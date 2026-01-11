/**
 * ConflictResolver
 *
 * Resolve conflicts when multiple chats modify the same files.
 * Part of Phase 4: Multi-Chat Coordination
 */

export type ResolutionStrategy = 'latest' | 'priority' | 'merge' | 'manual';

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

export class ConflictResolver {
  private chatPriorities: Map<string, number>;
  private conflictHistory: ConflictResolution[];

  constructor() {
    this.chatPriorities = new Map();
    this.conflictHistory = [];
  }

  detectConflict(mod1: Modification, mod2: Modification): boolean {
    return mod1.filePath === mod2.filePath && mod1.chatId !== mod2.chatId;
  }

  resolveConflict(
    mod1: Modification,
    mod2: Modification,
    strategy: ResolutionStrategy
  ): ConflictResolution {
    let winner: Modification;
    let loser: Modification;
    let merged: string | undefined;

    switch (strategy) {
      case 'latest':
        if (mod1.timestamp > mod2.timestamp) {
          winner = mod1;
          loser = mod2;
        } else {
          winner = mod2;
          loser = mod1;
        }
        break;

      case 'priority':
        const priority1 = this.chatPriorities.get(mod1.chatId) || 0;
        const priority2 = this.chatPriorities.get(mod2.chatId) || 0;

        if (priority1 >= priority2) {
          winner = mod1;
          loser = mod2;
        } else {
          winner = mod2;
          loser = mod1;
        }
        break;

      case 'merge':
        // Simple merge: concatenate both contents
        merged = `${mod1.content}\n${mod2.content}`;
        winner = mod1; // Arbitrary choice for winner when merged
        loser = mod2;
        break;

      default:
        winner = mod1;
        loser = mod2;
    }

    const resolution: ConflictResolution = {
      winner,
      loser,
      strategy,
      merged,
      resolvedAt: new Date(),
    };

    this.conflictHistory.push(resolution);
    return resolution;
  }

  setChatPriority(chatId: string, priority: number): void {
    this.chatPriorities.set(chatId, priority);
  }

  getConflictHistory(): ConflictResolution[] {
    return [...this.conflictHistory];
  }

  getStatistics(): ConflictStatistics {
    const byStrategy: Record<ResolutionStrategy, number> = {
      latest: 0,
      priority: 0,
      merge: 0,
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
}
