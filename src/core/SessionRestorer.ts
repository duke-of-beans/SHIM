/**
 * Session Restoration System
 * 
 * Handles loading checkpoints and reconstructing session state for crash recovery.
 */

import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';

/**
 * Reconstructed session state from checkpoint
 */
export interface RestoredState {
  conversation: {
    summary: string;
    keyDecisions: string[];
    currentContext: string;
    recentMessages: any[];
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
    activeSessions: any[];
    pendingOperations: any[];
    recentToolCalls: any[];
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

export class SessionRestorer {
  constructor(private checkpointRepo: CheckpointRepository) {}

  /**
   * Load checkpoint by ID
   */
  async loadCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    return await this.checkpointRepo.getById(checkpointId);
  }

  /**
   * Load most recent checkpoint for session
   */
  async loadMostRecent(sessionId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.checkpointRepo.listBySession(sessionId);
    
    if (checkpoints.length === 0) {
      return null;
    }
    
    // Sort by checkpoint number descending (most recent first)
    checkpoints.sort((a: Checkpoint, b: Checkpoint) => b.checkpointNumber - a.checkpointNumber);
    return checkpoints[0];
  }

  /**
   * Restore state from checkpoint
   */
  async restoreState(checkpointId: string): Promise<RestoredState> {
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
  async restoreAndMark(
    checkpointId: string,
    success: boolean,
    fidelity: number
  ): Promise<void> {
    await this.checkpointRepo.markRestored(checkpointId, success, fidelity);
  }

  /**
   * Calculate restoration fidelity
   */
  async calculateFidelity(
    checkpointId: string,
    components: FidelityComponents
  ): Promise<number> {
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
  async recordResumeEvent(data: ResumeEventData): Promise<ResumeEvent> {
    // In production, this would write to a resume_events table
    // For now, we'll create an in-memory record
    const event: ResumeEvent = {
      ...data,
      id: Date.now(),
      resumedAt: new Date().toISOString()
    };
    
    // Mark checkpoint as restored
    await this.restoreAndMark(
      data.checkpointId,
      data.success,
      data.fidelityScore
    );
    
    return event;
  }
}
