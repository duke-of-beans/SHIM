/**
 * LockManager
 * 
 * Provides distributed locking for coordinating operations across multiple chat instances.
 * 
 * Features:
 * - Exclusive lock acquisition with unique lock IDs
 * - Automatic expiration (TTL) to prevent deadlocks
 * - Lock extension for long-running operations
 * - Lock stealing prevention with owner verification
 * - Retry mechanism with configurable timeout
 * 
 * Implementation:
 * - Uses Redis SET NX EX for atomic lock acquisition
 * - UUID-based lock IDs for ownership verification
 * - Lua scripts for atomic operations
 * 
 * Architecture:
 * - Single Redis instance (not full Redlock)
 * - Suitable for coordination within single deployment
 * - Can be upgraded to Redlock for multi-master Redis
 */

import { RedisConnectionManager } from './RedisConnectionManager';
import type { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

export interface LockOptions {
  ttl?: number;        // Lock TTL in seconds (default: 30)
  timeout?: number;    // Acquisition timeout in milliseconds (default: 0)
  retryDelay?: number; // Retry delay in milliseconds (default: 50)
}

export class LockManager {
  private redis: Redis;
  private readonly defaultTTL = 30; // 30 seconds
  private readonly defaultRetryDelay = 50; // 50ms
  private activeLocks: Map<string, string> = new Map(); // resource -> lockId
  
  constructor(private connectionManager: RedisConnectionManager) {
    this.redis = connectionManager.getClient();
  }

  /**
   * Acquire exclusive lock on resource
   * Returns lock ID on success, null on failure
   */
  async acquire(
    resource: string,
    options: LockOptions = {}
  ): Promise<string | null> {
    this.validateResourceName(resource);
    
    const ttl = options.ttl || this.defaultTTL;
    const timeout = options.timeout || 0;
    const retryDelay = options.retryDelay || this.defaultRetryDelay;
    
    const lockId = randomUUID();
    const redisKey = this.getLockKey(resource);
    
    const startTime = Date.now();
    
    while (true) {
      // Try to acquire lock using SET NX EX
      const acquired = await this.redis.set(
        redisKey,
        lockId,
        'EX',
        ttl,
        'NX'
      );
      
      if (acquired === 'OK') {
        // Successfully acquired lock
        this.activeLocks.set(resource, lockId);
        return lockId;
      }
      
      // Check timeout
      if (timeout === 0) {
        return null; // No retry
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        return null; // Timeout exceeded
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  /**
   * Release lock (only if owned by lockId)
   * Returns true on success, false if not owner or already released
   */
  async release(resource: string, lockId: string): Promise<boolean> {
    const redisKey = this.getLockKey(resource);
    
    // Use Lua script for atomic check-and-delete
    const script = `
      local key = KEYS[1]
      local expectedValue = ARGV[1]
      local currentValue = redis.call('GET', key)
      
      if currentValue == expectedValue then
        redis.call('DEL', key)
        return 1
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(
      script,
      1,
      redisKey,
      lockId
    ) as number;
    
    if (result === 1) {
      this.activeLocks.delete(resource);
      return true;
    }
    
    return false;
  }

  /**
   * Extend lock TTL (only if owned by lockId)
   * Returns true on success, false if not owner
   */
  async extend(
    resource: string,
    lockId: string,
    ttl: number
  ): Promise<boolean> {
    const redisKey = this.getLockKey(resource);
    
    // Use Lua script for atomic check-and-expire
    const script = `
      local key = KEYS[1]
      local expectedValue = ARGV[1]
      local ttl = tonumber(ARGV[2])
      local currentValue = redis.call('GET', key)
      
      if currentValue == expectedValue then
        redis.call('EXPIRE', key, ttl)
        return 1
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(
      script,
      1,
      redisKey,
      lockId,
      ttl.toString()
    ) as number;
    
    return result === 1;
  }

  /**
   * Check if resource is locked
   */
  async isHeld(resource: string): Promise<boolean> {
    const redisKey = this.getLockKey(resource);
    const exists = await this.redis.exists(redisKey);
    return exists === 1;
  }

  /**
   * Get current lock owner ID
   * Returns null if not locked
   */
  async getOwner(resource: string): Promise<string | null> {
    const redisKey = this.getLockKey(resource);
    return await this.redis.get(redisKey);
  }

  /**
   * Release all locks held by this manager
   * Returns count of locks released
   */
  async releaseAll(): Promise<number> {
    let count = 0;
    
    for (const [resource, lockId] of this.activeLocks) {
      const released = await this.release(resource, lockId);
      if (released) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Release all active locks
    await this.releaseAll();
    this.activeLocks.clear();
  }

  /**
   * Get Redis key for lock
   */
  private getLockKey(resource: string): string {
    return `lock:${resource}`;
  }

  /**
   * Validate resource name
   */
  private validateResourceName(resource: string): void {
    if (!resource || resource.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
  }
}
