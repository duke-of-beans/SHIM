/**
 * Force Checkpoint Handler
 *
 * Manually creates a checkpoint on user request.
 * Use when user explicitly asks to "save checkpoint" or before risky operations.
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
interface ForceCheckpointArgs {
    reason?: string;
}
export declare class ForceCheckpointHandler extends BaseHandler {
    private checkpointManager;
    private sessionId;
    constructor();
    execute(args: ForceCheckpointArgs): Promise<HandlerResult>;
}
export {};
//# sourceMappingURL=force-checkpoint.d.ts.map