/**
 * ChatCoordinator - Supervisor Pattern for Multi-Chat Coordination
 * 
 * Orchestrates multiple worker chats to execute complex tasks in parallel.
 * 
 * Responsibilities:
 * - Task decomposition (breaking large tasks into subtasks)
 * - Worker assignment (distributing subtasks to available workers)
 * - Progress tracking (monitoring worker status)
 * - Result aggregation (collecting and combining results)
 * - Failure handling (retry, reassignment)
 * - Load balancing (distributing work evenly)
 * 
 * Architecture:
 * - Uses TaskQueueWrapper for task distribution
 * - Uses StateSynchronizer for shared state
 * - Uses LockManager for coordination
 * - Uses MessageBusWrapper for worker communication
 * - Uses WorkerRegistry for worker tracking
 */

import { EventEmitter } from 'events';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { LockManager } from './LockManager';
import { MessageBusWrapper } from './MessageBusWrapper';
import { WorkerRegistry } from './WorkerRegistry';

interface Task {
  id: string;
  type: string;
  description?: string;
  complexity?: 'low' | 'medium' | 'high';
  parentId?: string;
  mergeStrategy?: 'concatenate' | 'merge' | 'first' | 'last';
  requirements?: string[];
  urgent?: boolean;
}

interface TaskAssignment {
  taskId: string;
  workerId: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed';
  attempt: number;
  assignedAt: number;
}

interface AggregatedResult {
  results: any[];
  allCompleted: boolean;
  completed: number;
  total: number;
  [key: string]: any;
}

interface CoordinatorConfig {
  taskQueue: TaskQueueWrapper;
  stateSynchronizer: StateSynchronizer;
  lockManager: LockManager;
  messageBus: MessageBusWrapper;
  workerRegistry: WorkerRegistry;
  maxRetries?: number;
  retryBackoffMs?: number;
}

interface ShutdownOptions {
  gracePeriod?: number;
  forceAfter?: number;
}

export class ChatCoordinator extends EventEmitter {
  private taskQueue: TaskQueueWrapper;
  private stateSynchronizer: StateSynchronizer;
  private lockManager: LockManager;
  private messageBus: MessageBusWrapper;
  private workerRegistry: WorkerRegistry;
  private maxRetries: number;
  private retryBackoffMs: number;
  private isShuttingDown: boolean = false;

  constructor(config: CoordinatorConfig) {
    super();
    this.taskQueue = config.taskQueue;
    this.stateSynchronizer = config.stateSynchronizer;
    this.lockManager = config.lockManager;
    this.messageBus = config.messageBus;
    this.workerRegistry = config.workerRegistry;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBackoffMs = config.retryBackoffMs ?? 1000;
  }

  /**
   * Decompose large task into subtasks
   */
  async decomposeTask(task: Task): Promise<Task[]> {
    if (!task.id || !task.type) {
      throw new Error('Invalid task structure');
    }

    const complexity = task.complexity ?? 'medium';
    const subtaskCount = this.calculateSubtaskCount(complexity);

    const subtasks: Task[] = [];
    for (let i = 0; i < subtaskCount; i++) {
      subtasks.push({
        id: `${task.id}-sub-${i}`,
        type: `${task.type}-subtask`,
        parentId: task.id,
        description: `Subtask ${i + 1} of ${task.description || task.type}`,
      });
    }

    // Store parent-child relationship
    await this.stateSynchronizer.setState(
      `task:${task.id}:subtasks`,
      subtasks.map(t => t.id),
      60000 // 1 minute TTL
    );

    return subtasks;
  }

  private calculateSubtaskCount(complexity: string): number {
    switch (complexity) {
      case 'low':
        return 2;
      case 'medium':
        return 4;
      case 'high':
        return 8;
      default:
        return 4;
    }
  }

  /**
   * Assign tasks to available workers
   */
  async assignTasks(tasks: Task[]): Promise<TaskAssignment[]> {
    if (this.isShuttingDown) {
      throw new Error('Coordinator is shutting down');
    }

    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      // Check for duplicate assignment
      const existing = await this.getTaskAssignment(task.id);
      if (existing && existing.status !== 'failed') {
        throw new Error('Task already assigned');
      }

      // Find best worker
      const workerId = await this.findBestWorker(task);

      if (!workerId) {
        // No workers available - queue for later
        assignments.push({
          taskId: task.id,
          workerId: '',
          status: 'queued',
          attempt: 1,
          assignedAt: Date.now(),
        });
        continue;
      }

      // Create assignment
      const assignment: TaskAssignment = {
        taskId: task.id,
        workerId,
        status: 'pending',
        attempt: (existing?.attempt ?? 0) + 1,
        assignedAt: Date.now(),
      };

      // Store assignment
      await this.stateSynchronizer.setState(
        `assignment:${task.id}`,
        assignment,
        600000 // 10 minute TTL
      );

      // Add to worker's task list
      await this.stateSynchronizer.updateFields(
        `worker:${workerId}:tasks`,
        { [task.id]: 'pending' }
      );

      assignments.push(assignment);

      // Emit event
      this.emit('task-assigned', {
        taskId: task.id,
        workerId,
        assignedAt: assignment.assignedAt,
      });
    }

