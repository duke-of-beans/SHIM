"use strict";
/**
 * Session Status Handler
 *
 * Shows current SHIM status including:
 * - Checkpoint count
 * - Session duration
 * - Recovery availability
 * - Recent signals
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStatusHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const ResumeDetector_js_1 = require("../../core/ResumeDetector.js");
const shared_state_js_1 = require("../shared-state.js");
const uuid_1 = require("uuid");
class SessionStatusHandler extends base_handler_js_1.BaseHandler {
    resumeDetector;
    sessionStartTime;
    sessionId;
    constructor() {
        super();
        // Use shared repositories (already initialized by server)
        const checkpointRepo = (0, shared_state_js_1.getCheckpointRepository)();
        // Initialize resume detector
        this.resumeDetector = new ResumeDetector_js_1.ResumeDetector(checkpointRepo);
        this.sessionStartTime = Date.now();
        this.sessionId = (0, uuid_1.v4)();
        this.log('Session Status Handler initialized');
    }
    async execute(args) {
        try {
            const startTime = Date.now();
            const sessionToCheck = args.session_id || this.sessionId;
            // Get shared repositories
            const checkpointRepo = (0, shared_state_js_1.getCheckpointRepository)();
            const signalHistory = (0, shared_state_js_1.getSignalHistoryRepository)();
            // Get checkpoints for session
            const checkpoints = await checkpointRepo.listBySession(sessionToCheck);
            const checkpointCount = checkpoints.length;
            // Get last checkpoint
            const lastCheckpoint = await checkpointRepo.getMostRecent(sessionToCheck);
            const lastCheckpointTime = lastCheckpoint
                ? lastCheckpoint.createdAt
                : null;
            const timeSinceLastCheckpoint = lastCheckpoint
                ? Date.now() - new Date(lastCheckpoint.createdAt).getTime()
                : null;
            // Check recovery availability
            const resumeDetection = await this.resumeDetector.checkResume(sessionToCheck);
            // Calculate session duration
            const sessionDurationMs = Date.now() - this.sessionStartTime;
            const sessionDurationMin = Math.floor(sessionDurationMs / 60000);
            // Get recent signals for session
            const recentSnapshots = await signalHistory.getSessionSnapshots(sessionToCheck);
            const latestSnapshot = await signalHistory.getLatestSnapshot(sessionToCheck);
            const elapsed = Date.now() - startTime;
            this.log('Session status retrieved', { elapsed: `${elapsed}ms` });
            // Return comprehensive status
            return {
                success: true,
                shim_active: true,
                session_id: sessionToCheck,
                session_duration_minutes: sessionDurationMin,
                checkpoint_count: checkpointCount,
                last_checkpoint: lastCheckpointTime,
                last_checkpoint_number: lastCheckpoint?.checkpointNumber,
                time_since_last_checkpoint_ms: timeSinceLastCheckpoint,
                recovery_available: resumeDetection.shouldResume,
                interruption_reason: resumeDetection.interruptionReason,
                recovery_confidence: resumeDetection.confidence,
                signal_snapshot_count: recentSnapshots.length,
                latest_crash_risk: latestSnapshot?.signals.crashRisk,
                elapsed_ms: elapsed,
            };
        }
        catch (error) {
            return this.handleError(error, 'session-status');
        }
    }
}
exports.SessionStatusHandler = SessionStatusHandler;
//# sourceMappingURL=session-status.js.map