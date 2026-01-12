/**
 * ConflictResolver
 *
 * Resolve conflicts from concurrent modifications across chat instances.
 * Part of Phase 4: Multi-Chat Coordination
 */
export type ResolutionStrategy = 'latest' | 'merge' | 'priority' | 'manual';
export interface Modification {
    id: string;
    filePath: string;
    chatId: string;
    content: string;
    timestamp: Date;
}
export interface ConflictResolution {
    winner: Modification;
    loser: Modification;
    strategy: ResolutionStrategy;
    merged?: string;
    resolvedAt: Date;
}
export interface ConflictStatistics {
    totalConflicts: number;
    byStrategy: Record<ResolutionStrategy, number>;
}
export declare class ConflictResolver {
    private chatPriorities;
    private conflictHistory;
    constructor();
    detectConflict(mod1: Modification, mod2: Modification): boolean;
    resolveConflict(mod1: Modification, mod2: Modification, strategy: ResolutionStrategy): ConflictResolution;
    setChatPriority(chatId: string, priority: number): void;
    getConflictHistory(): ConflictResolution[];
    getStatistics(): ConflictStatistics;
    private mergeContent;
}
//# sourceMappingURL=ConflictResolver.d.ts.map