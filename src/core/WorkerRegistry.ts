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
export class WorkerRegistry {
  private readonly HEARTBEAT_TIMEOUT = 30000; // 30 seconds
  private readonly WORKER_KEY_PREFIX = 'worker:';
  
  constructor(private readonly redis: RedisConnectionManager) {}
  
  /**
   * Register a new worker or update existing worker.
   * 
   * If worker already exists, preserves registration time but updates
   * chat ID and heartbeat timestamp.
   * 
   * @param workerId Unique worker identifier
   * @param chatId Associated chat session ID
   */
  async registerWorker(workerId: string, chatId: string): Promise<void> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    // Check if worker exists
    const existing = await client.get(key);
    const now = Date.now();
    
    let worker: WorkerInfo;
    
    if (existing) {
      // Update existing worker
      const existingWorker = JSON.parse(existing) as WorkerInfo;
      worker = {
        ...existingWorker,
        chatId,
        lastHeartbeat: now,
      };
    } else {
      // Create new worker
      worker = {
        workerId,
        chatId,
        status: 'idle',
        health: 'healthy',
        registeredAt: now,
        lastHeartbeat: now,
      };
    }
    
    await client.set(key, JSON.stringify(worker));
  }
  
  /**
   * Unregister a worker.
   * 
   * Safe to call on non-existent workers (no-op).
   * 
   * @param workerId Worker to unregister
   */
  async unregisterWorker(workerId: string): Promise<void> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    await client.del(key);
  }
  
  /**
   * Update worker heartbeat timestamp.
   * 
   * Safe to call on non-existent workers (no-op).
   * 
   * @param workerId Worker to update
   */
  async heartbeat(workerId: string): Promise<void> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    const existing = await client.get(key);
    if (!existing) {
      return; // Worker doesn't exist, ignore
    }
    
    const worker = JSON.parse(existing) as WorkerInfo;
    worker.lastHeartbeat = Date.now();
    
    await client.set(key, JSON.stringify(worker));
  }
  
  /**
   * Get worker information.
   * 
   * @param workerId Worker to retrieve
   * @returns Worker info or null if not found
   */
  async getWorker(workerId: string): Promise<WorkerInfo | null> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as WorkerInfo;
  }
  
  /**
   * List all registered workers.
   * 
   * @returns Array of all workers
   */
  async listWorkers(): Promise<WorkerInfo[]> {
    const client = this.redis.getClient();
    const pattern = this.getWorkerKey('*');
    
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return [];
    }
    
    const values = await client.mget(...keys);
    return values
      .filter((v): v is string => v !== null)
      .map(v => JSON.parse(v) as WorkerInfo);
  }
  
  /**
   * Detect crashed workers (heartbeat timeout exceeded).
   * 
   * Automatically updates health status to 'crashed' for detected workers.
   * 
   * @returns Array of crashed workers
   */
  async getCrashedWorkers(): Promise<WorkerInfo[]> {
    const workers = await this.listWorkers();
    const now = Date.now();
    const crashed: WorkerInfo[] = [];
    
    for (const worker of workers) {
      const timeSinceHeartbeat = now - worker.lastHeartbeat;
      
      if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT) {
        // Update health status to crashed
        worker.health = 'crashed';
        await this.updateHealth(worker.workerId, 'crashed');
        crashed.push(worker);
      }
    }
    
    return crashed;
  }
  
  /**
   * Update worker health status.
   * 
   * @param workerId Worker to update
   * @param health New health status
   */
  async updateHealth(workerId: string, health: WorkerHealth): Promise<void> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    const existing = await client.get(key);
    if (!existing) {
      return; // Worker doesn't exist
    }
    
    const worker = JSON.parse(existing) as WorkerInfo;
    worker.health = health;
    
    await client.set(key, JSON.stringify(worker));
  }
  
  /**
   * Get workers filtered by health status.
   * 
   * @param health Health status to filter by
   * @returns Workers with matching health status
   */
  async getWorkersByHealth(health: WorkerHealth): Promise<WorkerInfo[]> {
    const workers = await this.listWorkers();
    return workers.filter(w => w.health === health);
  }
  
  /**
   * Update worker status and optional current task.
   * 
   * @param workerId Worker to update
   * @param status New status
   * @param currentTask Task ID (optional, cleared if undefined)
   */
  async updateStatus(
    workerId: string,
    status: WorkerStatus,
    currentTask?: string
  ): Promise<void> {
    const client = this.redis.getClient();
    const key = this.getWorkerKey(workerId);
    
    const existing = await client.get(key);
    if (!existing) {
      return; // Worker doesn't exist
    }
    
    const worker = JSON.parse(existing) as WorkerInfo;
    worker.status = status;
    
    // Update or clear current task
    if (currentTask !== undefined) {
      worker.currentTask = currentTask;
    } else if (status === 'idle') {
      delete worker.currentTask;
    }
    
    await client.set(key, JSON.stringify(worker));
  }
  
  /**
   * Cleanup resources (for testing).
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up (Redis handles connection cleanup)
  }
  
  /**
   * Get Redis key for worker.
   */
  private getWorkerKey(workerId: string): string {
    return `${this.WORKER_KEY_PREFIX}${workerId}`;
  }
}
