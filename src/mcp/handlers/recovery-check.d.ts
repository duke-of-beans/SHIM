/**
 * Recovery Check Handler
 *
 * Checks for incomplete previous session at startup.
 * Shows recovery prompt to user if detected.
 *
 * Uses existing ResumeDetector and SessionRestorer from Phase 1.
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
interface RecoveryCheckArgs {
    session_id?: string;
}
export declare class RecoveryCheckHandler extends BaseHandler {
    private resumeDetector;
    private sessionId;
    constructor();
    execute(args: RecoveryCheckArgs): Promise<HandlerResult>;
}
export {};
//# sourceMappingURL=recovery-check.d.ts.map