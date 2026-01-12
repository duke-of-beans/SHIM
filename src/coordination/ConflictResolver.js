/**
 * ConflictResolver
 *
 * Resolve conflicts from concurrent modifications across chat instances.
 * Part of Phase 4: Multi-Chat Coordination
 */
export class ConflictResolver {
    chatPriorities;
    conflictHistory;
    constructor() {
        this.chatPriorities = new Map();
        this.conflictHistory = [];
    }
    detectConflict(mod1, mod2) {
        return mod1.filePath === mod2.filePath && mod1.id !== mod2.id;
    }
    resolveConflict(mod1, mod2, strategy) {
        let winner;
        let loser;
        let merged;
        switch (strategy) {
            case 'latest':
                if (mod1.timestamp >= mod2.timestamp) {
                    winner = mod1;
                    loser = mod2;
                }
                else {
                    winner = mod2;
                    loser = mod1;
                }
                break;
            case 'merge':
                winner = mod1;
                loser = mod2;
                merged = this.mergeContent(mod1.content, mod2.content);
                break;
            case 'priority':
                const priority1 = this.chatPriorities.get(mod1.chatId) || 0;
                const priority2 = this.chatPriorities.get(mod2.chatId) || 0;
                if (priority1 >= priority2) {
                    winner = mod1;
                    loser = mod2;
                }
                else {
                    winner = mod2;
                    loser = mod1;
                }
                break;
            case 'manual':
            default:
                winner = mod1;
                loser = mod2;
                break;
        }
        const resolution = {
            winner,
            loser,
            strategy,
            merged,
            resolvedAt: new Date(),
        };
        this.conflictHistory.push(resolution);
        return resolution;
    }
    setChatPriority(chatId, priority) {
        this.chatPriorities.set(chatId, priority);
    }
    getConflictHistory() {
        return [...this.conflictHistory];
    }
    getStatistics() {
        const byStrategy = {
            latest: 0,
            merge: 0,
            priority: 0,
            manual: 0,
        };
        this.conflictHistory.forEach((resolution) => {
            byStrategy[resolution.strategy]++;
        });
        return {
            totalConflicts: this.conflictHistory.length,
            byStrategy,
        };
    }
    mergeContent(content1, content2) {
        // Simple merge: combine unique lines
        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');
        const merged = new Set([...lines1, ...lines2]);
        return Array.from(merged).join('\n');
    }
}
//# sourceMappingURL=ConflictResolver.js.map