/**
 * WorkDistributor Tests
 *
 * Tests for distributing tasks across multiple chat instances.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { WorkDistributor, Task, TaskPriority, DistributionStrategy } from './WorkDistributor';
import { ChatRegistry } from './ChatRegistry';

describe('WorkDistributor', () => {
  let distributor: WorkDistributor;
  let registry: ChatRegistry;

  beforeEach(() => {
    registry = new ChatRegistry();
    distributor = new WorkDistributor(registry);
  });

  describe('Construction', () => {
    it('should create WorkDistributor instance', () => {
      expect(distributor).toBeInstanceOf(WorkDistributor);
    });

    it('should accept custom strategy', () => {
      const custom = new WorkDistributor(registry, 'capability-match');
      expect(custom).toBeInstanceOf(WorkDistributor);
    });
  });

  describe('Task Distribution', () => {
    it('should distribute task to available chat', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      const task: Task = {
        id: 'task-1',
        type: 'analysis',
        priority: 'medium',
        payload: {},
      };

      const assigned = distributor.distributeTask(task);
      expect(assigned).toBe(chatId);
    });

    it('should return null when no chats available', () => {
      const task: Task = {
        id: 'task-1',
        type: 'analysis',
        priority: 'medium',
        payload: {},
      };

      const assigned = distributor.distributeTask(task);
      expect(assigned).toBeNull();
    });

    it('should prefer idle chats over busy ones', () => {
      const id1 = registry.registerChat({ name: 'Chat 1', capabilities: [] });
      const id2 = registry.registerChat({ name: 'Chat 2', capabilities: [] });

      registry.updateStatus(id1, 'busy');
      registry.updateStatus(id2, 'idle');

      const task: Task = {
        id: 'task-1',
        type: 'test',
        priority: 'high',
        payload: {},
      };

      const assigned = distributor.distributeTask(task);
      expect(assigned).toBe(id2);
    });
  });

  describe('Capability Matching', () => {
    it('should match task to chat with required capability', () => {
      registry.registerChat({ name: 'Chat 1', capabilities: ['testing'] });
      const id2 = registry.registerChat({ name: 'Chat 2', capabilities: ['coding'] });

      const task: Task = {
        id: 'task-1',
        type: 'coding',
        priority: 'high',
        payload: {},
        requiredCapability: 'coding',
      };

      const assigned = distributor.distributeTask(task);
      expect(assigned).toBe(id2);
    });

    it('should return null when no chat has required capability', () => {
      registry.registerChat({ name: 'Chat', capabilities: ['testing'] });

      const task: Task = {
        id: 'task-1',
        type: 'coding',
        priority: 'high',
        payload: {},
        requiredCapability: 'coding',
      };

      const assigned = distributor.distributeTask(task);
      expect(assigned).toBeNull();
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize high priority tasks', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      const lowTask: Task = {
        id: 'task-1',
        type: 'test',
        priority: 'low',
        payload: {},
      };

      const highTask: Task = {
        id: 'task-2',
        type: 'test',
        priority: 'high',
        payload: {},
      };

      distributor.queueTask(lowTask);
      distributor.queueTask(highTask);

      const next = distributor.getNextTask();
      expect(next?.id).toBe('task-2');
    });
  });

  describe('Load Balancing', () => {
    it('should distribute tasks evenly across chats', () => {
      const id1 = registry.registerChat({ name: 'Chat 1', capabilities: [] });
      const id2 = registry.registerChat({ name: 'Chat 2', capabilities: [] });

      const task1: Task = { id: 'task-1', type: 'test', priority: 'medium', payload: {} };
      const task2: Task = { id: 'task-2', type: 'test', priority: 'medium', payload: {} };

      const assigned1 = distributor.distributeTask(task1);
      registry.updateStatus(assigned1!, 'busy');

      const assigned2 = distributor.distributeTask(task2);

      expect(assigned1).not.toBe(assigned2);
    });
  });

  describe('Task Queue', () => {
    it('should queue tasks when no chats available', () => {
      const task: Task = {
        id: 'task-1',
        type: 'test',
        priority: 'medium',
        payload: {},
      };

      distributor.queueTask(task);

      const queued = distributor.getQueuedTasks();
      expect(queued.length).toBe(1);
    });

    it('should process queued tasks when chat becomes available', () => {
      const task: Task = {
        id: 'task-1',
        type: 'test',
        priority: 'medium',
        payload: {},
      };

      distributor.queueTask(task);
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      const assigned = distributor.processQueue();
      expect(assigned.length).toBe(1);
      expect(assigned[0].chatId).toBe(chatId);
    });
  });

  describe('Statistics', () => {
    it('should track distribution statistics', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      const task: Task = {
        id: 'task-1',
        type: 'test',
        priority: 'medium',
        payload: {},
      };

      distributor.distributeTask(task);

      const stats = distributor.getStatistics();
      expect(stats.totalDistributed).toBe(1);
    });
  });
});
