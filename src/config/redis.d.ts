/**
 * Redis Configuration for SHIM
 *
 * Default configuration for local development with Docker
 */
import type { RedisConfig } from '../models/Redis';
export declare const REDIS_CONFIG: RedisConfig;
/**
 * Test configuration (faster retries, shorter timeouts)
 */
export declare const REDIS_TEST_CONFIG: RedisConfig;
/**
 * Create a test Redis configuration with optional overrides
 */
export declare function createTestRedisConfig(overrides?: Partial<RedisConfig>): RedisConfig;
//# sourceMappingURL=redis.d.ts.map