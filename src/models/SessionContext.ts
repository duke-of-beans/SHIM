/**
 * Session Context Model
 * 
 * Represents the current state of a session for checkpointing.
 * This is a simplified version of the full Checkpoint model,
 * used for creating checkpoints via the MCP API.
 */

export interface SessionContext {
  // Session identification
  sessionId: string;
  
  // Current work
  currentTask: string;
  progress: number; // 0.0 to 1.0
  
  // Decisions and planning
  decisions: string[];
  nextSteps: string[];
  
  // File tracking
  activeFiles: string[];
  
  // Timing
  timestamp: string;
  
  // Optional metadata
  metadata?: {
    checkpointType?: 'auto' | 'manual' | 'forced';
    reason?: string;
    [key: string]: any;
  };
}
