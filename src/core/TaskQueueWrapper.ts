/**
 * TaskQueueWrapper
 * 
 * Thin wrapper around BullMQ for distributed task queue management.
 * 
 * Features:
 * - Task submission with priority and delay
 * - Concurrent task processing
 * - Job progress tracking
 * - Automatic retry with backoff
 * - Queue metrics and monitoring
 * - Event-driven architecture
 * 
 * Architecture:
 * - Uses BullMQ (battle-tested queue library)
 * - Redis as backing store
 * - Thin wrapper (~150 LOC)
 * - LEAN-OUT principle: use existing tools, not custom infrastructure
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { RedisConnectionManager } from './RedisConnectionManager';
import type { Redis } from 'ioredis';
import { EventEmitter } from 'events';

export interface TaskOptions {
  priority?: number;      // Lower number = higher priority (1-10)
  delay?: number;         // Delay in milliseconds
  attempts?: number;      // Max retry attempts (default: 3)
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  jobId?: string;         // Custom job ID
  removeOnComplete?: boolean | number; // Remove on completion (default: false)
  removeOnFail?: boolean | number;     // Remove on failure (default: false)
}

export interface ProcessOptions {
  concurrency?: number;   // Number of concurrent workers (default: 1)
}

export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

type ProcessorFunction<T = any, R = any> = (job: Job<T, R>) => Promise<R>;

export class TaskQueueWrapper extends EventEmitter {
  private queue: Queue;
  private worker?: Worker;
  private queueEvents: QueueEvents;
  private redis: Redis;
  
  constructor(
    private queueName: string,
    private connectionManager: RedisConnectionManager
  ) {
    super();
    this.redis = connectionManager.getClient();
    
    // Initialize BullMQ Queue
    this.queue = new Queue(queueName, {
      connection: {
        host: this.redis.options.host,
        port: this.redis.options.port,
        db: this.redis.options.db,
      },
    });
    
    // Initialize QueueEvents for monitoring
    this.queueEvents = new QueueEvents(queueName, {
      connection: {
        host: this.redis.options.host,
        port: this.redis.options.port,
        db: this.redis.options.db,
      },
    });
    
    // Forward BullMQ events
    this.setupEventForwarding();
  }

  /**
   * Add task to queue
   * Returns job ID
   */
  async addTask<T = any>(
    data: T,
    options: TaskOptions = {}
  ): Promise<string> {
    if (data === undefined || data === null) {
      throw new Error('Task data cannot be undefined or null');
    }
    
    const job = await this.queue.add(
      'task',
      data,
      {
        priority: options.priority,
        delay: options.delay,
        attempts: options.attempts || 3,
        backoff: options.backoff,
        jobId: options.jobId,
        removeOnComplete: options.removeOnComplete,
        removeOnFail: options.removeOnFail,
      }
    );
    
    return job.id!;
  }

  /**
   * Register task processor
   */
  async process<T = any, R = any>(
    processor: ProcessorFunction<T, R>,
    options: ProcessOptions = {}
  ): Promise<void> {
    if (this.worker) {
      throw new Error('Processor already registered');
    }
    
    this.worker = new Worker(
      this.queueName,
      processor,
      {
        connection: {
          host: this.redis.options.host,
          port: this.redis.options.port,
          db: this.redis.options.db,
        },
        concurrency: options.concurrency || 1,
      }
    );
    
    // Forward worker events
    this.worker.on('completed', (job, result) => {
      this.emit('completed', job, result);
    });
    
    this.worker.on('failed', (job, error) => {
      this.emit('failed', job, error);
    });
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const job = await this.queue.getJob(jobId);
    return job || null;
  }

  /**
   * Remove job by ID
   */
  async removeJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }
    
    await job.remove();
    return true;
  }

  /**
   * Clean jobs by status and age
   */
  async clean(
    status: 'completed' | 'failed',
    grace: number
  ): Promise<number> {
    const jobs = await this.queue.clean(grace, 1000, status);
    return jobs.length;
  }

  /**
   * Get job counts by status
   */
  async getJobCounts(): Promise<JobCounts> {
    const counts = await this.queue.getJobCounts();
    
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    };
  }

  /**
   * Get waiting jobs
   */
  async getWaiting(): Promise<Job[]> {
    return await this.queue.getWaiting();
  }

  /**
   * Get active jobs
   */
  async getActive(): Promise<Job[]> {
    return await this.queue.getActive();
  }

  /**
   * Get completed jobs
   */
  async getCompleted(): Promise<Job[]> {
    return await this.queue.getCompleted();
  }

  /**
   * Get failed jobs
   */
  async getFailed(): Promise<Job[]> {
    return await this.queue.getFailed();
  }

  /**
   * Pause queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Check if queue is paused
   */
  async isPaused(): Promise<boolean> {
    return await this.queue.isPaused();
  }

  /**
   * Drain queue (remove all waiting jobs)
   */
  async drain(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Close queue and worker
   */
  async close(): Promise<void> {
    // Close worker first
    if (this.worker) {
      await this.worker.close();
      this.worker = undefined;
    }
    
    // Close queue events
    await this.queueEvents.close();
    
    // Close queue
    await this.queue.close();
  }

  /**
   * Setup event forwarding from BullMQ to EventEmitter
   */
  private setupEventForwarding(): void {
    // Forward queue events
    this.queueEvents.on('completed', ({ jobId }) => {
      this.queue.getJob(jobId).then((job) => {
        if (job) {
          this.emit('completed', job, job.returnvalue);
        }
      });
    });
    
    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.queue.getJob(jobId).then((job) => {
        this.emit('failed', job, new Error(failedReason));
      });
    });
  }
}
