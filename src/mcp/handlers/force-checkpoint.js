"use strict";
/**
 * Force Checkpoint Handler
 *
 * Manually creates a checkpoint on user request.
 * Use when user explicitly asks to "save checkpoint" or before risky operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForceCheckpointHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const CheckpointManager_js_1 = require("../../core/CheckpointManager.js");
const SignalCollector_js_1 = require("../../core/SignalCollector.js");
const shared_state_js_1 = require("../shared-state.js");
const uuid_1 = require("uuid");
class ForceCheckpointHandler extends base_handler_js_1.BaseHandler {
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
        this.log('Force Checkpoint Handler initialized');
    }
    async execute(args) {
        try {
            const startTime = Date.now();
            const reason = args.reason || 'Manual checkpoint requested';
            // Create checkpoint using CreateCheckpointInput
            const checkpoint = await this.checkpointManager.createCheckpoint({
                sessionId: this.sessionId,
                trigger: 'user_requested',
                operation: `Manual checkpoint: ${reason}`,
                progress: 0.5,
                userPreferences: undefined
            });
            const elapsed = Date.now() - startTime;
            this.log('Manual checkpoint created', {
                id: checkpoint.id,
                reason,
                elapsed: `${elapsed}ms`,
            });
            // Return confirmation
            return {
                success: true,
                checkpoint_id: checkpoint.id,
                checkpoint_number: checkpoint.checkpointNumber,
                reason,
                created_at: checkpoint.createdAt,
                elapsed_ms: elapsed,
            };
        }
        catch (error) {
            return this.handleError(error, 'force-checkpoint');
        }
    }
}
exports.ForceCheckpointHandler = ForceCheckpointHandler;
//# sourceMappingURL=force-checkpoint.js.map