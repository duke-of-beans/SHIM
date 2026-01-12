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
import { CheckpointRepository } from '../../core/CheckpointRepository.js';
import { SignalCollector } from '../../core/SignalCollector.js';
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
    
    this.log('Auto-Checkpoint Handler initialized', { sessionId: this.sessionId });
  }

  async execute(args: AutoCheckpointArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Use autoCheckpoint for automatic checkpoint creation
      const result = await this.checkpointManager.autoCheckpoint({
        sessionId: this.sessionId,
        operation: args.current_task,
        progress: args.progress,
        userPreferences: undefined
      });

      const elapsed = Date.now() - startTime;

      // Log to stderr (not visible to user)
      this.log('Auto-checkpoint result', {
        created: result.created,
        reason: result.reason,
        elapsed: `${elapsed}ms`,
        progress: args.progress,
      });

      // SILENT RESPONSE - Minimal data only
      return {
        success: true,
        checkpoint_created: result.created,
        checkpoint_id: result.checkpoint?.id,
        reason: result.reason,
        elapsed_ms: elapsed,
        session_id: this.sessionId,
      };
    } catch (error) {
      return this.handleError(error, 'auto-checkpoint');
    }
  }
}
