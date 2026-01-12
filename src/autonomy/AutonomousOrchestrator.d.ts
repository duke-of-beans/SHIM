/**
 * AutonomousOrchestrator
 *
 * Coordinate 24/7 autonomous goal execution.
 * Orchestrates decomposition → tracking → reporting cycle.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 4/8
 */
import { Goal } from './GoalDecomposer';
import { ReportFormat } from './GoalReporter';
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
export declare class AutonomousOrchestrator {
    private state;
    private decomposer;
    private tracker;
    private reporter;
    private config;
    private currentGoal;
    private cyclesCompleted;
    private startedAt;
    private lastCycleAt;
    private executionTimer;
    private maxCycles;
    constructor(config?: OrchestratorConfig);
    /**
     * Get current execution state
     */
    getState(): ExecutionState;
    /**
     * Start autonomous execution
     */
    start(goal: Goal, options?: ExecutionOptions): Promise<void>;
    /**
     * Stop autonomous execution
     */
    stop(): Promise<void>;
    /**
     * Pause autonomous execution
     */
    pause(): Promise<void>;
    /**
     * Resume autonomous execution
     */
    resume(): Promise<void>;
    /**
     * Get execution status
     */
    getStatus(): ExecutionStatus;
    /**
     * Get progress for a goal
     */
    getProgress(goalId: string): import("./ProgressTracker").GoalProgress;
    /**
     * Generate report for a goal
     */
    generateReport(goalId: string, format: ReportFormat): string;
    /**
     * Schedule next execution cycle
     */
    private scheduleNextCycle;
    /**
     * Execute one cycle of the orchestration loop
     */
    private executeCycle;
}
//# sourceMappingURL=AutonomousOrchestrator.d.ts.map