/**
 * Resume Detection System
 *
 * Detects session interruptions and generates resume prompts from checkpoints.
 */
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint, ResumeDetection, ResumePrompt } from '../models/Checkpoint';
export declare class ResumeDetector {
    private checkpointRepo;
    constructor(checkpointRepo: CheckpointRepository);
    /**
     * Check if session should resume from a checkpoint
     */
    checkResume(sessionId: string): Promise<ResumeDetection>;
    /**
     * Generate resume prompt from checkpoint
     */
    generateResumePrompt(checkpoint: Checkpoint): ResumePrompt;
    /**
     * Classify interruption reason based on signals
     */
    private classifyInterruption;
    /**
     * Calculate confidence in interruption classification
     */
    private calculateConfidence;
    /**
     * Format situation message
     */
    private formatSituation;
    /**
     * Format progress message
     */
    private formatProgress;
    /**
     * Format next steps
     */
    private formatNextSteps;
    /**
     * Format active files
     */
    private formatFiles;
    /**
     * Format recent tool calls
     */
    private formatTools;
    /**
     * Format blockers
     */
    private formatBlockers;
    /**
     * Format duration as human-readable string
     */
    private formatDuration;
}
//# sourceMappingURL=ResumeDetector.d.ts.map