    return assignments;
  }

  /**
   * Find best worker for task using load balancing
   */
  private async findBestWorker(task: Task): Promise<string | null> {
    const workers = await this.workerRegistry.listWorkers();
    if (workers.length === 0) return null;

    // Filter by capabilities if task has requirements
    let candidates = workers;
    if (task.requirements && task.requirements.length > 0) {
      candidates = workers.filter(w => 
        task.requirements!.every(req => w.capabilities?.includes(req))
      );
    }

    if (candidates.length === 0) return null;

    // Load balancing: find worker with lowest current load
    let bestWorker = candidates[0];
    let lowestLoad = await this.getWorkerLoad(bestWorker.id);

    for (const worker of candidates.slice(1)) {
      const load = await this.getWorkerLoad(worker.id);
      if (load < lowestLoad) {
        lowestLoad = load;
        bestWorker = worker;
      }
    }

    // Check capacity
    if (lowestLoad >= bestWorker.capacity) {
      return null; // Over capacity
    }

    return bestWorker.id;
  }

  /**
   * Get current load for worker (number of assigned tasks)
   */
  private async getWorkerLoad(workerId: string): Promise<number> {
    const tasks = await this.stateSynchronizer.getState(`worker:${workerId}:tasks`);
    if (!tasks) return 0;
    return Object.keys(tasks).length;
  }

  /**
   * Get task assignment
   */
  async getTaskAssignment(taskId: string): Promise<TaskAssignment | null> {
    return await this.stateSynchronizer.getState(`assignment:${taskId}`);
  }

  /**
   * Update task progress (0.0 to 1.0)
   */
  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    await this.stateSynchronizer.setState(
      `task:${taskId}:progress`,
      progress,
      300000 // 5 minute TTL
    );
  }

  /**
   * Get task progress
   */
  async getTaskProgress(taskId: string): Promise<number> {
    const progress = await this.stateSynchronizer.getState(`task:${taskId}:progress`);
    return progress ?? 0;
  }

  /**
   * Get aggregate progress across all subtasks
   */
  async getAggregateProgress(parentTaskId: string): Promise<number> {
    const subtaskIds = await this.stateSynchronizer.getState(
      `task:${parentTaskId}:subtasks`
    );

    if (!subtaskIds || subtaskIds.length === 0) {
      return 0;
    }

    let totalProgress = 0;
    for (const subtaskId of subtaskIds) {
      const progress = await this.getTaskProgress(subtaskId);
      totalProgress += progress;
    }

    return totalProgress / subtaskIds.length;
  }

  /**
   * Update task state
   */
  async updateTaskState(
    taskId: string, 
    state: 'pending' | 'running' | 'completed' | 'failed'
  ): Promise<void> {
    await this.stateSynchronizer.setState(
      `task:${taskId}:state`,
      state,
      300000 // 5 minute TTL
    );
  }

  /**
   * Get task state
   */
  async getTaskState(taskId: string): Promise<string> {
    const state = await this.stateSynchronizer.getState(`task:${taskId}:state`);
    return state ?? 'unknown';
  }

  /**
   * Submit task result
   */
  async submitTaskResult(taskId: string, result: any): Promise<void> {
    if (!result) {
      throw new Error('Invalid result data');
    }

    const assignment = await this.getTaskAssignment(taskId);
    if (!assignment) {
      throw new Error('Task not found');
    }

    // Store result
    await this.stateSynchronizer.setState(
      `task:${taskId}:result`,
      result,
      600000 // 10 minute TTL
    );

    // Update state
    await this.updateTaskState(taskId, 'completed');
    await this.updateTaskProgress(taskId, 1.0);

    // Remove from worker's task list
    if (assignment.workerId) {
      const tasks = await this.stateSynchronizer.getState(
        `worker:${assignment.workerId}:tasks`
      );
      if (tasks && tasks[taskId]) {
        delete tasks[taskId];
        await this.stateSynchronizer.setState(
          `worker:${assignment.workerId}:tasks`,
          tasks,
          600000
        );
      }
    }

    // Emit event
    this.emit('task-completed', {
      taskId,
      result,
      completedAt: Date.now(),
    });

    // Check if parent task complete
    await this.checkParentCompletion(taskId);
  }

  /**
   * Check if all subtasks of parent are complete
   */
  private async checkParentCompletion(subtaskId: string): Promise<void> {
    // Get parent task ID from subtask ID pattern
    const parentId = subtaskId.split('-sub-')[0];
    if (parentId === subtaskId) return; // No parent

    const subtaskIds = await this.stateSynchronizer.getState(
      `task:${parentId}:subtasks`
    );

    if (!subtaskIds) return;

    // Check if all subtasks completed
    for (const id of subtaskIds) {
      const state = await this.getTaskState(id);
      if (state !== 'completed') return; // Not all complete
    }

    // All subtasks complete - emit parent completion event
    this.emit('parent-task-completed', {
      taskId: parentId,
      completedAt: Date.now(),
    });
  }

  /**
   * Aggregate results from all subtasks
   */
  async aggregateResults(parentTaskId: string): Promise<AggregatedResult> {
    const subtaskIds = await this.stateSynchronizer.getState(
      `task:${parentTaskId}:subtasks`
    );

    if (!subtaskIds || subtaskIds.length === 0) {
      return {
        results: [],
        allCompleted: true,
        completed: 0,
        total: 0,
      };
    }

    const results: any[] = [];
    let completedCount = 0;

    for (const subtaskId of subtaskIds) {
      const state = await this.getTaskState(subtaskId);
      if (state === 'completed') {
        completedCount++;
        const result = await this.stateSynchronizer.getState(
          `task:${subtaskId}:result`
        );
        if (result) results.push(result);
      }
    }

    const allCompleted = completedCount === subtaskIds.length;

    // Apply merge strategy if all complete
    if (allCompleted) {
      const parentTask = await this.stateSynchronizer.getState(`task:${parentTaskId}`);
      const strategy = parentTask?.mergeStrategy ?? 'concatenate';
      
      return this.mergeResults(results, strategy, {
        allCompleted,
        completed: completedCount,
        total: subtaskIds.length,
      });
    }

    return {
      results,
      allCompleted,
      completed: completedCount,
      total: subtaskIds.length,
    };
  }

  /**
   * Get partial results (for in-progress tasks)
   */
  async getPartialResults(parentTaskId: string): Promise<AggregatedResult> {
    return this.aggregateResults(parentTaskId);
  }

  /**
   * Merge results according to strategy
   */
  private mergeResults(
    results: any[], 
    strategy: string,
    metadata: { allCompleted: boolean; completed: number; total: number }
  ): AggregatedResult {
    switch (strategy) {
      case 'concatenate':
        // Flatten arrays
        const concatenated = results.reduce((acc, r) => {
          if (r.items) return [...acc, ...r.items];
          return [...acc, r];
        }, []);
        return {
          ...metadata,
          results,
          items: concatenated,
        };

      case 'merge':
        // Merge objects
        const merged = results.reduce((acc, r) => ({ ...acc, ...r }), {});
        return {
          ...metadata,
          results,
          ...merged,
        };

      case 'first':
        return {
          ...metadata,
          results,
          value: results[0],
        };

      case 'last':
        return {
          ...metadata,
          results,
          value: results[results.length - 1],
        };

      default:
        return {
          ...metadata,
          results,
        };
    }
  }

  /**
   * Mark task as failed
   */
  async markTaskFailed(taskId: string, reason: string): Promise<void> {
    const assignment = await this.getTaskAssignment(taskId);
    if (!assignment) return;

    // Update state
    await this.updateTaskState(taskId, 'failed');

    // Check retry limit
    if (assignment.attempt >= this.maxRetries) {
      assignment.status = 'failed';
      await this.stateSynchronizer.setState(`assignment:${taskId}`, assignment, 600000);
      return;
    }

    // Apply exponential backoff
    const backoffMs = this.retryBackoffMs * Math.pow(2, assignment.attempt - 1);
    await new Promise(resolve => setTimeout(resolve, backoffMs));

    // Reassign to different worker
    const task = await this.stateSynchronizer.getState(`task:${taskId}`);
    if (task) {
      await this.assignTasks([task]);
    }
  }

  /**
   * Handle worker failure - reassign all tasks
   */
  async handleWorkerFailure(workerId: string): Promise<void> {
    // Get all tasks assigned to this worker
    const tasks = await this.stateSynchronizer.getState(`worker:${workerId}:tasks`);
    
    if (!tasks) return;

    // Reassign each task
    const taskIds = Object.keys(tasks);
    for (const taskId of taskIds) {
      await this.markTaskFailed(taskId, 'Worker failed');
    }

    // Clear worker's task list
    await this.stateSynchronizer.setState(`worker:${workerId}:tasks`, {}, 600000);

    // Emit event
    this.emit('worker-failed', {
      workerId,
      taskCount: taskIds.length,
      failedAt: Date.now(),
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(options: ShutdownOptions = {}): Promise<void> {
    this.isShuttingDown = true;

    const gracePeriod = options.gracePeriod ?? 30000; // 30 seconds default
    const forceAfter = options.forceAfter ?? 60000; // 60 seconds max

    // Wait for in-flight tasks with timeout
    const startTime = Date.now();
    
    while (Date.now() - startTime < gracePeriod) {
      const hasPendingTasks = await this.hasPendingTasks();
      if (!hasPendingTasks) break;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Force shutdown after max time
    if (Date.now() - startTime >= forceAfter) {
      console.warn('Force shutdown - pending tasks may be incomplete');
    }

    // Cleanup resources
    await this.cleanup();
  }

  /**
   * Check if there are any pending tasks
   */
  private async hasPendingTasks(): Promise<boolean> {
    const workers = await this.workerRegistry.listWorkers();
    
    for (const worker of workers) {
      const tasks = await this.stateSynchronizer.getState(`worker:${worker.id}:tasks`);
      if (tasks && Object.keys(tasks).length > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Check if coordinator is shutdown
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }
}
