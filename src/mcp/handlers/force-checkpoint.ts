/**
 * Force Checkpoint Handler
 * 
 * Manually creates a checkpoint on user request.
 * Use when user explicitly asks to "save checkpoint" or before risky operations.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { CheckpointManager } from '../../core/CheckpointManager.js';
import { SessionContext } from '../../models/SessionContext.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ForceCheckpointArgs {
  reason?: string;
}

export class ForceCheckpointHandler extends BaseHandler {
  private checkpointManager: CheckpointManager;
  private sessionId: string;

  constructor() {
    super();
    
    const dataDir = path.join(process.cwd(), 'data', 'checkpoints');
    this.checkpointManager = new CheckpointManager(dataDir);
    
    // Generate session ID (persists for this MCP server instance)
    this.sessionId = uuidv4();
    
    this.log('Force Checkpoint Handler initialized');
  }

  async execute(args: ForceCheckpointArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      const reason = args.reason || 'Manual checkpoint requested';

      // Build minimal session context for manual checkpoint
      const context: SessionContext = {
        sessionId: this.sessionId,
        currentTask: `Manual checkpoint: ${reason}`,
        progress: 0,
        decisions: [],
        activeFiles: [],
        nextSteps: [],
        timestamp: new Date().toISOString(),
        metadata: {
          checkpointType: 'manual',
          reason,
        },
      };

      // Create checkpoint
      const checkpoint = await this.checkpointManager.createCheckpoint(context);

      const elapsed = Date.now() - startTime;

      this.log('Manual checkpoint created', {
        id: checkpoint.id,
        reason,
        elapsed: `${elapsed}ms`,
      });

      // Return confirmation
      return {
        success: true,
        checkpoint_id: checkpoint.id,
        reason,
        timestamp: checkpoint.timestamp,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'force-checkpoint');
    }
  }
}
