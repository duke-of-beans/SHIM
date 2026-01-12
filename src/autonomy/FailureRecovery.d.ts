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
export declare class FailureRecovery {
    private config;
    private history;
    private consecutiveFailures;
    private circuitOpen;
    constructor(config?: RecoveryConfig);
    /**
     * Classify failure as transient or permanent
     */
    classifyFailure(error: Error): FailureType;
    /**
     * Calculate delay for retry attempt
     */
    calculateDelay(attemptNumber: number): number;
    /**
     * Execute operation with retry logic
     */
    executeWithRetry<T>(operation: () => Promise<T>, operationId?: string): Promise<T>;
    /**
     * Get recovery attempt history
     */
    getRecoveryHistory(): RecoveryAttempt[];
    /**
     * Get recovery statistics
     */
    getStatistics(): RecoveryStatistics;
    /**
     * Check if circuit breaker is open
     */
    isCircuitOpen(): boolean;
    /**
     * Record recovery attempt
     */
    private recordAttempt;
    /**
     * Check and update circuit breaker state
     */
    private checkCircuitBreaker;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}
//# sourceMappingURL=FailureRecovery.d.ts.map