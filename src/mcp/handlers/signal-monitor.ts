/**
 * Signal Monitor Handler
 * 
 * Monitors crash warning signals during session.
 * Triggers preemptive checkpoint if risk is high.
 * 
 * Uses existing SignalCollector from Phase 1.
 */

import { BaseHandler, HandlerResult} from './base-handler.js';
import { SignalCollector } from '../../core/SignalCollector.js';
import { SignalHistoryRepository } from '../../core/SignalHistoryRepository.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class SignalMonitorHandler extends BaseHandler {
  private signalCollector: SignalCollector;
  private signalHistory: SignalHistoryRepository;
  private sessionId: string;

  constructor() {
    super();
    
    const dbPath = path.join(process.cwd(), 'data', 'shim.db');
    
    // Initialize signal history repository
    this.signalHistory = new SignalHistoryRepository(dbPath);
    this.signalHistory.initialize().catch(err => {
      this.log('Failed to initialize signal history', { error: err });
    });
    
    // Initialize signal collector with default thresholds
    this.signalCollector = new SignalCollector();
    
    // Generate session ID
    this.sessionId = uuidv4();
    
    this.log('Signal Monitor Handler initialized');
  }

  async execute(_args: unknown): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Get current signals (synchronous)
      const signals = this.signalCollector.getSignals();
      
      // Save snapshot to history
      await this.signalHistory.saveSnapshot(this.sessionId, signals);

      const elapsed = Date.now() - startTime;

      this.log('Signals monitored', {
        crashRisk: signals.crashRisk,
        riskFactors: signals.riskFactors,
        elapsed: `${elapsed}ms`,
      });

      // Determine if preemptive checkpoint needed
      const needsCheckpoint = signals.crashRisk === 'danger' || signals.crashRisk === 'warning';

      return {
        success: true,
        crash_risk: signals.crashRisk,
        risk_factors: signals.riskFactors,
        needs_checkpoint: needsCheckpoint,
        signals: {
          context_window_usage: signals.contextWindowUsage,
          message_count: signals.messageCount,
          tool_call_count: signals.toolCallCount,
          tool_calls_since_checkpoint: signals.toolCallsSinceCheckpoint,
          session_duration_ms: signals.sessionDuration,
          tool_failure_rate: signals.toolFailureRate,
        },
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'signal-monitor');
    }
  }
}
