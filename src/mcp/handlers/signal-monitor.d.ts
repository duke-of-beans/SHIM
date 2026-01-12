/**
 * Signal Monitor Handler
 *
 * Monitors crash warning signals during session.
 * Triggers preemptive checkpoint if risk is high.
 *
 * Uses existing SignalCollector from Phase 1.
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
export declare class SignalMonitorHandler extends BaseHandler {
    private signalCollector;
    private sessionId;
    constructor();
    execute(_args: unknown): Promise<HandlerResult>;
}
//# sourceMappingURL=signal-monitor.d.ts.map