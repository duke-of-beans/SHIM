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
  keyPrefix?: string;         // Optional key prefix for namespacing
  
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

/**
 * Worker Status
 * 
 * Current operational status of a worker
 */
export type WorkerStatus = 'idle' | 'busy';

/**
 * Worker Health
 * 
 * Health status based on heartbeat monitoring
 */
export type WorkerHealth = 'healthy' | 'degraded' | 'crashed';

/**
 * Worker Information
 * 
 * Complete worker registration and status data
 */
export interface WorkerInfo {
  workerId: string;            // Unique worker identifier
  chatId: string;              // Associated chat session ID
  status: WorkerStatus;        // Current operational status
  health: WorkerHealth;        // Health based on heartbeat
  registeredAt: number;        // Timestamp of registration (ms since epoch)
  lastHeartbeat: number;       // Timestamp of last heartbeat (ms since epoch)
  currentTask?: string;        // Optional current task ID
}
