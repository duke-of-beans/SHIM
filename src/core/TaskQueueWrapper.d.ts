/**
 * TaskQueueWrapper
 *
 * Wraps BullMQ with SHIM-specific task handling
 * Provides task management, worker pattern, and queue control
 */
import { RedisConnectionManager } from './RedisConnectionManager';
/**
 * Task structure
 */
export interface Task {
    type: string;
    data: Record<string, unknown>;
}
/**
 * Task result from processor
 */
export interface TaskResult {
    success: boolean;
    [key: string]: unknown;
}
/**
 * Options for adding tasks
 */
export interface AddOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
}
/**
 * Queue statistics
 */
export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}
/**
 * Task processor function
 */
export type TaskProcessor = (task: Task, progress?: ProgressCallback) => Promise<TaskResult>;
/**
 * Progress callback
 */
export type ProgressCallback = (percentage: number, message?: string) => void;
/**
 * TaskQueueWrapper
 *
 * Wraps BullMQ queue with SHIM-specific functionality
 */
export declare class TaskQueueWrapper {
    private queue;
    private worker;
    private queueEvents;
    private connection;
    private queueName;
    constructor(connection: RedisConnectionManager, queueName: string);
    /**
     * Get Redis connection configuration
     */
    private getConnectionConfig;
    /**
     * Add task to queue
     */
    addTask(task: Task, options?: AddOptions): Promise<string>;
    /**
     * Get task by ID
     */
    getTask(taskId: string): Promise<Task | null>;
    /**
     * Update task
     */
    updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
    /**
     * Register worker to process tasks
     */
    registerWorker(processor: TaskProcessor, concurrency?: number): Promise<void>;
    /**
     * Pause queue
     */
    pause(): Promise<void>;
    /**
     * Resume queue
     */
    resume(): Promise<void>;
    /**
     * Drain queue (remove waiting jobs)
     */
    drain(): Promise<void>;
    /**
     * Clean completed/failed jobs
     */
    clean(grace: number): Promise<void>;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<QueueStats>;
    /**
     * Get waiting job count
     */
    getWaitingCount(): Promise<number>;
    /**
     * Get active job count
     */
    getActiveCount(): Promise<number>;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
//# sourceMappingURL=TaskQueueWrapper.d.ts.map