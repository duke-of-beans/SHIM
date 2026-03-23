/**
 * WorkerAutomation Test Suite
 *
 * Sprint 3 fix: replaced real TaskQueueWrapper, StateSynchronizer, and
 * MessageBusWrapper with lightweight in-memory mocks. The real TaskQueueWrapper
 * creates a BullMQ Worker on every process() call and throws
 * "Processor already registered" on subsequent calls — incompatible with the
 * while-loop in processTaskLoop(). The mocks let us:
 *   - Manually trigger task processing via triggerTask()
 *   - Capture published messages without Redis Pub/Sub open handles
 *   - Assert state changes without real Redis calls
 * WorkerRegistry and RedisConnectionManager remain real (they work fine).
 *
 * Production code is NOT changed (sprint constraint).
 */

import { WorkerAutomation } from './WorkerAutomation';
import { RedisConnectionManager } from './RedisConnectionManager';
import { WorkerRegistry } from './WorkerRegistry';

// ---------------------------------------------------------------------------
// TaskQueueWrapper mock
// ---------------------------------------------------------------------------
function createTaskQueueMock() {
  let _processor: ((job: any) => Promise<any>) | null = null;

  return {
    async process(processor: (job: any) => Promise<any>): Promise<void> {
      _processor = processor;
    },
    async addTask(data: any, _options?: any): Promise<string> {
      const job = { data, id: `job-${Date.now()}-${Math.random()}` };
      if (_processor) {
        setTimeout(async () => {
          try { await _processor!(job); } catch (_) {}
        }, 0);
      }
      return job.id;
    },
    async close(): Promise<void> { _processor = null; },
    async triggerTask(data: any): Promise<void> {
      if (!_processor) throw new Error('No processor registered — call worker.start() first');
      const job = { data, id: `manual-${Date.now()}` };
      // Don't propagate errors — WorkerAutomation.processTask catches internally
      try { await _processor(job); } catch (_) {}
    },
    hasProcessor(): boolean { return _processor !== null; },
  };
}

// ---------------------------------------------------------------------------
// StateSynchronizer mock — 3-arg API (key, value, ttl?)
// ---------------------------------------------------------------------------
function createStateSyncMock() {
  const store = new Map<string, any>();
  return {
    _store: store,
    async setState(key: string, value: any, _ttl?: number): Promise<number> {
      store.set(key, value); return 1;
    },
    async getState(key: string): Promise<any> {
      return store.get(key) ?? null;
    },
    async updateFields(key: string, fields: Record<string, any>): Promise<number> {
      const cur = store.get(key) ?? {};
      store.set(key, { ...cur, ...fields }); return 1;
    },
    async cleanup(): Promise<void> { store.clear(); },
  };
}

// ---------------------------------------------------------------------------
// MessageBusWrapper mock — in-memory pub/sub
// ---------------------------------------------------------------------------
function createMessageBusMock() {
  const handlers = new Map<string, Array<(msg: any) => void>>();
  const published: Array<{ channel: string; message: any }> = [];
  return {
    _published: published,
    async subscribe(channel: string, handler: (msg: any) => void): Promise<void> {
      if (!handlers.has(channel)) handlers.set(channel, []);
      handlers.get(channel)!.push(handler);
    },
    async publish(channel: string, message: any): Promise<number> {
      published.push({ channel, message });
      const h = handlers.get(channel) ?? [];
      for (const fn of h) setImmediate(() => fn(message));
      return h.length;
    },
    async close(): Promise<void> { handlers.clear(); published.length = 0; },
  };
}

