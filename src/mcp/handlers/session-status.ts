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
import { ResumeDetector } from '../../core/ResumeDetector.js';
import { getCheckpointRepository, getSignalHistoryRepository } from '../shared-state.js';
import { v4 as uuidv4 } from 'uuid';

interface SessionStatusArgs {
  session_id?: string;
}

export class SessionStatusHandler extends BaseHandler {
  private resumeDetector: ResumeDetector;
  private sessionStartTime: number;
  private sessionId: string;

  constructor() {
    super();
    
    // Use shared repositories (already initialized by server)
    const checkpointRepo = getCheckpointRepository();
    
    // Initialize resume detector
    this.resumeDetector = new ResumeDetector(checkpointRepo);
    
    this.sessionStartTime = Date.now();
    this.sessionId = uuidv4();
    
    this.log('Session Status Handler initialized');
  }

  async execute(args: SessionStatusArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      const sessionToCheck = args.session_id || this.sessionId;

      // Get shared repositories
      const checkpointRepo = getCheckpointRepository();
      const signalHistory = getSignalHistoryRepository();

      // Get checkpoints for session
      const checkpoints = await checkpointRepo.listBySession(sessionToCheck);
      const checkpointCount = checkpoints.length;
      
      // Get last checkpoint
      const lastCheckpoint = await checkpointRepo.getMostRecent(sessionToCheck);
      
      const lastCheckpointTime = lastCheckpoint
        ? lastCheckpoint.createdAt
        : null;
      
      const timeSinceLastCheckpoint = lastCheckpoint
        ? Date.now() - new Date(lastCheckpoint.createdAt).getTime()
        : null;

      // Check recovery availability
      const resumeDetection = await this.resumeDetector.checkResume(sessionToCheck);

      // Calculate session duration
      const sessionDurationMs = Date.now() - this.sessionStartTime;
      const sessionDurationMin = Math.floor(sessionDurationMs / 60000);

      // Get recent signals for session
      const recentSnapshots = await signalHistory.getSessionSnapshots(sessionToCheck);
      const latestSnapshot = await signalHistory.getLatestSnapshot(sessionToCheck);

      const elapsed = Date.now() - startTime;

      this.log('Session status retrieved', { elapsed: `${elapsed}ms` });

      // Return comprehensive status
      return {
        success: true,
        shim_active: true,
        session_id: sessionToCheck,
        session_duration_minutes: sessionDurationMin,
        checkpoint_count: checkpointCount,
        last_checkpoint: lastCheckpointTime,
        last_checkpoint_number: lastCheckpoint?.checkpointNumber,
        time_since_last_checkpoint_ms: timeSinceLastCheckpoint,
        recovery_available: resumeDetection.shouldResume,
        interruption_reason: resumeDetection.interruptionReason,
        recovery_confidence: resumeDetection.confidence,
        signal_snapshot_count: recentSnapshots.length,
        latest_crash_risk: latestSnapshot?.signals.crashRisk,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'session-status');
    }
  }
}
