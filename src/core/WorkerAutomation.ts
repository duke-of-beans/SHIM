/**
 * WorkerAutomation - Autonomous Worker Task Execution
 * 
 * Worker-side component that autonomously executes tasks assigned by ChatCoordinator.
 * 
 * Features:
 * - Auto-registration with WorkerRegistry
 * - Autonomous task processing from queue
 * - Result reporting to coordinator via MessageBus
 * - Error handling and recovery
 * - Health monitoring with periodic heartbeats
 * - Task timeout handling
 * - Graceful shutdown
 * - Lifecycle management (stopped → idle → busy → idle)
 * 
 * Integrates with:
 * - TaskQueueWrapper (receives tasks)
 * - StateSynchronizer (task status and metadata)
 * - WorkerRegistry (registration and health)
 * - MessageBusWrapper (communication with coordinator)
 */

import { EventEmitter } from 'events';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { WorkerRegistry } from './WorkerRegistry';
import { MessageBusWrapper } from './MessageBusWrapper';

interface Task {
  id: string;
  type: string;
  [key: string]: any;
}

interface WorkerConfig {
  workerId: string;
  taskQueue: TaskQueueWrapper;
  stateSynchronizer: StateSynchronizer;
  workerRegistry: WorkerRegistry;
  messageBus: MessageBusWrapper;
  capabilities?: string[];
  capacity?: number;
}

interface StartOptions {
  heartbeatInterval?: number;
  taskTimeout?: number;
}

interface ShutdownOptions {
  gracePeriod?: number;
  force?: boolean;
}

interface WorkerHealth {
  workerId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  errorCount: number;
  lastHeartbeat: number;
}

type WorkerStatus = 'stopped' | 'idle' | 'busy' | 'error';
type TaskProcessor = (task: Task) => Promise<any>;

export class WorkerAutomation extends EventEmitter {
  private workerId: string;
  private taskQueue: TaskQueueWrapper;
  private stateSynchronizer: StateSynchronizer;
  private workerRegistry: WorkerRegistry;
  private messageBus: MessageBusWrapper;
  private capabilities: string[];
  private capacity: number;
  
  private status: WorkerStatus = 'stopped';
  private taskProcessor?: TaskProcessor;
  private isRunning: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private heartbeatIntervalMs: number = 5000; // 5 seconds default
  private taskTimeoutMs: number = 300000; // 5 minutes default
  private startTime: number = 0;
  private errorCount: number = 0;
  private lastHeartbeat: number = 0;
  private currentTaskId?: string;

  constructor(config: WorkerConfig) {
    super();
    this.workerId = config.workerId;
    this.taskQueue = config.taskQueue;
    this.stateSynchronizer = config.stateSynchronizer;
    this.workerRegistry = config.workerRegistry;
    this.messageBus = config.messageBus;
    this.capabilities = config.capabilities || ['general'];
    this.capacity = config.capacity || 1;
  }

  /**
   * Start the worker (auto-registers and begins processing)
   */
  async start(options: StartOptions = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error('Worker already running');
    }

    // Validate options
    if (options.heartbeatInterval !== undefined) {
      if (options.heartbeatInterval <= 0) {
        throw new Error('Invalid heartbeat interval');
      }
      this.heartbeatIntervalMs = options.heartbeatInterval;
    }

    if (options.taskTimeout !== undefined) {
      this.taskTimeoutMs = options.taskTimeout;
    }

    // Validate capacity
    if (this.capacity < 0) {
      throw new Error('Invalid capacity');
    }

    // Register with WorkerRegistry
    await this.workerRegistry.register(this.workerId, {
      capabilities: this.capabilities,
      capacity: this.capacity,
      heartbeatInterval: this.heartbeatIntervalMs,
    });

    // Set initial status
    this.status = 'idle';
    this.isRunning = true;
    this.startTime = Date.now();
    this.errorCount = 0;

    // Start heartbeat
    this.startHeartbeat();

    // Listen for task assignments
    await this.messageBus.subscribe('task-assignment', async (message) => {
      if (message.workerId === this.workerId) {
        // Coordinator assigned task to this worker
        // (Already in queue, just acknowledgment)
      }
    });

    // Start processing tasks
    this.processTaskLoop();

