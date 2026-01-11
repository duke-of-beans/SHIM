/**
 * Redis Configuration
 * 
 * Configuration options for Redis connection
 */
export interface RedisConfig {
  // Connection
  host?: string;              // Default: localhost
  port?: number;              // Default: 6379
  password?: string;          // Optional auth
  db?: number;                // Database number (default: 0)
  
  // Reliability
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  
  // Performance
  lazyConnect?: boolean;
  keepAlive?: number;
}

/**
 * Connection Statistics
 * 
 * Runtime statistics about the Redis connection
 */
export interface ConnectionStats {
  connected: boolean;
  host: string;
  port: number;
  db: number;
  uptime?: number;          // Milliseconds since connection
  commandsSent?: number;
  commandsFailed?: number;
}
