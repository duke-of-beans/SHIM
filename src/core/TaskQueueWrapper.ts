/**
 * TaskQueueWrapper
 * 
 * Wraps BullMQ with SHIM-specific task handling
 * Provides task management, worker pattern, and queue control
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { RedisConnectionManager } from './RedisConnectionManager';

/**
 * Task structure
 */
export interface Task {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Task result from processor
 */
export interface TaskResult {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Options for adding tasks
 */
export interface AddOptions {
  priority?: number;      // 1 (highest) to 10 (lowest)
  delay?: number;         // Delay in milliseconds
  attempts?: number;      // Retry attempts
}

/**
 * Queue statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Task processor function
 */
export type TaskProcessor = (
  task: Task,
  progress?: ProgressCallback
) => Promise<TaskResult>;

/**
 * Progress callback
 */
export type ProgressCallback = (percentage: number, message?: string) => void;

/**
 * TaskQueueWrapper
 * 
 * Wraps BullMQ queue with SHIM-specific functionality
 */
export class TaskQueueWrapper {
  private queue: Queue;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents;
  private connection: RedisConnectionManager;
  private queueName: string;

  constructor(
    connection: RedisConnectionManager,
    queueName: string
  ) {
    if (!connection) {
      throw new Error('RedisConnectionManager is required');
    }

    if (!queueName || queueName.trim() === '') {
      throw new Error('Queue name cannot be empty');
    }

    this.connection = connection;
    this.queueName = queueName;

    // Get Redis connection configuration (not client instance)
    // Only call getClient() if connection is ready
    const connectionConfig = this.getConnectionConfig();

    // Initialize BullMQ queue
    this.queue = new Queue(queueName, {
      connection: connectionConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    });

    // Initialize queue events with error handler to prevent unhandled errors
    this.queueEvents = new QueueEvents(queueName, {
      connection: connectionConfig
    });

    // Prevent unhandled error events from crashing tests
    this.queueEvents.on('error', (err) => {
      // Silently handle connection errors during cleanup
      if (err.message?.includes('Connection is closed')) {
        return;
      }
      console.error('QueueEvents error:', err);
    });
  }

  /**
   * Get Redis connection configuration
   */
  private getConnectionConfig(): {
    host: string;
    port: number;
    db: number;
    password?: string;
    keyPrefix?: string;
  } {
    try {
      // Try to get client - this might throw if not connected
      const redisClient = this.connection.getClient();
      return {
        host: redisClient.options.host || 'localhost',
        port: redisClient.options.port || 6379,
        db: redisClient.options.db || 0,
        password: redisClient.options.password,
        keyPrefix: redisClient.options.keyPrefix
      };
    } catch (err) {
      // Connection not established - return default config
      // BullMQ will handle connection errors when operations are attempted
      return {
        host: 'localhost',
        port: 6379,
        db: 0
      };
    }
  }

  /**
   * Add task to queue
   */
  async addTask(task: Task, options?: AddOptions): Promise<string> {
    if (!task) {
      throw new Error('Task is required');
    }

    const jobOptions: {
      priority?: number;
      delay?: number;
      attempts?: number;
    } = {};

    if (options?.priority) {
      jobOptions.priority = options.priority;
    }

    if (options?.delay) {
      jobOptions.delay = options.delay;
    }

    if (options?.attempts) {
      jobOptions.attempts = options.attempts;
    }

    // Pass only task.data to BullMQ (job.name is already task.type)
    const job = await this.queue.add(task.type, task.data, jobOptions);
    return job.id!;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    const job = await this.queue.getJob(taskId);
    
    if (!job) {
      return null;
    }

    return {
      type: job.name,
      data: job.data
    };
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const job = await this.queue.getJob(taskId);
    
    if (!job) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (updates.data) {
      // BullMQ doesn't support updating job data directly
      // Instead, we update the job's data property and save it
      Object.assign(job.data, updates.data);
      await job.updateData(job.data);
    }
  }

  /**
   * Register worker to process tasks
   */
  async registerWorker(
    processor: TaskProcessor,
    concurrency: number = 1
  ): Promise<void> {
    if (!processor) {
      throw new Error('Processor is required');
    }

    const connectionConfig = this.getConnectionConfig();

    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        const task: Task = {
          type: job.name,
          data: job.data
        };

        // Progress callback
        const progress: ProgressCallback = (percentage: number, _message?: string) => {
          void job.updateProgress(percentage);
        };

        return processor(task, progress);
      },
      {
        connection: connectionConfig,
        concurrency
      }
    );

    // Add error handler to prevent unhandled errors
    this.worker.on('error', (err) => {
      // Silently handle connection errors during cleanup
      if (err.message?.includes('Connection is closed')) {
        return;
      }
      console.error('Worker error:', err);
    });

    // Wait for worker to be ready before returning
    await this.worker.waitUntilReady();
  }

  /**
   * Pause queue
   */
  async pause(): Promise<void> {
    return this.queue.pause();
  }

  /**
   * Resume queue
   */
  async resume(): Promise<void> {
    return this.queue.resume();
  }

  /**
   * Drain queue (remove waiting jobs)
   */
  async drain(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Clean completed/failed jobs
   */
  async clean(grace: number): Promise<void> {
    await this.queue.clean(grace, 100, 'completed');
    await this.queue.clean(grace, 100, 'failed');
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed'
    );

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0
    };
  }

  /**
   * Get waiting job count
   */
  async getWaitingCount(): Promise<number> {
    return this.queue.getWaitingCount();
  }

  /**
   * Get active job count
   */
  async getActiveCount(): Promise<number> {
    return this.queue.getActiveCount();
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }

    await this.queueEvents.close();
    await this.queue.close();
  }
}
