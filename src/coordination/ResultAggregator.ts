/**
 * ResultAggregator
 *
 * Aggregate and merge results from distributed tasks.
 * Part of Phase 4: Multi-Chat Coordination
 */

export type TaskStatus = 'success' | 'failed' | 'timeout';
export type AggregationStrategy = 'merge' | 'concat' | 'latest';

export interface TaskResult {
  taskId: string;
  chatId: string;
  status: TaskStatus;
  data: any;
  error?: string;
  completedAt: Date;
  groupId?: string;
}

export interface AggregationStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

export class ResultAggregator {
  private results: Map<string, TaskResult>;

  constructor() {
    this.results = new Map();
  }

  addResult(result: TaskResult): void {
    this.results.set(result.taskId, result);
  }

  getResult(taskId: string): TaskResult | null {
    return this.results.get(taskId) || null;
  }

  getAllResults(): TaskResult[] {
    return Array.from(this.results.values());
  }

  getResultsByGroup(groupId: string): TaskResult[] {
    return this.getAllResults().filter((r) => r.groupId === groupId);
  }

  mergeResults(groupId: string): any {
    const groupResults = this.getResultsByGroup(groupId);
    const merged: any = {};

    groupResults.forEach((result) => {
      if (result.status === 'success') {
        Object.assign(merged, result.data);
      }
    });

    return merged;
  }

  isGroupComplete(taskIds: string[]): boolean {
    return taskIds.every((id) => this.results.has(id));
  }

  getProgress(taskIds: string[]): number {
    const completed = taskIds.filter((id) => this.results.has(id)).length;
    return completed / taskIds.length;
  }

  getFailedResults(): TaskResult[] {
    return this.getAllResults().filter((r) => r.status === 'failed');
  }

  getSuccessfulResults(): TaskResult[] {
    return this.getAllResults().filter((r) => r.status === 'success');
  }

  getStatistics(): AggregationStatistics {
    const all = this.getAllResults();
    const successful = this.getSuccessfulResults().length;
    const failed = this.getFailedResults().length;

    return {
      total: all.length,
      successful,
      failed,
      successRate: all.length > 0 ? successful / all.length : 0,
    };
  }
}
