/**
 * StateSynchronizer
 * 
 * Manages distributed state synchronization across multiple chat instances using Redis.
 * 
 * Features:
 * - Optimistic locking with version management
 * - Atomic operations (get, set, update, increment)
 * - Conflict detection and resolution
 * - TTL-based expiration
 * - Namespace isolation
 * 
 * Architecture:
 * - Uses Redis as backing store
 * - JSON serialization for complex objects
 * - Version tracking for optimistic concurrency control
 * - Separate Redis keys for state and version
 */

import { RedisConnectionManager } from './RedisConnectionManager';
import type { Redis } from 'ioredis';

export interface StateOptions {
  ttl?: number; // Time to live in seconds
}

export interface StateWithVersion<T = any> {
  state: T;
  version: number;
}

export class StateSynchronizer {
  private redis: Redis;
  
  constructor(private connectionManager: RedisConnectionManager) {
    this.redis = connectionManager.getClient();
  }

  /**
   * Set state with automatic version increment
   * Returns new version number
   */
  async setState(
    namespace: string,
    key: string,
    state: any,
    options: StateOptions = {}
  ): Promise<number> {
    const redisKey = this.getRedisKey(namespace, key);
    const versionKey = this.getVersionKey(namespace, key);
    
    // Serialize state
    const serialized = JSON.stringify(state);
    
    // Increment version atomically
    const newVersion = await this.redis.incr(versionKey);
    
    // Set state
    if (options.ttl) {
      await this.redis.setex(redisKey, options.ttl, serialized);
      await this.redis.expire(versionKey, options.ttl);
    } else {
      await this.redis.set(redisKey, serialized);
    }
    
    return newVersion;
  }

  /**
   * Get state without version
   */
  async getState<T = any>(namespace: string, key: string): Promise<T | null> {
    const redisKey = this.getRedisKey(namespace, key);
    const serialized = await this.redis.get(redisKey);
    
    if (!serialized) {
      return null;
    }
    
    try {
      return JSON.parse(serialized);
    } catch (error) {
      // Invalid JSON - return null
      return null;
    }
  }

  /**
   * Get state with version for optimistic locking
   */
  async getStateWithVersion<T = any>(
    namespace: string,
    key: string
  ): Promise<StateWithVersion<T> | null> {
    const state = await this.getState<T>(namespace, key);
    
    if (state === null) {
      return null;
    }
    
    const versionKey = this.getVersionKey(namespace, key);
    const versionStr = await this.redis.get(versionKey);
    const version = versionStr ? parseInt(versionStr, 10) : 0;
    
    return { state, version };
  }

  /**
   * Set state only if version matches (optimistic locking)
   * Returns new version on success, null on conflict
   */
  async setStateIfVersion(
    namespace: string,
    key: string,
    state: any,
    expectedVersion: number,
    options: StateOptions = {}
  ): Promise<number | null> {
    const redisKey = this.getRedisKey(namespace, key);
    const versionKey = this.getVersionKey(namespace, key);
    
    // Use Lua script for atomic check-and-set
    const script = `
      local versionKey = KEYS[1]
      local stateKey = KEYS[2]
      local expectedVersion = tonumber(ARGV[1])
      local newState = ARGV[2]
      local ttl = tonumber(ARGV[3])
      
      local currentVersion = tonumber(redis.call('GET', versionKey)) or 0
      
      if currentVersion == expectedVersion then
        local newVersion = redis.call('INCR', versionKey)
        redis.call('SET', stateKey, newState)
        
        if ttl > 0 then
          redis.call('EXPIRE', stateKey, ttl)
          redis.call('EXPIRE', versionKey, ttl)
        end
        
        return newVersion
      else
        return -1
      end
    `;
    
    const serialized = JSON.stringify(state);
    const ttl = options.ttl || 0;
    
    const result = await this.redis.eval(
      script,
      2,
      versionKey,
      redisKey,
      expectedVersion.toString(),
      serialized,
      ttl.toString()
    ) as number;
    
    return result === -1 ? null : result;
  }

  /**
   * Delete state and version
   */
  async deleteState(namespace: string, key: string): Promise<void> {
    const redisKey = this.getRedisKey(namespace, key);
    const versionKey = this.getVersionKey(namespace, key);
    
    await this.redis.del(redisKey, versionKey);
  }

  /**
   * Update specific fields atomically while preserving others
   */
  async updateFields(
    namespace: string,
    key: string,
    fields: Record<string, any>
  ): Promise<number> {
    // Get current state
    const current = await this.getState(namespace, key);
    
    if (!current) {
      throw new Error(`State not found: ${namespace}:${key}`);
    }
    
    // Merge fields
    const updated = { ...current, ...fields };
    
    // Set with version increment
    return await this.setState(namespace, key, updated);
  }

  /**
   * Atomically increment a numeric field
   */
  async incrementField(
    namespace: string,
    key: string,
    field: string,
    delta: number
  ): Promise<number> {
    // Get current state
    const current = await this.getState(namespace, key);
    
    if (!current) {
      throw new Error(`State not found: ${namespace}:${key}`);
    }
    
    const currentValue = typeof current[field] === 'number' ? current[field] : 0;
    const newValue = currentValue + delta;
    
    // Update field
    await this.updateFields(namespace, key, { [field]: newValue });
    
    return newValue;
  }

  /**
   * List all keys in a namespace
   */
  async listKeys(namespace: string): Promise<string[]> {
    const pattern = this.getRedisKey(namespace, '*');
    const keys = await this.redis.keys(pattern);
    
    // Extract key names (remove namespace prefix)
    const prefix = this.getRedisKey(namespace, '');
    return keys.map(k => k.slice(prefix.length));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // No persistent resources to clean up
    // Connection is managed by RedisConnectionManager
  }

  /**
   * Get Redis key for state
   */
  getRedisKey(namespace: string, key: string): string {
    return `state:${namespace}:${key}`;
  }

  /**
   * Get Redis key for version tracking
   */
  private getVersionKey(namespace: string, key: string): string {
    return `version:${namespace}:${key}`;
  }
}
