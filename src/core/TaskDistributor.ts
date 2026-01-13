/**
 * TaskDistributor - Advanced Task Queue Management
 * 
 * Provides sophisticated task distribution and queue management
 * beyond basic queueing.
 * 
 * Features:
 * - Priority-based task distribution (1 = highest, 10 = lowest)
 * - Deadline tracking and escalation
 * - Multiple routing strategies (round-robin, least-loaded, capability-based)
 * - Queue metrics and health monitoring
 * - Task dependencies and ordering
 * - Batch task submission
 * - Performance optimization
 * 
 * Integrates with:
 * - TaskQueueWrapper (underlying queue)
 * - StateSynchronizer (task metadata and state)
 * - WorkerRegistry (worker availability and capabilities)
 */

import { EventEmitter } from 'events';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { WorkerRegistry } from './WorkerRegistry';

interface Task {
  id: string;
  type?: string;
  priority?: number; // 1 = highest, 10 = lowest
  deadline?: number; // Unix timestamp
  dependencies?: string[]; // Task IDs that must complete first
  requirements?: string[]; // Required worker capabilities
  workerId?: string; // Pre-assigned worker
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'queued';
  error?: string;
  submittedAt?: number;
}

interface TaskAssignment {
  taskId: string;
  workerId: string;
  status: string;
  reason?: string;
}

interface QueueMetrics {
  depth: number;
  avgWaitTimeMs: number;
  throughputPerSecond: number;
  byPriority: Record<number, number>;
  oldestTaskAgeMs: number;
}

interface QueueHealth {
  isStarving: boolean;
  isSaturated: boolean;
  saturationRatio: number;
  oldestTaskAgeMs: number;
  reason?: string;
}

type RoutingStrategy = 'round-robin' | 'least-loaded' | 'capability-based';

interface DistributorConfig {
  taskQueue: TaskQueueWrapper;
  stateSynchronizer: StateSynchronizer;
  workerRegistry: WorkerRegistry;
  defaultPriority?: number;
  deadlineEscalationThresholdMs?: number;
}

export class TaskDistributor extends EventEmitter {
  private taskQueue: TaskQueueWrapper;
  private stateSynchronizer: StateSynchronizer;
  private workerRegistry: WorkerRegistry;
  private defaultPriority: number;
  private deadlineEscalationThresholdMs: number;
  private currentStrategy: RoutingStrategy = 'least-loaded';
  private roundRobinIndex: number = 0;
  private isShuttingDown: boolean = false;
  private submissionCount: number = 0;
  private completionCount: number = 0;
  private startTime: number = Date.now();

  constructor(config: DistributorConfig) {
    super();
    this.taskQueue = config.taskQueue;
    this.stateSynchronizer = config.stateSynchronizer;
    this.workerRegistry = config.workerRegistry;
    this.defaultPriority = config.defaultPriority ?? 5;
    this.deadlineEscalationThresholdMs = config.deadlineEscalationThresholdMs ?? 30000; // 30 seconds
  }

  /**
   * Submit a single task
   */
  async submitTask(task: Task): Promise<string> {
    if (!task || !task.id) {
      throw new Error('Invalid task');
    }

    // Check Redis connection
    if (!this.stateSynchronizer) {
      throw new Error('Redis connection unavailable');
    }

    // Set defaults
    task.priority = task.priority ?? this.defaultPriority;
    task.status = task.status ?? 'pending';
    task.submittedAt = task.submittedAt ?? Date.now();
    task.type = task.type ?? 'default';

    // Check for circular dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      await this.checkCircularDependencies(task.id, task.dependencies);
    }

    // Store task metadata
    await this.stateSynchronizer.setState(
      `task:${task.id}:meta`,
      task,
      600000 // 10 minute TTL
    );

    // Add to queue with priority
    await this.taskQueue.addTask(task, {
      priority: task.priority,
      delay: 0,
    });

    this.submissionCount++;

