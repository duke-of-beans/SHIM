/**
 * Session Start Integration
 *
 * Handles automatic crash detection and resume prompting on session startup.
 */
import { ResumeDetector } from './ResumeDetector';
import { SessionRestorer, RestoredState } from './SessionRestorer';
import { CheckpointRepository } from './CheckpointRepository';
import { ResumeDetection } from '../models/Checkpoint';
/**
 * Session start result
 */
export interface SessionStartResult {
    resumeNeeded: boolean;
    prompt: string | null;
    detection: ResumeDetection | null;
}
/**
 * Restore result
 */
export interface RestoreResult {
    success: boolean;
    state: RestoredState | null;
    fidelity?: number;
}
/**
 * Session starter - coordinates crash detection and resume on startup
 */
export declare class SessionStarter {
    private resumeDetector;
    private sessionRestorer;
    private checkpointRepo;
    constructor(resumeDetector: ResumeDetector, sessionRestorer: SessionRestorer, checkpointRepo: CheckpointRepository);
    /**
     * Check for resume needed on session start
     */
    checkSessionStart(sessionId: string): Promise<SessionStartResult>;
    /**
     * Perform restore (when user confirms)
     */
    performRestore(checkpointId: string, userConfirmed: boolean): Promise<RestoreResult>;
    /**
     * Format resume prompt for user display
     */
    private formatPromptForUser;
}
//# sourceMappingURL=SessionStarter.d.ts.map