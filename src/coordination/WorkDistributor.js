"use strict";
/**
 * WorkDistributor
 *
 * Distribute tasks across multiple chat instances intelligently.
 * Part of Phase 4: Multi-Chat Coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkDistributor = void 0;
class WorkDistributor {
    registry;
    strategy;
    taskQueue;
    distributionCount;
    constructor(registry, strategy = 'load-balance') {
        this.registry = registry;
        this.strategy = strategy;
        this.taskQueue = [];
        this.distributionCount = 0;
    }
    distributeTask(task) {
        let targetChat = null;
        // Check for capability requirement
        if (task.requiredCapability) {
            const capableChats = this.registry.findByCapability(task.requiredCapability);
            const idleCapable = capableChats.filter((c) => c.status === 'idle');
            if (idleCapable.length > 0) {
                targetChat = idleCapable[0].id;
            }
        }
        else {
            // Find any idle chat
            const idleChats = this.registry.findByStatus('idle');
            if (idleChats.length > 0) {
                targetChat = idleChats[0].id;
            }
        }
        if (targetChat) {
            this.registry.assignTask(targetChat, task.id);
            this.distributionCount++;
            return targetChat;
        }
        return null;
    }
    queueTask(task) {
        this.taskQueue.push(task);
        this.sortQueue();
    }
    getNextTask() {
        return this.taskQueue.shift() || null;
    }
    getQueuedTasks() {
        return [...this.taskQueue];
    }
    processQueue() {
        const assignments = [];
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue[0];
            const chatId = this.distributeTask(task);
            if (!chatId) {
                break; // No available chats
            }
            this.taskQueue.shift();
            assignments.push({ taskId: task.id, chatId });
        }
        return assignments;
    }
    getStatistics() {
        return {
            totalDistributed: this.distributionCount,
            queuedTasks: this.taskQueue.length,
        };
    }
    sortQueue() {
        const priorityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        };
        this.taskQueue.sort((a, b) => {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
}
exports.WorkDistributor = WorkDistributor;
//# sourceMappingURL=WorkDistributor.js.map