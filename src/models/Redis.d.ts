/**
 * Redis Configuration
 *
 * Configuration options for Redis connection
 */
export interface RedisConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    retryStrategy?: (times: number) => number | null;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
    keepAlive?: number;
}
/**
 * Connection Statistics
 *
 * Runtime statistics about the Redis connection
 */
export interface ConnectionStats {
    connected: boolean;
    host: string;
    port: number;
    db: number;
    uptime?: number;
    commandsSent?: number;
    commandsFailed?: number;
}
/**
 * Worker Status
 *
 * Current operational status of a worker
 */
export type WorkerStatus = 'idle' | 'busy';
/**
 * Worker Health
 *
 * Health status based on heartbeat monitoring
 */
export type WorkerHealth = 'healthy' | 'degraded' | 'crashed';
/**
 * Worker Information
 *
 * Complete worker registration and status data
 */
export interface WorkerInfo {
    workerId: string;
    chatId: string;
    status: WorkerStatus;
    health: WorkerHealth;
    registeredAt: number;
    lastHeartbeat: number;
    currentTask?: string;
}
//# sourceMappingURL=Redis.d.ts.map