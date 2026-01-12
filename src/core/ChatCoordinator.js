"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCoordinator = void 0;
class ChatCoordinator {
    config;
    registry;
    messageBus;
    chats = new Map();
    tasks = new Map();
    taskQueue = [];
    constructor(config) {
        // Validate configuration
        if (config.maxConcurrentChats !== undefined && config.maxConcurrentChats <= 0) {
            throw new Error('maxConcurrentChats must be positive');
        }
        this.registry = config.registry;
        this.messageBus = config.messageBus;
        this.config = {
            maxConcurrentChats: config.maxConcurrentChats ?? 5,
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Register a new chat session
     */
    async registerChat(chatId) {
        // Check max concurrent chats
        if (this.chats.size >= this.config.maxConcurrentChats) {
            throw new Error('Maximum concurrent chats reached');
        }
        const session = {
            chatId,
            status: 'idle',
            registeredAt: Date.now(),
            lastActivity: Date.now(),
        };
        this.chats.set(chatId, session);
        // Register with worker registry
        await this.registry.registerWorker(chatId, chatId);
        return session;
    }
    /**
     * Unregister a chat session
     */
    async unregisterChat(chatId) {
        this.chats.delete(chatId);
        await this.registry.unregisterWorker(chatId);
    }
    /**
     * List all registered chats
     */
    async listChats() {
        return Array.from(this.chats.values());
    }
    /**
     * Assign task to available chat
     */
    async assignTask(task) {
        // Find available chat
        const availableChat = this.findAvailableChat();
        if (!availableChat) {
            // Queue task
            this.taskQueue.push(task);
            this.sortTaskQueue();
            const assignment = {
                taskId: task.id,
                chatId: '',
                status: 'queued',
                assignedAt: Date.now(),
            };
            this.tasks.set(task.id, assignment);
            return assignment;
        }
        // Assign to chat
        const assignment = {
            taskId: task.id,
            chatId: availableChat.chatId,
            status: 'assigned',
            assignedAt: Date.now(),
        };
        this.tasks.set(task.id, assignment);
        // Update chat status
        availableChat.status = 'busy';
        availableChat.currentTask = task.id;
        availableChat.lastActivity = Date.now();
        // Update worker registry
        await this.registry.updateStatus(availableChat.chatId, 'busy', task.id);
        return assignment;
    }
    /**
     * Get task queue
     */
    async getTaskQueue() {
        return [...this.taskQueue];
    }
    /**
     * Update task progress
     */
    async updateTaskProgress(taskId, update) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        task.status = update.status;
        if (update.progress !== undefined) {
            task.progress = update.progress;
        }
        if (update.message !== undefined) {
            task.message = update.message;
        }
        // Update chat activity
        const chat = this.chats.get(task.chatId);
        if (chat) {
            chat.lastActivity = Date.now();
        }
    }
    /**
     * Get task status
     */
    async getTaskStatus(taskId) {
        return this.tasks.get(taskId) || null;
    }
    /**
     * Complete task
     */
    async completeTask(taskId, completion) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        task.status = completion.success ? 'completed' : 'failed';
        task.result = completion.result;
        // Free up chat
        const chat = this.chats.get(task.chatId);
        if (chat) {
            chat.status = 'idle';
            delete chat.currentTask;
            chat.lastActivity = Date.now();
            await this.registry.updateStatus(chat.chatId, 'idle');
        }
        // Assign next queued task if any
        await this.assignNextQueuedTask();
    }
    /**
     * Get progress summary
     */
    async getProgressSummary() {
        const tasks = Array.from(this.tasks.values());
        return {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
            queuedTasks: tasks.filter(t => t.status === 'queued').length,
            failedTasks: tasks.filter(t => t.status === 'failed').length,
            activeChats: Array.from(this.chats.values()).filter(c => c.status === 'busy').length,
        };
    }
    /**
     * Get crashed chats
     */
    async getCrashedChats() {
        const crashed = await this.registry.getCrashedWorkers();
        const crashedSessions = [];
        for (const worker of crashed) {
            const chat = this.chats.get(worker.chatId);
            if (chat) {
                chat.status = 'crashed';
                crashedSessions.push(chat);
            }
        }
        return crashedSessions;
    }
    /**
     * Recover tasks from crashed chats
     */
    async recoverCrashedTasks() {
        const crashed = await this.getCrashedChats();
        for (const chat of crashed) {
            if (chat.currentTask) {
                const task = this.tasks.get(chat.currentTask);
                if (task) {
                    // Reset task status
                    task.status = 'queued';
                    task.chatId = '';
                    // Re-queue task
                    const originalTask = this.taskQueue.find(t => t.id === chat.currentTask);
                    if (originalTask) {
                        this.taskQueue.push(originalTask);
                        this.sortTaskQueue();
                    }
                }
            }
            // Unregister crashed chat
            await this.unregisterChat(chat.chatId);
        }
        // Assign recovered tasks
        await this.assignNextQueuedTask();
    }
    /**
     * Aggregate results from multiple tasks
     */
    async aggregateResults(taskIds) {
        const results = [];
        let totalIssues = 0;
        for (const taskId of taskIds) {
            const task = this.tasks.get(taskId);
            if (task && task.result) {
                results.push(task.result);
                if (task.result.issues !== undefined) {
                    totalIssues += task.result.issues;
                }
            }
        }
        return {
            tasks: taskIds.length,
            results,
            totalIssues,
        };
    }
    /**
     * Update max concurrent chats
     */
    setMaxConcurrentChats(max) {
        this.config.maxConcurrentChats = max;
    }
    /**
     * Stop coordinator
     */
    async stop() {
        // Unregister all chats
        for (const chatId of this.chats.keys()) {
            await this.unregisterChat(chatId);
        }
        this.chats.clear();
        this.tasks.clear();
        this.taskQueue = [];
    }
    /**
     * Find available chat for task assignment
     */
    findAvailableChat() {
        for (const chat of this.chats.values()) {
            if (chat.status === 'idle') {
                return chat;
            }
        }
        return null;
    }
    /**
     * Sort task queue by priority (lowest number = highest priority)
     */
    sortTaskQueue() {
        this.taskQueue.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Assign next queued task to available chat
     */
    async assignNextQueuedTask() {
        if (this.taskQueue.length === 0) {
            return;
        }
        const availableChat = this.findAvailableChat();
        if (!availableChat) {
            return;
        }
        const task = this.taskQueue.shift();
        if (task) {
            await this.assignTask(task);
        }
    }
}
exports.ChatCoordinator = ChatCoordinator;
//# sourceMappingURL=ChatCoordinator.js.map