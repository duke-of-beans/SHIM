"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnectionManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis_1 = require("../config/redis");
class RedisConnectionManager {
    client = null;
    config;
    connectedAt = null;
    constructor(config) {
        this.config = { ...redis_1.REDIS_CONFIG, ...config };
    }
    /**
     * Connect to Redis server
     */
    async connect() {
        if (this.client && this.client.status === 'ready') {
            return; // Already connected
        }
        return new Promise((resolve, reject) => {
            this.client = new ioredis_1.default({
                host: this.config.host,
                port: this.config.port,
                password: this.config.password,
                db: this.config.db,
                retryStrategy: this.config.retryStrategy,
                maxRetriesPerRequest: this.config.maxRetriesPerRequest,
                enableReadyCheck: this.config.enableReadyCheck,
                lazyConnect: this.config.lazyConnect,
                keepAlive: this.config.keepAlive,
            });
            // Handle connection success
            this.client.on('ready', () => {
                this.connectedAt = Date.now();
                resolve();
            });
            // Handle connection errors
            this.client.on('error', (error) => {
                // Only reject on initial connection attempt
                if (!this.connectedAt) {
                    reject(error);
                }
            });
            // Always connect (lazyConnect only affects auto-connect on construction)
            this.client.connect().catch(reject);
        });
    }
    /**
     * Disconnect from Redis server
     */
    async disconnect() {
        if (!this.client) {
            return; // Already disconnected
        }
        await this.client.quit();
        this.client = null;
        this.connectedAt = null;
    }
    /**
     * Check if connected to Redis
     */
    isConnected() {
        return this.client !== null && this.client.status === 'ready';
    }
    /**
     * Ping Redis server to check connection health
     */
    async ping() {
        if (!this.client || !this.isConnected()) {
            return false;
        }
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get connection statistics
     */
    getConnectionStats() {
        const stats = {
            connected: this.isConnected(),
            host: this.config.host || 'localhost',
            port: this.config.port || 6379,
            db: this.config.db || 0,
        };
        if (this.connectedAt) {
            stats.uptime = Date.now() - this.connectedAt;
        }
        return stats;
    }
    /**
     * Get the underlying Redis client
     * @throws Error if not connected
     */
    getClient() {
        if (!this.client || !this.isConnected()) {
            throw new Error('Redis not connected');
        }
        return this.client;
    }
}
exports.RedisConnectionManager = RedisConnectionManager;
//# sourceMappingURL=RedisConnectionManager.js.map