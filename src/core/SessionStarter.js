"use strict";
/**
 * Session Start Integration
 *
 * Handles automatic crash detection and resume prompting on session startup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStarter = void 0;
/**
 * Session starter - coordinates crash detection and resume on startup
 */
class SessionStarter {
    resumeDetector;
    sessionRestorer;
    checkpointRepo;
    constructor(resumeDetector, sessionRestorer, checkpointRepo) {
        this.resumeDetector = resumeDetector;
        this.sessionRestorer = sessionRestorer;
        this.checkpointRepo = checkpointRepo;
    }
    /**
     * Check for resume needed on session start
     */
    async checkSessionStart(sessionId) {
        // Detect if resume needed
        const detection = await this.resumeDetector.checkResume(sessionId);
        if (!detection.shouldResume || !detection.lastCheckpoint) {
            return {
                resumeNeeded: false,
                prompt: null,
                detection: null
            };
        }
        // Generate resume prompt
        const resumePrompt = this.resumeDetector.generateResumePrompt(detection.lastCheckpoint);
        // Format as user-friendly text
        const prompt = this.formatPromptForUser(resumePrompt);
        return {
            resumeNeeded: true,
            prompt,
            detection
        };
    }
    /**
     * Perform restore (when user confirms)
     */
    async performRestore(checkpointId, userConfirmed) {
        if (!userConfirmed) {
            return {
                success: false,
                state: null
            };
        }
        // Restore state
        const state = await this.sessionRestorer.restoreState(checkpointId);
        // Calculate fidelity
        const fidelity = this.sessionRestorer.calculateFidelity(checkpointId, {
            conversationRestored: !!state.conversation,
            taskRestored: !!state.task,
            filesRestored: !!state.files,
            toolsRestored: !!state.tools
        });
        // Mark as restored
        await this.sessionRestorer.restoreAndMark(checkpointId, true, fidelity);
        return {
            success: true,
            state,
            fidelity
        };
    }
    /**
     * Format resume prompt for user display
     */
    formatPromptForUser(prompt) {
        const sections = prompt.sections;
        return `
🔄 **SESSION RESUME DETECTED**

**Situation:** ${sections.situation}

**What you were working on:**
${sections.progress}

**Where we left off:**
${sections.context}

**Next steps planned:**
${sections.next}

**Files you were editing:**
${sections.files}

Would you like to resume from this checkpoint?
`.trim();
    }
}
exports.SessionStarter = SessionStarter;
//# sourceMappingURL=SessionStarter.js.map