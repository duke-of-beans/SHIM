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
import { EventEmitter } from 'events';
import { ChatCoordinator } from './ChatCoordinator';
import { WorkerRegistry } from './WorkerRegistry';
export interface BalancerConfig {
    coordinator: ChatCoordinator;
    registry: WorkerRegistry;
    maxTasksPerSession?: number;
    balancingInterval?: number;
}
export interface LoadMetrics {
    chatId: string;
    currentTasks: number;
    maxTasks: number;
    utilizationRate: number;
    averageCompletionTime?: number;
}
export interface PerformanceMetrics {
    chatId: string;
    averageCompletionTime: number;
    tasksCompleted: number;
    successRate: number;
}
export declare class SessionBalancer extends EventEmitter {
    private config;
    private coordinator;
    private registry;
    private performanceHistory;
    private autoBalanceTimer?;
    private autoBalancing;
    constructor(config: BalancerConfig);
    /**
     * Get current configuration
     */
    getConfig(): {
        maxTasksPerSession: number;
        balancingInterval: number;
    };
    /**
     * Calculate load for a specific session
     */
    calculateLoad(chatId: string): Promise<LoadMetrics>;
    /**
     * Get load metrics for all sessions
     */
    getAllLoadMetrics(): Promise<LoadMetrics[]>;
    /**
     * Select least loaded session
     */
    selectSession(): Promise<string | null>;
    /**
     * Select session based on historical performance
     */
    selectSessionByPerformance(): Promise<string | null>;
    /**
     * Check if load is balanced
     */
    isBalanced(): Promise<boolean>;
    /**
     * Rebalance tasks across sessions
     */
    rebalance(): Promise<void>;
    /**
     * Record performance metrics
     */
    recordPerformance(chatId: string, data: {
        completionTime: number;
        success: boolean;
    }): Promise<void>;
    /**
     * Get performance metrics for a session
     */
    getPerformanceMetrics(chatId: string): Promise<PerformanceMetrics>;
    /**
     * Start automatic balancing
     */
    startAutoBalancing(): Promise<void>;
    /**
     * Stop automatic balancing
     */
    stopAutoBalancing(): Promise<void>;
    /**
     * Check if auto-balancing is active
     */
    isAutoBalancing(): boolean;
    /**
     * Update max tasks per session
     */
    setMaxTasksPerSession(max: number): void;
    /**
     * Update balancing interval
     */
    setBalancingInterval(interval: number): void;
    /**
     * Stop balancer
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=SessionBalancer.d.ts.map