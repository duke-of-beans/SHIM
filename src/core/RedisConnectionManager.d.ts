/**
 * RedisConnectionManager
 *
 * Manages Redis connection lifecycle with health monitoring and reconnection logic.
 *
 * Features:
 * - Automatic connection management
 * - Connection health monitoring
 * - Reconnection with exponential backoff
 * - Connection statistics tracking
 */
import Redis from 'ioredis';
import type { RedisConfig, ConnectionStats } from '../models/Redis';
export declare class RedisConnectionManager {
    private client;
    private config;
    private connectedAt;
    constructor(config?: RedisConfig);
    /**
     * Connect to Redis server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis server
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected to Redis
     */
    isConnected(): boolean;
    /**
     * Ping Redis server to check connection health
     */
    ping(): Promise<boolean>;
    /**
     * Get connection statistics
     */
    getConnectionStats(): ConnectionStats;
    /**
     * Get the underlying Redis client
     * @throws Error if not connected
     */
    getClient(): Redis;
}
//# sourceMappingURL=RedisConnectionManager.d.ts.map