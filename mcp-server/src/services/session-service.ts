/**
 * Session Service - Provides session status information
 * 
 * Aggregates data from all services to show current SHIM status
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// @ts-ignore - CommonJS build doesn't support import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHIM_ROOT = join(__dirname, '..', '..', '..');
const CHECKPOINT_DIR = join(SHIM_ROOT, 'data', 'checkpoints');

export interface SessionStatus {
  lastCheckpoint: string | null;
  sessionDuration: number;
  checkpointsCount: number;
  recoveryAvailable: boolean;
  signals: {
    riskLevel: number;
    activeSignals: string[];
  };
}

export class SessionService {
  private sessionStartTime: number = Date.now();

  async getStatus(): Promise<SessionStatus> {
    try {
      const fs = await import('fs/promises');

      // Get checkpoints
      let checkpointsCount = 0;
      let lastCheckpoint: string | null = null;
      let recoveryAvailable = false;

      try {
        const files = await fs.readdir(CHECKPOINT_DIR);
        const checkpointFiles = files.filter((f: string) => f.endsWith('.json'));
        checkpointsCount = checkpointFiles.length;

        if (checkpointFiles.length > 0) {
          const sortedFiles = checkpointFiles.sort().reverse();
          const latestFile = sortedFiles[0];
          
          // Read to get timestamp
          const content = await fs.readFile(join(CHECKPOINT_DIR, latestFile), 'utf-8');
          const checkpoint = JSON.parse(content);
          
          const checkpointTime = new Date(checkpoint.timestamp);
          const now = new Date();
          const minutesAgo = Math.floor((now.getTime() - checkpointTime.getTime()) / (1000 * 60));
          
          lastCheckpoint = `${minutesAgo} minutes ago`;

          // Check if recent enough for recovery
          recoveryAvailable = minutesAgo < 1440; // Within 24 hours
        }
      } catch {
        // Checkpoint directory doesn't exist or is empty
      }

      // Calculate session duration
      const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / (1000 * 60));

      return {
        lastCheckpoint,
        sessionDuration,
        checkpointsCount,
        recoveryAvailable,
        signals: {
          riskLevel: 0, // Will integrate with SignalService
          activeSignals: []
        }
      };
    } catch (error) {
      console.error('❌ Status check failed:', error);
      throw error;
    }
  }
}

