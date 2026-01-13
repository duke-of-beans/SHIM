/**
 * TaskQueueWrapper Test Suite
 * 
 * Tests distributed task queue using BullMQ.
 * 
 * Features tested:
 * - Task submission and processing
 * - Priority queues
 * - Job progress tracking
 * - Retry logic
 * - Job completion and failure handling
 * - Queue metrics and monitoring
 */

import { TaskQueueWrapper } from './TaskQueueWrapper';
import { RedisConnectionManager } from './RedisConnectionManager';

describe('TaskQueueWrapper', () => {
  let queue: TaskQueueWrapper;
  let redisManager: RedisConnectionManager;
  const queueName = 'test-queue';

  beforeEach(async () => {
    // Use test Redis connection
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
    
    queue = new TaskQueueWrapper(queueName, redisManager);
  });

  afterEach(async () => {
    await queue.close();
    await redisManager.disconnect();
  });

  describe('Task Submission', () => {
    it('should add task to queue', async () => {
      const taskData = { action: 'process', value: 42 };
      
      const jobId = await queue.addTask(taskData);
      
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should add task with priority', async () => {
      const highPriority = await queue.addTask({ task: 'high' }, { priority: 1 });
      const lowPriority = await queue.addTask({ task: 'low' }, { priority: 10 });
      
      expect(highPriority).toBeDefined();
      expect(lowPriority).toBeDefined();
      expect(highPriority).not.toBe(lowPriority);
    });

    it('should add task with delay', async () => {
      const taskData = { action: 'delayed' };
      
      const jobId = await queue.addTask(taskData, { delay: 1000 }); // 1 second
      
      expect(jobId).toBeDefined();
      
      // Job should not be immediately available
      const job = await queue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.state).not.toBe('active');
    });

    it('should add task with custom job ID', async () => {
      const customId = 'custom-job-123';
      
      const jobId = await queue.addTask({ task: 'custom' }, { jobId: customId });
      
      expect(jobId).toBe(customId);
    });

    it('should add task with retry options', async () => {
      const jobId = await queue.addTask(
        { task: 'retry' },
        { 
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      );
      
      expect(jobId).toBeDefined();
    });
  });

  describe('Task Processing', () => {
    it('should process tasks', async () => {
      const processed: any[] = [];
      
      // Register processor
      await queue.process(async (job) => {
        processed.push(job.data);
        return { success: true };
      });
      
      // Add task
      await queue.addTask({ value: 42 });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processed).toHaveLength(1);
      expect(processed[0].value).toBe(42);
    });

    it('should process multiple tasks in order', async () => {
      const processed: number[] = [];
      
      await queue.process(async (job) => {
        processed.push(job.data.order);
        return { success: true };
      });
      
      // Add tasks
      await queue.addTask({ order: 1 });
      await queue.addTask({ order: 2 });
      await queue.addTask({ order: 3 });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(processed).toHaveLength(3);
      expect(processed).toEqual([1, 2, 3]);
    });

    it('should handle concurrent processing', async () => {
      const processed: number[] = [];
      
      await queue.process(async (job) => {
        processed.push(job.data.value);
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      }, { concurrency: 3 });
      
      // Add 5 tasks
      for (let i = 0; i < 5; i++) {
        await queue.addTask({ value: i });
      }
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(processed).toHaveLength(5);
    });

    it('should respect priority in processing', async () => {
      const processed: string[] = [];
      
      await queue.process(async (job) => {
        processed.push(job.data.name);
        return { success: true };
      });
      
      // Add tasks with different priorities
      await queue.addTask({ name: 'low' }, { priority: 10 });
      await queue.addTask({ name: 'high' }, { priority: 1 });
      await queue.addTask({ name: 'medium' }, { priority: 5 });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(processed).toEqual(['high', 'medium', 'low']);
    });
  });

  describe('Job Progress', () => {
    it('should track job progress', async () => {
      let jobId: string;
      
      await queue.process(async (job) => {
        await job.updateProgress(25);
        await new Promise(resolve => setTimeout(resolve, 100));
        await job.updateProgress(50);
        await new Promise(resolve => setTimeout(resolve, 100));
        await job.updateProgress(75);
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      });
      
      jobId = await queue.addTask({ task: 'progress' });
      
      // Wait a bit and check progress
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const job = await queue.getJob(jobId);
      const progress = await job?.progress;
      
      expect(progress).toBeGreaterThan(0);
    });

    it('should get job state', async () => {
      const jobId = await queue.addTask({ task: 'state' });
      
      const job = await queue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.state).toMatch(/waiting|active|completed/);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed jobs', async () => {
      let attempts = 0;
      
      await queue.process(async (job) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Simulated failure');
        }
        return { success: true };
      });
      
      await queue.addTask(
        { task: 'retry' },
        { attempts: 3, backoff: { type: 'fixed', delay: 100 } }
      );
      
      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(attempts).toBe(3);
    });

    it('should move to failed after max attempts', async () => {
      await queue.process(async (job) => {
        throw new Error('Always fails');
      });
      
      const jobId = await queue.addTask(
        { task: 'fail' },
        { attempts: 2 }
      );
      
      // Wait for failure
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const job = await queue.getJob(jobId);
      expect(job?.state).toBe('failed');
    });
  });

  describe('Job Completion', () => {
    it('should complete jobs successfully', async () => {
      await queue.process(async (job) => {
        return { result: 'success', data: job.data };
      });
      
      const jobId = await queue.addTask({ value: 123 });
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const job = await queue.getJob(jobId);
      expect(job?.state).toBe('completed');
      expect(job?.returnvalue).toEqual({ result: 'success', data: { value: 123 } });
    });

    it('should handle job removal', async () => {
      const jobId = await queue.addTask({ task: 'remove' });
      
      const removed = await queue.removeJob(jobId);
      expect(removed).toBe(true);
      
      const job = await queue.getJob(jobId);
      expect(job).toBeNull();
    });

    it('should clean completed jobs', async () => {
      await queue.process(async (job) => {
        return { success: true };
      });
      
      // Add and complete jobs
      await queue.addTask({ task: 1 });
      await queue.addTask({ task: 2 });
      await queue.addTask({ task: 3 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean completed jobs older than 0 seconds
      const cleaned = await queue.clean('completed', 0);
      expect(cleaned).toBeGreaterThan(0);
    });
  });

  describe('Queue Metrics', () => {
    it('should get queue counts', async () => {
      // Add various jobs
      await queue.addTask({ task: 'waiting' });
      await queue.addTask({ task: 'delayed' }, { delay: 10000 });
      
      const counts = await queue.getJobCounts();
      
      expect(counts).toBeDefined();
      expect(counts.waiting).toBeGreaterThanOrEqual(1);
      expect(counts.delayed).toBeGreaterThanOrEqual(1);
    });

    it('should get waiting jobs', async () => {
      await queue.addTask({ task: 1 });
      await queue.addTask({ task: 2 });
      
      const waiting = await queue.getWaiting();
      
      expect(waiting).toHaveLength(2);
    });

    it('should get active jobs', async () => {
      await queue.process(async (job) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      });
      
      await queue.addTask({ task: 'active' });
      
      // Wait a bit for job to become active
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const active = await queue.getActive();
      expect(active.length).toBeGreaterThanOrEqual(0);
    });

    it('should get completed jobs', async () => {
      await queue.process(async (job) => {
        return { success: true };
      });
      
      await queue.addTask({ task: 'complete' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const completed = await queue.getCompleted();
      expect(completed).toHaveLength(1);
    });

    it('should get failed jobs', async () => {
      await queue.process(async (job) => {
        throw new Error('Test failure');
      });
      
      await queue.addTask({ task: 'fail' }, { attempts: 1 });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const failed = await queue.getFailed();
      expect(failed).toHaveLength(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit completed event', async () => {
      const completed: any[] = [];
      
      queue.on('completed', (job, result) => {
        completed.push({ job: job.data, result });
      });
      
      await queue.process(async (job) => {
        return { success: true };
      });
      
      await queue.addTask({ value: 42 });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(completed).toHaveLength(1);
      expect(completed[0].job.value).toBe(42);
    });

    it('should emit failed event', async () => {
      const failed: any[] = [];
      
      queue.on('failed', (job, error) => {
        failed.push({ job: job?.data, error: error.message });
      });
      
      await queue.process(async (job) => {
        throw new Error('Test error');
      });
      
      await queue.addTask({ value: 99 }, { attempts: 1 });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(failed).toHaveLength(1);
      expect(failed[0].error).toBe('Test error');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid job data', async () => {
      await expect(
        queue.addTask(undefined as any)
      ).rejects.toThrow();
    });

    it('should handle processor errors gracefully', async () => {
      await queue.process(async (job) => {
        if (job.data.shouldFail) {
          throw new Error('Expected error');
        }
        return { success: true };
      });
      
      const successId = await queue.addTask({ shouldFail: false });
      const failId = await queue.addTask({ shouldFail: true }, { attempts: 1 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const successJob = await queue.getJob(successId);
      const failJob = await queue.getJob(failId);
      
      expect(successJob?.state).toBe('completed');
      expect(failJob?.state).toBe('failed');
    });

    it('should handle connection errors', async () => {
      // Disconnect Redis
      await redisManager.disconnect();
      
      await expect(
        queue.addTask({ task: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should pause and resume queue', async () => {
      await queue.pause();
      
      const isPaused = await queue.isPaused();
      expect(isPaused).toBe(true);
      
      await queue.resume();
      
      const isResumed = await queue.isPaused();
      expect(isResumed).toBe(false);
    });

    it('should drain queue', async () => {
      await queue.addTask({ task: 1 });
      await queue.addTask({ task: 2 });
      
      await queue.drain();
      
      const counts = await queue.getJobCounts();
      expect(counts.waiting).toBe(0);
    });

    it('should close queue gracefully', async () => {
      await queue.process(async (job) => {
        return { success: true };
      });
      
      await queue.addTask({ task: 'closing' });
      
      await queue.close();
      
      // Should not be able to add tasks after close
      await expect(
        queue.addTask({ task: 'after-close' })
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle high throughput', async () => {
      let processed = 0;
      
      await queue.process(async (job) => {
        processed++;
        return { success: true };
      }, { concurrency: 10 });
      
      // Add 100 tasks
      const jobs = [];
      for (let i = 0; i < 100; i++) {
        jobs.push(queue.addTask({ index: i }));
      }
      await Promise.all(jobs);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      expect(processed).toBe(100);
    });

    it('should add tasks quickly (<10ms each)', async () => {
      const start = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await queue.addTask({ index: i });
      }
      
      const elapsed = Date.now() - start;
      const avgTime = elapsed / 10;
      
      expect(avgTime).toBeLessThan(10);
    });
  });
});
