/**
 * Force Checkpoint Handler
 * 
 * Manually creates a checkpoint on user request.
 * Use when user explicitly asks to "save checkpoint" or before risky operations.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { CheckpointManager } from '../../core/CheckpointManager.js';
import { CheckpointRepository } from '../../core/CheckpointRepository.js';
import { SignalCollector } from '../../core/SignalCollector.js';
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
    
    const dbPath = path.join(process.cwd(), 'data', 'shim.db');
    
    // Initialize repository
    const repository = new CheckpointRepository(dbPath);
    repository.initialize().catch(err => {
      this.log('Failed to initialize repository', { error: err });
    });
    
    // Initialize signal collector
    const signalCollector = new SignalCollector();
    
    // Initialize checkpoint manager
    this.checkpointManager = new CheckpointManager({
      signalCollector,
      checkpointRepo: repository,
      toolCallInterval: 5,
      timeIntervalMs: 10 * 60 * 1000
    });
    
    // Generate session ID (persists for this MCP server instance)
    this.sessionId = uuidv4();
    
    this.log('Force Checkpoint Handler initialized');
  }

  async execute(args: ForceCheckpointArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      const reason = args.reason || 'Manual checkpoint requested';

      // Create checkpoint using CreateCheckpointInput
      const checkpoint = await this.checkpointManager.createCheckpoint({
        sessionId: this.sessionId,
        trigger: 'user_requested',
        operation: `Manual checkpoint: ${reason}`,
        progress: 0.5,
        userPreferences: undefined
      });

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
        checkpoint_number: checkpoint.checkpointNumber,
        reason,
        created_at: checkpoint.createdAt,
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'force-checkpoint');
    }
  }
}
