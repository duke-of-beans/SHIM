"use strict";
/**
 * Shared State Management
 *
 * Singleton repositories shared across all MCP handlers.
 * Ensures single database connection and proper initialization.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRepositories = initializeRepositories;
exports.getCheckpointRepository = getCheckpointRepository;
exports.getSignalHistoryRepository = getSignalHistoryRepository;
const CheckpointRepository_js_1 = require("../core/CheckpointRepository.js");
const SignalHistoryRepository_js_1 = require("../core/SignalHistoryRepository.js");
const path_1 = __importDefault(require("path"));
/**
 * Shared repositories (singleton pattern)
 */
let checkpointRepo = null;
let signalHistoryRepo = null;
let initPromise = null;
/**
 * Initialize shared repositories (call once on server startup)
 */
async function initializeRepositories(dataDir = 'data') {
    // Return existing promise if already initializing
    if (initPromise) {
        return initPromise;
    }
    initPromise = (async () => {
        const dbPath = path_1.default.join(process.cwd(), dataDir, 'shim.db');
        console.error('[SHIM MCP] Initializing shared repositories', { dbPath });
        // Create repositories
        checkpointRepo = new CheckpointRepository_js_1.CheckpointRepository(dbPath);
        signalHistoryRepo = new SignalHistoryRepository_js_1.SignalHistoryRepository(dbPath);
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
function getCheckpointRepository() {
    if (!checkpointRepo) {
        throw new Error('Repositories not initialized. Call initializeRepositories() first.');
    }
    return checkpointRepo;
}
/**
 * Get shared signal history repository
 */
function getSignalHistoryRepository() {
    if (!signalHistoryRepo) {
        throw new Error('Repositories not initialized. Call initializeRepositories() first.');
    }
    return signalHistoryRepo;
}
//# sourceMappingURL=shared-state.js.map