/**
 * Session Restoration System
 *
 * Handles loading checkpoints and reconstructing session state for crash recovery.
 */
export class SessionRestorer {
    checkpointRepo;
    constructor(checkpointRepo) {
        this.checkpointRepo = checkpointRepo;
    }
    /**
     * Load checkpoint by ID
     */
    async loadCheckpoint(checkpointId) {
        return this.checkpointRepo.getById(checkpointId);
    }
    /**
     * Load most recent checkpoint for session
     */
    async loadMostRecent(sessionId) {
        const checkpoints = await this.checkpointRepo.listBySession(sessionId);
        if (checkpoints.length === 0) {
            return null;
        }
        // Sort by checkpoint number descending (most recent first)
        checkpoints.sort((a, b) => b.checkpointNumber - a.checkpointNumber);
        return checkpoints[0];
    }
    /**
     * Restore state from checkpoint
     */
    async restoreState(checkpointId) {
        const checkpoint = await this.loadCheckpoint(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${checkpointId}`);
        }
        return {
            conversation: checkpoint.conversationState,
            task: checkpoint.taskState,
            files: checkpoint.fileState,
            tools: checkpoint.toolState
        };
    }
    /**
     * Restore state and mark checkpoint as restored
     */
    async restoreAndMark(checkpointId, success, fidelity) {
        await this.checkpointRepo.markRestored(checkpointId, success, fidelity);
    }
    /**
     * Calculate restoration fidelity
     */
    calculateFidelity(checkpointId, components) {
        const weights = {
            conversation: 0.3,
            task: 0.4,
            files: 0.2,
            tools: 0.1
        };
        let fidelity = 0;
        if (components.conversationRestored) {
            fidelity += weights.conversation;
        }
        if (components.taskRestored) {
            fidelity += weights.task;
        }
        if (components.filesRestored) {
            fidelity += weights.files;
        }
        if (components.toolsRestored) {
            fidelity += weights.tools;
        }
        return fidelity;
    }
    /**
     * Record resume event
     */
    async recordResumeEvent(data) {
        // In production, this would write to a resume_events table
        // For now, we'll create an in-memory record
        const event = {
            ...data,
            id: Date.now(),
            resumedAt: new Date().toISOString()
        };
        // Mark checkpoint as restored
        await this.restoreAndMark(data.checkpointId, data.success, data.fidelityScore);
        return event;
    }
}
//# sourceMappingURL=SessionRestorer.js.map