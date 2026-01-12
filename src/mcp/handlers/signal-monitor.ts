/**
 * Signal Monitor Handler
 * 
 * Monitors crash warning signals during session.
 * Triggers preemptive checkpoint if risk is high.
 * 
 * Uses existing SignalCollector from Phase 1.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { SignalCollector } from '../../core/SignalCollector.js';
import { SignalHistoryRepository } from '../../core/SignalHistoryRepository.js';
import path from 'path';

export class SignalMonitorHandler extends BaseHandler {
  private signalCollector: SignalCollector;
  private signalHistory: SignalHistoryRepository;
  private readonly RISK_THRESHOLD = 0.7;

  constructor() {
    super();
    
    const dataDir = path.join(process.cwd(), 'data', 'signals');
    
    // Initialize signal collection
    this.signalHistory = new SignalHistoryRepository(
      path.join(dataDir, 'signal-history.db')
    );
    this.signalCollector = new SignalCollector(this.signalHistory);
    
    this.log('Signal Monitor Handler initialized');
  }

  async execute(args: any): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Collect current signals
      const signals = await this.signalCollector.collectSignals();
      
      // Calculate risk level (weighted average)
      const riskLevel = this.calculateRiskLevel(signals);

      const elapsed = Date.now() - startTime;

      this.log('Signals monitored', {
        riskLevel,
        signalCount: Object.keys(signals).length,
        elapsed: `${elapsed}ms`,
      });

      // Determine if preemptive checkpoint needed
      const needsCheckpoint = riskLevel > this.RISK_THRESHOLD;

      // SILENT RESPONSE unless high risk
      return {
        success: true,
        risk_level: riskLevel,
        needs_checkpoint: needsCheckpoint,
        signals_detected: Object.keys(signals).length,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'signal-monitor');
    }
  }

  /**
   * Calculate overall risk level from signals
   */
  private calculateRiskLevel(signals: Record<string, any>): number {
    // Default signal weights
    const weights = {
      memoryUsage: 0.3,
      cpuUsage: 0.2,
      toolCallRate: 0.2,
      sessionDuration: 0.15,
      errorRate: 0.15,
    };

    let totalRisk = 0;
    let totalWeight = 0;

    for (const [key, value] of Object.entries(signals)) {
      const weight = weights[key as keyof typeof weights] || 0.1;
      const risk = typeof value === 'number' ? value : 0;
      
      totalRisk += risk * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalRisk / totalWeight : 0;
  }
}
