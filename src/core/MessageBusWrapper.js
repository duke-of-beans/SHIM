"use strict";
/**
 * MessageBusWrapper
 *
 * Redis Pub/Sub wrapper for event broadcasting in SHIM multi-chat coordination.
 * Provides channel-based messaging and pattern subscriptions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBusWrapper = void 0;
/**
 * MessageBusWrapper
 *
 * Wraps Redis Pub/Sub for SHIM event broadcasting.
 * Supports channel subscriptions and pattern matching.
 */
class MessageBusWrapper {
    connection;
    publisher;
    subscriber;
    // Handler maps
    channelHandlers = new Map();
    patternHandlers = new Map();
    // Statistics
    stats = {
        published: 0,
        delivered: 0,
        failed: 0
    };
    /**
     * Create MessageBusWrapper
     *
     * @param connection - Redis connection manager
     */
    constructor(connection) {
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
    setupSubscriberHandlers() {
        // Handle channel messages
        this.subscriber.on('message', (channel, message) => {
            void this.handleMessage(channel, message, false);
        });
        // Handle pattern messages
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            void this.handlePatternMessage(pattern, channel, message);
        });
    }
    /**
     * Handle incoming message from channel
     */
    async handleMessage(channel, message, _isPattern) {
        try {
            const event = JSON.parse(message);
            const handlers = this.channelHandlers.get(channel);
            if (handlers && handlers.size > 0) {
                for (const handler of handlers) {
                    try {
                        await handler(event, channel);
                        this.stats.delivered++;
                    }
                    catch (error) {
                        this.stats.failed++;
                        console.error(`Handler error for channel ${channel}:`, error);
                    }
                }
            }
        }
        catch (error) {
            this.stats.failed++;
            console.error(`Failed to parse message on channel ${channel}:`, error);
        }
    }
    /**
     * Handle incoming message from pattern subscription
     */
    async handlePatternMessage(pattern, channel, message) {
        try {
            const event = JSON.parse(message);
            const handlers = this.patternHandlers.get(pattern);
            if (handlers && handlers.size > 0) {
                for (const handler of handlers) {
                    try {
                        await handler(event, channel);
                        this.stats.delivered++;
                    }
                    catch (error) {
                        this.stats.failed++;
                        console.error(`Handler error for pattern ${pattern}:`, error);
                    }
                }
            }
        }
        catch (error) {
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
    async publish(channel, event) {
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
    async publishToPattern(pattern, event) {
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
    async subscribe(channel, handler) {
        // Add handler to map
        if (!this.channelHandlers.has(channel)) {
            this.channelHandlers.set(channel, new Set());
            // Subscribe to channel in Redis
            await this.subscriber.subscribe(channel);
        }
        this.channelHandlers.get(channel).add(handler);
    }
    /**
     * Subscribe to pattern
     *
     * @param pattern - Channel pattern (e.g., "task:*")
     * @param handler - Event handler callback
     */
    async psubscribe(pattern, handler) {
        // Add handler to map
        if (!this.patternHandlers.has(pattern)) {
            this.patternHandlers.set(pattern, new Set());
            // Subscribe to pattern in Redis
            await this.subscriber.psubscribe(pattern);
        }
        this.patternHandlers.get(pattern).add(handler);
    }
    /**
     * Unsubscribe from channel
     *
     * @param channel - Channel name
     */
    async unsubscribe(channel) {
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
    async punsubscribe(pattern) {
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
    async getSubscriberCount(channel) {
        const count = await this.publisher.pubsub('NUMSUB', channel);
        // Redis returns [channel, count] array
        return count[1] || 0;
    }
    /**
     * Get event statistics
     *
     * @returns Event statistics object
     */
    getEventStats() {
        return { ...this.stats };
    }
    /**
     * Close message bus and disconnect subscriber
     */
    async close() {
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
exports.MessageBusWrapper = MessageBusWrapper;
//# sourceMappingURL=MessageBusWrapper.js.map