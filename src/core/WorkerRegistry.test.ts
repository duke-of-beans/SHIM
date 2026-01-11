/**
 * WorkerRegistry Test Suite
 * 
 * Tests worker registration, heartbeat monitoring, and crash detection.
 */

import { WorkerRegistry } from './WorkerRegistry';
import { RedisConnectionManager } from './RedisConnectionManager';
import { WorkerInfo, WorkerHealth } from '../models/Redis';

describe('WorkerRegistry', () => {
  let registry: WorkerRegistry;
  let redisManager: RedisConnectionManager;

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
    
    registry = new WorkerRegistry(redisManager);
  });

  afterEach(async () => {
    await registry.cleanup();
    await redisManager.disconnect();
  });

  describe('Worker Registration', () => {
    it('should register a new worker', async () => {
      const workerId = 'worker-001';
      const chatId = 'chat-001';
      
      await registry.registerWorker(workerId, chatId);
      
      const worker = await registry.getWorker(workerId);
      
      expect(worker).toBeDefined();
      expect(worker?.workerId).toBe(workerId);
      expect(worker?.chatId).toBe(chatId);
      expect(worker?.status).toBe('idle');
      expect(worker?.health).toBe('healthy');
      expect(worker?.registeredAt).toBeDefined();
      expect(worker?.lastHeartbeat).toBeDefined();
    });

    it('should update existing worker on re-registration', async () => {
      const workerId = 'worker-001';
      const chatId1 = 'chat-001';
      const chatId2 = 'chat-002';
      
      // First registration
      await registry.registerWorker(workerId, chatId1);
      const worker1 = await registry.getWorker(workerId);
      const registeredAt1 = worker1?.registeredAt;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second registration
      await registry.registerWorker(workerId, chatId2);
      const worker2 = await registry.getWorker(workerId);
      
      expect(worker2?.chatId).toBe(chatId2);
      expect(worker2?.registeredAt).toBe(registeredAt1); // Should keep original registration time
      expect(worker2?.lastHeartbeat).toBeGreaterThan(worker1!.lastHeartbeat);
    });

    it('should list all registered workers', async () => {
      await registry.registerWorker('worker-001', 'chat-001');
      await registry.registerWorker('worker-002', 'chat-002');
      await registry.registerWorker('worker-003', 'chat-003');
      
      const workers = await registry.listWorkers();
      
      expect(workers).toHaveLength(3);
      expect(workers.map(w => w.workerId).sort()).toEqual([
        'worker-001',
        'worker-002',
        'worker-003',
      ]);
    });
  });

  describe('Worker Unregistration', () => {
    it('should unregister a worker', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      await registry.unregisterWorker(workerId);
      
      const worker = await registry.getWorker(workerId);
      expect(worker).toBeNull();
    });

    it('should not error when unregistering non-existent worker', async () => {
      await expect(
        registry.unregisterWorker('worker-999')
      ).resolves.not.toThrow();
    });

    it('should remove worker from list after unregistration', async () => {
      await registry.registerWorker('worker-001', 'chat-001');
      await registry.registerWorker('worker-002', 'chat-002');
      
      await registry.unregisterWorker('worker-001');
      
      const workers = await registry.listWorkers();
      expect(workers).toHaveLength(1);
      expect(workers[0].workerId).toBe('worker-002');
    });
  });

  describe('Heartbeat Monitoring', () => {
    it('should update heartbeat timestamp', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      const worker1 = await registry.getWorker(workerId);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await registry.heartbeat(workerId);
      const worker2 = await registry.getWorker(workerId);
      
      expect(worker2?.lastHeartbeat).toBeGreaterThan(worker1!.lastHeartbeat);
    });

    it('should maintain health status on heartbeat', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      await registry.heartbeat(workerId);
      
      const worker = await registry.getWorker(workerId);
      expect(worker?.health).toBe('healthy');
    });

    it('should not error on heartbeat for non-existent worker', async () => {
      await expect(
        registry.heartbeat('worker-999')
      ).resolves.not.toThrow();
    });

    it('should detect crashed worker after timeout', async () => {
      const workerId = 'worker-001';
      
      // Register worker
      await registry.registerWorker(workerId, 'chat-001');
      
      // Simulate time passing (mock lastHeartbeat to be old)
      const client = redisManager.getClient();
      const key = `worker:${workerId}`; // Don't include keyPrefix - ioredis adds it automatically
      const worker = await registry.getWorker(workerId);
      
      if (worker) {
        const oldWorker = {
          ...worker,
          lastHeartbeat: Date.now() - 35000, // 35 seconds ago (past 30s timeout)
        };
        await client.set(key, JSON.stringify(oldWorker));
      }
      
      // Check for crashed workers
      const crashed = await registry.getCrashedWorkers();
      
      expect(crashed).toHaveLength(1);
      expect(crashed[0].workerId).toBe(workerId);
      expect(crashed[0].health).toBe('crashed');
    });
  });

  describe('Health Tracking', () => {
    it('should update worker health status', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      await registry.updateHealth(workerId, 'degraded');
      
      const worker = await registry.getWorker(workerId);
      expect(worker?.health).toBe('degraded');
    });

    it('should support all health states', async () => {
      const workerId = 'worker-001';
      await registry.registerWorker(workerId, 'chat-001');
      
      const healthStates: WorkerHealth[] = ['healthy', 'degraded', 'crashed'];
      
      for (const health of healthStates) {
        await registry.updateHealth(workerId, health);
        const worker = await registry.getWorker(workerId);
        expect(worker?.health).toBe(health);
      }
    });

    it('should filter workers by health status', async () => {
      await registry.registerWorker('worker-001', 'chat-001');
      await registry.registerWorker('worker-002', 'chat-002');
      await registry.registerWorker('worker-003', 'chat-003');
      
      await registry.updateHealth('worker-002', 'degraded');
      await registry.updateHealth('worker-003', 'crashed');
      
      const healthy = await registry.getWorkersByHealth('healthy');
      const degraded = await registry.getWorkersByHealth('degraded');
      const crashed = await registry.getWorkersByHealth('crashed');
      
      expect(healthy).toHaveLength(1);
      expect(healthy[0].workerId).toBe('worker-001');
      
      expect(degraded).toHaveLength(1);
      expect(degraded[0].workerId).toBe('worker-002');
      
      expect(crashed).toHaveLength(1);
      expect(crashed[0].workerId).toBe('worker-003');
    });
  });

  describe('Worker Status', () => {
    it('should update worker status', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      await registry.updateStatus(workerId, 'busy', 'task-001');
      
      const worker = await registry.getWorker(workerId);
      expect(worker?.status).toBe('busy');
      expect(worker?.currentTask).toBe('task-001');
    });

    it('should clear current task when status becomes idle', async () => {
      const workerId = 'worker-001';
      
      await registry.registerWorker(workerId, 'chat-001');
      await registry.updateStatus(workerId, 'busy', 'task-001');
      await registry.updateStatus(workerId, 'idle');
      
      const worker = await registry.getWorker(workerId);
      expect(worker?.status).toBe('idle');
      expect(worker?.currentTask).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should register worker in under 50ms', async () => {
      const start = Date.now();
      
      await registry.registerWorker('worker-001', 'chat-001');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should update heartbeat in under 20ms', async () => {
      await registry.registerWorker('worker-001', 'chat-001');
      
      const start = Date.now();
      await registry.heartbeat('worker-001');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(20);
    });

    it('should detect crashed workers in under 100ms with 100 workers', async () => {
      // Register 100 workers
      const workers = Array.from({ length: 100 }, (_, i) => `worker-${i.toString().padStart(3, '0')}`);
      
      for (const workerId of workers) {
        await registry.registerWorker(workerId, `chat-${workerId}`);
      }
      
      // Make half of them crashed (simulate old heartbeats)
      const client = redisManager.getClient();
      for (let i = 0; i < 50; i++) {
        const workerId = workers[i];
        const key = `worker:${workerId}`; // Don't include keyPrefix - ioredis adds it automatically
        const worker = await registry.getWorker(workerId);
        
        if (worker) {
          const oldWorker = {
            ...worker,
            lastHeartbeat: Date.now() - 35000,
          };
          await client.set(key, JSON.stringify(oldWorker));
        }
      }
      
      // Detect crashed workers
      const start = Date.now();
      const crashed = await registry.getCrashedWorkers();
      const duration = Date.now() - start;
      
      expect(crashed).toHaveLength(50);
      expect(duration).toBeLessThan(100);
    });
  });
});
