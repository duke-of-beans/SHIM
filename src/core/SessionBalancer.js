"use strict";
/**
 * SessionBalancer - Intelligent Load Balancing
 *
 * Balances workload across multiple chat sessions based on:
 * - Current load (tasks assigned)
 * - Historical performance (completion times)
 * - Resource constraints (max tasks per session)
 * - Task complexity
 *
 * Ensures optimal resource utilization and prevents overloading
 * any single chat session.
 *
 * Features:
 * - Load calculation per session
 * - Least-loaded session selection
 * - Automatic rebalancing
 * - Performance-based routing
 * - Periodic auto-balancing
 *
 * Example Usage:
 * ```typescript
 * const balancer = new SessionBalancer({
 *   coordinator: chatCoordinator,
 *   registry: workerRegistry,
 *   maxTasksPerSession: 3,
 *   balancingInterval: 5000
 * });
 *
 * // Start auto-balancing
 * await balancer.startAutoBalancing();
 *
 * // Select best session for new task
 * const chatId = await balancer.selectSession();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionBalancer = void 0;
const events_1 = require("events");
class SessionBalancer extends events_1.EventEmitter {
    config;
    coordinator;
    registry;
    performanceHistory = new Map();
    autoBalanceTimer;
    autoBalancing = false;
    constructor(config) {
        super();
        // Validate configuration
        if (config.maxTasksPerSession !== undefined && config.maxTasksPerSession <= 0) {
            throw new Error('maxTasksPerSession must be positive');
        }
        this.coordinator = config.coordinator;
        this.registry = config.registry;
        this.config = {
            maxTasksPerSession: config.maxTasksPerSession ?? 3,
            balancingInterval: config.balancingInterval ?? 5000,
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Calculate load for a specific session
     */
    async calculateLoad(chatId) {
        const summary = await this.coordinator.getProgressSummary();
        // Count tasks assigned to this chat
        let currentTasks = 0;
        // Get all active tasks
        const tasks = await this.coordinator.listChats();
        const targetChat = tasks.find(c => c.chatId === chatId);
        if (targetChat && targetChat.status === 'busy') {
            currentTasks = 1; // Simplified: 1 task if busy
        }
        const utilizationRate = currentTasks / this.config.maxTasksPerSession;
        // Get average completion time if available
        const perf = this.performanceHistory.get(chatId);
        const averageCompletionTime = perf && perf.completionTimes.length > 0
            ? perf.completionTimes.reduce((a, b) => a + b, 0) / perf.completionTimes.length
            : undefined;
        return {
            chatId,
            currentTasks,
            maxTasks: this.config.maxTasksPerSession,
            utilizationRate,
            averageCompletionTime,
        };
    }
    /**
     * Get load metrics for all sessions
     */
    async getAllLoadMetrics() {
        const chats = await this.coordinator.listChats();
        const metrics = await Promise.all(chats.map(chat => this.calculateLoad(chat.chatId)));
        return metrics;
    }
    /**
     * Select least loaded session
     */
    async selectSession() {
        const metrics = await this.getAllLoadMetrics();
        // Filter out overloaded sessions
        const available = metrics.filter(m => m.currentTasks < m.maxTasks);
        if (available.length === 0) {
            return null; // All sessions overloaded
        }
        // Sort by utilization rate (ascending)
        available.sort((a, b) => a.utilizationRate - b.utilizationRate);
        return available[0].chatId;
    }
    /**
     * Select session based on historical performance
     */
    async selectSessionByPerformance() {
        const metrics = await this.getAllLoadMetrics();
        // Filter out overloaded sessions
        const available = metrics.filter(m => m.currentTasks < m.maxTasks);
        if (available.length === 0) {
            return null;
        }
        // Sort by average completion time (ascending, undefined last)
        available.sort((a, b) => {
            if (a.averageCompletionTime === undefined)
                return 1;
            if (b.averageCompletionTime === undefined)
                return -1;
            return a.averageCompletionTime - b.averageCompletionTime;
        });
        return available[0].chatId;
    }
    /**
     * Check if load is balanced
     */
    async isBalanced() {
        const metrics = await this.getAllLoadMetrics();
        if (metrics.length <= 1) {
            return true; // Only one session, always balanced
        }
        const loads = metrics.map(m => m.currentTasks);
        const maxLoad = Math.max(...loads);
        const minLoad = Math.min(...loads);
        // Balanced if difference <= 1
        return maxLoad - minLoad <= 1;
    }
    /**
     * Rebalance tasks across sessions
     */
    async rebalance() {
        const isBalanced = await this.isBalanced();
        if (isBalanced) {
            return; // Already balanced
        }
        // Get metrics
        const metrics = await this.getAllLoadMetrics();
        // Sort by load (descending)
        metrics.sort((a, b) => b.currentTasks - a.currentTasks);
        const overloaded = metrics.filter(m => m.currentTasks > this.config.maxTasksPerSession / 2);
        const underloaded = metrics.filter(m => m.currentTasks < this.config.maxTasksPerSession / 2);
        if (overloaded.length === 0 || underloaded.length === 0) {
            return; // Can't rebalance
        }
        // In a real implementation, would move tasks from overloaded to underloaded
        // For now, just emit event
        this.emit('rebalanced', {
            overloaded: overloaded.map(m => m.chatId),
            underloaded: underloaded.map(m => m.chatId)
        });
    }
    /**
     * Record performance metrics
     */
    async recordPerformance(chatId, data) {
        let perf = this.performanceHistory.get(chatId);
        if (!perf) {
            perf = {
                completionTimes: [],
                successes: 0,
                failures: 0,
            };
            this.performanceHistory.set(chatId, perf);
        }
        perf.completionTimes.push(data.completionTime);
        if (data.success) {
            perf.successes++;
        }
        else {
            perf.failures++;
        }
        // Keep only last 100 completion times
        if (perf.completionTimes.length > 100) {
            perf.completionTimes.shift();
        }
    }
    /**
     * Get performance metrics for a session
     */
    async getPerformanceMetrics(chatId) {
        const perf = this.performanceHistory.get(chatId);
        if (!perf || perf.completionTimes.length === 0) {
            return {
                chatId,
                averageCompletionTime: 0,
                tasksCompleted: 0,
                successRate: 0,
            };
        }
        const averageCompletionTime = perf.completionTimes.reduce((a, b) => a + b, 0) / perf.completionTimes.length;
        const tasksCompleted = perf.successes + perf.failures;
        const successRate = tasksCompleted > 0 ? perf.successes / tasksCompleted : 0;
        return {
            chatId,
            averageCompletionTime,
            tasksCompleted,
            successRate,
        };
    }
    /**
     * Start automatic balancing
     */
    async startAutoBalancing() {
        if (this.autoBalancing) {
            return; // Already running
        }
        this.autoBalancing = true;
        this.autoBalanceTimer = setInterval(async () => {
            await this.rebalance();
        }, this.config.balancingInterval);
        this.emit('auto_balancing_started');
    }
    /**
     * Stop automatic balancing
     */
    async stopAutoBalancing() {
        if (!this.autoBalancing) {
            return;
        }
        this.autoBalancing = false;
        if (this.autoBalanceTimer) {
            clearInterval(this.autoBalanceTimer);
            this.autoBalanceTimer = undefined;
        }
        this.emit('auto_balancing_stopped');
    }
    /**
     * Check if auto-balancing is active
     */
    isAutoBalancing() {
        return this.autoBalancing;
    }
    /**
     * Update max tasks per session
     */
    setMaxTasksPerSession(max) {
        this.config.maxTasksPerSession = max;
    }
    /**
     * Update balancing interval
     */
    setBalancingInterval(interval) {
        this.config.balancingInterval = interval;
        // Restart auto-balancing if active
        if (this.autoBalancing) {
            this.stopAutoBalancing();
            this.startAutoBalancing();
        }
    }
    /**
     * Stop balancer
     */
    async stop() {
        await this.stopAutoBalancing();
        this.performanceHistory.clear();
    }
}
exports.SessionBalancer = SessionBalancer;
//# sourceMappingURL=SessionBalancer.js.map