    return task.id;
  }

  /**
   * Check for circular dependencies
   */
  private async checkCircularDependencies(
    taskId: string, 
    dependencies: string[],
    visited: Set<string> = new Set()
  ): Promise<void> {
    if (visited.has(taskId)) {
      throw new Error('Circular dependency detected');
    }

    visited.add(taskId);

    for (const depId of dependencies) {
      const depTask = await this.getTask(depId);
      if (depTask && depTask.dependencies) {
        await this.checkCircularDependencies(depId, depTask.dependencies, visited);
      }
    }
  }

  /**
   * Submit batch of tasks efficiently
   */
  async submitBatch(tasks: Task[]): Promise<string[]> {
    if (tasks.length === 0) return [];

    // Validate all tasks first
    for (const task of tasks) {
      if (!task.id || !task.type) {
        throw new Error('Invalid task in batch');
      }
    }

    const taskIds: string[] = [];

    // Submit all tasks
    for (const task of tasks) {
      const taskId = await this.submitTask(task);
      taskIds.push(taskId);
    }

    return taskIds;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    return await this.stateSynchronizer.getState(`task:${taskId}:meta`);
  }

  /**
   * Adjust task priority dynamically
   */
  async adjustPriority(taskId: string, newPriority: number): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    task.priority = newPriority;
    await this.stateSynchronizer.setState(`task:${taskId}:meta`, task, 600000);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const now = Date.now();
    const keys = await this.stateSynchronizer.listKeys('task:*:meta');
    const overdueTasks: Task[] = [];

    for (const key of keys) {
      const task = await this.stateSynchronizer.getState(key);
      if (task && task.deadline && task.deadline < now && task.status !== 'completed') {
        overdueTasks.push(task);
      }
    }

    return overdueTasks;
  }

  /**
   * Escalate priority for tasks approaching deadlines
   */
  async escalateApproachingDeadlines(): Promise<void> {
    const now = Date.now();
    const threshold = now + this.deadlineEscalationThresholdMs;
    const keys = await this.stateSynchronizer.listKeys('task:*:meta');

    for (const key of keys) {
      const task = await this.stateSynchronizer.getState(key);
      if (task && task.deadline && task.deadline < threshold && task.status === 'pending') {
        // Escalate priority (lower number = higher priority)
        const newPriority = Math.max(1, task.priority - 3);
        await this.adjustPriority(task.id, newPriority);
      }
    }
  }

  /**
   * Check deadlines and emit events for overdue tasks
   */
  async checkDeadlines(): Promise<void> {
    const overdueTasks = await this.getOverdueTasks();

    for (const task of overdueTasks) {
      this.emit('task-overdue', {
        taskId: task.id,
        deadline: task.deadline,
        overdueBy: Date.now() - task.deadline!,
      });
    }
  }

  /**
   * Process tasks with a processor function
   */
  async processTasks(
    processor: (task: Task) => Promise<any>
  ): Promise<void> {
    await this.taskQueue.process(async (job) => {
      const task = job.data as Task;
      
      try {
        // Check if can process (dependencies complete)
        const canProcess = await this.canProcessTask(task.id);
        if (!canProcess) {
          throw new Error('Dependencies not complete');
        }

        task.status = 'running';
        await this.stateSynchronizer.setState(`task:${task.id}:meta`, task, 600000);

        const result = await processor(task);

        task.status = 'completed';
        await this.stateSynchronizer.setState(`task:${task.id}:meta`, task, 600000);

        this.completionCount++;

        return result;
      } catch (error) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : String(error);
        await this.stateSynchronizer.setState(`task:${task.id}:meta`, task, 600000);
        throw error;
      }
    });
  }

  /**
   * Check if task can be processed (dependencies complete)
   */
  async canProcessTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    // Check all dependencies are complete
    for (const depId of task.dependencies) {
      const depTask = await this.getTask(depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Mark task as complete
   */
  async markTaskComplete(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (task) {
      task.status = 'completed';
      await this.stateSynchronizer.setState(`task:${taskId}:meta`, task, 600000);
      this.completionCount++;
    }
  }

  /**
   * Process batch of tasks
   */
  async processBatch(maxTasks: number): Promise<number> {
    let processed = 0;

    for (let i = 0; i < maxTasks; i++) {
      // Get next task from queue
      const job = await this.taskQueue.getWaiting();
      if (!job || job.length === 0) break;

      // Process first job
      await this.taskQueue.process(async (j) => {
        const task = j.data as Task;
        task.status = 'completed';
        await this.stateSynchronizer.setState(`task:${task.id}:meta`, task, 600000);
        this.completionCount++;
        processed++;
        return { done: true };
      });
    }

    return processed;
  }

  /**
   * Distribute tasks using round-robin strategy
   */
  async distributeRoundRobin(tasks: Task[]): Promise<TaskAssignment[]> {
    const workers = await this.workerRegistry.listWorkers();
    if (workers.length === 0) {
      return tasks.map(t => ({
        taskId: t.id,
        workerId: '',
        status: 'queued',
        reason: 'No workers available',
      }));
    }

    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      const worker = workers[this.roundRobinIndex % workers.length];
      this.roundRobinIndex++;

      assignments.push({
        taskId: task.id,
        workerId: worker.id,
        status: 'assigned',
      });

      // Store assignment
      await this.stateSynchronizer.updateFields(
        `worker:${worker.id}:tasks`,
        { [task.id]: 'assigned' }
      );
    }

    return assignments;
  }

  /**
   * Distribute tasks to least-loaded workers
   */
  async distributeLeastLoaded(tasks: Task[]): Promise<TaskAssignment[]> {
    const workers = await this.workerRegistry.listWorkers();
    if (workers.length === 0) {
      return tasks.map(t => ({
        taskId: t.id,
        workerId: '',
        status: 'queued',
        reason: 'No workers available',
      }));
    }

    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      // Find worker with lowest load
      let lowestLoad = Infinity;
      let bestWorker = workers[0];

      for (const worker of workers) {
        const load = await this.getWorkerLoad(worker.id);
        if (load < lowestLoad) {
          lowestLoad = load;
          bestWorker = worker;
        }
      }

      assignments.push({
        taskId: task.id,
        workerId: bestWorker.id,
        status: 'assigned',
      });

      // Store assignment
      await this.stateSynchronizer.updateFields(
        `worker:${bestWorker.id}:tasks`,
        { [task.id]: 'assigned' }
      );
    }

    return assignments;
  }

  /**
   * Get worker load (number of assigned tasks)
   */
  private async getWorkerLoad(workerId: string): Promise<number> {
    const tasks = await this.stateSynchronizer.getState(`worker:${workerId}:tasks`);
    return tasks ? Object.keys(tasks).length : 0;
  }

  /**
   * Distribute tasks based on capabilities
   */
  async distributeByCapability(tasks: Task[]): Promise<TaskAssignment[]> {
    const workers = await this.workerRegistry.listWorkers();
    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      // Find workers with required capabilities
      const capableWorkers = workers.filter(w => 
        !task.requirements || 
        task.requirements.every(req => w.capabilities?.includes(req))
      );

      if (capableWorkers.length === 0) {
        assignments.push({
          taskId: task.id,
          workerId: '',
          status: 'queued',
          reason: 'No capable worker available',
        });
        continue;
      }

      // Use least-loaded among capable workers
      let lowestLoad = Infinity;
      let bestWorker = capableWorkers[0];

      for (const worker of capableWorkers) {
        const load = await this.getWorkerLoad(worker.id);
        if (load < lowestLoad) {
          lowestLoad = load;
          bestWorker = worker;
        }
      }

      assignments.push({
        taskId: task.id,
        workerId: bestWorker.id,
        status: 'assigned',
      });

      // Store assignment
      await this.stateSynchronizer.updateFields(
        `worker:${bestWorker.id}:tasks`,
        { [task.id]: 'assigned' }
      );
    }

    return assignments;
  }

  /**
   * Set routing strategy
   */
  async setStrategy(strategy: RoutingStrategy): Promise<void> {
    this.currentStrategy = strategy;
    await this.stateSynchronizer.setState(
      'distributor:strategy',
      strategy,
      3600000 // 1 hour TTL
    );
  }

  /**
   * Get current routing strategy
   */
  async getStrategy(): Promise<RoutingStrategy> {
    const stored = await this.stateSynchronizer.getState('distributor:strategy');
    return stored || this.currentStrategy;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    const counts = await this.taskQueue.getJobCounts();
    const depth = counts.waiting + counts.active;

    // Calculate average wait time
    const waiting = await this.taskQueue.getWaiting();
    let totalWaitTime = 0;
    let oldestTaskAge = 0;

    for (const job of waiting) {
      const task = job.data as Task;
      if (task.submittedAt) {
        const waitTime = Date.now() - task.submittedAt;
        totalWaitTime += waitTime;
        oldestTaskAge = Math.max(oldestTaskAge, waitTime);
      }
    }

    const avgWaitTimeMs = waiting.length > 0 ? totalWaitTime / waiting.length : 0;

    // Calculate throughput
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const throughputPerSecond = elapsedSeconds > 0 ? this.completionCount / elapsedSeconds : 0;

    // Count by priority
    const byPriority: Record<number, number> = {};
    for (const job of waiting) {
      const task = job.data as Task;
      const priority = task.priority ?? this.defaultPriority;
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    }

    return {
      depth,
      avgWaitTimeMs,
      throughputPerSecond,
      byPriority,
      oldestTaskAgeMs: oldestTaskAge,
    };
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<QueueHealth> {
    const metrics = await this.getQueueMetrics();
    const workers = await this.workerRegistry.listWorkers();

    // Check starvation (tasks waiting but no workers)
    const isStarving = metrics.depth > 0 && workers.length === 0;

    // Calculate total capacity
    const totalCapacity = workers.reduce((sum, w) => sum + w.capacity, 0);

    // Check saturation (tasks >> capacity)
    const saturationRatio = totalCapacity > 0 ? metrics.depth / totalCapacity : 0;
    const isSaturated = saturationRatio > 5; // More than 5x capacity

    return {
      isStarving,
      isSaturated,
      saturationRatio,
      oldestTaskAgeMs: metrics.oldestTaskAgeMs,
      reason: isStarving 
        ? 'No workers available' 
        : isSaturated 
        ? 'Queue overloaded' 
        : undefined,
    };
  }

  /**
   * Check queue health and emit warnings
   */
  async checkQueueHealth(): Promise<void> {
    const health = await this.getQueueHealth();

    if (health.isStarving || health.isSaturated) {
      this.emit('queue-warning', {
        health,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Shutdown distributor gracefully
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Wait for in-flight tasks
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const counts = await this.taskQueue.getJobCounts();
      if (counts.active === 0) break;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Cleanup
    this.removeAllListeners();
  }
}
