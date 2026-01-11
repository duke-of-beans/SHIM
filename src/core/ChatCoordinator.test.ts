/**
 * ChatCoordinator Tests
 * 
 * Tests for multi-chat coordination and task distribution.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Coordinate multiple Claude chat sessions working on
 * different parts of a large project concurrently.
 * 
 * Responsibilities:
 * - Chat session registration
 * - Task assignment to chats
 * - Work distribution and load balancing  
 * - Progress tracking across chats
 * - Crash detection and recovery
 * - Result aggregation
 */

import { ChatCoordinator, CoordinatorConfig, ChatSession, Task, TaskStatus } from './ChatCoordinator';
import { WorkerRegistry } from './WorkerRegistry';
import { MessageBusWrapper } from './MessageBusWrapper';
import { RedisConnectionManager } from './RedisConnectionManager';

describe('ChatCoordinator', () => {
  let coordinator: ChatCoordinator;
  let registry: WorkerRegistry;
  let messageBus: MessageBusWrapper;
  let redisManager: RedisConnectionManager;
  
  beforeEach(async () => {
    // Set up test Redis
    redisManager = new RedisConnectionManager({
      host: 'localhost',
      port: 6379,
      db: 1,
      keyPrefix: 'shim:test:',
      lazyConnect: true,
    });
    
    await redisManager.connect();
    
    // Clear test database
    const client = redisManager.getClient();
    await client.flushdb();
    
    // Initialize components
    registry = new WorkerRegistry(redisManager);
    messageBus = new MessageBusWrapper(redisManager);
    
    coordinator = new ChatCoordinator({
      registry,
      messageBus,
      maxConcurrentChats: 5
    });
  });
  
  afterEach(async () => {
    await coordinator.stop();
    await messageBus.cleanup();
    await registry.cleanup();
    await redisManager.disconnect();
  });
  
  describe('Construction', () => {
    it('should create ChatCoordinator instance', () => {
      expect(coordinator).toBeInstanceOf(ChatCoordinator);
    });
    
    it('should accept configuration', () => {
      const config = coordinator.getConfig();
      
      expect(config.maxConcurrentChats).toBe(5);
    });
    
    it('should validate configuration', () => {
      expect(() => {
        new ChatCoordinator({
          registry,
          messageBus,
          maxConcurrentChats: 0  // Invalid
        });
      }).toThrow();
    });
  });
  
  describe('Chat Session Management', () => {
    it('should register a new chat session', async () => {
      const session = await coordinator.registerChat('chat-001');
      
      expect(session.chatId).toBe('chat-001');
      expect(session.status).toBe('idle');
    });
    
    it('should list all registered chats', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      const chats = await coordinator.listChats();
      
      expect(chats.length).toBe(2);
    });
    
    it('should unregister a chat session', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.unregisterChat('chat-001');
      
      const chats = await coordinator.listChats();
      expect(chats.length).toBe(0);
    });
    
    it('should enforce max concurrent chats', async () => {
      // Register max chats
      for (let i = 1; i <= 5; i++) {
        await coordinator.registerChat(`chat-00${i}`);
      }
      
      // Try to register one more
      await expect(
        coordinator.registerChat('chat-006')
      ).rejects.toThrow('Maximum concurrent chats reached');
    });
  });
  
  describe('Task Distribution', () => {
    it('should assign task to available chat', async () => {
      await coordinator.registerChat('chat-001');
      
      const task: Task = {
        id: 'task-001',
        type: 'code_review',
        priority: 1,
        data: { file: 'src/test.ts' }
      };
      
      const assigned = await coordinator.assignTask(task);
      
      expect(assigned.chatId).toBe('chat-001');
      expect(assigned.status).toBe('assigned');
    });
    
    it('should distribute tasks across multiple chats', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      await coordinator.registerChat('chat-003');
      
      const tasks: Task[] = [
        { id: 'task-001', type: 'code_review', priority: 1, data: {} },
        { id: 'task-002', type: 'refactor', priority: 1, data: {} },
        { id: 'task-003', type: 'test_write', priority: 1, data: {} },
      ];
      
      const assignments = await Promise.all(
        tasks.map(t => coordinator.assignTask(t))
      );
      
      // Should distribute across chats (not all to same chat)
      const chatIds = new Set(assignments.map(a => a.chatId));
      expect(chatIds.size).toBeGreaterThan(1);
    });
    
    it('should queue tasks when all chats busy', async () => {
      await coordinator.registerChat('chat-001');
      
      // Assign task (chat now busy)
      await coordinator.assignTask({
        id: 'task-001',
        type: 'code_review',
        priority: 1,
        data: {}
      });
      
      // Assign second task (should queue)
      const queued = await coordinator.assignTask({
        id: 'task-002',
        type: 'refactor',
        priority: 1,
        data: {}
      });
      
      expect(queued.status).toBe('queued');
    });
    
    it('should respect task priority', async () => {
      await coordinator.registerChat('chat-001');
      
      const lowPriority: Task = {
        id: 'task-low',
        type: 'code_review',
        priority: 3,
        data: {}
      };
      
      const highPriority: Task = {
        id: 'task-high',
        type: 'critical_fix',
        priority: 1,
        data: {}
      };
      
      // Queue both (chat busy)
      await coordinator.assignTask(lowPriority);
      await coordinator.assignTask(highPriority);
      
      const queue = await coordinator.getTaskQueue();
      
      // High priority should be first
      expect(queue[0].id).toBe('task-high');
    });
  });
  
  describe('Progress Tracking', () => {
    it('should track task progress', async () => {
      await coordinator.registerChat('chat-001');
      
      const task: Task = {
        id: 'task-001',
        type: 'code_review',
        priority: 1,
        data: {}
      };
      
      await coordinator.assignTask(task);
      
      await coordinator.updateTaskProgress('task-001', {
        status: 'in_progress',
        progress: 0.5,
        message: 'Reviewing file 1 of 2'
      });
      
      const status = await coordinator.getTaskStatus('task-001');
      
      expect(status?.status).toBe('in_progress');
      expect(status?.progress).toBe(0.5);
    });
    
    it('should mark task as complete', async () => {
      await coordinator.registerChat('chat-001');
      
      const task: Task = {
        id: 'task-001',
        type: 'code_review',
        priority: 1,
        data: {}
      };
      
      await coordinator.assignTask(task);
      
      await coordinator.completeTask('task-001', {
        success: true,
        result: { issues: [] }
      });
      
      const status = await coordinator.getTaskStatus('task-001');
      
      expect(status?.status).toBe('completed');
    });
    
    it('should get overall progress summary', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Assign some tasks
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't3', type: 'review', priority: 1, data: {} });
      
      // Complete one
      await coordinator.completeTask('t1', { success: true, result: {} });
      
      const summary = await coordinator.getProgressSummary();
      
      expect(summary.totalTasks).toBe(3);
      expect(summary.completedTasks).toBe(1);
      expect(summary.inProgressTasks).toBe(2);
    });
  });
  
  describe('Crash Detection & Recovery', () => {
    it('should detect crashed chat sessions', async () => {
      await coordinator.registerChat('chat-001');
      
      // Simulate crash (no heartbeat)
      await new Promise(resolve => setTimeout(resolve, 35000)); // > 30s timeout
      
      const crashed = await coordinator.getCrashedChats();
      
      expect(crashed.length).toBe(1);
      expect(crashed[0].chatId).toBe('chat-001');
    });
    
    it('should reassign tasks from crashed chat', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Assign task to chat-001
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      
      // Simulate crash of chat-001
      // ... recovery should reassign to chat-002
      
      await coordinator.recoverCrashedTasks();
      
      const task = await coordinator.getTaskStatus('t1');
      expect(task?.chatId).toBe('chat-002');
    });
  });
  
  describe('Result Aggregation', () => {
    it('should aggregate results from multiple chats', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Assign and complete tasks
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: { file: 'a.ts' } });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: { file: 'b.ts' } });
      
      await coordinator.completeTask('t1', { success: true, result: { issues: 2 } });
      await coordinator.completeTask('t2', { success: true, result: { issues: 3 } });
      
      const aggregated = await coordinator.aggregateResults(['t1', 't2']);
      
      expect(aggregated.totalIssues).toBe(5);
    });
  });
  
  describe('Configuration Updates', () => {
    it('should update max concurrent chats', () => {
      coordinator.setMaxConcurrentChats(10);
      
      const config = coordinator.getConfig();
      expect(config.maxConcurrentChats).toBe(10);
    });
  });
});
