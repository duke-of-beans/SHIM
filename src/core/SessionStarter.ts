/**
 * Session Start Integration
 * 
 * Handles automatic crash detection and resume prompting on session startup.
 */

import { ResumeDetector } from './ResumeDetector';
import { SessionRestorer, RestoredState } from './SessionRestorer';
import { CheckpointRepository } from './CheckpointRepository';
import { ResumeDetection, ResumePrompt } from '../models/Checkpoint';

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
export class SessionStarter {
  constructor(
    private resumeDetector: ResumeDetector,
    private sessionRestorer: SessionRestorer,
    private checkpointRepo: CheckpointRepository
  ) {}

  /**
   * Check for resume needed on session start
   */
  async checkSessionStart(sessionId: string): Promise<SessionStartResult> {
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
    const resumePrompt = this.resumeDetector.generateResumePrompt(
      detection.lastCheckpoint
    );
    
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
  async performRestore(
    checkpointId: string,
    userConfirmed: boolean
  ): Promise<RestoreResult> {
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
  private formatPromptForUser(prompt: ResumePrompt): string {
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