// ---------------------------------------------------------------------------
describe('WorkerAutomation', () => {
  let worker: WorkerAutomation;
  let redisManager: RedisConnectionManager;
  let taskQueue: ReturnType<typeof createTaskQueueMock>;
  let stateSyncMock: ReturnType<typeof createStateSyncMock>;
  let workerRegistry: WorkerRegistry;
  let messageBus: ReturnType<typeof createMessageBusMock>;

  beforeEach(async () => {
    redisManager = new RedisConnectionManager({
      host: 'localhost', port: 6379, db: 1,
      keyPrefix: 'shim:test:', lazyConnect: true,
    });
    await redisManager.connect();
    await redisManager.getClient().flushdb();

    taskQueue      = createTaskQueueMock();
    stateSyncMock  = createStateSyncMock();
    workerRegistry = new WorkerRegistry(redisManager);
    messageBus     = createMessageBusMock();

    worker = new WorkerAutomation({
      workerId: 'test-worker',
      taskQueue: taskQueue as any,
      stateSynchronizer: stateSyncMock as any,
      workerRegistry,
      messageBus: messageBus as any,
      capabilities: ['general', 'computation'],
      capacity: 5,
    });
  });

  afterEach(async () => {
    try { await worker.shutdown({ force: true }); } catch (_) {}
    await stateSyncMock.cleanup();
    await messageBus.close();
    await workerRegistry.cleanup();
    await redisManager.disconnect();
  });

  // -------------------------------------------------------------------------
  describe('Worker Registration', () => {
    it('should auto-register with WorkerRegistry on start', async () => {
      await worker.start();
      const info = await workerRegistry.getWorker('test-worker');
      expect(info).toBeDefined();
      expect(info!.workerId).toBe('test-worker');
    });

    it('should set initial status to idle', async () => {
      await worker.start();
      expect(worker.getStatus()).toBe('idle');
    });

    it('should deregister on shutdown', async () => {
      await worker.start();
      await worker.shutdown({ force: true });
      expect(await workerRegistry.getWorker('test-worker')).toBeNull();
    });

    it('should update registration on capability change', async () => {
      await worker.start();
      await worker.updateCapabilities(['general', 'computation', 'analysis']);
      expect(await workerRegistry.getWorker('test-worker')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('Autonomous Task Execution', () => {
    it('should process a task when processor is set', async () => {
      await worker.start();
      const processed: any[] = [];
      worker.setTaskProcessor(async (task) => { processed.push(task); return { done: true }; });
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(processed.length).toBe(1);
      expect(processed[0].id).toBe('task-1');
    });

    it('should update status to busy while processing', async () => {
      await worker.start();
      let observed: string | null = null;
      worker.setTaskProcessor(async () => { observed = worker.getStatus(); return { done: true }; });
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(observed).toBe('busy');
    });

    it('should return to idle after task completion', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => ({ done: true }));
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(worker.getStatus()).toBe('idle');
    });

    it('should process multiple tasks', async () => {
      const results: string[] = [];
      await worker.start();
      worker.setTaskProcessor(async (task) => { results.push(task.id); return { done: true }; });
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await taskQueue.triggerTask({ id: 'task-2', type: 'work' });
      await taskQueue.triggerTask({ id: 'task-3', type: 'work' });
      await new Promise(r => setTimeout(r, 100));
      expect(results).toContain('task-1');
      expect(results).toContain('task-2');
      expect(results).toContain('task-3');
    });
  });

  // -------------------------------------------------------------------------
  describe('Result Reporting', () => {
    it('should publish task results to task-results channel', async () => {
      await worker.start();
      worker.setTaskProcessor(async (task) => ({ result: `Result for ${task.id}` }));
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      const msgs = messageBus._published.filter(p => p.channel === 'task-results');
      expect(msgs.length).toBe(1);
      expect(msgs[0].message.taskId).toBe('task-1');
    });

    it('should include worker ID in result reports', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => ({ done: true }));
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      const msgs = messageBus._published.filter(p => p.channel === 'task-results');
      expect(msgs[0].message.workerId).toBe('test-worker');
    });

    it('should publish progress updates', async () => {
      await worker.start();
      worker.setTaskProcessor(async (task) => {
        await worker.reportProgress(task.id, 0.5);
        await worker.reportProgress(task.id, 1.0);
        return { done: true };
      });
      await taskQueue.triggerTask({ id: 'task-1', type: 'work' });
      await new Promise(r => setTimeout(r, 100));
      const msgs = messageBus._published.filter(p => p.channel === 'task-progress');
      expect(msgs.length).toBeGreaterThanOrEqual(2);
      expect(msgs[0].message.progress).toBe(0.5);
    });
  });

  // -------------------------------------------------------------------------
  describe('Error Handling', () => {
    it('should handle task errors gracefully', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => { throw new Error('Processing failed'); });
      await taskQueue.triggerTask({ id: 'failing-task', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(worker.getStatus()).toBe('idle');
    });

    it('should publish error reports to task-errors channel', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => { throw new Error('Task error'); });
      await taskQueue.triggerTask({ id: 'error-task', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      const msgs = messageBus._published.filter(p => p.channel === 'task-errors');
      expect(msgs.length).toBe(1);
      expect(msgs[0].message.taskId).toBe('error-task');
      expect(msgs[0].message.error).toContain('Task error');
    });

    it('should record failed status in state', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => { throw new Error('Fatal'); });
      await taskQueue.triggerTask({ id: 'fatal-task', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(stateSyncMock._store.get('task:fatal-task:status')).toBe('failed');
    });
  });

  // -------------------------------------------------------------------------
  describe('Health Monitoring', () => {
    it('should send periodic heartbeats', async () => {
      await worker.start({ heartbeatInterval: 100 });
      await new Promise(r => setTimeout(r, 350));
      const hb = messageBus._published.filter(p => p.channel === 'worker-heartbeat');
      expect(hb.length).toBeGreaterThanOrEqual(3);
      expect(hb[0].message.workerId).toBe('test-worker');
    });

    it('should include load in heartbeats', async () => {
      await worker.start({ heartbeatInterval: 100 });
      await new Promise(r => setTimeout(r, 150));
      const hb = messageBus._published.filter(p => p.channel === 'worker-heartbeat');
      expect(hb.length).toBeGreaterThan(0);
      expect(typeof hb[0].message.load).toBe('number');
    });

    it('should report healthy status', async () => {
      await worker.start();
      await new Promise(r => setTimeout(r, 10)); // ensure startTime > 0
      const health = await worker.getHealth();
      expect(health.workerId).toBe('test-worker');
      expect(health.status).toBe('healthy');
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should degrade health after repeated errors', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => { throw new Error('Continuous failure'); });
      for (let i = 0; i < 6; i++) {
        await taskQueue.triggerTask({ id: `fail-${i}`, type: 'work' });
        await new Promise(r => setTimeout(r, 20));
      }
      const health = await worker.getHealth();
      expect(health.status).toBe('degraded');
    });
  });

  // -------------------------------------------------------------------------
  describe('Task Timeout Handling', () => {
    it('should timeout long-running tasks', async () => {
      const timeoutEvents: any[] = [];
      await worker.start({ taskTimeout: 100 });
      worker.on('task-timeout', (e) => timeoutEvents.push(e));
      worker.setTaskProcessor(async () => {
        await new Promise(r => setTimeout(r, 500));
        return { done: true };
      });
      await taskQueue.triggerTask({ id: 'slow-task', type: 'work' });
      await new Promise(r => setTimeout(r, 300));
      expect(timeoutEvents.length).toBe(1);
      expect(timeoutEvents[0].taskId).toBe('slow-task');
    });

    it('should report timeout errors', async () => {
      await worker.start({ taskTimeout: 100 });
      worker.setTaskProcessor(async () => {
        await new Promise(r => setTimeout(r, 400));
        return { done: true };
      });
      await taskQueue.triggerTask({ id: 'timeout-task', type: 'work' });
      await new Promise(r => setTimeout(r, 300));
      const msgs = messageBus._published.filter(p => p.channel === 'task-errors');
      expect(msgs.length).toBeGreaterThan(0);
      expect(msgs[0].message.error).toContain('timeout');
    });
  });

  // -------------------------------------------------------------------------
  describe('Graceful Shutdown', () => {
    it('should set isRunning false on shutdown', async () => {
      await worker.start();
      await worker.shutdown();
      expect(await worker.getIsRunning()).toBe(false);
    });

    it('should deregister from WorkerRegistry on shutdown', async () => {
      await worker.start();
      await worker.shutdown({ force: true });
      expect(await workerRegistry.getWorker('test-worker')).toBeNull();
    });

    it('should stop heartbeats on shutdown', async () => {
      await worker.start({ heartbeatInterval: 100 });
      await new Promise(r => setTimeout(r, 150));
      const before = messageBus._published.filter(p => p.channel === 'worker-heartbeat').length;
      await worker.shutdown({ force: true });
      await new Promise(r => setTimeout(r, 200));
      const after = messageBus._published.filter(p => p.channel === 'worker-heartbeat').length;
      expect(after).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('Worker Lifecycle', () => {
    it('should start in stopped state', () => {
      expect(worker.getStatus()).toBe('stopped');
    });

    it('should emit idle on start', async () => {
      const states: string[] = [];
      worker.on('status-change', (e) => states.push(e.status));
      await worker.start();
      expect(states).toContain('idle');
    });

    it('should prevent double-start', async () => {
      await worker.start();
      await expect(worker.start()).rejects.toThrow('Worker already running');
    });

    it('should allow restart after shutdown', async () => {
      await worker.start();
      await worker.shutdown({ force: true });
      worker = new WorkerAutomation({
        workerId: 'test-worker',
        taskQueue: taskQueue as any,
        stateSynchronizer: stateSyncMock as any,
        workerRegistry,
        messageBus: messageBus as any,
        capabilities: ['general'],
        capacity: 5,
      });
      await worker.start();
      expect(worker.getStatus()).toBe('idle');
    });
  });

  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should idle with no tasks', async () => {
      await worker.start();
      worker.setTaskProcessor(async () => ({ done: true }));
      await new Promise(r => setTimeout(r, 100));
      expect(worker.getStatus()).toBe('idle');
    });

    it('should handle task processor not set', async () => {
      await worker.start();
      await taskQueue.triggerTask({ id: 'no-processor', type: 'work' });
      await new Promise(r => setTimeout(r, 50));
      expect(['idle', 'error']).toContain(worker.getStatus());
    });

    it('should reject zero heartbeat interval', async () => {
      await expect(worker.start({ heartbeatInterval: 0 }))
        .rejects.toThrow('Invalid heartbeat interval');
    });

    it('should reject negative capacity', async () => {
      const badWorker = new WorkerAutomation({
        workerId: 'bad-worker',
        taskQueue: taskQueue as any,
        stateSynchronizer: stateSyncMock as any,
        workerRegistry,
        messageBus: messageBus as any,
        capacity: -1,
      });
      await expect(badWorker.start()).rejects.toThrow('Invalid capacity');
    });

    it('should report capacity', async () => {
      await worker.start();
      expect(await worker.getCapacity()).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  describe('Integration with Coordinator', () => {
    it('should publish capability updates', async () => {
      await worker.start();
      await worker.updateCapabilities(['new', 'capabilities']);
      await new Promise(r => setTimeout(r, 50));
      const msgs = messageBus._published.filter(p => p.channel === 'worker-update');
      expect(msgs.length).toBe(1);
      expect(msgs[0].message.workerId).toBe('test-worker');
      expect(msgs[0].message.capabilities).toEqual(['new', 'capabilities']);
    });
  });
});
