import { Checkpoint, CheckpointTrigger } from '../models/Checkpoint';
import { SignalCollector, CrashRisk } from './SignalCollector';
import { CheckpointRepository } from './CheckpointRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CheckpointManagerConfig {
  signalCollector: SignalCollector;
  checkpointRepo: CheckpointRepository;
  toolCallInterval?: number;      // Default: 5 tool calls
  timeIntervalMs?: number;         // Default: 10 minutes
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
export class CheckpointManager {
  private signalCollector: SignalCollector;
  private checkpointRepo: CheckpointRepository;
  private toolCallInterval: number;
  private timeIntervalMs: number;
  private lastCheckpointTime: number;

  constructor(config: CheckpointManagerConfig) {
    this.signalCollector = config.signalCollector;
    this.checkpointRepo = config.checkpointRepo;
    this.toolCallInterval = config.toolCallInterval ?? 5;
    this.timeIntervalMs = config.timeIntervalMs ?? 10 * 60 * 1000; // 10 minutes
    this.lastCheckpointTime = Date.now();
  }

  /**
   * Check if checkpoint should be triggered
   */
  shouldTriggerCheckpoint(): TriggerCheckResult {
    const signals = this.signalCollector.getSignals();
    const risk = this.signalCollector.getCrashRisk();

    // Priority 1: Danger zone (immediate risk)
    if (risk === 'danger') {
      return {
        shouldTrigger: true,
        reason: 'danger_zone',
        risk
      };
    }

    // Priority 2: Warning zone
    if (risk === 'warning') {
      return {
        shouldTrigger: true,
        reason: 'warning_zone',
        risk
      };
    }

    // Priority 3: Tool call interval
    if (signals.toolCallsSinceCheckpoint >= this.toolCallInterval) {
      return {
        shouldTrigger: true,
        reason: 'tool_call_interval',
        risk
      };
    }

    // Priority 4: Time interval
    const timeSinceLastCheckpoint = Date.now() - this.lastCheckpointTime;
    if (timeSinceLastCheckpoint >= this.timeIntervalMs) {
      return {
        shouldTrigger: true,
        reason: 'time_interval',
        risk
      };
    }

    // No trigger
    return {
      shouldTrigger: false,
      reason: null,
      risk
    };
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(input: CreateCheckpointInput): Promise<Checkpoint> {
    const signals = this.signalCollector.getSignals();
    const _risk = this.signalCollector.getCrashRisk();

    const checkpoint: Checkpoint = {
      id: uuidv4(),
      sessionId: input.sessionId,
      checkpointNumber: 0, // Will be set by repository
      createdAt: new Date().toISOString(),
      triggeredBy: input.trigger,
      
      // Conversation state
      conversationState: {
        summary: `Operation: ${input.operation}`,
        keyDecisions: [],
        currentContext: `Progress: ${Math.round(input.progress * 100)}%`,
        recentMessages: []
      },
      
      // Task state
      taskState: {
        operation: input.operation,
        phase: input.progress < 0.5 ? 'in-progress' : 'near-completion',
        progress: input.progress,
        completedSteps: [],
        nextSteps: [],
        blockers: []
      },
      
      // File state
      fileState: {
        activeFiles: [],
        modifiedFiles: [],
        stagedFiles: [],
        uncommittedDiff: ''
      },
      
      // Tool state
      toolState: {
        activeSessions: [],
        pendingOperations: [],
        recentToolCalls: []
      },
      
      // Signals
      signals: signals,
      
      // User preferences
      userPreferences: {
        customInstructions: input.userPreferences,
        recentPreferences: undefined
      }
    };

    // Save to repository
    await this.checkpointRepo.save(checkpoint);

    // Reset counters
    this.signalCollector.resetCheckpointCounter();
    this.lastCheckpointTime = Date.now();

    return checkpoint;
  }

  /**
   * Auto-checkpoint workflow: check trigger and create if needed
   */
  async autoCheckpoint(input: Omit<CreateCheckpointInput, 'trigger'>): Promise<AutoCheckpointResult> {
    const triggerCheck = this.shouldTriggerCheckpoint();

    if (!triggerCheck.shouldTrigger || !triggerCheck.reason) {
      return {
        created: false,
        checkpoint: null,
        reason: null
      };
    }

    const checkpoint = await this.createCheckpoint({
      ...input,
      trigger: triggerCheck.reason
    });

    return {
      created: true,
      checkpoint,
      reason: triggerCheck.reason
    };
  }

  /**
   * Get checkpoint statistics for a session
   */
  async getCheckpointStats(sessionId: string): Promise<CheckpointStats> {
    const checkpoints = await this.checkpointRepo.listBySession(sessionId);
    
    return {
      totalCheckpoints: checkpoints.length,
      lastCheckpoint: checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null
    };
  }
}
