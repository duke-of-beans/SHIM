"use strict";
/**
 * Signal Monitor Handler
 *
 * Monitors crash warning signals during session.
 * Triggers preemptive checkpoint if risk is high.
 *
 * Uses existing SignalCollector from Phase 1.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalMonitorHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const SignalCollector_js_1 = require("../../core/SignalCollector.js");
const shared_state_js_1 = require("../shared-state.js");
const uuid_1 = require("uuid");
class SignalMonitorHandler extends base_handler_js_1.BaseHandler {
    signalCollector;
    sessionId;
    constructor() {
        super();
        // Initialize signal collector with default thresholds
        this.signalCollector = new SignalCollector_js_1.SignalCollector();
        // Generate session ID
        this.sessionId = (0, uuid_1.v4)();
        this.log('Signal Monitor Handler initialized');
    }
    async execute(_args) {
        try {
            const startTime = Date.now();
            // Get shared signal history repository
            const signalHistory = (0, shared_state_js_1.getSignalHistoryRepository)();
            // Get current signals (synchronous)
            const signals = this.signalCollector.getSignals();
            // Save snapshot to history
            await signalHistory.saveSnapshot(this.sessionId, signals);
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
        }
        catch (error) {
            return this.handleError(error, 'signal-monitor');
        }
    }
}
exports.SignalMonitorHandler = SignalMonitorHandler;
//# sourceMappingURL=signal-monitor.js.map