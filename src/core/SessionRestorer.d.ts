/**
 * Session Restoration System
 *
 * Handles loading checkpoints and reconstructing session state for crash recovery.
 */
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint, ConversationMessage, ToolSession, PendingOp, ToolCallRecord } from '../models/Checkpoint';
/**
 * Reconstructed session state from checkpoint
 */
export interface RestoredState {
    conversation: {
        summary: string;
        keyDecisions: string[];
        currentContext: string;
        recentMessages: ConversationMessage[];
    };
    task: {
        operation: string;
        phase: string;
        progress: number;
        completedSteps: string[];
        nextSteps: string[];
        blockers: string[];
    };
    files: {
        activeFiles: string[];
        modifiedFiles: string[];
        stagedFiles: string[];
        uncommittedDiff: string;
    };
    tools: {
        activeSessions: ToolSession[];
        pendingOperations: PendingOp[];
        recentToolCalls: ToolCallRecord[];
    };
}
/**
 * Fidelity components for restoration quality
 */
export interface FidelityComponents {
    conversationRestored: boolean;
    taskRestored: boolean;
    filesRestored: boolean;
    toolsRestored: boolean;
}
/**
 * Resume event details
 */
export interface ResumeEventData {
    checkpointId: string;
    sessionId: string;
    interruptionReason: 'crash' | 'timeout' | 'manual_exit' | 'unknown';
    timeSinceCheckpoint: number;
    resumeConfidence: number;
    success: boolean;
    fidelityScore: number;
}
/**
 * Resume event record
 */
export interface ResumeEvent extends ResumeEventData {
    id: number;
    resumedAt: string;
}
export declare class SessionRestorer {
    private checkpointRepo;
    constructor(checkpointRepo: CheckpointRepository);
    /**
     * Load checkpoint by ID
     */
    loadCheckpoint(checkpointId: string): Promise<Checkpoint | null>;
    /**
     * Load most recent checkpoint for session
     */
    loadMostRecent(sessionId: string): Promise<Checkpoint | null>;
    /**
     * Restore state from checkpoint
     */
    restoreState(checkpointId: string): Promise<RestoredState>;
    /**
     * Restore state and mark checkpoint as restored
     */
    restoreAndMark(checkpointId: string, success: boolean, fidelity: number): Promise<void>;
    /**
     * Calculate restoration fidelity
     */
    calculateFidelity(checkpointId: string, components: FidelityComponents): number;
    /**
     * Record resume event
     */
    recordResumeEvent(data: ResumeEventData): Promise<ResumeEvent>;
}
//# sourceMappingURL=SessionRestorer.d.ts.map