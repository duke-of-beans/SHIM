"use strict";
/**
 * Recovery Check Handler
 *
 * Checks for incomplete previous session at startup.
 * Shows recovery prompt to user if detected.
 *
 * Uses existing ResumeDetector and SessionRestorer from Phase 1.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryCheckHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const ResumeDetector_js_1 = require("../../core/ResumeDetector.js");
const shared_state_js_1 = require("../shared-state.js");
const uuid_1 = require("uuid");
class RecoveryCheckHandler extends base_handler_js_1.BaseHandler {
    resumeDetector;
    sessionId;
    constructor() {
        super();
        // Use shared repository (already initialized by server)
        const checkpointRepo = (0, shared_state_js_1.getCheckpointRepository)();
        // Initialize resume detector
        this.resumeDetector = new ResumeDetector_js_1.ResumeDetector(checkpointRepo);
        // Generate session ID
        this.sessionId = (0, uuid_1.v4)();
        this.log('Recovery Check Handler initialized');
    }
    async execute(args) {
        try {
            const startTime = Date.now();
            const sessionToCheck = args.session_id || this.sessionId;
            // Check for resume
            const resumeDetection = await this.resumeDetector.checkResume(sessionToCheck);
            if (!resumeDetection.shouldResume || !resumeDetection.lastCheckpoint) {
                this.log('No recovery needed');
                return {
                    success: true,
                    recovery_available: false,
                    session_id: sessionToCheck
                };
            }
            // Generate resume prompt
            const resumePrompt = this.resumeDetector.generateResumePrompt(resumeDetection.lastCheckpoint);
            const elapsed = Date.now() - startTime;
            this.log('Recovery available', {
                sessionId: sessionToCheck,
                checkpointId: resumeDetection.lastCheckpoint.id,
                confidence: resumeDetection.confidence,
                elapsed: `${elapsed}ms`,
            });
            // Return recovery info (will be shown to user)
            return {
                success: true,
                recovery_available: true,
                session_id: sessionToCheck,
                checkpoint_id: resumeDetection.lastCheckpoint.id,
                checkpoint_number: resumeDetection.lastCheckpoint.checkpointNumber,
                interruption_reason: resumeDetection.interruptionReason,
                time_since_interruption_ms: resumeDetection.timeSinceInterruption,
                confidence: resumeDetection.confidence,
                resume_prompt: resumePrompt,
                elapsed_ms: elapsed,
            };
        }
        catch (error) {
            return this.handleError(error, 'recovery-check');
        }
    }
}
exports.RecoveryCheckHandler = RecoveryCheckHandler;
//# sourceMappingURL=recovery-check.js.map