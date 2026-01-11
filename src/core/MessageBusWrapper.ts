/**
 * MessageBusWrapper
 * 
 * Redis Pub/Sub wrapper for event broadcasting in SHIM multi-chat coordination.
 * Provides channel-based messaging and pattern subscriptions.
 */

import { Redis } from 'ioredis';
import { RedisConnectionManager } from './RedisConnectionManager';

/**
 * Event structure for pub/sub
 */
export interface ProgressEvent {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * Event handler callback
 */
export type EventHandler = (
  event: ProgressEvent,
  channel: string
) => void | Promise<void>;

/**
 * Event statistics
 */
export interface EventStats {
  published: number;
  delivered: number;
  failed: number;
}

/**
 * MessageBusWrapper
 * 
 * Wraps Redis Pub/Sub for SHIM event broadcasting.
 * Supports channel subscriptions and pattern matching.
 */
export class MessageBusWrapper {
  private connection: RedisConnectionManager;
  private publisher: Redis;
  private subscriber: Redis;
  
  // Handler maps
  private channelHandlers: Map<string, Set<EventHandler>> = new Map();
  private patternHandlers: Map<string, Set<EventHandler>> = new Map();
  
  // Statistics
  private stats: EventStats = {
    published: 0,
    delivered: 0,
    failed: 0
  };

  /**
   * Create MessageBusWrapper
   * 
   * @param connection - Redis connection manager
   */
  constructor(connection: RedisConnectionManager) {
    if (!connection) {
      throw new Error('Connection manager required');
    }

    this.connection = connection;
    this.publisher = connection.getClient();
    this.subscriber = connection.getClient().duplicate();

    // Set up subscriber message handlers
    this.setupSubscriberHandlers();
  }

  /**
   * Setup Redis subscriber message handlers
   */
  private setupSubscriberHandlers(): void {
    // Handle channel messages
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message, false);
    });

    // Handle pattern messages
    this.subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      this.handlePatternMessage(pattern, channel, message);
    });
  }

  /**
   * Handle incoming message from channel
   */
  private async handleMessage(channel: string, message: string, isPattern: boolean): Promise<void> {
    try {
      const event: ProgressEvent = JSON.parse(message);
      const handlers = this.channelHandlers.get(channel);

      if (handlers && handlers.size > 0) {
        for (const handler of handlers) {
          try {
            await handler(event, channel);
            this.stats.delivered++;
          } catch (error) {
            this.stats.failed++;
            console.error(`Handler error for channel ${channel}:`, error);
          }
        }
      }
    } catch (error) {
      this.stats.failed++;
      console.error(`Failed to parse message on channel ${channel}:`, error);
    }
  }

  /**
   * Handle incoming message from pattern subscription
   */
  private async handlePatternMessage(pattern: string, channel: string, message: string): Promise<void> {
    try {
      const event: ProgressEvent = JSON.parse(message);
      const handlers = this.patternHandlers.get(pattern);

      if (handlers && handlers.size > 0) {
        for (const handler of handlers) {
          try {
            await handler(event, channel);
            this.stats.delivered++;
          } catch (error) {
            this.stats.failed++;
            console.error(`Handler error for pattern ${pattern}:`, error);
          }
        }
      }
    } catch (error) {
      this.stats.failed++;
      console.error(`Failed to parse pattern message ${pattern}:`, error);
    }
  }

  /**
   * Publish event to single channel
   * 
   * @param channel - Channel name
   * @param event - Event to publish
   * @returns Number of subscribers that received the message
   */
  async publish(channel: string, event: ProgressEvent): Promise<number> {
    if (!event) {
      throw new Error('Event required for publish');
    }

    const message = JSON.stringify(event);
    const subscriberCount = await this.publisher.publish(channel, message);
    
    this.stats.published++;
    
    return subscriberCount;
  }

  /**
   * Publish event to pattern-matching channels
   * 
   * @param pattern - Channel pattern (e.g., "task:*")
   * @param event - Event to publish
   */
  async publishToPattern(pattern: string, event: ProgressEvent): Promise<void> {
    if (!event) {
      throw new Error('Event required for publish');
    }

    // Redis doesn't support publishing to patterns directly
    // We publish to the specific channel that matches the pattern
    const message = JSON.stringify(event);
    await this.publisher.publish(pattern, message);
    
    this.stats.published++;
  }

  /**
   * Subscribe to channel
   * 
   * @param channel - Channel name
   * @param handler - Event handler callback
   */
  async subscribe(channel: string, handler: EventHandler): Promise<void> {
    // Add handler to map
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
      
      // Subscribe to channel in Redis
      await this.subscriber.subscribe(channel);
    }

    this.channelHandlers.get(channel)!.add(handler);
  }

  /**
   * Subscribe to pattern
   * 
   * @param pattern - Channel pattern (e.g., "task:*")
   * @param handler - Event handler callback
   */
  async psubscribe(pattern: string, handler: EventHandler): Promise<void> {
    // Add handler to map
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, new Set());
      
      // Subscribe to pattern in Redis
      await this.subscriber.psubscribe(pattern);
    }

    this.patternHandlers.get(pattern)!.add(handler);
  }

  /**
   * Unsubscribe from channel
   * 
   * @param channel - Channel name
   */
  async unsubscribe(channel: string): Promise<void> {
    // Remove all handlers for channel
    this.channelHandlers.delete(channel);
    
    // Unsubscribe from channel in Redis
    await this.subscriber.unsubscribe(channel);
  }

  /**
   * Unsubscribe from pattern
   * 
   * @param pattern - Channel pattern
   */
  async punsubscribe(pattern: string): Promise<void> {
    // Remove all handlers for pattern
    this.patternHandlers.delete(pattern);
    
    // Unsubscribe from pattern in Redis
    await this.subscriber.punsubscribe(pattern);
  }

  /**
   * Get subscriber count for channel
   * 
   * @param channel - Channel name
   * @returns Number of active subscribers
   */
  async getSubscriberCount(channel: string): Promise<number> {
    const count = await this.publisher.pubsub('NUMSUB', channel);
    
    // Redis returns [channel, count] array
    return count[1] as number || 0;
  }

  /**
   * Get event statistics
   * 
   * @returns Event statistics object
   */
  getEventStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * Close message bus and disconnect subscriber
   */
  async close(): Promise<void> {
    // Unsubscribe from all channels
    const channels = Array.from(this.channelHandlers.keys());
    if (channels.length > 0) {
      await this.subscriber.unsubscribe(...channels);
    }

    // Unsubscribe from all patterns
    const patterns = Array.from(this.patternHandlers.keys());
    if (patterns.length > 0) {
      await this.subscriber.punsubscribe(...patterns);
    }

    // Clear handler maps
    this.channelHandlers.clear();
    this.patternHandlers.clear();

    // Disconnect subscriber
    await this.subscriber.quit();
  }
}
