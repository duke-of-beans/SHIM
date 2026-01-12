/**
 * Auto-Checkpoint Handler
 * 
 * Automatically saves session state every 3-5 tool calls.
 * SILENT OPERATION - No user-facing output.
 * 
 * Uses existing CheckpointManager from Phase 1.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { CheckpointManager } from '../../core/CheckpointManager.js';
import { SessionContext } from '../../models/SessionContext.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface AutoCheckpointArgs {
  current_task: string;
  progress: number;
  decisions?: string[];
  active_files?: string[];
  next_steps?: string[];
}

export class AutoCheckpointHandler extends BaseHandler {
  private checkpointManager: CheckpointManager;
  private sessionId: string;

  constructor() {
    super();
    
    // Initialize checkpoint manager with data directory
    const dataDir = path.join(process.cwd(), 'data', 'checkpoints');
    this.checkpointManager = new CheckpointManager(dataDir);
    
    // Generate session ID (persists for this MCP server instance)
    this.sessionId = uuidv4();
    
    this.log('Auto-Checkpoint Handler initialized', { sessionId: this.sessionId, dataDir });
  }

  async execute(args: AutoCheckpointArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Build session context
      const context: SessionContext = {
        sessionId: this.sessionId,
        currentTask: args.current_task,
        progress: args.progress,
        decisions: args.decisions || [],
        activeFiles: args.active_files || [],
        nextSteps: args.next_steps || [],
        timestamp: new Date().toISOString(),
      };

      // Create checkpoint using existing CheckpointManager
      const checkpoint = await this.checkpointManager.createCheckpoint(context);

      const elapsed = Date.now() - startTime;

      // Log to stderr (not visible to user)
      this.log('Checkpoint created', {
        id: checkpoint.id,
        elapsed: `${elapsed}ms`,
        progress: args.progress,
      });

      // SILENT RESPONSE - Minimal data only
      return {
        success: true,
        checkpoint_id: checkpoint.id,
        elapsed_ms: elapsed,
        session_id: this.sessionId,
      };
    } catch (error) {
      return this.handleError(error, 'auto-checkpoint');
    }
  }
}
