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
import { SessionRestorer } from '../../core/SessionRestorer.js';
import path from 'path';

export class RecoveryCheckHandler extends BaseHandler {
  private resumeDetector: ResumeDetector;
  private sessionRestorer: SessionRestorer;

  constructor() {
    super();
    
    const dataDir = path.join(process.cwd(), 'data');
    
    // Initialize detectors
    this.resumeDetector = new ResumeDetector(dataDir);
    this.sessionRestorer = new SessionRestorer(dataDir);
    
    this.log('Recovery Check Handler initialized');
  }

  async execute(args: any): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Detect incomplete session
      const incompleteSession = await this.resumeDetector.detectIncompleteSession();

      if (!incompleteSession) {
        this.log('No recovery needed');
        return {
          success: true,
          recovery_available: false,
        };
      }

      // Generate resume prompt
      const resumePrompt = await this.sessionRestorer.generateResumePrompt(
        incompleteSession.id
      );

      const elapsed = Date.now() - startTime;

      this.log('Recovery available', {
        sessionId: incompleteSession.id,
        timestamp: incompleteSession.timestamp,
        elapsed: `${elapsed}ms`,
      });

      // Return recovery info (will be shown to user)
      return {
        success: true,
        recovery_available: true,
        session_id: incompleteSession.id,
        session_summary: resumePrompt.summary,
        timestamp: incompleteSession.timestamp,
        progress: incompleteSession.progress,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'recovery-check');
    }
  }
}
