/**
 * ChatCoordinator - Multi-Chat Orchestration
 *
 * Coordinates multiple Claude chat sessions working on different
 * parts of a large project concurrently.
 *
 * Responsibilities:
 * - Chat session registration/management
 * - Task distribution across chats
 * - Load balancing
 * - Progress tracking
 * - Crash detection and recovery
 * - Result aggregation
 *
 * Architecture:
 * - Uses WorkerRegistry for chat tracking
 * - Uses MessageBus for inter-chat communication
 * - Uses Redis for task queue and state
 *
 * Example Usage:
 * ```typescript
 * const coordinator = new ChatCoordinator({
 *   registry: workerRegistry,
 *   messageBus: messageBus,
 *   maxConcurrentChats: 5
 * });
 *
 * // Register chats
 * await coordinator.registerChat('chat-001');
 * await coordinator.registerChat('chat-002');
 *
 * // Assign tasks
 * await coordinator.assignTask({
 *   id: 'task-001',
 *   type: 'code_review',
 *   priority: 1,
 *   data: { file: 'src/test.ts' }
 * });
 *
 * // Track progress
 * const summary = await coordinator.getProgressSummary();
 * ```
 */
import { WorkerRegistry } from './WorkerRegistry';
import { MessageBusWrapper } from './MessageBusWrapper';
export interface CoordinatorConfig {
    registry: WorkerRegistry;
    messageBus: MessageBusWrapper;
    maxConcurrentChats?: number;
}
export interface ChatSession {
    chatId: string;
    status: 'idle' | 'busy' | 'crashed';
    currentTask?: string;
    registeredAt: number;
    lastActivity: number;
}
export interface Task {
    id: string;
    type: string;
    priority: number;
    data: any;
}
export type TaskStatus = 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed';
export interface TaskAssignment {
    taskId: string;
    chatId: string;
    status: TaskStatus;
    assignedAt: number;
    progress?: number;
    message?: string;
    result?: any;
}
export interface ProgressSummary {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    failedTasks: number;
    activeChats: number;
}
export declare class ChatCoordinator {
    private config;
    private registry;
    private messageBus;
    private chats;
    private tasks;
    private taskQueue;
    constructor(config: CoordinatorConfig);
    /**
     * Get current configuration
     */
    getConfig(): {
        maxConcurrentChats: number;
    };
    /**
     * Register a new chat session
     */
    registerChat(chatId: string): Promise<ChatSession>;
    /**
     * Unregister a chat session
     */
    unregisterChat(chatId: string): Promise<void>;
    /**
     * List all registered chats
     */
    listChats(): Promise<ChatSession[]>;
    /**
     * Assign task to available chat
     */
    assignTask(task: Task): Promise<TaskAssignment>;
    /**
     * Get task queue
     */
    getTaskQueue(): Promise<Task[]>;
    /**
     * Update task progress
     */
    updateTaskProgress(taskId: string, update: {
        status: TaskStatus;
        progress?: number;
        message?: string;
    }): Promise<void>;
    /**
     * Get task status
     */
    getTaskStatus(taskId: string): Promise<TaskAssignment | null>;
    /**
     * Complete task
     */
    completeTask(taskId: string, completion: {
        success: boolean;
        result: any;
    }): Promise<void>;
    /**
     * Get progress summary
     */
    getProgressSummary(): Promise<ProgressSummary>;
    /**
     * Get crashed chats
     */
    getCrashedChats(): Promise<ChatSession[]>;
    /**
     * Recover tasks from crashed chats
     */
    recoverCrashedTasks(): Promise<void>;
    /**
     * Aggregate results from multiple tasks
     */
    aggregateResults(taskIds: string[]): Promise<any>;
    /**
     * Update max concurrent chats
     */
    setMaxConcurrentChats(max: number): void;
    /**
     * Stop coordinator
     */
    stop(): Promise<void>;
    /**
     * Find available chat for task assignment
     */
    private findAvailableChat;
    /**
     * Sort task queue by priority (lowest number = highest priority)
     */
    private sortTaskQueue;
    /**
     * Assign next queued task to available chat
     */
    private assignNextQueuedTask;
}
//# sourceMappingURL=ChatCoordinator.d.ts.map