/**
 * FailureRecovery
 *
 * Intelligent failure handling with retry strategies.
 * Supports exponential backoff, linear backoff, and fixed intervals.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 6/8
 */

export type RetryStrategy = 'exponential' | 'linear' | 'fixed';
export type FailureType = 'transient' | 'permanent';

export interface RecoveryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  strategy?: RetryStrategy;
  jitter?: boolean;
  circuitBreakerThreshold?: number;
}

export interface RecoveryAttempt {
  operationId: string;
  timestamp: Date;
  attemptCount: number;
  succeeded: boolean;
  error?: Error;
}

export interface RecoveryStatistics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  totalRetries: number;
}

export class FailureRecovery {
  private config: Required<RecoveryConfig>;
  private history: RecoveryAttempt[];
  private consecutiveFailures: number;
  private circuitOpen: boolean;

  constructor(config: RecoveryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      strategy: config.strategy ?? 'exponential',
      jitter: config.jitter ?? false,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
    };

    this.history = [];
    this.consecutiveFailures = 0;
    this.circuitOpen = false;
  }

  /**
   * Classify failure as transient or permanent
   */
  classifyFailure(error: Error): FailureType {
    const message = error.message.toLowerCase();

    // Permanent failure indicators
    const permanentKeywords = [
      'invalid credentials',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'invalid',
    ];

    for (const keyword of permanentKeywords) {
      if (message.includes(keyword)) {
        return 'permanent';
      }
    }

    // Default to transient (network issues, timeouts, etc.)
    return 'transient';
  }

  /**
   * Calculate delay for retry attempt
   */
  calculateDelay(attemptNumber: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case 'exponential':
        delay = this.config.initialDelayMs * Math.pow(2, attemptNumber - 1);
        break;
      case 'linear':
        delay = this.config.initialDelayMs * attemptNumber;
        break;
      case 'fixed':
        delay = this.config.initialDelayMs;
        break;
    }

    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelayMs);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterRange = delay * 0.5; // ±50%
      const jitterAmount = (Math.random() * 2 - 1) * jitterRange;
      delay = Math.max(0, delay + jitterAmount);
    }

    return delay;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string = 'unnamed-operation'
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open - too many consecutive failures');
    }

    let lastError: any;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      attemptCount++;

      try {
        const result = await operation();

        // Success - record and reset circuit breaker
        this.recordAttempt(operationId, attemptCount, true);
        this.consecutiveFailures = 0;
        this.circuitOpen = false;

        return result;
      } catch (error) {
        lastError = error;

        // Classify failure
        const failureType = this.classifyFailure(
          error instanceof Error ? error : new Error(String(error))
        );

        // Don't retry permanent failures
        if (failureType === 'permanent') {
          this.recordAttempt(operationId, attemptCount, false, error as Error);
          this.consecutiveFailures++;
          this.checkCircuitBreaker();
          throw error;
        }

        // If this was the last retry, give up
        if (attempt === this.config.maxRetries) {
          this.recordAttempt(operationId, attemptCount, false, error as Error);
          this.consecutiveFailures++;
          this.checkCircuitBreaker();
          throw error;
        }

        // Wait before retrying (transient failures only)
        const delay = this.calculateDelay(attempt + 1);
        await this.sleep(delay);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
  }

  /**
   * Get recovery attempt history
   */
  getRecoveryHistory(): RecoveryAttempt[] {
    return [...this.history];
  }

  /**
   * Get recovery statistics
   */
  getStatistics(): RecoveryStatistics {
    const totalOperations = this.history.length;
    const successfulOperations = this.history.filter((r) => r.succeeded).length;
    const failedOperations = totalOperations - successfulOperations;
    const successRate = totalOperations > 0 ? successfulOperations / totalOperations : 0;
    const totalRetries = this.history.reduce((sum, r) => sum + (r.attemptCount - 1), 0);

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate,
      totalRetries,
    };
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(): boolean {
    return this.circuitOpen;
  }

  /**
   * Record recovery attempt
   */
  private recordAttempt(
    operationId: string,
    attemptCount: number,
    succeeded: boolean,
    error?: Error
  ): void {
    this.history.push({
      operationId,
      timestamp: new Date(),
      attemptCount,
      succeeded,
      error,
    });
  }

  /**
   * Check and update circuit breaker state
   */
  private checkCircuitBreaker(): void {
    if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.circuitOpen = true;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
