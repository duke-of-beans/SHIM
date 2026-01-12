"use strict";
/**
 * AutonomousOrchestrator
 *
 * Coordinate 24/7 autonomous goal execution.
 * Orchestrates decomposition → tracking → reporting cycle.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 4/8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousOrchestrator = void 0;
const GoalDecomposer_1 = require("./GoalDecomposer");
const ProgressTracker_1 = require("./ProgressTracker");
const GoalReporter_1 = require("./GoalReporter");
class AutonomousOrchestrator {
    state;
    decomposer;
    tracker;
    reporter;
    config;
    currentGoal;
    cyclesCompleted;
    startedAt;
    lastCycleAt;
    executionTimer;
    maxCycles;
    constructor(config = {}) {
        this.state = 'stopped';
        this.decomposer = new GoalDecomposer_1.GoalDecomposer();
        this.tracker = new ProgressTracker_1.ProgressTracker();
        this.reporter = new GoalReporter_1.GoalReporter();
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
    getState() {
        return this.state;
    }
    /**
     * Start autonomous execution
     */
    async start(goal, options = {}) {
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
        }
        catch (error) {
            // If already tracking, that's okay (allows restart)
            // Just continue with existing tracking
        }
        // Start execution loop
        this.scheduleNextCycle();
    }
    /**
     * Stop autonomous execution
     */
    async stop() {
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
    async pause() {
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
    async resume() {
        if (this.state !== 'paused') {
            throw new Error('Orchestrator is not paused');
        }
        this.state = 'running';
        this.scheduleNextCycle();
    }
    /**
     * Get execution status
     */
    getStatus() {
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
    getProgress(goalId) {
        return this.tracker.getProgress(goalId);
    }
    /**
     * Generate report for a goal
     */
    generateReport(goalId, format) {
        return this.reporter.generateReport(goalId, this.tracker, format);
    }
    /**
     * Schedule next execution cycle
     */
    scheduleNextCycle() {
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
    executeCycle() {
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
        }
        catch (error) {
            // Log error but continue execution
            console.error('Error in execution cycle:', error);
            // Continue scheduling next cycle
            this.scheduleNextCycle();
        }
    }
}
exports.AutonomousOrchestrator = AutonomousOrchestrator;
//# sourceMappingURL=AutonomousOrchestrator.js.map