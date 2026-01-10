/**
 * SignalCollector - TDD Implementation
 * 
 * Tracks observable signals for crash prediction
 * Spec: docs/specs/SPEC_CRASH_PREVENTION.md
 * Performance Target: <5ms overhead per operation
 */

import { encoding_for_model } from 'tiktoken';
import type { CrashSignals, CrashRisk } from '../models/Checkpoint';

// Re-export for convenience
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

const DEFAULT_THRESHOLDS: RiskThresholds = {
  warningZone: {
    contextWindowUsage: 0.60,
    messageCount: 35,
    sessionDuration: 60 * 60 * 1000,
    toolCallsSinceCheckpoint: 10,
    toolFailureRate: 0.15,
  },
  dangerZone: {
    contextWindowUsage: 0.75,
    messageCount: 50,
    sessionDuration: 90 * 60 * 1000,
    toolCallsSinceCheckpoint: 15,
    toolFailureRate: 0.20,
  },
};

const CONTEXT_WINDOW_SIZE = 200000; // Claude Sonnet context window

export class SignalCollector {
  private thresholds: RiskThresholds;
  private encoder: any;

  // Counters
  private messageCount = 0;
  private toolCallCount = 0;
  private toolCallsSinceCheckpoint = 0;
  private consecutiveToolFailures = 0;

  // Token tracking
  private estimatedTotalTokens = 0;
  private tokenHistory: number[] = [];

  // Latency tracking
  private latencyHistory: number[] = [];
  private messageTimestamps: number[] = [];

  // Tool results
  private toolResults: Array<{ success: boolean; latency: number }> = [];

  // Session tracking
  private sessionStartTime = Date.now();
  private lastResponseTime = Date.now();

  constructor(thresholds: RiskThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
    this.encoder = encoding_for_model('gpt-4');
  }

  /**
   * Record a message
   */
  onMessage(content: string, role: 'user' | 'assistant'): void {
    this.messageCount++;

    // Estimate tokens
    const tokens = this.encoder.encode(content).length;
    this.estimatedTotalTokens += tokens;
    this.tokenHistory.push(tokens);

    // Keep last 20 messages for average
    if (this.tokenHistory.length > 20) {
      this.tokenHistory.shift();
    }

    // Track message timestamps
    this.messageTimestamps.push(Date.now());
    if (this.messageTimestamps.length > 20) {
      this.messageTimestamps.shift();
    }

    this.lastResponseTime = Date.now();
  }

  /**
   * Record a tool call
   */
  onToolCall(tool: string, args: any, result: any, latency: number): void {
    this.toolCallCount++;
    this.toolCallsSinceCheckpoint++;

    const success = !result.error && !result.is_error;
    this.toolResults.push({ success, latency });

    // Keep last 50 tool results
    if (this.toolResults.length > 50) {
      this.toolResults.shift();
    }

    // Track consecutive failures
    if (success) {
      this.consecutiveToolFailures = 0;
    } else {
      this.consecutiveToolFailures++;
    }

    // Update latency history
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 20) {
      this.latencyHistory.shift();
    }

