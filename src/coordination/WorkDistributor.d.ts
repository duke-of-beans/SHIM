/**
 * WorkDistributor
 *
 * Distribute tasks across multiple chat instances intelligently.
 * Part of Phase 4: Multi-Chat Coordination
 */
import { ChatRegistry } from './ChatRegistry';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DistributionStrategy = 'round-robin' | 'capability-match' | 'load-balance';
export interface Task {
    id: string;
    type: string;
    priority: TaskPriority;
    payload: any;
    requiredCapability?: string;
}
export interface TaskAssignment {
    taskId: string;
    chatId: string;
}
export interface DistributionStatistics {
    totalDistributed: number;
    queuedTasks: number;
}
export declare class WorkDistributor {
    private registry;
    private strategy;
    private taskQueue;
    private distributionCount;
    constructor(registry: ChatRegistry, strategy?: DistributionStrategy);
    distributeTask(task: Task): string | null;
    queueTask(task: Task): void;
    getNextTask(): Task | null;
    getQueuedTasks(): Task[];
    processQueue(): TaskAssignment[];
    getStatistics(): DistributionStatistics;
    private sortQueue;
}
//# sourceMappingURL=WorkDistributor.d.ts.map