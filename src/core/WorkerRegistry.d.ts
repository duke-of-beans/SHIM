/**
 * WorkerRegistry
 *
 * Manages worker registration, heartbeat monitoring, and crash detection.
 * Workers are stored in Redis with automatic timeout-based crash detection.
 */
import { RedisConnectionManager } from './RedisConnectionManager';
import { WorkerInfo, WorkerStatus, WorkerHealth } from '../models/Redis';
/**
 * Worker registration and monitoring system.
 *
 * Features:
 * - Worker registration/unregistration
 * - Heartbeat monitoring (30s timeout)
 * - Automatic crash detection
 * - Health status tracking
 * - Status management (idle/busy)
 *
 * Performance:
 * - Registration: <50ms
 * - Heartbeat: <20ms
 * - Crash detection (100 workers): <100ms
 */
export declare class WorkerRegistry {
    private readonly redis;
    private readonly HEARTBEAT_TIMEOUT;
    private readonly WORKER_KEY_PREFIX;
    constructor(redis: RedisConnectionManager);
    /**
     * Register a new worker or update existing worker.
     *
     * If worker already exists, preserves registration time but updates
     * chat ID and heartbeat timestamp.
     *
     * @param workerId Unique worker identifier
     * @param chatId Associated chat session ID
     */
    registerWorker(workerId: string, chatId: string): Promise<void>;
    /**
     * Unregister a worker.
     *
     * Safe to call on non-existent workers (no-op).
     *
     * @param workerId Worker to unregister
     */
    unregisterWorker(workerId: string): Promise<void>;
    /**
     * Update worker heartbeat timestamp.
     *
     * Safe to call on non-existent workers (no-op).
     *
     * @param workerId Worker to update
     */
    heartbeat(workerId: string): Promise<void>;
    /**
     * Get worker information.
     *
     * @param workerId Worker to retrieve
     * @returns Worker info or null if not found
     */
    getWorker(workerId: string): Promise<WorkerInfo | null>;
    /**
     * List all registered workers.
     *
     * @returns Array of all workers
     */
    listWorkers(): Promise<WorkerInfo[]>;
    /**
     * Detect crashed workers (heartbeat timeout exceeded).
     *
     * Automatically updates health status to 'crashed' for detected workers.
     *
     * @returns Array of crashed workers
     */
    getCrashedWorkers(): Promise<WorkerInfo[]>;
    /**
     * Update worker health status.
     *
     * @param workerId Worker to update
     * @param health New health status
     */
    updateHealth(workerId: string, health: WorkerHealth): Promise<void>;
    /**
     * Get workers filtered by health status.
     *
     * @param health Health status to filter by
     * @returns Workers with matching health status
     */
    getWorkersByHealth(health: WorkerHealth): Promise<WorkerInfo[]>;
    /**
     * Update worker status and optional current task.
     *
     * @param workerId Worker to update
     * @param status New status
     * @param currentTask Task ID (optional, cleared if undefined)
     */
    updateStatus(workerId: string, status: WorkerStatus, currentTask?: string): Promise<void>;
    /**
     * Cleanup resources (for testing).
     */
    cleanup(): Promise<void>;
    /**
     * Get Redis key for worker.
     */
    private getWorkerKey;
}
//# sourceMappingURL=WorkerRegistry.d.ts.map