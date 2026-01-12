/**
 * Shared State Management
 *
 * Singleton repositories shared across all MCP handlers.
 * Ensures single database connection and proper initialization.
 */
import { CheckpointRepository } from '../core/CheckpointRepository.js';
import { SignalHistoryRepository } from '../core/SignalHistoryRepository.js';
/**
 * Initialize shared repositories (call once on server startup)
 */
export declare function initializeRepositories(dataDir?: string): Promise<void>;
/**
 * Get shared checkpoint repository
 */
export declare function getCheckpointRepository(): CheckpointRepository;
/**
 * Get shared signal history repository
 */
export declare function getSignalHistoryRepository(): SignalHistoryRepository;
//# sourceMappingURL=shared-state.d.ts.map