    this.emit('status-change', { status: this.status });
  }

  /**
   * Process task loop (runs continuously while worker is running)
   */
  private async processTaskLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Process next task from queue
        await this.taskQueue.process(async (job) => {
          const task = job.data as Task;
          this.currentTaskId = task.id;
          
          return await this.processTask(task);
        });
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between checks
      } catch (error) {
        // Loop continues even on error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: Task): Promise<any> {
    if (!this.taskProcessor) {
      // No processor set - skip or error
      this.status = 'idle';
      return { skipped: true, reason: 'No task processor configured' };
    }

    try {
      // Update status to busy
      this.status = 'busy';
      this.emit('status-change', { status: this.status });

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.taskTimeoutMs);
      });

      // Race between task completion and timeout
      const result = await Promise.race([
        this.taskProcessor(task),
        timeoutPromise,
      ]);

      // Report success
      await this.reportResult(task.id, result);

      // Update status
      await this.stateSynchronizer.setState(
        `task:${task.id}:status`,
        'completed',
        300000 // 5 min TTL
      );

      // Return to idle
      this.status = 'idle';
      this.emit('status-change', { status: this.status });

      return result;
    } catch (error) {
      // Handle error
      await this.handleTaskError(task.id, error);

      // Return to idle
      this.status = 'idle';
      this.emit('status-change', { status: this.status });

      throw error;
    } finally {
      this.currentTaskId = undefined;
    }
  }

  /**
   * Handle task processing error
   */
  private async handleTaskError(taskId: string, error: any): Promise<void> {
    this.errorCount++;

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if timeout error
    if (errorMessage.includes('timeout')) {
      this.emit('task-timeout', { taskId, timeout: this.taskTimeoutMs });
    }

    // Report error to coordinator
    await this.messageBus.publish('task-errors', {
      taskId,
      workerId: this.workerId,
      error: errorMessage,
      timestamp: Date.now(),
    });

    // Update task status
    await this.stateSynchronizer.setState(
      `task:${taskId}:status`,
      'failed',
      300000
    );

    // Check if worker should be marked as degraded
    if (this.errorCount > 5) {
      this.status = 'error';
      this.emit('status-change', { status: this.status });
    }
  }

  /**
   * Report task result to coordinator
   */
  private async reportResult(taskId: string, result: any): Promise<void> {
    await this.messageBus.publish('task-results', {
      taskId,
      workerId: this.workerId,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Report task progress
   */
  async reportProgress(taskId: string, progress: number): Promise<void> {
    await this.messageBus.publish('task-progress', {
      taskId,
      workerId: this.workerId,
      progress,
      timestamp: Date.now(),
    });
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        // Heartbeat failed - continue anyway
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Send heartbeat to coordinator
   */
  private async sendHeartbeat(): Promise<void> {
    const load = this.status === 'busy' ? 1 : 0;
    
    this.lastHeartbeat = Date.now();

    await this.messageBus.publish('worker-heartbeat', {
      workerId: this.workerId,
      status: this.status,
      load,
      timestamp: this.lastHeartbeat,
    });

    // Update registry heartbeat
    await this.workerRegistry.heartbeat(this.workerId);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Set task processor function
   */
  setTaskProcessor(processor: TaskProcessor): void {
    this.taskProcessor = processor;
  }

  /**
   * Get current status
   */
  getStatus(): WorkerStatus {
    return this.status;
  }

  /**
   * Check if worker is running
   */
  async isRunning(): Promise<boolean> {
    return this.isRunning;
  }

  /**
   * Get worker capacity
   */
  async getCapacity(): Promise<number> {
    return this.capacity;
  }

  /**
   * Update worker capabilities
   */
  async updateCapabilities(capabilities: string[]): Promise<void> {
    this.capabilities = capabilities;

    // Update registry
    await this.workerRegistry.updateWorker(this.workerId, {
      capabilities,
    });

    // Notify coordinator
    await this.messageBus.publish('worker-update', {
      workerId: this.workerId,
      capabilities,
      timestamp: Date.now(),
    });
  }

  /**
   * Get worker health status
   */
  async getHealth(): Promise<WorkerHealth> {
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    
    if (!this.isRunning) {
      healthStatus = 'unhealthy';
    } else if (this.errorCount > 5) {
      healthStatus = 'degraded';
    } else if (this.status === 'error') {
      healthStatus = 'unhealthy';
    } else {
      healthStatus = 'healthy';
    }

    return {
      workerId: this.workerId,
      status: healthStatus,
      uptime,
      errorCount: this.errorCount,
      lastHeartbeat: this.lastHeartbeat,
    };
  }

  /**
   * Shutdown worker gracefully
   */
  async shutdown(options: ShutdownOptions = {}): Promise<void> {
    const gracePeriod = options.gracePeriod ?? 30000; // 30 seconds default
    const force = options.force ?? false;

    // Stop accepting new tasks
    this.isRunning = false;

    if (!force && this.currentTaskId) {
      // Wait for current task to complete (with timeout)
      const startTime = Date.now();
      
      while (this.currentTaskId && Date.now() - startTime < gracePeriod) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Deregister from WorkerRegistry
    await this.workerRegistry.deregister(this.workerId);

    // Update status
    this.status = 'stopped';
    this.emit('status-change', { status: this.status });

    // Cleanup
    this.removeAllListeners();
  }
}
