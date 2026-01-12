/**
 * Session Status Handler
 *
 * Shows current SHIM status including:
 * - Checkpoint count
 * - Session duration
 * - Recovery availability
 * - Recent signals
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
interface SessionStatusArgs {
    session_id?: string;
}
export declare class SessionStatusHandler extends BaseHandler {
    private resumeDetector;
    private sessionStartTime;
    private sessionId;
    constructor();
    execute(args: SessionStatusArgs): Promise<HandlerResult>;
}
export {};
//# sourceMappingURL=session-status.d.ts.map