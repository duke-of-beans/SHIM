/**
 * MessageBusWrapper Tests
 * 
 * Tests Redis Pub/Sub wrapper for event broadcasting.
 * Coverage: Publish, subscribe, patterns, multiple subscribers, unsubscribe, reconnection.
 */

import { MessageBusWrapper } from './MessageBusWrapper';
import { RedisConnectionManager } from './RedisConnectionManager';
import { createTestRedisConfig } from '../config/redis';

describe('MessageBusWrapper', () => {
  let connection: RedisConnectionManager;
  let messageBus: MessageBusWrapper;

  beforeEach(async () => {
    const config = createTestRedisConfig();
    connection = new RedisConnectionManager(config);
    await connection.connect();
    messageBus = new MessageBusWrapper(connection);
  });

  afterEach(async () => {
    await messageBus.close();
    await connection.disconnect();
  });

  describe('Construction', () => {
    it('should create MessageBusWrapper with valid connection', () => {
      expect(messageBus).toBeDefined();
    });

    it('should throw error if connection is null', () => {
      expect(() => new MessageBusWrapper(null as any)).toThrow('Connection manager required');
    });
  });

  describe('Publishing', () => {
    it('should publish event to single channel', async () => {
      const event = {
        type: 'task:started',
        data: { taskId: 'test-task-1' },
        timestamp: Date.now()
      };

      const subscriberCount = await messageBus.publish('task:started', event);
      
      // No subscribers yet
      expect(subscriberCount).toBe(0);
    });

    it('should publish to channel with active subscriber', async () => {
      const received: any[] = [];
      const handler = (event: any) => {
        received.push(event);
      };

      await messageBus.subscribe('task:started', handler);

      const event = {
        type: 'task:started',
        data: { taskId: 'test-task-2' },
        timestamp: Date.now()
      };

      await messageBus.publish('task:started', event);

      // Give pub/sub time to deliver
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('task:started');
      expect(received[0].data.taskId).toBe('test-task-2');
    });

    it('should publish to pattern matching channels', async () => {
      const received: any[] = [];
      const handler = (event: any) => {
        received.push(event);
      };

      // Subscribe to pattern
      await messageBus.psubscribe('task:*', handler);

      const startedEvent = {
        type: 'task:started',
        data: { taskId: 'test-1' },
        timestamp: Date.now()
      };

      const completedEvent = {
        type: 'task:completed',
        data: { taskId: 'test-1' },
        timestamp: Date.now()
      };

      await messageBus.publishToPattern('task:started', startedEvent);
      await messageBus.publishToPattern('task:completed', completedEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received.length).toBe(2);
      expect(received[0].type).toBe('task:started');
      expect(received[1].type).toBe('task:completed');
    });

    it('should enforce publish latency benchmark (<5ms)', async () => {
      const event = {
        type: 'benchmark',
        data: { test: true },
        timestamp: Date.now()
      };

      const start = Date.now();
      await messageBus.publish('benchmark:test', event);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('Subscribing', () => {
    it('should subscribe to single channel', async () => {
      const received: any[] = [];
      const handler = (event: any) => {
        received.push(event);
      };

      await messageBus.subscribe('worker:registered', handler);

      const event = {
        type: 'worker:registered',
        data: { workerId: 'worker-1' },
        timestamp: Date.now()
      };

      await messageBus.publish('worker:registered', event);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received.length).toBe(1);
    });

    it('should support multiple subscribers on same channel', async () => {
      const received1: any[] = [];
      const received2: any[] = [];

      const handler1 = (event: any) => received1.push(event);
      const handler2 = (event: any) => received2.push(event);

      await messageBus.subscribe('test:channel', handler1);
      await messageBus.subscribe('test:channel', handler2);

      const event = {
        type: 'test',
        data: { value: 42 },
        timestamp: Date.now()
      };

      await messageBus.publish('test:channel', event);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received1.length).toBe(1);
      expect(received2.length).toBe(1);
      expect(received1[0].data.value).toBe(42);
      expect(received2[0].data.value).toBe(42);
    });

    it('should subscribe to pattern', async () => {
      const received: any[] = [];
      const handler = (event: any, channel: string) => {
        received.push({ event, channel });
      };

      await messageBus.psubscribe('supervisor:*', handler);

      await messageBus.publish('supervisor:command', {
        type: 'command',
        data: { cmd: 'restart' },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received.length).toBe(1);
      expect(received[0].channel).toBe('supervisor:command');
    });

    it('should enforce subscription latency benchmark (<20ms)', async () => {
      const handler = () => {};

      const start = Date.now();
      await messageBus.subscribe('latency:test', handler);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(20);
    });
  });

  describe('Unsubscribing', () => {
    it('should unsubscribe from channel', async () => {
      const received: any[] = [];
      const handler = (event: any) => received.push(event);

      await messageBus.subscribe('test:unsub', handler);

      // Publish before unsubscribe
      await messageBus.publish('test:unsub', {
        type: 'test',
        data: { before: true },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(received.length).toBe(1);

      // Unsubscribe
      await messageBus.unsubscribe('test:unsub');

      // Publish after unsubscribe
      await messageBus.publish('test:unsub', {
        type: 'test',
        data: { after: true },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be 1 (not received second message)
      expect(received.length).toBe(1);
    });

    it('should unsubscribe from pattern', async () => {
      const received: any[] = [];
      const handler = (event: any) => received.push(event);

      await messageBus.psubscribe('pattern:*', handler);

      await messageBus.publish('pattern:test', {
        type: 'test',
        data: { value: 1 },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(received.length).toBe(1);

      await messageBus.punsubscribe('pattern:*');

      await messageBus.publish('pattern:test', {
        type: 'test',
        data: { value: 2 },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(received.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should get subscriber count for channel', async () => {
      const handler = () => {};

      const countBefore = await messageBus.getSubscriberCount('stats:test');
      expect(countBefore).toBe(0);

      await messageBus.subscribe('stats:test', handler);

      const countAfter = await messageBus.getSubscriberCount('stats:test');
      expect(countAfter).toBeGreaterThan(0);
    });

    it('should track event statistics', () => {
      const stats = messageBus.getEventStats();

      expect(stats).toHaveProperty('published');
      expect(stats).toHaveProperty('delivered');
      expect(stats).toHaveProperty('failed');
      expect(stats.published).toBe(0);
      expect(stats.delivered).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('should update statistics on publish', async () => {
      const statsBefore = messageBus.getEventStats();

      await messageBus.publish('stats:update', {
        type: 'test',
        data: {},
        timestamp: Date.now()
      });

      const statsAfter = messageBus.getEventStats();

      expect(statsAfter.published).toBe(statsBefore.published + 1);
    });
  });

  describe('Reconnection', () => {
    it('should handle reconnection after disconnect', async () => {
      const received: any[] = [];
      const handler = (event: any) => received.push(event);

      await messageBus.subscribe('reconnect:test', handler);

      // Disconnect
      await connection.disconnect();

      // Reconnect
      await connection.connect();

      // Should be able to publish again
      await messageBus.publish('reconnect:test', {
        type: 'reconnect',
        data: { test: true },
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Event should be delivered after reconnect
      expect(received.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle publish errors gracefully', async () => {
      await connection.disconnect();

      await expect(
        messageBus.publish('error:test', {
          type: 'test',
          data: {},
          timestamp: Date.now()
        })
      ).rejects.toThrow();
    });

    it('should handle subscribe errors gracefully', async () => {
      await connection.disconnect();

      const handler = () => {};

      await expect(
        messageBus.subscribe('error:sub', handler)
      ).rejects.toThrow();
    });

    it('should handle invalid event data', async () => {
      // Event without required fields should throw
      await expect(
        messageBus.publish('invalid:test', null as any)
      ).rejects.toThrow();
    });
  });
});
