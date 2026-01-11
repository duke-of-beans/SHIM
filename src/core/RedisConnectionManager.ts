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
import { REDIS_CONFIG } from '../config/redis';

export class RedisConnectionManager {
  private client: Redis | null = null;
  private config: RedisConfig;
  private connectedAt: number | null = null;
  
  constructor(config?: RedisConfig) {
    this.config = { ...REDIS_CONFIG, ...config };
  }
  
  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      return; // Already connected
    }
    
    return new Promise((resolve, reject) => {
      this.client = new Redis({
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
  async disconnect(): Promise<void> {
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
  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
  
  /**
   * Ping Redis server to check connection health
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      return false;
    }
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get connection statistics
   */
  getConnectionStats(): ConnectionStats {
    const stats: ConnectionStats = {
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
  getClient(): Redis {
    if (!this.client || !this.isConnected()) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }
}
