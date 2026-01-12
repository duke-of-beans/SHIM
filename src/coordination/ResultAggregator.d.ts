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
export declare class ResultAggregator {
    private results;
    constructor();
    addResult(result: TaskResult): void;
    getResult(taskId: string): TaskResult | null;
    getAllResults(): TaskResult[];
    getResultsByGroup(groupId: string): TaskResult[];
    mergeResults(groupId: string): any;
    isGroupComplete(taskIds: string[]): boolean;
    getProgress(taskIds: string[]): number;
    getFailedResults(): TaskResult[];
    getSuccessfulResults(): TaskResult[];
    getStatistics(): AggregationStatistics;
}
//# sourceMappingURL=ResultAggregator.d.ts.map