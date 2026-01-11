/**
 * AutonomousOrchestrator
 *
 * Coordinate 24/7 autonomous goal execution.
 * Orchestrates decomposition → tracking → reporting cycle.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 4/8
 */

import { GoalDecomposer, Goal } from './GoalDecomposer';
import { ProgressTracker } from './ProgressTracker';
import { GoalReporter, ReportFormat } from './GoalReporter';

export type ExecutionState = 'stopped' | 'running' | 'paused';

export interface OrchestratorConfig {
  executionIntervalMs?: number;
}

export interface ExecutionOptions {
  maxCycles?: number;
}

export interface ExecutionStatus {
  state: ExecutionState;
  currentGoal: string | null;
  cyclesCompleted: number;
  startedAt: Date | null;
  uptimeMs: number;
  lastCycleAt: Date | null;
}

export class AutonomousOrchestrator {
  private state: ExecutionState;
  private decomposer: GoalDecomposer;
  private tracker: ProgressTracker;
  private reporter: GoalReporter;
  private config: Required<OrchestratorConfig>;
  
  private currentGoal: Goal | null;
  private cyclesCompleted: number;
  private startedAt: Date | null;
  private lastCycleAt: Date | null;
  private executionTimer: NodeJS.Timeout | null;
  private maxCycles: number | null;

  constructor(config: OrchestratorConfig = {}) {
    this.state = 'stopped';
    this.decomposer = new GoalDecomposer();
    this.tracker = new ProgressTracker();
    this.reporter = new GoalReporter();
    
    this.config = {
      executionIntervalMs: config.executionIntervalMs ?? 100,
    };

    this.currentGoal = null;
    this.cyclesCompleted = 0;
    this.startedAt = null;
    this.lastCycleAt = null;
    this.executionTimer = null;
    this.maxCycles = null;
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionState {
    return this.state;
  }

  /**
   * Start autonomous execution
   */
  async start(goal: Goal, options: ExecutionOptions = {}): Promise<void> {
    if (this.state === 'running') {
      throw new Error('Orchestrator is already running');
    }

    this.currentGoal = goal;
    this.cyclesCompleted = 0;
    this.startedAt = new Date();
    this.maxCycles = options.maxCycles ?? null;
    this.state = 'running';

    // Initialize tracking (only if not already tracked)
    const decomposition = await this.decomposer.decompose(goal);
    try {
      this.tracker.startTracking(goal.id, decomposition);
    } catch (error) {
      // If already tracking, that's okay (allows restart)
      // Just continue with existing tracking
    }

    // Start execution loop
    this.scheduleNextCycle();
  }

  /**
   * Stop autonomous execution
   */
  async stop(): Promise<void> {
    if (this.state === 'stopped') {
      throw new Error('Orchestrator is already stopped');
    }

    this.state = 'stopped';
    
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
      this.executionTimer = null;
    }

    this.currentGoal = null;
  }

  /**
   * Pause autonomous execution
   */
  async pause(): Promise<void> {
    if (this.state !== 'running') {
      throw new Error('Orchestrator is not running');
    }

    this.state = 'paused';
    
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
      this.executionTimer = null;
    }
  }

  /**
   * Resume autonomous execution
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      throw new Error('Orchestrator is not paused');
    }

    this.state = 'running';
    this.scheduleNextCycle();
  }

  /**
   * Get execution status
   */
  getStatus(): ExecutionStatus {
    const uptimeMs = this.startedAt 
      ? Date.now() - this.startedAt.getTime()
      : 0;

    return {
      state: this.state,
      currentGoal: this.currentGoal?.id ?? null,
      cyclesCompleted: this.cyclesCompleted,
      startedAt: this.startedAt,
      uptimeMs,
      lastCycleAt: this.lastCycleAt,
    };
  }

  /**
   * Get progress for a goal
   */
  getProgress(goalId: string) {
    return this.tracker.getProgress(goalId);
  }

  /**
   * Generate report for a goal
   */
  generateReport(goalId: string, format: ReportFormat): string {
    return this.reporter.generateReport(goalId, this.tracker, format);
  }

  /**
   * Schedule next execution cycle
   */
  private scheduleNextCycle(): void {
    if (this.state !== 'running') {
      return;
    }

    this.executionTimer = setTimeout(() => {
      this.executeCycle();
    }, this.config.executionIntervalMs);
  }

  /**
   * Execute one cycle of the orchestration loop
   */
  private executeCycle(): void {
    if (this.state !== 'running' || !this.currentGoal) {
      return;
    }

    try {
      // In a real implementation, this would:
      // 1. Check progress
      // 2. Execute next sub-goal if needed
      // 3. Update tracking
      // 4. Generate reports
      
      // For now, we just mark the cycle as complete
      this.cyclesCompleted++;
      this.lastCycleAt = new Date();

      // Check if we've hit max cycles
      if (this.maxCycles !== null && this.cyclesCompleted >= this.maxCycles) {
        this.state = 'stopped';
        if (this.executionTimer) {
          clearTimeout(this.executionTimer);
          this.executionTimer = null;
        }
        return;
      }

      // Schedule next cycle
      this.scheduleNextCycle();
    } catch (error) {
      // Log error but continue execution
      console.error('Error in execution cycle:', error);
      
      // Continue scheduling next cycle
      this.scheduleNextCycle();
    }
  }
}
