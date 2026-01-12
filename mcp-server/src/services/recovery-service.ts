/**
 * Recovery Service - Detects and manages session recovery
 * 
 * Checks for incomplete sessions and provides recovery information
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHIM_ROOT = join(__dirname, '..', '..', '..');
const CHECKPOINT_DIR = join(SHIM_ROOT, 'data', 'checkpoints');

export interface RecoveryInfo {
  available: boolean;
  summary?: string;
  timestamp?: string;
  checkpointId?: string;
}

export class RecoveryService {
  async checkRecovery(): Promise<RecoveryInfo> {
    try {
      const fs = await import('node:fs/promises');
      
      // Check if checkpoints directory exists
      try {
        await fs.access(CHECKPOINT_DIR);
      } catch {
        // No checkpoints directory = no recovery available
        return { available: false };
      }

      // Get all checkpoint files
      const files = await fs.readdir(CHECKPOINT_DIR);
      const checkpointFiles = files.filter((f: string) => f.endsWith('.json'));

      if (checkpointFiles.length === 0) {
        return { available: false };
      }

      // Get most recent checkpoint
      const sortedFiles = checkpointFiles.sort().reverse();
      const latestFile = sortedFiles[0];
      const checkpointPath = join(CHECKPOINT_DIR, latestFile);

      // Read checkpoint
      const content = await fs.readFile(checkpointPath, 'utf-8');
      const checkpoint = JSON.parse(content);

      // Check if checkpoint is recent (within last 24 hours)
      const checkpointTime = new Date(checkpoint.timestamp).getTime();
      const now = Date.now();
      const hoursSinceCheckpoint = (now - checkpointTime) / (1000 * 60 * 60);

      if (hoursSinceCheckpoint > 24) {
        // Too old, don't offer recovery
        return { available: false };
      }

      // Build summary
      const summary = `
Task: ${checkpoint.current_task}
Progress: ${Math.floor(checkpoint.progress * 100)}%
Last activity: ${new Date(checkpoint.timestamp).toLocaleString()}
      `.trim();

      console.error(`🔄 Recovery available: ${checkpoint.checkpoint_id}`);

      return {
        available: true,
        summary,
        timestamp: checkpoint.timestamp,
        checkpointId: checkpoint.checkpoint_id
      };
    } catch (error) {
      console.error('❌ Recovery check failed:', error);
      return { available: false };
    }
  }
}
