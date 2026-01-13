/**
 * ChatCoordinator Test Suite
 * 
 * Tests supervisor pattern for multi-chat coordination.
 * 
 * Features tested:
 * - Task decomposition (supervisor breaks down large tasks)
 * - Worker assignment (distributing subtasks to worker chats)
 * - Progress tracking (monitoring worker status)
 * - Result aggregation (collecting and combining results)
 * - Worker failure handling (retry, reassignment)
 * - Load balancing (distributing work evenly)
 */

import { ChatCoordinator } from './ChatCoordinator';
import { RedisConnectionManager } from './RedisConnectionManager';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { LockManager } from './LockManager';
import { MessageBusWrapper } from './MessageBusWrapper';
import { WorkerRegistry } from './WorkerRegistry';

describe('ChatCoordinator', () => {
  let coordinator: ChatCoordinator;
  let redisManager: RedisConnectionManager;
  let taskQueue: TaskQueueWrapper;
  let stateSynchronizer: StateSynchronizer;
  let lockManager: LockManager;
  let messageBus: MessageBusWrapper;
  let workerRegistry: WorkerRegistry;

  beforeEach(async () => {
    // Initialize test Redis connection
    redisManager = new RedisConnectionManager({
      host: 'localhost',
      port: 6379,
      db: 1, // Test database
      keyPrefix: 'shim:test:',
      lazyConnect: true,
    });
    
    await redisManager.connect();
    
    // Clear test database
    const client = redisManager.getClient();
    await client.flushdb();
    
    // Initialize infrastructure components
    taskQueue = new TaskQueueWrapper('coordination-queue', redisManager);
    stateSynchronizer = new StateSynchronizer(redisManager);
    lockManager = new LockManager(redisManager);
    messageBus = new MessageBusWrapper(redisManager);
    workerRegistry = new WorkerRegistry(redisManager);
    
    // Initialize coordinator
    coordinator = new ChatCoordinator({
      taskQueue,
      stateSynchronizer,
      lockManager,
      messageBus,
      workerRegistry,
    });
  });

  afterEach(async () => {
    await coordinator.shutdown();
    await taskQueue.close();
    await stateSynchronizer.cleanup();
    await lockManager.cleanup();
    await messageBus.cleanup();
    await workerRegistry.cleanup();
    await redisManager.disconnect();
  });

  describe('Task Decomposition', () => {
    it('should decompose large task into subtasks', async () => {
      const largeTask = {
        type: 'build-feature',
        description: 'Implement user authentication',
        complexity: 'high',
      };
      
      const subtasks = await coordinator.decomposeTask(largeTask);
      
      expect(subtasks.length).toBeGreaterThan(1);
      expect(subtasks.every(t => t.parentTaskId === largeTask.id)).toBe(true);
    });

    it('should create appropriate number of subtasks', async () => {
      const simpleTask = {
        type: 'refactor',
        description: 'Rename variable',
        complexity: 'low',
      };
      
      const complexTask = {
        type: 'implement',
        description: 'Build distributed system',
        complexity: 'high',
      };
      
      const simpleSubtasks = await coordinator.decomposeTask(simpleTask);
      const complexSubtasks = await coordinator.decomposeTask(complexTask);
      
      expect(simpleSubtasks.length).toBeLessThan(complexSubtasks.length);
    });

    it('should assign unique IDs to subtasks', async () => {
      const task = {
        type: 'test',
        description: 'Test decomposition',
      };
      
      const subtasks = await coordinator.decomposeTask(task);
      const ids = subtasks.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Worker Assignment', () => {
    it('should assign subtasks to available workers', async () => {
      // Register workers
      await workerRegistry.register('worker-1', { capacity: 5 });
      await workerRegistry.register('worker-2', { capacity: 5 });
      
      const task = {
        type: 'parallel-work',
        description: 'Process data',
      };
      
      const subtasks = await coordinator.decomposeTask(task);
      const assignments = await coordinator.assignTasks(subtasks);
      
      expect(assignments.length).toBe(subtasks.length);
      expect(assignments.every(a => a.workerId)).toBe(true);
    });

    it('should distribute work evenly across workers', async () => {
      await workerRegistry.register('worker-1', { capacity: 10 });
      await workerRegistry.register('worker-2', { capacity: 10 });
      
      const tasks = Array(10).fill(null).map((_, i) => ({
        id: `task-${i}`,
        type: 'work',
      }));
      
      const assignments = await coordinator.assignTasks(tasks);
      
      // Count assignments per worker
      const worker1Count = assignments.filter(a => a.workerId === 'worker-1').length;
      const worker2Count = assignments.filter(a => a.workerId === 'worker-2').length;
      
      // Should be roughly equal (within 2 tasks)
      expect(Math.abs(worker1Count - worker2Count)).toBeLessThanOrEqual(2);
    });

    it('should respect worker capacity limits', async () => {
      await workerRegistry.register('worker-1', { capacity: 2 });
      
      const tasks = Array(5).fill(null).map((_, i) => ({
        id: `task-${i}`,
        type: 'work',
      }));
      
      const assignments = await coordinator.assignTasks(tasks);
      
      // Should only assign up to capacity
      const worker1Tasks = assignments.filter(a => a.workerId === 'worker-1');
      expect(worker1Tasks.length).toBeLessThanOrEqual(2);
    });

    it('should queue tasks when no workers available', async () => {
      const tasks = [{ id: 'task-1', type: 'work' }];
      
      // No workers registered
      const assignments = await coordinator.assignTasks(tasks);
      
      // Should queue for later
      expect(assignments.every(a => a.status === 'queued')).toBe(true);
    });

    it('should reassign failed tasks', async () => {
      await workerRegistry.register('worker-1', { capacity: 5 });
      await workerRegistry.register('worker-2', { capacity: 5 });
      
      const task = { id: 'task-1', type: 'work' };
      
      // Initial assignment
      const [assignment1] = await coordinator.assignTasks([task]);
      
      // Simulate failure
      await coordinator.markTaskFailed(assignment1.taskId, 'worker crashed');
      
      // Should reassign to different worker
      const reassignment = await coordinator.getTaskAssignment(task.id);
      expect(reassignment.workerId).not.toBe(assignment1.workerId);
      expect(reassignment.attempt).toBeGreaterThan(1);
    });
  });

  describe('Progress Tracking', () => {
    it('should track individual task progress', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      await coordinator.updateTaskProgress(task.id, 0.5);
      
      const progress = await coordinator.getTaskProgress(task.id);
      expect(progress).toBe(0.5);
    });

    it('should aggregate progress across subtasks', async () => {
      const parentTask = { id: 'parent', type: 'complex' };
      const subtasks = [
        { id: 'sub-1', parentId: 'parent', type: 'work' },
        { id: 'sub-2', parentId: 'parent', type: 'work' },
        { id: 'sub-3', parentId: 'parent', type: 'work' },
      ];
      
      // Set individual progress
      await coordinator.updateTaskProgress('sub-1', 1.0); // Complete
      await coordinator.updateTaskProgress('sub-2', 0.5); // 50%
      await coordinator.updateTaskProgress('sub-3', 0.0); // Not started
      
      const aggregateProgress = await coordinator.getAggregateProgress('parent');
      
      // (1.0 + 0.5 + 0.0) / 3 = 0.5
      expect(aggregateProgress).toBeCloseTo(0.5, 1);
    });

    it('should track task state transitions', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      await coordinator.updateTaskState(task.id, 'pending');
      expect(await coordinator.getTaskState(task.id)).toBe('pending');
      
      await coordinator.updateTaskState(task.id, 'running');
      expect(await coordinator.getTaskState(task.id)).toBe('running');
      
      await coordinator.updateTaskState(task.id, 'completed');
      expect(await coordinator.getTaskState(task.id)).toBe('completed');
    });
  });

  describe('Result Aggregation', () => {
    it('should collect results from completed subtasks', async () => {
      const parentTask = { id: 'parent', type: 'analysis' };
      const subtasks = [
        { id: 'sub-1', parentId: 'parent' },
        { id: 'sub-2', parentId: 'parent' },
      ];
      
      // Complete subtasks with results
      await coordinator.submitTaskResult('sub-1', { data: 'result-1' });
      await coordinator.submitTaskResult('sub-2', { data: 'result-2' });
      
      const aggregatedResult = await coordinator.aggregateResults('parent');
      
      expect(aggregatedResult.results).toHaveLength(2);
      expect(aggregatedResult.allCompleted).toBe(true);
    });

    it('should wait for all subtasks before marking parent complete', async () => {
      const parentTask = { id: 'parent', type: 'build' };
      
      // Create subtasks
      await coordinator.updateTaskState('sub-1', 'completed');
      await coordinator.updateTaskState('sub-2', 'running'); // Still running
      
      const parentState = await coordinator.getTaskState('parent');
      
      expect(parentState).not.toBe('completed');
    });

    it('should merge results according to strategy', async () => {
      const parentTask = { 
        id: 'parent', 
        type: 'data-processing',
        mergeStrategy: 'concatenate',
      };
      
      await coordinator.submitTaskResult('sub-1', { items: [1, 2, 3] });
      await coordinator.submitTaskResult('sub-2', { items: [4, 5, 6] });
      
      const merged = await coordinator.aggregateResults('parent');
      
      expect(merged.items).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle partial results', async () => {
      const parentTask = { id: 'parent', type: 'search' };
      
      // Some subtasks complete, others still running
      await coordinator.submitTaskResult('sub-1', { found: ['item-1'] });
      
      const partialResults = await coordinator.getPartialResults('parent');
      
      expect(partialResults.completed).toBe(1);
      expect(partialResults.total).toBeGreaterThan(1);
      expect(partialResults.results).toHaveLength(1);
    });
  });

  describe('Worker Failure Handling', () => {
    it('should detect worker heartbeat timeout', async () => {
      const workerId = 'worker-1';
      await workerRegistry.register(workerId, { heartbeatInterval: 1000 });
      
      // Simulate no heartbeat for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const isHealthy = await workerRegistry.isHealthy(workerId);
      expect(isHealthy).toBe(false);
    });

    it('should reassign tasks from failed worker', async () => {
      await workerRegistry.register('worker-1', { capacity: 5 });
      await workerRegistry.register('worker-2', { capacity: 5 });
      
      const task = { id: 'task-1', type: 'work' };
      
      // Assign to worker-1
      await coordinator.assignTasks([task]);
      
      // Simulate worker-1 failure
      await coordinator.handleWorkerFailure('worker-1');
      
      // Task should be reassigned to worker-2
      const assignment = await coordinator.getTaskAssignment(task.id);
      expect(assignment.workerId).toBe('worker-2');
    });

    it('should retry failed tasks up to max attempts', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await coordinator.markTaskFailed(task.id, 'error');
      }
      
      const assignment = await coordinator.getTaskAssignment(task.id);
      
      expect(assignment.status).toBe('failed');
      expect(assignment.attempt).toBe(3);
    });

    it('should apply exponential backoff for retries', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      const start = Date.now();
      
      // First retry
      await coordinator.markTaskFailed(task.id, 'error');
      const retry1Time = Date.now() - start;
      
      // Second retry (should wait longer)
      await coordinator.markTaskFailed(task.id, 'error');
      const retry2Time = Date.now() - start;
      
      expect(retry2Time).toBeGreaterThan(retry1Time * 1.5);
    });
  });

  describe('Load Balancing', () => {
    it('should prioritize workers with lower load', async () => {
      await workerRegistry.register('worker-1', { capacity: 10 });
      await workerRegistry.register('worker-2', { capacity: 10 });
      
      // Assign 5 tasks to worker-1
      for (let i = 0; i < 5; i++) {
        await coordinator.assignTasks([{ id: `task-${i}`, type: 'work' }]);
      }
      
      // Next task should go to worker-2 (lower load)
      const [assignment] = await coordinator.assignTasks([{ id: 'next-task', type: 'work' }]);
      
      expect(assignment.workerId).toBe('worker-2');
    });

    it('should balance by worker capability', async () => {
      await workerRegistry.register('worker-fast', { 
        capacity: 10,
        capabilities: ['fast-processing'],
      });
      await workerRegistry.register('worker-analysis', {
        capacity: 10,
        capabilities: ['deep-analysis'],
      });
      
      const fastTask = { 
        id: 'fast-1', 
        type: 'format',
        requirements: ['fast-processing'],
      };
      
      const [assignment] = await coordinator.assignTasks([fastTask]);
      
      expect(assignment.workerId).toBe('worker-fast');
    });
  });

  describe('Event Handling', () => {
    it('should emit event when task assigned', async () => {
      const events: any[] = [];
      coordinator.on('task-assigned', (event) => events.push(event));
      
      await workerRegistry.register('worker-1', { capacity: 5 });
      const task = { id: 'task-1', type: 'work' };
      
      await coordinator.assignTasks([task]);
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('task-1');
      expect(events[0].workerId).toBe('worker-1');
    });

    it('should emit event when task completed', async () => {
      const events: any[] = [];
      coordinator.on('task-completed', (event) => events.push(event));
      
      const task = { id: 'task-1', type: 'work' };
      await coordinator.submitTaskResult(task.id, { success: true });
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('task-1');
    });

    it('should emit event when worker fails', async () => {
      const events: any[] = [];
      coordinator.on('worker-failed', (event) => events.push(event));
      
      await workerRegistry.register('worker-1', { capacity: 5 });
      await coordinator.handleWorkerFailure('worker-1');
      
      expect(events).toHaveLength(1);
      expect(events[0].workerId).toBe('worker-1');
    });

    it('should emit event when all subtasks complete', async () => {
      const events: any[] = [];
      coordinator.on('parent-task-completed', (event) => events.push(event));
      
      const parentTask = { id: 'parent', type: 'complex' };
      
      // Complete all subtasks
      await coordinator.submitTaskResult('sub-1', { done: true });
      await coordinator.submitTaskResult('sub-2', { done: true });
      
      expect(events.some(e => e.taskId === 'parent')).toBe(true);
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should gracefully shutdown coordinator', async () => {
      await workerRegistry.register('worker-1', { capacity: 5 });
      
      await coordinator.shutdown();
      
      // Should not accept new tasks
      await expect(
        coordinator.assignTasks([{ id: 'task-1', type: 'work' }])
      ).rejects.toThrow('Coordinator is shutting down');
    });

    it('should wait for in-flight tasks on shutdown', async () => {
      const task = { id: 'task-1', type: 'long-running' };
      await coordinator.assignTasks([task]);
      
      const shutdownPromise = coordinator.shutdown({ gracePeriod: 5000 });
      
      // Complete task
      await coordinator.submitTaskResult(task.id, { done: true });
      
      await shutdownPromise;
      
      const state = await coordinator.getTaskState(task.id);
      expect(state).toBe('completed');
    });

    it('should cleanup resources on shutdown', async () => {
      await coordinator.shutdown();
      
      // Verify cleanup
      expect(coordinator.isShutdown()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task structure', async () => {
      const invalidTask = { id: 'bad' }; // Missing required fields
      
      await expect(
        coordinator.decomposeTask(invalidTask as any)
      ).rejects.toThrow('Invalid task structure');
    });

    it('should handle worker assignment failure', async () => {
      // No workers available
      const task = { id: 'task-1', type: 'work', urgent: true };
      
      // Should queue instead of failing
      const [assignment] = await coordinator.assignTasks([task]);
      expect(assignment.status).toBe('queued');
    });

    it('should handle result submission for unknown task', async () => {
      await expect(
        coordinator.submitTaskResult('unknown-task', { data: 'test' })
      ).rejects.toThrow('Task not found');
    });

    it('should handle malformed result data', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      await expect(
        coordinator.submitTaskResult(task.id, null as any)
      ).rejects.toThrow('Invalid result data');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should decompose tasks in under 100ms', async () => {
      const task = { 
        id: 'perf-test', 
        type: 'complex',
        complexity: 'high',
      };
      
      const start = Date.now();
      await coordinator.decomposeTask(task);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should assign 100 tasks in under 500ms', async () => {
      await workerRegistry.register('worker-1', { capacity: 100 });
      
      const tasks = Array(100).fill(null).map((_, i) => ({
        id: `task-${i}`,
        type: 'batch-work',
      }));
      
      const start = Date.now();
      await coordinator.assignTasks(tasks);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
    });

    it('should aggregate results from 50 subtasks in under 200ms', async () => {
      const parentTask = { id: 'parent', type: 'aggregation-test' };
      
      // Submit 50 results
      const submitPromises = Array(50).fill(null).map((_, i) =>
        coordinator.submitTaskResult(`sub-${i}`, { value: i })
      );
      await Promise.all(submitPromises);
      
      const start = Date.now();
      await coordinator.aggregateResults('parent');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty subtask list', async () => {
      const result = await coordinator.aggregateResults('task-with-no-subtasks');
      
      expect(result.results).toEqual([]);
      expect(result.allCompleted).toBe(true);
    });

    it('should handle duplicate task assignment', async () => {
      await workerRegistry.register('worker-1', { capacity: 5 });
      
      const task = { id: 'task-1', type: 'work' };
      
      await coordinator.assignTasks([task]);
      
      // Try assigning again
      await expect(
        coordinator.assignTasks([task])
      ).rejects.toThrow('Task already assigned');
    });

    it('should handle concurrent progress updates', async () => {
      const task = { id: 'task-1', type: 'work' };
      
      // Multiple concurrent updates
      await Promise.all([
        coordinator.updateTaskProgress(task.id, 0.3),
        coordinator.updateTaskProgress(task.id, 0.6),
        coordinator.updateTaskProgress(task.id, 0.9),
      ]);
      
      // Should use latest value
      const progress = await coordinator.getTaskProgress(task.id);
      expect(progress).toBeGreaterThanOrEqual(0.3);
    });

    it('should handle worker re-registration', async () => {
      await workerRegistry.register('worker-1', { capacity: 5 });
      
      // Re-register with different capacity
      await workerRegistry.register('worker-1', { capacity: 10 });
      
      const info = await workerRegistry.getWorker('worker-1');
      expect(info.capacity).toBe(10);
    });
  });
});
