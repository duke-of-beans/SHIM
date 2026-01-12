"use strict";
/**
 * Redis Configuration for SHIM
 *
 * Default configuration for local development with Docker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_TEST_CONFIG = exports.REDIS_CONFIG = void 0;
exports.createTestRedisConfig = createTestRedisConfig;
exports.REDIS_CONFIG = {
    // Connection (matches docker-compose.yml)
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    // Optional auth (for production)
    password: process.env.REDIS_PASSWORD,
    // Reliability
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000); // Max 3 second delay
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // Performance
    lazyConnect: false, // Connect immediately
    keepAlive: 30000, // 30 seconds
};
/**
 * Test configuration (faster retries, shorter timeouts)
 */
exports.REDIS_TEST_CONFIG = {
    ...exports.REDIS_CONFIG,
    retryStrategy: (times) => {
        if (times > 3)
            return null; // Give up after 3 tries
        return Math.min(times * 50, 500); // Max 500ms delay
    },
    maxRetriesPerRequest: 3,
};
/**
 * Create a test Redis configuration with optional overrides
 */
function createTestRedisConfig(overrides) {
    return {
        ...exports.REDIS_TEST_CONFIG,
        ...overrides,
    };
}
//# sourceMappingURL=redis.js.map