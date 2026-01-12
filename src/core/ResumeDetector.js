/**
 * Resume Detection System
 *
 * Detects session interruptions and generates resume prompts from checkpoints.
 */
export class ResumeDetector {
    checkpointRepo;
    constructor(checkpointRepo) {
        this.checkpointRepo = checkpointRepo;
    }
    /**
     * Check if session should resume from a checkpoint
     */
    async checkResume(sessionId) {
        // Get most recent checkpoint for session
        const lastCheckpoint = await this.checkpointRepo.getMostRecent(sessionId);
        // No checkpoint = no resume needed
        if (!lastCheckpoint) {
            return {
                shouldResume: false,
                lastCheckpoint: null,
                interruptionReason: 'unknown',
                timeSinceInterruption: 0,
                confidence: 0
            };
        }
        // Already restored = no resume needed
        if (lastCheckpoint.restored_at) {
            return {
                shouldResume: false,
                lastCheckpoint,
                interruptionReason: 'unknown',
                timeSinceInterruption: 0,
                confidence: 0
            };
        }
        // Calculate time since interruption
        const checkpointTime = new Date(lastCheckpoint.createdAt).getTime();
        const now = Date.now();
        const _timeSince = now - checkpointTime;
        // Classify interruption reason
        const reason = this.classifyInterruption(lastCheckpoint, _timeSince);
        // Calculate confidence
        const confidence = this.calculateConfidence(lastCheckpoint, _timeSince, reason);
        return {
            shouldResume: true,
            lastCheckpoint,
            interruptionReason: reason,
            timeSinceInterruption: _timeSince,
            confidence
        };
    }
    /**
     * Generate resume prompt from checkpoint
     */
    generateResumePrompt(checkpoint) {
        const checkpointTime = new Date(checkpoint.createdAt).getTime();
        const timeSince = Date.now() - checkpointTime;
        const reason = this.classifyInterruption(checkpoint, timeSince);
        // Format time duration
        const timeSinceStr = this.formatDuration(timeSince);
        // Build prompt sections
        const situation = this.formatSituation(reason);
        const progress = this.formatProgress(checkpoint.taskState);
        const context = checkpoint.conversationState.summary;
        const nextSteps = this.formatNextSteps(checkpoint.taskState.nextSteps);
        const files = this.formatFiles(checkpoint.fileState.activeFiles);
        const tools = this.formatTools(checkpoint.toolState.recentToolCalls);
        const blockers = this.formatBlockers(checkpoint.taskState.blockers);
        return {
            sections: {
                situation,
                progress,
                context,
                next: nextSteps,
                files,
                tools,
                blockers
            },
            checkpointId: checkpoint.id,
            metadata: {
                interruptionReason: reason,
                timeSince: timeSinceStr,
                progress: checkpoint.taskState.progress
            }
        };
    }
    /**
     * Classify interruption reason based on signals
     */
    classifyInterruption(checkpoint, _timeSince) {
        const risk = checkpoint.signals.crashRisk;
        const progress = checkpoint.taskState.progress;
        const sessionDuration = checkpoint.signals.sessionDuration;
        // Danger/warning = likely crash
        if (risk === 'danger') {
            return 'crash';
        }
        if (risk === 'warning') {
            return 'crash';
        }
        // Complete task = manual exit
        if (progress >= 1.0) {
            return 'manual_exit';
        }
        // Very long session (>90 min) = timeout
        if (sessionDuration > 90 * 60 * 1000) {
            return 'timeout';
        }
        // Otherwise ambiguous
        return 'unknown';
    }
    /**
     * Calculate confidence in interruption classification
     */
    calculateConfidence(checkpoint, timeSince, reason) {
        let baseConfidence = 0;
        // Base confidence from interruption reason
        switch (reason) {
            case 'crash':
                baseConfidence = checkpoint.signals.crashRisk === 'danger' ? 0.95 : 0.85;
                break;
            case 'timeout':
                baseConfidence = 0.85;
                break;
            case 'manual_exit':
                baseConfidence = 0.9;
                break;
            case 'unknown':
                baseConfidence = 0.3;
                break;
        }
        // Adjust for recency (more recent = higher confidence)
        const minutesSince = timeSince / (60 * 1000);
        if (minutesSince < 5) {
            baseConfidence = Math.min(1.0, baseConfidence + 0.1);
        }
        else if (minutesSince > 60) {
            baseConfidence = Math.max(0, baseConfidence - 0.2);
        }
        return baseConfidence;
    }
    /**
     * Format situation message
     */
    formatSituation(reason) {
        switch (reason) {
            case 'crash':
                return 'Session interrupted due to crash or context window overflow';
            case 'timeout':
                return 'Session timed out due to inactivity';
            case 'manual_exit':
                return 'Session ended manually after task completion';
            case 'unknown':
                return 'Session interrupted for unknown reason';
        }
    }
    /**
     * Format progress message
     */
    formatProgress(taskState) {
        const percent = Math.round(taskState.progress * 100);
        return `Operation: ${taskState.operation} (${percent}% complete)`;
    }
    /**
     * Format next steps
     */
    formatNextSteps(steps) {
        if (steps.length === 0) {
            return 'No next steps defined';
        }
        return steps.join(', ');
    }
    /**
     * Format active files
     */
    formatFiles(files) {
        if (files.length === 0) {
            return 'No active files';
        }
        return files.join(', ');
    }
    /**
     * Format recent tool calls
     */
    formatTools(toolCalls) {
        if (toolCalls.length === 0) {
            return 'No recent tool calls';
        }
        const tools = toolCalls.map(call => call.tool);
        return tools.join(', ');
    }
    /**
     * Format blockers
     */
    formatBlockers(blockers) {
        if (blockers.length === 0) {
            return 'No blockers';
        }
        return blockers.join(', ');
    }
    /**
     * Format duration as human-readable string
     */
    formatDuration(ms) {
        const minutes = Math.floor(ms / (60 * 1000));
        if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hour${hours === 1 ? '' : 's'}, ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    }
}
//# sourceMappingURL=ResumeDetector.js.map