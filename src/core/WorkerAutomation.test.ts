/**
 * WorkerAutomation Test Suite
 * 
 * Tests autonomous worker task execution and coordination.
 * 
 * Features tested:
 * - Autonomous task execution
 * - Result reporting to coordinator
 * - Error handling and recovery
 * - Health monitoring and heartbeats
 * - Auto-registration with WorkerRegistry
 * - Task processing loops
 * - Graceful shutdown
 * - Worker lifecycle management
 */

import { WorkerAutomation } from './WorkerAutomation';
import { RedisConnectionManager } from './RedisConnectionManager';
import { TaskQueueWrapper } from './TaskQueueWrapper';
import { StateSynchronizer } from './StateSynchronizer';
import { WorkerRegistry } from './WorkerRegistry';
import { MessageBusWrapper } from './MessageBusWrapper';

describe('WorkerAutomation', () => {
  let worker: WorkerAutomation;
  let redisManager: RedisConnectionManager;
  let taskQueue: TaskQueueWrapper;
  let stateSynchronizer: StateSynchronizer;
  let workerRegistry: WorkerRegistry;
  let messageBus: MessageBusWrapper;

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
    taskQueue = new TaskQueueWrapper('worker-queue', redisManager);
    stateSynchronizer = new StateSynchronizer(redisManager);
    workerRegistry = new WorkerRegistry(redisManager);
    messageBus = new MessageBusWrapper(redisManager);
    
    // Initialize worker
    worker = new WorkerAutomation({
      workerId: 'test-worker',
      taskQueue,
      stateSynchronizer,
      workerRegistry,
      messageBus,
      capabilities: ['general', 'computation'],
      capacity: 5,
    });
  });

  afterEach(async () => {
    await worker.shutdown();
    await taskQueue.close();
    await stateSynchronizer.cleanup();
    await workerRegistry.cleanup();
    await messageBus.close();
    await redisManager.disconnect();
  });

  describe('Worker Registration', () => {
    it('should auto-register with WorkerRegistry on start', async () => {
      await worker.start();
      
      const workerInfo = await workerRegistry.getWorker('test-worker');
      
      expect(workerInfo).toBeDefined();
      expect(workerInfo.id).toBe('test-worker');
      expect(workerInfo.capabilities).toEqual(['general', 'computation']);
      expect(workerInfo.capacity).toBe(5);
    });

    it('should set initial status to idle', async () => {
      await worker.start();
      
      const status = await worker.getStatus();
      
      expect(status).toBe('idle');
    });

    it('should deregister on shutdown', async () => {
      await worker.start();
      await worker.shutdown();
      
      const workerInfo = await workerRegistry.getWorker('test-worker');
      
      expect(workerInfo).toBeNull();
    });

    it('should update registration on capability change', async () => {
      await worker.start();
      
      await worker.updateCapabilities(['general', 'computation', 'analysis']);
      
      const workerInfo = await workerRegistry.getWorker('test-worker');
      
      expect(workerInfo.capabilities).toEqual(['general', 'computation', 'analysis']);
    });
  });

  describe('Autonomous Task Execution', () => {
    it('should automatically process tasks from queue', async () => {
      const processedTasks: any[] = [];
      
      await worker.start();
      
      // Define task processor
      worker.setTaskProcessor(async (task) => {
        processedTasks.push(task);
        return { result: `Processed ${task.id}` };
      });
      
      // Add tasks to queue
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      await taskQueue.addTask({ id: 'task-2', type: 'work' });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processedTasks.length).toBe(2);
    });

    it('should update status to busy while processing', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        const status = await worker.getStatus();
        expect(status).toBe('busy');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should return to idle after task completion', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const status = await worker.getStatus();
      expect(status).toBe('idle');
    });

    it('should process multiple tasks sequentially', async () => {
      const processingOrder: string[] = [];
      
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        processingOrder.push(task.id);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      await taskQueue.addTask({ id: 'task-2', type: 'work' });
      await taskQueue.addTask({ id: 'task-3', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processingOrder).toEqual(['task-1', 'task-2', 'task-3']);
    });
  });

  describe('Result Reporting', () => {
    it('should report task results to coordinator', async () => {
      const reportedResults: any[] = [];
      
      await worker.start();
      
      // Listen for result reports
      await messageBus.subscribe('task-results', (message) => {
        reportedResults.push(message);
      });
      
      worker.setTaskProcessor(async (task) => {
        return { result: `Result for ${task.id}` };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(reportedResults.length).toBe(1);
      expect(reportedResults[0].taskId).toBe('task-1');
      expect(reportedResults[0].result.result).toContain('Result for task-1');
    });

    it('should include worker ID in result reports', async () => {
      const reportedResults: any[] = [];
      
      await worker.start();
      
      await messageBus.subscribe('task-results', (message) => {
        reportedResults.push(message);
      });
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(reportedResults[0].workerId).toBe('test-worker');
    });

    it('should report task progress updates', async () => {
      const progressUpdates: any[] = [];
      
      await worker.start();
      
      await messageBus.subscribe('task-progress', (message) => {
        progressUpdates.push(message);
      });
      
      worker.setTaskProcessor(async (task) => {
        await worker.reportProgress(task.id, 0.5);
        await new Promise(resolve => setTimeout(resolve, 50));
        await worker.reportProgress(task.id, 1.0);
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task-1', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
      expect(progressUpdates[0].progress).toBe(0.5);
      expect(progressUpdates[1].progress).toBe(1.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle task processing errors gracefully', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        throw new Error('Processing failed');
      });
      
      await taskQueue.addTask({ id: 'failing-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Worker should still be running
      const status = await worker.getStatus();
      expect(status).toBe('idle');
    });

    it('should report errors to coordinator', async () => {
      const errorReports: any[] = [];
      
      await worker.start();
      
      await messageBus.subscribe('task-errors', (message) => {
        errorReports.push(message);
      });
      
      worker.setTaskProcessor(async (task) => {
        throw new Error('Task error');
      });
      
      await taskQueue.addTask({ id: 'error-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(errorReports.length).toBe(1);
      expect(errorReports[0].taskId).toBe('error-task');
      expect(errorReports[0].error).toContain('Task error');
    });

    it('should retry failed tasks with exponential backoff', async () => {
      let attempts = 0;
      
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry me');
        }
        return { done: true, attempts };
      });
      
      await taskQueue.addTask({ id: 'retry-task', type: 'work' }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 100 },
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(attempts).toBe(3);
    });

    it('should set status to error on unrecoverable failure', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        throw new Error('Fatal error');
      });
      
      // Max retries exhausted
      await taskQueue.addTask({ id: 'fatal-task', type: 'work' }, {
        attempts: 1,
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const taskStatus = await stateSynchronizer.getState('task:fatal-task:status');
      expect(taskStatus).toBe('failed');
    });
  });

  describe('Health Monitoring', () => {
    it('should send periodic heartbeats', async () => {
      const heartbeats: any[] = [];
      
      await worker.start({ heartbeatInterval: 100 });
      
      await messageBus.subscribe('worker-heartbeat', (message) => {
        heartbeats.push(message);
      });
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(heartbeats.length).toBeGreaterThanOrEqual(3);
      expect(heartbeats[0].workerId).toBe('test-worker');
    });

    it('should include current load in heartbeats', async () => {
      const heartbeats: any[] = [];
      
      await worker.start({ heartbeatInterval: 100 });
      
      await messageBus.subscribe('worker-heartbeat', (message) => {
        heartbeats.push(message);
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(heartbeats[0].load).toBeDefined();
      expect(typeof heartbeats[0].load).toBe('number');
    });

    it('should report health status', async () => {
      await worker.start();
      
      const health = await worker.getHealth();
      
      expect(health.workerId).toBe('test-worker');
      expect(health.status).toBe('healthy');
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should detect unhealthy state on repeated errors', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        throw new Error('Continuous failure');
      });
      
      // Add multiple failing tasks
      for (let i = 0; i < 5; i++) {
        await taskQueue.addTask({ id: `fail-${i}`, type: 'work' });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const health = await worker.getHealth();
      expect(health.status).toBe('degraded');
    });
  });

  describe('Task Timeout Handling', () => {
    it('should timeout long-running tasks', async () => {
      const timeoutEvents: any[] = [];
      
      await worker.start({ taskTimeout: 200 });
      
      worker.on('task-timeout', (event) => timeoutEvents.push(event));
      
      worker.setTaskProcessor(async (task) => {
        // Simulate long-running task
        await new Promise(resolve => setTimeout(resolve, 500));
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'slow-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(timeoutEvents.length).toBe(1);
      expect(timeoutEvents[0].taskId).toBe('slow-task');
    });

    it('should cancel timed-out tasks', async () => {
      await worker.start({ taskTimeout: 100 });
      
      let taskCompleted = false;
      
      worker.setTaskProcessor(async (task) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        taskCompleted = true;
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'timeout-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(taskCompleted).toBe(false);
    });

    it('should report timeout errors', async () => {
      const errorReports: any[] = [];
      
      await worker.start({ taskTimeout: 100 });
      
      await messageBus.subscribe('task-errors', (message) => {
        errorReports.push(message);
      });
      
      worker.setTaskProcessor(async (task) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'timeout-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(errorReports.length).toBe(1);
      expect(errorReports[0].error).toContain('timeout');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should complete current task before shutdown', async () => {
      await worker.start();
      
      let taskCompleted = false;
      
      worker.setTaskProcessor(async (task) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        taskCompleted = true;
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'final-task', type: 'work' });
      
      // Start processing, then shutdown
      await new Promise(resolve => setTimeout(resolve, 50));
      await worker.shutdown({ gracePeriod: 1000 });
      
      expect(taskCompleted).toBe(true);
    });

    it('should stop accepting new tasks during shutdown', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      await worker.shutdown();
      
      const isRunning = await worker.isRunning();
      expect(isRunning).toBe(false);
    });

    it('should deregister from WorkerRegistry on shutdown', async () => {
      await worker.start();
      await worker.shutdown();
      
      const workerInfo = await workerRegistry.getWorker('test-worker');
      expect(workerInfo).toBeNull();
    });

    it('should cancel heartbeats on shutdown', async () => {
      const heartbeats: any[] = [];
      
      await worker.start({ heartbeatInterval: 100 });
      
      await messageBus.subscribe('worker-heartbeat', (message) => {
        heartbeats.push(message);
      });
      
      await new Promise(resolve => setTimeout(resolve, 250));
      const countBefore = heartbeats.length;
      
      await worker.shutdown();
      
      await new Promise(resolve => setTimeout(resolve, 250));
      const countAfter = heartbeats.length;
      
      // No new heartbeats after shutdown
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Worker Lifecycle', () => {
    it('should start in stopped state', () => {
      const status = worker.getStatus();
      expect(status).toBe('stopped');
    });

    it('should transition through states correctly', async () => {
      const states: string[] = [];
      
      worker.on('status-change', (event) => states.push(event.status));
      
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await worker.shutdown();
      
      expect(states).toContain('idle');
      expect(states).toContain('busy');
      expect(states).toContain('stopped');
    });

    it('should prevent double-start', async () => {
      await worker.start();
      
      await expect(worker.start()).rejects.toThrow('Worker already running');
    });

    it('should allow restart after shutdown', async () => {
      await worker.start();
      await worker.shutdown();
      
      await worker.start();
      
      const status = await worker.getStatus();
      expect(status).toBe('idle');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process 100 tasks in under 5 seconds', async () => {
      await worker.start();
      
      let processed = 0;
      
      worker.setTaskProcessor(async (task) => {
        processed++;
        return { done: true };
      });
      
      // Add 100 tasks
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await taskQueue.addTask({ id: `task-${i}`, type: 'work' });
      }
      
      // Wait for processing
      while (processed < 100 && Date.now() - start < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const duration = Date.now() - start;
      
      expect(processed).toBe(100);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle high throughput processing', async () => {
      await worker.start();
      
      let throughput = 0;
      const start = Date.now();
      
      worker.setTaskProcessor(async (task) => {
        throughput++;
        return { done: true };
      });
      
      // Add tasks rapidly
      for (let i = 0; i < 50; i++) {
        await taskQueue.addTask({ id: `fast-${i}`, type: 'work' });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tasksPerSecond = throughput / ((Date.now() - start) / 1000);
      
      expect(tasksPerSecond).toBeGreaterThan(10); // At least 10 tasks/sec
    });

    it('should maintain low latency for heartbeats', async () => {
      const heartbeatLatencies: number[] = [];
      
      await worker.start({ heartbeatInterval: 100 });
      
      await messageBus.subscribe('worker-heartbeat', (message) => {
        const latency = Date.now() - message.timestamp;
        heartbeatLatencies.push(latency);
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const avgLatency = heartbeatLatencies.reduce((a, b) => a + b, 0) / heartbeatLatencies.length;
      
      expect(avgLatency).toBeLessThan(50); // <50ms average latency
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task queue gracefully', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      // No tasks added
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const status = await worker.getStatus();
      expect(status).toBe('idle');
    });

    it('should handle rapid start-stop cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await worker.start();
        await worker.shutdown();
      }
      
      const status = await worker.getStatus();
      expect(status).toBe('stopped');
    });

    it('should handle Redis connection loss during processing', async () => {
      await worker.start();
      
      worker.setTaskProcessor(async (task) => {
        // Disconnect Redis mid-task
        await redisManager.disconnect();
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'disconnect-task', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Worker should detect connection loss
      const health = await worker.getHealth();
      expect(health.status).not.toBe('healthy');
    });

    it('should handle task processor not set', async () => {
      await worker.start();
      
      // No processor set
      await taskQueue.addTask({ id: 'no-processor', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should handle gracefully (skip or error)
      const status = await worker.getStatus();
      expect(['idle', 'error']).toContain(status);
    });

    it('should handle zero heartbeat interval', async () => {
      await expect(
        worker.start({ heartbeatInterval: 0 })
      ).rejects.toThrow('Invalid heartbeat interval');
    });

    it('should handle negative capacity', async () => {
      const badWorker = new WorkerAutomation({
        workerId: 'bad-worker',
        taskQueue,
        stateSynchronizer,
        workerRegistry,
        messageBus,
        capacity: -1,
      });
      
      await expect(badWorker.start()).rejects.toThrow('Invalid capacity');
    });

    it('should handle extremely long task timeout', async () => {
      await worker.start({ taskTimeout: 3600000 }); // 1 hour
      
      worker.setTaskProcessor(async (task) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { done: true };
      });
      
      await taskQueue.addTask({ id: 'long-timeout', type: 'work' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should complete normally
      const status = await worker.getStatus();
      expect(status).toBe('idle');
    });
  });

  describe('Integration with Coordinator', () => {
    it('should receive tasks assigned by coordinator', async () => {
      const assignedTasks: any[] = [];
      
      await worker.start();
      
      await messageBus.subscribe('task-assignment', async (message) => {
        if (message.workerId === 'test-worker') {
          assignedTasks.push(message.taskId);
          await taskQueue.addTask({ id: message.taskId, type: 'work' });
        }
      });
      
      worker.setTaskProcessor(async (task) => {
        return { done: true };
      });
      
      // Simulate coordinator assignment
      await messageBus.publish('task-assignment', {
        taskId: 'assigned-task',
        workerId: 'test-worker',
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(assignedTasks).toContain('assigned-task');
    });

    it('should respect capacity limits from coordinator', async () => {
      await worker.start();
      
      const capacity = await worker.getCapacity();
      
      expect(capacity).toBe(5); // Configured capacity
    });

    it('should update coordinator on capability changes', async () => {
      const updates: any[] = [];
      
      await worker.start();
      
      await messageBus.subscribe('worker-update', (message) => {
        updates.push(message);
      });
      
      await worker.updateCapabilities(['new', 'capabilities']);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(updates.length).toBe(1);
      expect(updates[0].workerId).toBe('test-worker');
      expect(updates[0].capabilities).toEqual(['new', 'capabilities']);
    });
  });
});
