/**
 * TaskDistributor Test Suite
 * 
 * Tests advanced task queue management and distribution.
 * 
 * Features tested:
 * - Priority-based task distribution
 * - Deadline tracking and enforcement
 * - Task routing strategies (round-robin, least-loaded, capability-based)
 * - Queue metrics and monitoring
 * - Task dependencies and ordering
 * - Batch task submission
 * - Queue health monitoring
 */

import { TaskDistributor } from './TaskDistributor';
import { RedisConnectionManager } from './RedisConnectionManager';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { WorkerRegistry } from './WorkerRegistry';

describe('TaskDistributor', () => {
  let distributor: TaskDistributor;
  let redisManager: RedisConnectionManager;
  let taskQueue: TaskQueueWrapper;
  let stateSynchronizer: StateSynchronizer;
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
    taskQueue = new TaskQueueWrapper('distributor-queue', redisManager);
    stateSynchronizer = new StateSynchronizer(redisManager);
    workerRegistry = new WorkerRegistry(redisManager);
    
    // Initialize distributor
    distributor = new TaskDistributor({
      taskQueue,
      stateSynchronizer,
      workerRegistry,
    });
  });

  afterEach(async () => {
    await distributor.shutdown();
    await taskQueue.close();
    await stateSynchronizer.cleanup();
    await workerRegistry.cleanup();
    await redisManager.disconnect();
  });

  describe('Priority-Based Distribution', () => {
    it('should process high priority tasks before low priority', async () => {
      const processedOrder: string[] = [];
      
      // Add tasks with different priorities
      await distributor.submitTask({ id: 'low', priority: 10 });
      await distributor.submitTask({ id: 'high', priority: 1 });
      await distributor.submitTask({ id: 'medium', priority: 5 });
      
      // Process tasks
      await distributor.processTasks((task) => {
        processedOrder.push(task.id);
        return Promise.resolve({ done: true });
      });
      
      // Should process in priority order (1 = highest)
      expect(processedOrder[0]).toBe('high');
      expect(processedOrder[1]).toBe('medium');
      expect(processedOrder[2]).toBe('low');
    });

    it('should handle priority ties with FIFO', async () => {
      const processedOrder: string[] = [];
      
      // Add tasks with same priority
      await distributor.submitTask({ id: 'task-1', priority: 5 });
      await distributor.submitTask({ id: 'task-2', priority: 5 });
      await distributor.submitTask({ id: 'task-3', priority: 5 });
      
      await distributor.processTasks((task) => {
        processedOrder.push(task.id);
        return Promise.resolve({ done: true });
      });
      
      // Should maintain submission order
      expect(processedOrder).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should allow dynamic priority adjustment', async () => {
      const taskId = await distributor.submitTask({ 
        id: 'adjustable', 
        priority: 10,
      });
      
      // Increase priority (lower number = higher priority)
      await distributor.adjustPriority(taskId, 1);
      
      const task = await distributor.getTask(taskId);
      expect(task.priority).toBe(1);
    });
  });

  describe('Deadline Tracking', () => {
    it('should track task deadlines', async () => {
      const deadline = Date.now() + 60000; // 1 minute
      
      const taskId = await distributor.submitTask({
        id: 'deadline-task',
        deadline,
      });
      
      const task = await distributor.getTask(taskId);
      expect(task.deadline).toBe(deadline);
    });

    it('should identify overdue tasks', async () => {
      const pastDeadline = Date.now() - 1000; // 1 second ago
      
      await distributor.submitTask({
        id: 'overdue',
        deadline: pastDeadline,
      });
      
      const overdueTasks = await distributor.getOverdueTasks();
      
      expect(overdueTasks.length).toBe(1);
      expect(overdueTasks[0].id).toBe('overdue');
    });

    it('should escalate priority for approaching deadlines', async () => {
      const urgentDeadline = Date.now() + 5000; // 5 seconds
      
      const taskId = await distributor.submitTask({
        id: 'urgent',
        priority: 10,
        deadline: urgentDeadline,
      });
      
      // Check priority after deadline escalation
      await distributor.escalateApproachingDeadlines();
      
      const task = await distributor.getTask(taskId);
      expect(task.priority).toBeLessThan(10); // Escalated
    });

    it('should emit event when task becomes overdue', async () => {
      const events: any[] = [];
      distributor.on('task-overdue', (event) => events.push(event));
      
      const pastDeadline = Date.now() - 1000;
      
      await distributor.submitTask({
        id: 'overdue',
        deadline: pastDeadline,
      });
      
      await distributor.checkDeadlines();
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('overdue');
    });
  });

  describe('Task Routing Strategies', () => {
    it('should distribute tasks round-robin', async () => {
      await workerRegistry.register('worker-1', { capacity: 10 });
      await workerRegistry.register('worker-2', { capacity: 10 });
      await workerRegistry.register('worker-3', { capacity: 10 });
      
      const tasks = Array(9).fill(null).map((_, i) => ({
        id: `task-${i}`,
        type: 'work',
      }));
      
      const assignments = await distributor.distributeRoundRobin(tasks);
      
      // Each worker should get 3 tasks
      const worker1Count = assignments.filter(a => a.workerId === 'worker-1').length;
      const worker2Count = assignments.filter(a => a.workerId === 'worker-2').length;
      const worker3Count = assignments.filter(a => a.workerId === 'worker-3').length;
      
      expect(worker1Count).toBe(3);
      expect(worker2Count).toBe(3);
      expect(worker3Count).toBe(3);
    });

    it('should distribute tasks to least-loaded workers', async () => {
      await workerRegistry.register('worker-1', { capacity: 10 });
      await workerRegistry.register('worker-2', { capacity: 10 });
      
      // Pre-load worker-1 with tasks
      await distributor.submitTask({ id: 'existing-1', workerId: 'worker-1' });
      await distributor.submitTask({ id: 'existing-2', workerId: 'worker-1' });
      await distributor.submitTask({ id: 'existing-3', workerId: 'worker-1' });
      
      // New task should go to worker-2 (least loaded)
      const assignment = await distributor.distributeLeastLoaded([
        { id: 'new-task', type: 'work' }
      ]);
      
      expect(assignment[0].workerId).toBe('worker-2');
    });

    it('should route tasks based on capabilities', async () => {
      await workerRegistry.register('worker-cpu', { 
        capacity: 10,
        capabilities: ['cpu-intensive'],
      });
      await workerRegistry.register('worker-io', {
        capacity: 10,
        capabilities: ['io-intensive'],
      });
      
      const cpuTask = {
        id: 'compute',
        requirements: ['cpu-intensive'],
      };
      
      const assignment = await distributor.distributeByCapability([cpuTask]);
      
      expect(assignment[0].workerId).toBe('worker-cpu');
    });

    it('should switch strategies dynamically', async () => {
      await distributor.setStrategy('round-robin');
      expect(await distributor.getStrategy()).toBe('round-robin');
      
      await distributor.setStrategy('least-loaded');
      expect(await distributor.getStrategy()).toBe('least-loaded');
      
      await distributor.setStrategy('capability-based');
      expect(await distributor.getStrategy()).toBe('capability-based');
    });
  });

  describe('Queue Metrics', () => {
    it('should track queue depth', async () => {
      await distributor.submitTask({ id: 'task-1' });
      await distributor.submitTask({ id: 'task-2' });
      await distributor.submitTask({ id: 'task-3' });
      
      const metrics = await distributor.getQueueMetrics();
      
      expect(metrics.depth).toBe(3);
    });

    it('should track average wait time', async () => {
      const task1Start = Date.now();
      await distributor.submitTask({ id: 'task-1' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await distributor.processTasks((task) => {
        return Promise.resolve({ done: true });
      });
      
      const metrics = await distributor.getQueueMetrics();
      
      expect(metrics.avgWaitTimeMs).toBeGreaterThan(50);
    });

    it('should track throughput', async () => {
      const start = Date.now();
      
      // Submit and process 10 tasks
      for (let i = 0; i < 10; i++) {
        await distributor.submitTask({ id: `task-${i}` });
      }
      
      await distributor.processTasks((task) => {
        return Promise.resolve({ done: true });
      });
      
      const duration = Date.now() - start;
      const metrics = await distributor.getQueueMetrics();
      
      expect(metrics.throughputPerSecond).toBeGreaterThan(0);
    });

    it('should track task distribution by priority', async () => {
      await distributor.submitTask({ id: 'high', priority: 1 });
      await distributor.submitTask({ id: 'high2', priority: 1 });
      await distributor.submitTask({ id: 'medium', priority: 5 });
      await distributor.submitTask({ id: 'low', priority: 10 });
      
      const metrics = await distributor.getQueueMetrics();
      
      expect(metrics.byPriority[1]).toBe(2); // 2 high priority
      expect(metrics.byPriority[5]).toBe(1); // 1 medium
      expect(metrics.byPriority[10]).toBe(1); // 1 low
    });
  });

  describe('Task Dependencies', () => {
    it('should enforce task ordering with dependencies', async () => {
      await distributor.submitTask({ 
        id: 'task-1',
        dependencies: [],
      });
      
      await distributor.submitTask({
        id: 'task-2',
        dependencies: ['task-1'], // Must wait for task-1
      });
      
      const canProcess = await distributor.canProcessTask('task-2');
      
      expect(canProcess).toBe(false); // task-1 not complete
    });

    it('should allow processing after dependencies complete', async () => {
      await distributor.submitTask({ id: 'task-1' });
      await distributor.submitTask({ 
        id: 'task-2', 
        dependencies: ['task-1'],
      });
      
      // Complete task-1
      await distributor.markTaskComplete('task-1');
      
      const canProcess = await distributor.canProcessTask('task-2');
      
      expect(canProcess).toBe(true);
    });

    it('should detect circular dependencies', async () => {
      await distributor.submitTask({
        id: 'task-1',
        dependencies: ['task-2'],
      });
      
      await expect(
        distributor.submitTask({
          id: 'task-2',
          dependencies: ['task-1'], // Circular!
        })
      ).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Batch Task Submission', () => {
    it('should submit multiple tasks efficiently', async () => {
      const tasks = Array(100).fill(null).map((_, i) => ({
        id: `batch-${i}`,
        type: 'batch-work',
      }));
      
      const start = Date.now();
      const taskIds = await distributor.submitBatch(tasks);
      const duration = Date.now() - start;
      
      expect(taskIds.length).toBe(100);
      expect(duration).toBeLessThan(1000); // <1 second for 100 tasks
    });

    it('should validate all tasks in batch before submission', async () => {
      const tasks = [
        { id: 'valid-1', type: 'work' },
        { id: 'invalid' }, // Missing type
        { id: 'valid-2', type: 'work' },
      ];
      
      await expect(
        distributor.submitBatch(tasks)
      ).rejects.toThrow('Invalid task in batch');
    });

    it('should support partial batch processing', async () => {
      const tasks = Array(50).fill(null).map((_, i) => ({
        id: `task-${i}`,
        type: 'work',
      }));
      
      await distributor.submitBatch(tasks);
      
      // Process only 20 tasks
      const processed = await distributor.processBatch(20);
      
      expect(processed).toBe(20);
      
      const metrics = await distributor.getQueueMetrics();
      expect(metrics.depth).toBe(30); // 50 - 20 = 30 remaining
    });
  });

  describe('Queue Health Monitoring', () => {
    it('should detect queue starvation', async () => {
      // No workers available
      await distributor.submitTask({ id: 'starving' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const health = await distributor.getQueueHealth();
      
      expect(health.isStarving).toBe(true);
      expect(health.reason).toContain('No workers available');
    });

    it('should detect queue saturation', async () => {
      // Many tasks, limited capacity
      await workerRegistry.register('worker-1', { capacity: 2 });
      
      for (let i = 0; i < 100; i++) {
        await distributor.submitTask({ id: `task-${i}` });
      }
      
      const health = await distributor.getQueueHealth();
      
      expect(health.isSaturated).toBe(true);
      expect(health.saturationRatio).toBeGreaterThan(10); // 100 tasks / 2 capacity
    });

    it('should track queue age', async () => {
      await distributor.submitTask({ id: 'old-task' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const health = await distributor.getQueueHealth();
      
      expect(health.oldestTaskAgeMs).toBeGreaterThan(50);
    });

    it('should emit warning when queue unhealthy', async () => {
      const warnings: any[] = [];
      distributor.on('queue-warning', (event) => warnings.push(event));
      
      // Create unhealthy condition (no workers)
      await distributor.submitTask({ id: 'task' });
      
      await distributor.checkQueueHealth();
      
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task submission', async () => {
      await expect(
        distributor.submitTask(null as any)
      ).rejects.toThrow('Invalid task');
    });

    it('should handle missing worker for capability-based routing', async () => {
      const task = {
        id: 'specialized',
        requirements: ['rare-capability'],
      };
      
      // No workers with this capability
      const assignment = await distributor.distributeByCapability([task]);
      
      expect(assignment[0].status).toBe('queued');
      expect(assignment[0].reason).toContain('No capable worker');
    });

    it('should handle task processing failure', async () => {
      await distributor.submitTask({ id: 'failing' });
      
      await distributor.processTasks((task) => {
        throw new Error('Processing failed');
      });
      
      const task = await distributor.getTask('failing');
      
      expect(task.status).toBe('failed');
      expect(task.error).toContain('Processing failed');
    });

    it('should handle Redis connection loss gracefully', async () => {
      // Simulate connection loss
      await redisManager.disconnect();
      
      await expect(
        distributor.submitTask({ id: 'offline' })
      ).rejects.toThrow('Redis connection unavailable');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should submit 1000 tasks in under 2 seconds', async () => {
      const tasks = Array(1000).fill(null).map((_, i) => ({
        id: `perf-${i}`,
        type: 'benchmark',
      }));
      
      const start = Date.now();
      await distributor.submitBatch(tasks);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    it('should calculate queue metrics in under 100ms', async () => {
      // Add 100 tasks
      for (let i = 0; i < 100; i++) {
        await distributor.submitTask({ id: `task-${i}` });
      }
      
      const start = Date.now();
      await distributor.getQueueMetrics();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should check deadlines for 500 tasks in under 200ms', async () => {
      const deadline = Date.now() + 60000;
      
      for (let i = 0; i < 500; i++) {
        await distributor.submitTask({ 
          id: `task-${i}`,
          deadline,
        });
      }
      
      const start = Date.now();
      await distributor.checkDeadlines();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-priority tasks', async () => {
      await distributor.submitTask({ id: 'zero', priority: 0 });
      
      const task = await distributor.getTask('zero');
      expect(task.priority).toBe(0);
    });

    it('should handle negative priority (if allowed)', async () => {
      await distributor.submitTask({ id: 'negative', priority: -1 });
      
      const task = await distributor.getTask('negative');
      expect(task.priority).toBe(-1); // Or error if not allowed
    });

    it('should handle empty batch submission', async () => {
      const result = await distributor.submitBatch([]);
      
      expect(result).toEqual([]);
    });

    it('should handle concurrent strategy switches', async () => {
      await Promise.all([
        distributor.setStrategy('round-robin'),
        distributor.setStrategy('least-loaded'),
        distributor.setStrategy('capability-based'),
      ]);
      
      // Should end in valid state
      const strategy = await distributor.getStrategy();
      expect(['round-robin', 'least-loaded', 'capability-based']).toContain(strategy);
    });

    it('should handle task with extremely long deadline', async () => {
      const farFuture = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
      
      await distributor.submitTask({
        id: 'future',
        deadline: farFuture,
      });
      
      const overdue = await distributor.getOverdueTasks();
      expect(overdue).not.toContainEqual(expect.objectContaining({ id: 'future' }));
    });
  });
});
