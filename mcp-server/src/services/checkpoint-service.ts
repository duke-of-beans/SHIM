/**
 * Checkpoint Service - Integrates with SHIM CheckpointManager
 * 
 * Handles automatic and manual checkpoint creation
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to main SHIM project
const SHIM_ROOT = join(__dirname, '..', '..', '..');
const DATA_DIR = join(SHIM_ROOT, 'data', 'checkpoints');

export interface CheckpointData {
  currentTask: string;
  progress: number;
  decisions: string[];
  activeFiles: string[];
  nextSteps: string[];
}

export interface CheckpointResult {
  checkpointId: string;
  elapsedTime: number;
}

export class CheckpointService {
  private lastCheckpointTime: number = Date.now();
  private checkpointCount: number = 0;

  async createCheckpoint(data: CheckpointData): Promise<CheckpointResult> {
    const startTime = Date.now();
    
    // Generate checkpoint ID
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const checkpointId = `session-${timestamp}`;

    // Create checkpoint object
    const checkpoint = {
      checkpoint_id: checkpointId,
      timestamp: new Date().toISOString(),
      current_task: data.currentTask,
      progress: data.progress,
      decisions: data.decisions,
      active_files: data.activeFiles,
      next_steps: data.nextSteps,
      tool_calls: this.checkpointCount,
      duration_minutes: Math.floor((Date.now() - this.lastCheckpointTime) / 60000),
    };

    // Import dynamically to avoid initialization issues
    const fs = await import('node:fs/promises');
    
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write checkpoint
    const checkpointPath = join(DATA_DIR, `${checkpointId}.json`);
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

    // Update state
    this.checkpointCount++;
    this.lastCheckpointTime = Date.now();

    const elapsedTime = Date.now() - startTime;

    // Log to stderr (stdout reserved for MCP protocol)
    console.error(`✅ Checkpoint saved: ${checkpointId} (${elapsedTime}ms)`);

    return {
      checkpointId,
      elapsedTime
    };
  }

  async forceCheckpoint(reason?: string): Promise<CheckpointResult> {
    // For manual checkpoints, create a minimal checkpoint
    return this.createCheckpoint({
      currentTask: reason || 'Manual checkpoint',
      progress: 0,
      decisions: [],
      activeFiles: [],
      nextSteps: []
    });
  }
}

