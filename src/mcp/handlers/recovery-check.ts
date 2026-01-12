/**
 * Recovery Check Handler
 * 
 * Checks for incomplete previous session at startup.
 * Shows recovery prompt to user if detected.
 * 
 * Uses existing ResumeDetector and SessionRestorer from Phase 1.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { ResumeDetector } from '../../core/ResumeDetector.js';
import { getCheckpointRepository } from '../shared-state.js';
import { v4 as uuidv4 } from 'uuid';

interface RecoveryCheckArgs {
  session_id?: string;  // Optional: check specific session, otherwise check current
}

export class RecoveryCheckHandler extends BaseHandler {
  private resumeDetector: ResumeDetector;
  private sessionId: string;

  constructor() {
    super();
    
    // Use shared repository (already initialized by server)
    const checkpointRepo = getCheckpointRepository();
    
    // Initialize resume detector
    this.resumeDetector = new ResumeDetector(checkpointRepo);
    
    // Generate session ID
    this.sessionId = uuidv4();
    
    this.log('Recovery Check Handler initialized');
  }

  async execute(args: RecoveryCheckArgs): Promise<HandlerResult> {
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
      const resumePrompt = this.resumeDetector.generateResumePrompt(
        resumeDetection.lastCheckpoint
      );

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
    } catch (error) {
      return this.handleError(error, 'recovery-check');
    }
  }
}
