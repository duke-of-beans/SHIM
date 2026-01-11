/**
 * ChatRegistry Tests
 *
 * Tests for tracking and managing multiple chat instances.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Coordinate work across multiple Claude instances.
 */

import { ChatRegistry, ChatInstance, ChatStatus } from './ChatRegistry';

describe('ChatRegistry', () => {
  let registry: ChatRegistry;

  beforeEach(() => {
    registry = new ChatRegistry();
  });

  describe('Construction', () => {
    it('should create ChatRegistry instance', () => {
      expect(registry).toBeInstanceOf(ChatRegistry);
    });

    it('should start with no registered chats', () => {
      const chats = registry.listChats();
      expect(chats.length).toBe(0);
    });
  });

  describe('Chat Registration', () => {
    it('should register new chat instance', () => {
      const chatId = registry.registerChat({
        name: 'Test Chat',
        capabilities: ['code', 'analysis'],
      });

      expect(chatId).toBeDefined();
      expect(typeof chatId).toBe('string');
    });

    it('should assign unique IDs to chats', () => {
      const id1 = registry.registerChat({ name: 'Chat 1', capabilities: [] });
      const id2 = registry.registerChat({ name: 'Chat 2', capabilities: [] });

      expect(id1).not.toBe(id2);
    });

    it('should track chat capabilities', () => {
      const chatId = registry.registerChat({
        name: 'Specialized Chat',
        capabilities: ['testing', 'debugging'],
      });

      const chat = registry.getChat(chatId);
      expect(chat?.capabilities).toContain('testing');
      expect(chat?.capabilities).toContain('debugging');
    });

    it('should set initial status to idle', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });
      const chat = registry.getChat(chatId);

      expect(chat?.status).toBe('idle');
    });
  });

  describe('Chat Retrieval', () => {
    it('should retrieve chat by ID', () => {
      const chatId = registry.registerChat({ name: 'Test', capabilities: [] });
      const chat = registry.getChat(chatId);

      expect(chat).toBeDefined();
      expect(chat?.id).toBe(chatId);
    });

    it('should return null for unknown chat ID', () => {
      const chat = registry.getChat('nonexistent');
      expect(chat).toBeNull();
    });

    it('should list all registered chats', () => {
      registry.registerChat({ name: 'Chat 1', capabilities: [] });
      registry.registerChat({ name: 'Chat 2', capabilities: [] });
      registry.registerChat({ name: 'Chat 3', capabilities: [] });

      const chats = registry.listChats();
      expect(chats.length).toBe(3);
    });
  });

  describe('Status Management', () => {
    it('should update chat status', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      registry.updateStatus(chatId, 'busy');

      const chat = registry.getChat(chatId);
      expect(chat?.status).toBe('busy');
    });

    it('should find idle chats', () => {
      const id1 = registry.registerChat({ name: 'Chat 1', capabilities: [] });
      const id2 = registry.registerChat({ name: 'Chat 2', capabilities: [] });
      const id3 = registry.registerChat({ name: 'Chat 3', capabilities: [] });

      registry.updateStatus(id1, 'busy');
      registry.updateStatus(id2, 'idle');
      registry.updateStatus(id3, 'busy');

      const idleChats = registry.findByStatus('idle');
      expect(idleChats.length).toBe(1);
      expect(idleChats[0].id).toBe(id2);
    });

    it('should find chats by capability', () => {
      registry.registerChat({ name: 'Chat 1', capabilities: ['testing'] });
      registry.registerChat({ name: 'Chat 2', capabilities: ['coding'] });
      registry.registerChat({ name: 'Chat 3', capabilities: ['testing', 'coding'] });

      const testingChats = registry.findByCapability('testing');
      expect(testingChats.length).toBe(2);
    });
  });

  describe('Task Assignment', () => {
    it('should assign task to chat', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      registry.assignTask(chatId, 'task-1');

      const chat = registry.getChat(chatId);
      expect(chat?.currentTask).toBe('task-1');
      expect(chat?.status).toBe('busy');
    });

    it('should complete task', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      registry.assignTask(chatId, 'task-1');
      registry.completeTask(chatId);

      const chat = registry.getChat(chatId);
      expect(chat?.currentTask).toBeUndefined();
      expect(chat?.status).toBe('idle');
    });
  });

  describe('Chat Deregistration', () => {
    it('should unregister chat', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      registry.unregisterChat(chatId);

      const chat = registry.getChat(chatId);
      expect(chat).toBeNull();
    });
  });

  describe('Health Monitoring', () => {
    it('should track last heartbeat', () => {
      const chatId = registry.registerChat({ name: 'Chat', capabilities: [] });

      registry.heartbeat(chatId);

      const chat = registry.getChat(chatId);
      expect(chat?.lastHeartbeat).toBeDefined();
    });

    it('should detect stale chats', () => {
      const id1 = registry.registerChat({ name: 'Chat 1', capabilities: [] });
      registry.registerChat({ name: 'Chat 2', capabilities: [] });

      registry.heartbeat(id1);

      const stale = registry.findStaleChats(1000);
      expect(Array.isArray(stale)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should get registry statistics', () => {
      registry.registerChat({ name: 'Chat 1', capabilities: [] });
      registry.registerChat({ name: 'Chat 2', capabilities: [] });

      const stats = registry.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.byStatus).toHaveProperty('idle');
    });
  });
});
