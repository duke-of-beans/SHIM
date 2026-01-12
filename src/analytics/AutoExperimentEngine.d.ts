/**
 * AutoExperimentEngine - Autonomous experiment orchestration
 *
 * The "conductor" that makes SHIM self-improving by orchestrating
 * the complete Kaizen loop automatically.
 *
 * Responsibilities:
 * - Continuous metrics monitoring
 * - Automatic opportunity detection
 * - Experiment creation from patterns
 * - Progress monitoring
 * - Safety validation
 * - Auto-deployment of winners
 * - Rollback on violations
 * - Improvement reporting
 *
 * Kaizen Loop:
 * 1. Monitor metrics continuously
 * 2. Detect improvement opportunities
 * 3. Create A/B experiments
 * 4. Validate safety bounds
 * 5. Monitor experiment progress
 * 6. Deploy winners automatically
 * 7. Rollback on regressions
 * 8. Report improvements
 *
 * Zero human intervention required!
 */
import { EventEmitter } from 'events';
import { SHIMMetrics } from './SHIMMetrics';
import { OpportunityDetector, Opportunity } from './OpportunityDetector';
import { StatsigIntegration, ExperimentConfig } from './StatsigIntegration';
import { SafetyBounds, BoundConfig } from './SafetyBounds';
export interface EngineConfig {
    metrics: SHIMMetrics;
    detector: OpportunityDetector;
    statsig: StatsigIntegration;
    safety: SafetyBounds;
    detectionInterval?: number;
    minSampleSize?: number;
    maxConcurrentExperiments?: number;
    deploymentThreshold?: number;
    maxRetries?: number;
}
export interface EngineStatus {
    running: boolean;
    paused: boolean;
    initialized: boolean;
    uptime: number;
    lastDetectionCycle: string;
    lastSafetyCheck: string;
    lastProgressCheck: string;
}
export interface ExperimentStatus {
    active: number;
    completed: number;
    rollbacks: number;
    deploymentsCompleted: number;
}
export interface AutoExperimentEngineEvents {
    started: () => void;
    stopped: () => void;
    paused: () => void;
    resumed: () => void;
    detection_cycle: () => void;
    detection_skipped: (reason: string) => void;
    opportunities_detected: (opportunities: Opportunity[]) => void;
    experiment_created: (experiment: ExperimentConfig) => void;
    experiment_rejected: (data: {
        opportunity: Opportunity;
        reason: string;
    }) => void;
    max_experiments_reached: () => void;
    safety_check: () => void;
    safety_violation: (violations: any[]) => void;
    auto_rollback: (data: {
        experiment: ExperimentConfig;
        reason: string;
    }) => void;
    progress_check: () => void;
    progress_update: (status: ExperimentStatus) => void;
    auto_deployed: (result: any) => void;
    deployment_rejected: (data: {
        experiment: ExperimentConfig;
        reason: string;
    }) => void;
    error: (error: any) => void;
}
export declare interface AutoExperimentEngine {
    on<K extends keyof AutoExperimentEngineEvents>(event: K, listener: AutoExperimentEngineEvents[K]): this;
    emit<K extends keyof AutoExperimentEngineEvents>(event: K, ...args: Parameters<AutoExperimentEngineEvents[K]>): boolean;
}
export declare class AutoExperimentEngine extends EventEmitter {
    private metrics;
    private detector;
    private statsig;
    private safety;
    private config;
    private running;
    private paused;
    private initialized;
    private detectionTimer?;
    private safetyTimer?;
    private progressTimer?;
    private activeExperiments;
    private completedExperiments;
    private rollbackedExperiments;
    private startTime?;
    private lastDetectionCycle?;
    private lastSafetyCheck?;
    private lastProgressCheck?;
    private stats;
    constructor(config: EngineConfig);
    /**
     * Get current configuration
     */
    getConfig(): {
        detectionInterval: number;
        minSampleSize: number;
        maxConcurrentExperiments: number;
        deploymentThreshold: number;
        maxRetries: number;
    };
    /**
     * Initialize engine
     */
    initialize(): Promise<boolean>;
    /**
     * Start engine
     */
    start(): Promise<boolean>;
    /**
     * Stop engine
     */
    stop(): Promise<boolean>;
    /**
     * Pause engine (keep running, stop cycles)
     */
    pause(): Promise<void>;
    /**
     * Resume engine
     */
    resume(): Promise<void>;
    /**
     * Check if running
     */
    isRunning(): boolean;
    /**
     * Check if paused
     */
    isPaused(): boolean;
    /**
     * Get engine status
     */
    getStatus(): EngineStatus;
    /**
     * Get experiment status
     */
    getExperimentStatus(): ExperimentStatus;
    /**
     * Get active experiments
     */
    getActiveExperiments(): ExperimentConfig[];
    /**
     * Start detection loop
     */
    private startDetectionLoop;
    /**
     * Start safety loop
     */
    private startSafetyLoop;
    /**
     * Start progress loop
     */
    private startProgressLoop;
    /**
     * Run detection cycle
     */
    runDetectionCycle(): Promise<void>;
    /**
     * Run safety check
     */
    runSafetyCheck(): Promise<void>;
    /**
     * Run progress check
     */
    runProgressCheck(): Promise<void>;
    /**
     * Create experiments from opportunities
     */
    private createExperimentsFromOpportunities;
    /**
     * Perform auto-rollback
     */
    private performAutoRollback;
    /**
     * Check for ready deployments
     */
    private checkForDeployments;
    /**
     * Check if new metrics available
     */
    private hasNewMetrics;
    /**
     * Update detection interval
     */
    setDetectionInterval(interval: number): void;
    /**
     * Update safety bounds
     */
    updateSafetyBounds(bounds: BoundConfig): void;
    /**
     * Update deployment threshold
     */
    setDeploymentThreshold(threshold: number): void;
    /**
     * Generate status report
     */
    generateStatusReport(): object;
    /**
     * Generate improvement report
     */
    generateImprovementReport(): object;
    /**
     * Calculate ROI
     */
    calculateROI(): object;
    /**
     * Calculate crash reduction
     */
    private calculateCrashReduction;
    /**
     * Calculate performance gain
     */
    private calculatePerformanceGain;
    /**
     * Calculate token savings
     */
    private calculateTokenSavings;
}
//# sourceMappingURL=AutoExperimentEngine.d.ts.map