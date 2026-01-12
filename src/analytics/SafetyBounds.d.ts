/**
 * SafetyBounds - Safety enforcement for automated experimentation
 *
 * Purpose: Prevent regressions by enforcing quality/performance/cost bounds.
 *
 * Responsibilities:
 * - Define safety thresholds (crash rate, performance, quality, cost)
 * - Validate metrics against bounds
 * - Classify violation severity (warning vs critical)
 * - Recommend rollback on critical violations
 * - Monitor bounds in real-time
 * - Generate violation reports
 *
 * Integration:
 * 1. SafetyBounds validates experiments before deployment
 * 2. Monitors metrics during experiments
 * 3. Triggers rollback on critical violations
 * 4. Prevents unsafe auto-deployments
 */
import { EventEmitter } from 'events';
import { SHIMMetrics } from './SHIMMetrics';
import { ExperimentConfig } from './StatsigIntegration';
export type BoundType = 'crashRate' | 'checkpointTime' | 'resumeSuccessRate' | 'tokenCost' | 'restartTime' | 'modelAccuracy';
export interface BoundConfig {
    [key: string]: {
        max?: number;
        min?: number;
        maxIncrease?: number;
        critical?: number;
    };
}
export interface Violation {
    boundType: BoundType | string;
    currentValue: number;
    threshold: number;
    severity: 'warning' | 'critical';
    message: string;
    experimentId?: string;
    detectedAt: string;
}
export interface ValidationResult {
    passed: boolean;
    violations: Violation[];
    shouldRollback: boolean;
    rollbackReason?: string;
}
export declare class SafetyBounds extends EventEmitter {
    private config;
    private baseline;
    constructor(config: BoundConfig);
    /**
     * Get current configuration
     */
    getConfig(): BoundConfig;
    /**
     * Update bound threshold
     */
    updateBound(boundType: string, config: BoundConfig[string]): void;
    /**
     * Remove bound
     */
    removeBound(boundType: string): void;
    /**
     * Set baseline metrics for comparison
     */
    setBaseline(baseline: Record<string, number>): void;
    /**
     * Validate current metrics against bounds
     */
    validate(metrics: SHIMMetrics): Promise<ValidationResult>;
    /**
     * Validate experiment against bounds
     */
    validateExperiment(experiment: ExperimentConfig, metrics: SHIMMetrics): Promise<ValidationResult>;
    /**
     * Validate token cost increase
     */
    validateTokenCostIncrease(baseline: number, current: number): Promise<ValidationResult>;
    /**
     * Validate against baseline metrics
     */
    validateAgainstBaseline(metrics: SHIMMetrics): Promise<ValidationResult>;
    /**
     * Check individual bound
     */
    private checkBound;
    /**
     * Generate violation message
     */
    private generateViolationMessage;
    /**
     * Format value for display
     */
    private formatValue;
    /**
     * Generate rollback reason
     */
    private generateRollbackReason;
    /**
     * Generate violation report
     */
    generateReport(result: ValidationResult): string;
    /**
     * Get remediation suggestion
     */
    private getSuggestion;
}
//# sourceMappingURL=SafetyBounds.d.ts.map