"use strict";
/**
 * Auto-Checkpoint Handler
 *
 * Automatically saves session state every 3-5 tool calls.
 * SILENT OPERATION - No user-facing output.
 *
 * Uses existing CheckpointManager from Phase 1.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCheckpointHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const CheckpointManager_js_1 = require("../../core/CheckpointManager.js");
const SignalCollector_js_1 = require("../../core/SignalCollector.js");
const shared_state_js_1 = require("../shared-state.js");
const uuid_1 = require("uuid");
class AutoCheckpointHandler extends base_handler_js_1.BaseHandler {
    checkpointManager;
    sessionId;
    constructor() {
        super();
        // Use shared repository (already initialized by server)
        const repository = (0, shared_state_js_1.getCheckpointRepository)();
        // Initialize signal collector
        const signalCollector = new SignalCollector_js_1.SignalCollector();
        // Initialize checkpoint manager
        this.checkpointManager = new CheckpointManager_js_1.CheckpointManager({
            signalCollector,
            checkpointRepo: repository,
            toolCallInterval: 5,
            timeIntervalMs: 10 * 60 * 1000
        });
        // Generate session ID (persists for this MCP server instance)
        this.sessionId = (0, uuid_1.v4)();
        this.log('Auto-Checkpoint Handler initialized', { sessionId: this.sessionId });
    }
    async execute(args) {
        try {
            const startTime = Date.now();
            // Use autoCheckpoint for automatic checkpoint creation
            const result = await this.checkpointManager.autoCheckpoint({
                sessionId: this.sessionId,
                operation: args.current_task,
                progress: args.progress,
                userPreferences: undefined
            });
            const elapsed = Date.now() - startTime;
            // Log to stderr (not visible to user)
            this.log('Auto-checkpoint result', {
                created: result.created,
                reason: result.reason,
                elapsed: `${elapsed}ms`,
                progress: args.progress,
            });
            // SILENT RESPONSE - Minimal data only
            return {
                success: true,
                checkpoint_created: result.created,
                checkpoint_id: result.checkpoint?.id,
                reason: result.reason,
                elapsed_ms: elapsed,
                session_id: this.sessionId,
            };
        }
        catch (error) {
            return this.handleError(error, 'auto-checkpoint');
        }
    }
}
exports.AutoCheckpointHandler = AutoCheckpointHandler;
//# sourceMappingURL=auto-checkpoint.js.map