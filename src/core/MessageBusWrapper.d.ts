/**
 * MessageBusWrapper
 *
 * Redis Pub/Sub wrapper for event broadcasting in SHIM multi-chat coordination.
 * Provides channel-based messaging and pattern subscriptions.
 */
import { RedisConnectionManager } from './RedisConnectionManager';
/**
 * Event structure for pub/sub
 */
export interface ProgressEvent {
    type: string;
    data: Record<string, unknown>;
    timestamp: number;
}
/**
 * Event handler callback
 */
export type EventHandler = (event: ProgressEvent, channel: string) => void | Promise<void>;
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
export declare class MessageBusWrapper {
    private connection;
    private publisher;
    private subscriber;
    private channelHandlers;
    private patternHandlers;
    private stats;
    /**
     * Create MessageBusWrapper
     *
     * @param connection - Redis connection manager
     */
    constructor(connection: RedisConnectionManager);
    /**
     * Setup Redis subscriber message handlers
     */
    private setupSubscriberHandlers;
    /**
     * Handle incoming message from channel
     */
    private handleMessage;
    /**
     * Handle incoming message from pattern subscription
     */
    private handlePatternMessage;
    /**
     * Publish event to single channel
     *
     * @param channel - Channel name
     * @param event - Event to publish
     * @returns Number of subscribers that received the message
     */
    publish(channel: string, event: ProgressEvent): Promise<number>;
    /**
     * Publish event to pattern-matching channels
     *
     * @param pattern - Channel pattern (e.g., "task:*")
     * @param event - Event to publish
     */
    publishToPattern(pattern: string, event: ProgressEvent): Promise<void>;
    /**
     * Subscribe to channel
     *
     * @param channel - Channel name
     * @param handler - Event handler callback
     */
    subscribe(channel: string, handler: EventHandler): Promise<void>;
    /**
     * Subscribe to pattern
     *
     * @param pattern - Channel pattern (e.g., "task:*")
     * @param handler - Event handler callback
     */
    psubscribe(pattern: string, handler: EventHandler): Promise<void>;
    /**
     * Unsubscribe from channel
     *
     * @param channel - Channel name
     */
    unsubscribe(channel: string): Promise<void>;
    /**
     * Unsubscribe from pattern
     *
     * @param pattern - Channel pattern
     */
    punsubscribe(pattern: string): Promise<void>;
    /**
     * Get subscriber count for channel
     *
     * @param channel - Channel name
     * @returns Number of active subscribers
     */
    getSubscriberCount(channel: string): Promise<number>;
    /**
     * Get event statistics
     *
     * @returns Event statistics object
     */
    getEventStats(): EventStats;
    /**
     * Close message bus and disconnect subscriber
     */
    close(): Promise<void>;
}
//# sourceMappingURL=MessageBusWrapper.d.ts.map