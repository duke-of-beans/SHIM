/**
 * Session Status Handler
 * 
 * Shows current SHIM status including:
 * - Checkpoint count
 * - Session duration
 * - Recovery availability
 * - Recent signals
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { CheckpointManager } from '../../core/CheckpointManager.js';
import { ResumeDetector } from '../../core/ResumeDetector.js';
import { SignalHistoryRepository } from '../../core/SignalHistoryRepository.js';
import path from 'path';

export class SessionStatusHandler extends BaseHandler {
  private checkpointManager: CheckpointManager;
  private resumeDetector: ResumeDetector;
  private signalHistory: SignalHistoryRepository;
  private sessionStartTime: number;

  constructor() {
    super();
    
    const dataDir = path.join(process.cwd(), 'data');
    
    // Initialize components
    this.checkpointManager = new CheckpointManager(
      path.join(dataDir, 'checkpoints')
    );
    this.resumeDetector = new ResumeDetector(dataDir);
    this.signalHistory = new SignalHistoryRepository(
      path.join(dataDir, 'signals', 'signal-history.db')
    );
    
    this.sessionStartTime = Date.now();
    
    this.log('Session Status Handler initialized');
  }

  async execute(args: any): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Get checkpoint count
      const checkpoints = await this.checkpointManager.listCheckpoints();
      const checkpointCount = checkpoints.length;
      
      // Get last checkpoint time
      const lastCheckpoint = checkpoints.length > 0 
        ? checkpoints[checkpoints.length - 1]
        : null;
      
      const lastCheckpointTime = lastCheckpoint
        ? new Date(lastCheckpoint.timestamp).toISOString()
        : null;
      
      const timeSinceLastCheckpoint = lastCheckpoint
        ? Date.now() - new Date(lastCheckpoint.timestamp).getTime()
        : null;

      // Check recovery availability
      const recoveryAvailable = await this.resumeDetector.detectIncompleteSession();

      // Calculate session duration
      const sessionDurationMs = Date.now() - this.sessionStartTime;
      const sessionDurationMin = Math.floor(sessionDurationMs / 60000);

      // Get recent signal count
      const recentSignals = await this.signalHistory.getRecentSignals(10);

      const elapsed = Date.now() - startTime;

      this.log('Session status retrieved', { elapsed: `${elapsed}ms` });

      // Return comprehensive status
      return {
        success: true,
        shim_active: true,
        session_duration_minutes: sessionDurationMin,
        checkpoint_count: checkpointCount,
        last_checkpoint: lastCheckpointTime,
        time_since_last_checkpoint_ms: timeSinceLastCheckpoint,
        recovery_available: !!recoveryAvailable,
        recent_signal_count: recentSignals.length,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'session-status');
    }
  }
}
