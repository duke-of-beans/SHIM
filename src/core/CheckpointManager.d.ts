import { Checkpoint, CheckpointTrigger } from '../models/Checkpoint';
import { SignalCollector, CrashRisk } from './SignalCollector';
import { CheckpointRepository } from './CheckpointRepository';
export interface CheckpointManagerConfig {
    signalCollector: SignalCollector;
    checkpointRepo: CheckpointRepository;
    toolCallInterval?: number;
    timeIntervalMs?: number;
}
export interface TriggerCheckResult {
    shouldTrigger: boolean;
    reason: CheckpointTrigger | null;
    risk: CrashRisk;
}
export interface CreateCheckpointInput {
    sessionId: string;
    trigger: CheckpointTrigger;
    operation: string;
    progress: number;
    userPreferences?: string;
}
export interface AutoCheckpointResult {
    created: boolean;
    checkpoint: Checkpoint | null;
    reason: CheckpointTrigger | null;
}
export interface CheckpointStats {
    totalCheckpoints: number;
    lastCheckpoint: Checkpoint | null;
}
/**
 * CheckpointManager - Intelligent checkpoint triggering and creation
 *
 * Responsibilities:
 * - Detect when checkpoints should be created based on multiple triggers
 * - Prioritize triggers (danger > warning > intervals)
 * - Create and save checkpoints with full state
 * - Reset counters after checkpoint creation
 * - Provide auto-checkpoint workflow
 */
export declare class CheckpointManager {
    private signalCollector;
    private checkpointRepo;
    private toolCallInterval;
    private timeIntervalMs;
    private lastCheckpointTime;
    constructor(config: CheckpointManagerConfig);
    /**
     * Check if checkpoint should be triggered
     */
    shouldTriggerCheckpoint(): TriggerCheckResult;
    /**
     * Create a checkpoint
     */
    createCheckpoint(input: CreateCheckpointInput): Promise<Checkpoint>;
    /**
     * Auto-checkpoint workflow: check trigger and create if needed
     */
    autoCheckpoint(input: Omit<CreateCheckpointInput, 'trigger'>): Promise<AutoCheckpointResult>;
    /**
     * Get checkpoint statistics for a session
     */
    getCheckpointStats(sessionId: string): Promise<CheckpointStats>;
}
//# sourceMappingURL=CheckpointManager.d.ts.map