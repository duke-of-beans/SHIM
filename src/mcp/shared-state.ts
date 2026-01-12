/**
 * Shared State Management
 * 
 * Singleton repositories shared across all MCP handlers.
 * Ensures single database connection and proper initialization.
 */

import { CheckpointRepository } from '../core/CheckpointRepository.js';
import { SignalHistoryRepository } from '../core/SignalHistoryRepository.js';
import path from 'path';

/**
 * Shared repositories (singleton pattern)
 */
let checkpointRepo: CheckpointRepository | null = null;
let signalHistoryRepo: SignalHistoryRepository | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize shared repositories (call once on server startup)
 */
export async function initializeRepositories(dataDir: string = 'data'): Promise<void> {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const dbPath = path.join(process.cwd(), dataDir, 'shim.db');
    
    console.error('[SHIM MCP] Initializing shared repositories', { dbPath });

    // Create repositories
    checkpointRepo = new CheckpointRepository(dbPath);
    signalHistoryRepo = new SignalHistoryRepository(dbPath);

    // Initialize both
    await Promise.all([
      checkpointRepo.initialize(),
      signalHistoryRepo.initialize()
    ]);

    console.error('[SHIM MCP] Repositories initialized successfully');
  })();

  return initPromise;
}

/**
 * Get shared checkpoint repository
 */
export function getCheckpointRepository(): CheckpointRepository {
  if (!checkpointRepo) {
    throw new Error('Repositories not initialized. Call initializeRepositories() first.');
  }
  return checkpointRepo;
}

/**
 * Get shared signal history repository
 */
export function getSignalHistoryRepository(): SignalHistoryRepository {
  if (!signalHistoryRepo) {
    throw new Error('Repositories not initialized. Call initializeRepositories() first.');
  }
  return signalHistoryRepo;
}