    this.lastResponseTime = Date.now();
  }

  /**
   * Get current crash risk level
   */
  getCrashRisk(): CrashRisk {
    const signals = this.getSignals();
    return signals.crashRisk;
  }

  /**
   * Get all current signals
   */
  getSignals(): CrashSignals {
    const now = Date.now();
    const sessionDuration = now - this.sessionStartTime;
    const timeSinceLastResponse = now - this.lastResponseTime;

    // Calculate averages
    const tokensPerMessage = this.tokenHistory.length > 0
      ? this.tokenHistory.reduce((a, b) => a + b, 0) / this.tokenHistory.length
      : 0;

    const avgResponseLatency = this.latencyHistory.length > 0
      ? this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
      : 0;

    // Context window calculation
    const contextWindowUsage = this.estimatedTotalTokens / CONTEXT_WINDOW_SIZE;
    const contextWindowRemaining = CONTEXT_WINDOW_SIZE - this.estimatedTotalTokens;

    // Calculate tool failure rate
    const recentToolResults = this.toolResults.slice(-50);
    const toolFailureRate = recentToolResults.length > 0
      ? recentToolResults.filter(r => !r.success).length / recentToolResults.length
      : 0;

    // Calculate messages per minute
    const messagesPerMinute = this.calculateMessagesPerMinute();

    // Determine trends
    const latencyTrend = this.calculateLatencyTrend();
    const responseLatencyTrend = this.calculateResponseLatencyTrend(avgResponseLatency);

    const signals: CrashSignals = {
      estimatedTotalTokens: this.estimatedTotalTokens,
      tokensPerMessage,
      contextWindowUsage,
      contextWindowRemaining,
      messageCount: this.messageCount,
      toolCallCount: this.toolCallCount,
      toolCallsSinceCheckpoint: this.toolCallsSinceCheckpoint,
      messagesPerMinute,
      sessionDuration,
      avgResponseLatency,
      timeSinceLastResponse,
      latencyTrend,
      toolFailureRate,
      consecutiveToolFailures: this.consecutiveToolFailures,
      responseLatencyTrend,
      errorPatterns: [],
      crashRisk: 'safe',
      riskFactors: [],
    };

    signals.crashRisk = this.assessRisk(signals);
    signals.riskFactors = this.identifyRiskFactors(signals);

    return signals;
  }

  /**
   * Reset checkpoint counter
   */
  resetCheckpointCounter(): void {
    this.toolCallsSinceCheckpoint = 0;
  }

  private calculateMessagesPerMinute(): number {
    if (this.messageTimestamps.length < 2) return 0;

    const recentTimestamps = this.messageTimestamps.slice(-10);
    const duration = recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0];
    const durationMinutes = duration / (60 * 1000);

    return durationMinutes > 0 ? recentTimestamps.length / durationMinutes : 0;
  }

  private calculateLatencyTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.latencyHistory.length < 5) return 'stable';

    // Simple linear regression
    const recent = this.latencyHistory.slice(-10);
    const n = recent.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = recent.reduce((a, b) => a + b, 0);
    const sumXY = recent.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  private calculateResponseLatencyTrend(avgLatency: number): 'normal' | 'degrading' | 'critical' {
    if (avgLatency < 2000) return 'normal';
    if (avgLatency < 5000) return 'degrading';
    return 'critical';
  }

  private assessRisk(signals: CrashSignals): CrashRisk {
    const dangerCount = this.countSignalsExceeding(signals, this.thresholds.dangerZone);
    const warningCount = this.countSignalsExceeding(signals, this.thresholds.warningZone);

    // Risk assessment algorithm:
    // - Context window exhaustion is critical → immediate 'danger'
    // - Danger: ≥2 danger zone signals OR critical context usage
    // - Warning: ≥1 danger zone signal OR ≥1 warning zone signal
    // - Safe: Otherwise
    
    // Context window exhaustion is immediate crash risk
    if (signals.contextWindowUsage >= this.thresholds.dangerZone.contextWindowUsage) {
      return 'danger';
    }
    
    if (dangerCount >= 2) return 'danger';
    if (dangerCount >= 1 || warningCount >= 1) return 'warning';
    return 'safe';
  }

  private countSignalsExceeding(signals: CrashSignals, thresholds: any): number {
    let count = 0;

    if (signals.contextWindowUsage >= thresholds.contextWindowUsage) count++;
    if (signals.messageCount >= thresholds.messageCount) count++;
    if (signals.sessionDuration >= thresholds.sessionDuration) count++;
    if (signals.toolCallsSinceCheckpoint >= thresholds.toolCallsSinceCheckpoint) count++;
    if (signals.toolFailureRate >= thresholds.toolFailureRate) count++;

    return count;
  }

  private identifyRiskFactors(signals: CrashSignals): string[] {
    const factors: string[] = [];

    if (signals.contextWindowUsage > this.thresholds.dangerZone.contextWindowUsage) {
      factors.push('Context window usage critical');
    }
    if (signals.messageCount > this.thresholds.dangerZone.messageCount) {
      factors.push('High message count');
    }
    if (signals.toolFailureRate > this.thresholds.dangerZone.toolFailureRate) {
      factors.push('High tool failure rate');
    }
    if (signals.consecutiveToolFailures >= 3) {
      factors.push('Multiple consecutive tool failures');
    }
    if (signals.latencyTrend === 'increasing') {
      factors.push('Increasing response latency');
    }

    return factors;
  }
}
