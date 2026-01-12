/**
 * Signal Service - Monitors crash warning signals
 * 
 * Detects patterns that may indicate an impending crash
 */

export interface SignalMonitorResult {
  riskLevel: number;
  signals: string[];
  warnings: string[];
}

export class SignalService {
  private toolCallCount: number = 0;
  private sessionStartTime: number = Date.now();
  private lastSignalCheck: number = Date.now();

  async monitor(): Promise<SignalMonitorResult> {
    this.toolCallCount++;
    this.lastSignalCheck = Date.now();

    const signals: string[] = [];
    const warnings: string[] = [];
    let riskLevel = 0;

    // Calculate session duration
    const sessionDurationMinutes = (Date.now() - this.sessionStartTime) / (1000 * 60);

    // SIGNAL 1: Long session duration
    if (sessionDurationMinutes > 45) {
      signals.push('Long session duration');
      riskLevel += 0.2;
    }

    if (sessionDurationMinutes > 60) {
      warnings.push('Session duration exceeds 60 minutes - elevated crash risk');
      riskLevel += 0.3;
    }

    // SIGNAL 2: High tool call frequency
    if (this.toolCallCount > 50) {
      signals.push('High tool call count');
      riskLevel += 0.1;
    }

    if (this.toolCallCount > 100) {
      warnings.push('Tool call count very high - consider checkpoint');
      riskLevel += 0.2;
    }

    // SIGNAL 3: Memory pressure (estimated)
    const estimatedMemoryUsage = this.toolCallCount * 1.5; // MB per tool call (rough estimate)
    if (estimatedMemoryUsage > 500) {
      signals.push('High estimated memory usage');
      riskLevel += 0.15;
    }

    // Cap risk level at 1.0
    riskLevel = Math.min(riskLevel, 1.0);

    // Log high risk
    if (riskLevel > 0.7) {
      console.error(`⚠️  High crash risk detected: ${riskLevel.toFixed(2)}`);
      console.error(`   Signals: ${signals.join(', ')}`);
    }

    return {
      riskLevel,
      signals,
      warnings
    };
  }

  reset(): void {
    this.toolCallCount = 0;
    this.sessionStartTime = Date.now();
    this.lastSignalCheck = Date.now();
  }
}

