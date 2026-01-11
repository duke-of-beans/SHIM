/**
 * TaskQueueWrapper Tests
 * 
 * Tests for BullMQ wrapper with SHIM-specific task handling
 */

import { TaskQueueWrapper } from './TaskQueueWrapper';
import { RedisConnectionManager } from './RedisConnectionManager';
import { REDIS_CONFIG } from '../config/redis';

describe('TaskQueueWrapper', () => {
  let connection: RedisConnectionManager;
  let queue: TaskQueueWrapper;
  const testQueueName = 'test-queue';

  beforeEach(async () => {
    connection = new RedisConnectionManager(REDIS_CONFIG);
    await connection.connect();
    queue = new TaskQueueWrapper(connection, testQueueName);
  });

  afterEach(async () => {
    // Clean up queue
    await queue.drain();
    await queue.clean(0);
    await connection.disconnect();
  });

  describe('Construction', () => {
    it('should create TaskQueueWrapper with connection and queue name', () => {
      expect(queue).toBeDefined();
      expect(queue).toBeInstanceOf(TaskQueueWrapper);
    });

    it('should throw error if connection not provided', () => {
      expect(() => new TaskQueueWrapper(null as any, testQueueName)).toThrow();
    });

    it('should throw error if queue name empty', () => {
      expect(() => new TaskQueueWrapper(connection, '')).toThrow();
    });
  });

  describe('Task Management - addTask', () => {
    it('should add task and return task ID', async () => {
      const task = {
        type: 'test-task',
        data: { message: 'Hello' }
      };

      const taskId = await queue.addTask(task);

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(taskId.length).toBeGreaterThan(0);
    });

    it('should add task with priority option', async () => {
      const task = {
        type: 'urgent-task',
        data: { priority: 'high' }
      };

      const taskId = await queue.addTask(task, { priority: 1 });

      expect(taskId).toBeDefined();
      
      // Verify task stored with priority
      const retrieved = await queue.getTask(taskId);
      expect(retrieved).toBeDefined();
    });

    it('should add task with delay option', async () => {
      const task = {
        type: 'delayed-task',
        data: { scheduled: true }
      };

      const taskId = await queue.addTask(task, { delay: 5000 });

      expect(taskId).toBeDefined();
      
      // Task should be in delayed state, not active
      const activeCount = await queue.getActiveCount();
      expect(activeCount).toBe(0);
    });

    it('should add task with custom retry attempts', async () => {
      const task = {
        type: 'retry-task',
        data: { retries: 5 }
      };

      const taskId = await queue.addTask(task, { attempts: 5 });

      expect(taskId).toBeDefined();
    });

    it('should enforce performance benchmark: task addition under 10ms', async () => {
      const task = {
        type: 'perf-test',
        data: { test: 'performance' }
      };

      const start = Date.now();
      await queue.addTask(task);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('Task Management - getTask', () => {
    it('should retrieve task by ID', async () => {
      const task = {
        type: 'retrieve-test',
        data: { value: 42 }
      };

      const taskId = await queue.addTask(task);
      const retrieved = await queue.getTask(taskId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.type).toBe('retrieve-test');
      expect(retrieved?.data.value).toBe(42);
    });

    it('should return null for non-existent task', async () => {
      const retrieved = await queue.getTask('non-existent-task-id');
      expect(retrieved).toBeNull();
    });

    it('should enforce performance benchmark: task retrieval under 5ms', async () => {
      const task = {
        type: 'perf-get',
        data: { test: 'retrieval' }
      };

      const taskId = await queue.addTask(task);

      const start = Date.now();
      await queue.getTask(taskId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('Task Management - updateTask', () => {
    it('should update task data', async () => {
      const task = {
        type: 'update-test',
        data: { status: 'pending' }
      };

      const taskId = await queue.addTask(task);
      
      await queue.updateTask(taskId, {
        data: { status: 'in-progress' }
      });

      const updated = await queue.getTask(taskId);
      expect(updated?.data.status).toBe('in-progress');
    });

    it('should throw error for non-existent task update', async () => {
      await expect(
        queue.updateTask('non-existent', { data: {} })
      ).rejects.toThrow();
    });
  });

  describe('Worker Pattern', () => {
    it('should register worker and process task successfully', async () => {
      let processedTask: any = null;

      const processor = async (task: any) => {
        processedTask = task;
        return { success: true };
      };

      await queue.registerWorker(processor);

      const task = {
        type: 'worker-test',
        data: { message: 'Process me' }
      };

      await queue.addTask(task);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(processedTask).toBeDefined();
      expect(processedTask.type).toBe('worker-test');
    });

    it('should handle worker processing failure with retry', async () => {
      let attemptCount = 0;

      const processor = async (task: any) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated failure');
        }
        return { success: true, attempts: attemptCount };
      };

      await queue.registerWorker(processor);

      const task = {
        type: 'retry-test',
        data: { shouldRetry: true }
      };

      await queue.addTask(task, { attempts: 3 });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(attemptCount).toBe(3);
    });

    it('should support worker concurrency', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const processor = async (task: any) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCount--;
        return { success: true };
      };

      await queue.registerWorker(processor, 3);

      // Add multiple tasks
      for (let i = 0; i < 10; i++) {
        await queue.addTask({ type: 'concurrent-test', data: { id: i } });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it('should call progress callback during processing', async () => {
      let progressUpdates: number[] = [];

      const processor = async (task: any, progress: (pct: number) => void) => {
        progress(25);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        progress(50);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        progress(75);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        progress(100);
        return { success: true };
      };

      // Hook into progress updates
      await queue.registerWorker(async (task, progress) => {
        const wrappedProgress = (pct: number) => {
          progressUpdates.push(pct);
          if (progress) progress(pct);
        };
        return processor(task, wrappedProgress);
      });

      await queue.addTask({ type: 'progress-test', data: {} });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Queue Control', () => {
    it('should pause and resume queue', async () => {
      await queue.pause();
      
      // Add task while paused
      const taskId = await queue.addTask({
        type: 'paused-test',
        data: { shouldWait: true }
      });

      // Should be waiting, not active
      const waitingCount = await queue.getWaitingCount();
      expect(waitingCount).toBeGreaterThan(0);

      await queue.resume();

      // Queue should process now
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should drain queue (remove waiting jobs)', async () => {
      // Add tasks
      await queue.addTask({ type: 'drain-1', data: {} });
      await queue.addTask({ type: 'drain-2', data: {} });
      await queue.addTask({ type: 'drain-3', data: {} });

      await queue.pause();
      await queue.drain();

      const waitingCount = await queue.getWaitingCount();
      expect(waitingCount).toBe(0);
    });

    it('should clean completed jobs with grace period', async () => {
      // Register simple processor
      await queue.registerWorker(async (task) => ({ success: true }));

      // Add and process task
      await queue.addTask({ type: 'clean-test', data: {} });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Clean completed jobs
      await queue.clean(0);

      // Stats should show cleaned state
      const stats = await queue.getQueueStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should return queue statistics', async () => {
      const stats = await queue.getQueueStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
    });

    it('should return accurate waiting count', async () => {
      await queue.pause();

      await queue.addTask({ type: 'wait-1', data: {} });
      await queue.addTask({ type: 'wait-2', data: {} });
      await queue.addTask({ type: 'wait-3', data: {} });

      const waitingCount = await queue.getWaitingCount();
      expect(waitingCount).toBe(3);
    });

    it('should return accurate active count', async () => {
      // Register slow processor
      await queue.registerWorker(async (task) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      });

      // Add tasks
      await queue.addTask({ type: 'active-1', data: {} });
      await queue.addTask({ type: 'active-2', data: {} });

      // Wait for tasks to become active
      await new Promise(resolve => setTimeout(resolve, 50));

      const activeCount = await queue.getActiveCount();
      expect(activeCount).toBeGreaterThan(0);
    });

    it('should enforce performance benchmark: statistics under 20ms', async () => {
      const start = Date.now();
      await queue.getQueueStats();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(20);
    });
  });

  describe('Stalled Jobs', () => {
    it('should detect and retry stalled jobs', async () => {
      let processCount = 0;

      const processor = async (task: any) => {
        processCount++;
        
        if (processCount === 1) {
          // Simulate stall (process hangs)
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
        return { success: true };
      };

      await queue.registerWorker(processor);

      await queue.addTask({ type: 'stall-test', data: {} });

      // Wait for stall detection (30s interval from config)
      await new Promise(resolve => setTimeout(resolve, 35000));

      // Job should be retried
      expect(processCount).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      await connection.disconnect();

      await expect(
        queue.addTask({ type: 'error-test', data: {} })
      ).rejects.toThrow();
    });

    it('should handle invalid task data', async () => {
      await expect(
        queue.addTask(null as any)
      ).rejects.toThrow();
    });

    it('should handle worker registration errors', async () => {
      await expect(
        queue.registerWorker(null as any)
      ).rejects.toThrow();
    });
  });
});
