/**
 * SignalCollector - TDD Implementation
 *
 * Tracks observable signals for crash prediction
 * Spec: docs/specs/SPEC_CRASH_PREVENTION.md
 * Performance Target: <5ms overhead per operation
 */
import type { CrashSignals, CrashRisk } from '../models/Checkpoint';
export type { CrashSignals, CrashRisk };
interface RiskThresholds {
    warningZone: {
        contextWindowUsage: number;
        messageCount: number;
        sessionDuration: number;
        toolCallsSinceCheckpoint: number;
        toolFailureRate: number;
    };
    dangerZone: {
        contextWindowUsage: number;
        messageCount: number;
        sessionDuration: number;
        toolCallsSinceCheckpoint: number;
        toolFailureRate: number;
    };
}
export declare class SignalCollector {
    private thresholds;
    private encoder;
    private messageCount;
    private toolCallCount;
    private toolCallsSinceCheckpoint;
    private consecutiveToolFailures;
    private estimatedTotalTokens;
    private tokenHistory;
    private latencyHistory;
    private messageTimestamps;
    private toolResults;
    private sessionStartTime;
    private lastResponseTime;
    constructor(thresholds?: RiskThresholds);
    /**
     * Record a message
     */
    onMessage(content: string, _role: 'user' | 'assistant'): void;
    /**
     * Record a tool call
     */
    onToolCall(tool: string, args: Record<string, unknown>, result: Record<string, unknown>, latency: number): void;
    /**
     * Get current crash risk level
     */
    getCrashRisk(): CrashRisk;
    /**
     * Get all current signals
     */
    getSignals(): CrashSignals;
    /**
     * Reset checkpoint counter
     */
    resetCheckpointCounter(): void;
    private calculateMessagesPerMinute;
    private calculateLatencyTrend;
    private calculateResponseLatencyTrend;
    private assessRisk;
    private countSignalsExceeding;
    private identifyRiskFactors;
}
//# sourceMappingURL=SignalCollector.d.ts.map