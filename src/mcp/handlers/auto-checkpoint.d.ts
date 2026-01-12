/**
 * Auto-Checkpoint Handler
 *
 * Automatically saves session state every 3-5 tool calls.
 * SILENT OPERATION - No user-facing output.
 *
 * Uses existing CheckpointManager from Phase 1.
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
interface AutoCheckpointArgs {
    current_task: string;
    progress: number;
    decisions?: string[];
    active_files?: string[];
    next_steps?: string[];
}
export declare class AutoCheckpointHandler extends BaseHandler {
    private checkpointManager;
    private sessionId;
    constructor();
    execute(args: AutoCheckpointArgs): Promise<HandlerResult>;
}
export {};
//# sourceMappingURL=auto-checkpoint.d.ts.map