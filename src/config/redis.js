/**
 * Redis Configuration for SHIM
 *
 * Default configuration for local development with Docker
 */
export const REDIS_CONFIG = {
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
export const REDIS_TEST_CONFIG = {
    ...REDIS_CONFIG,
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
export function createTestRedisConfig(overrides) {
    return {
        ...REDIS_TEST_CONFIG,
        ...overrides,
    };
}
//# sourceMappingURL=redis.js.map