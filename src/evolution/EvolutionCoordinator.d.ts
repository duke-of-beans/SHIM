/**
 * EvolutionCoordinator - Autonomous System Evolution
 *
 * Coordinates continuous improvement across all SHIM components.
 *
 * Manages evolution of:
 * - Crash prediction models
 * - Model routing strategies
 * - Load balancing algorithms
 * - Prompt analysis heuristics
 * - Checkpoint strategies
 *
 * Features:
 * - Multi-area experiment coordination
 * - Priority-based scheduling
 * - Version management with rollback
 * - Cross-area learning
 * - Impact analysis
 * - Comprehensive reporting
 *
 * Example:
 * ```typescript
 * const coordinator = new EvolutionCoordinator({
 *   maxConcurrentExperiments: 3,
 *   minExperimentGap: 86400000 // 24 hours
 * });
 *
 * // Register areas
 * await coordinator.registerArea({
 *   name: 'crash_prediction',
 *   currentVersion: '1.0.0',
 *   metrics: ['accuracy', 'latency'],
 *   priority: 1
 * });
 *
 * // Start evolution
 * await coordinator.start();
 *
 * // System now autonomously improves crash prediction!
 * ```
 */
export interface CoordinatorConfig {
    maxConcurrentExperiments?: number;
    minExperimentGap?: number;
}
export interface EvolutionArea {
    name: string;
    currentVersion: string;
    metrics: string[];
    priority?: number;
    baselineMetrics?: Record<string, number>;
}
export interface EvolutionStatus {
    area: string;
    currentVersion: string;
    activeExperiments: number;
    totalExperiments: number;
    successRate: number;
    lastExperiment?: number;
}
export interface Experiment {
    id: string;
    area: string;
    hypothesis: string;
    treatment: any;
    startedAt: number;
    paused?: boolean;
}
export interface VersionInfo {
    version: string;
    timestamp: number;
    improvement?: number;
    metrics?: Record<string, number>;
}
export interface ImprovementReport {
    area: string;
    currentVersion: string;
    totalExperiments: number;
    successfulExperiments: number;
    successRate: number;
    totalImprovement: number;
}
export interface EvolutionSummary {
    totalAreas: number;
    totalExperiments: number;
    overallSuccessRate: number;
    areas: Record<string, ImprovementReport>;
}
export declare class EvolutionCoordinator {
    private config;
    private areas;
    private experiments;
    private running;
    constructor(config: CoordinatorConfig);
    /**
     * Get configuration
     */
    getConfig(): {
        maxConcurrentExperiments: number;
        minExperimentGap: number;
    };
    /**
     * Register evolution area
     */
    registerArea(area: EvolutionArea): Promise<void>;
    /**
     * List all evolution areas
     */
    listAreas(): Promise<string[]>;
    /**
     * Get area status
     */
    getAreaStatus(areaName: string): Promise<EvolutionStatus>;
    /**
     * Get next experiment to run (priority-based)
     */
    getNextExperiment(): Promise<{
        area: string;
    } | null>;
    /**
     * Start experiment
     */
    startExperiment(areaName: string, config: {
        hypothesis: string;
        treatment: any;
    }): Promise<string>;
    /**
     * Complete experiment
     */
    completeExperiment(areaName: string, result: {
        success: boolean;
        improvement?: number;
        newVersion?: string;
    }): Promise<void>;
    /**
     * Rollback experiment
     */
    rollbackExperiment(areaName: string, reason: {
        reason: string;
    }): Promise<void>;
    /**
     * Get active experiments
     */
    getActiveExperiments(): Promise<Experiment[]>;
    /**
     * Upgrade version
     */
    upgradeVersion(areaName: string, newVersion: string, metadata: {
        improvement?: number;
    }): Promise<void>;
    /**
     * Get version history
     */
    getVersionHistory(areaName: string): Promise<VersionInfo[]>;
    /**
     * Rollback to version
     */
    rollbackToVersion(areaName: string, version: string): Promise<void>;
    /**
     * Generate report for area
     */
    generateReport(areaName: string): Promise<ImprovementReport>;
    /**
     * Generate overall summary
     */
    generateSummary(): Promise<EvolutionSummary>;
    /**
     * Start coordinator
     */
    start(): Promise<void>;
    /**
     * Stop coordinator
     */
    stop(): Promise<void>;
    /**
     * Check if running
     */
    isRunning(): boolean;
    /**
     * Pause all experiments
     */
    pauseAll(): Promise<void>;
    /**
     * Resume all experiments
     */
    resumeAll(): Promise<void>;
}
//# sourceMappingURL=EvolutionCoordinator.d.ts.map