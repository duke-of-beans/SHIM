/**
 * OpportunityDetector - Pattern detection and improvement opportunity identification
 *
 * LEAN-OUT: Uses simple-statistics (battle-tested) for statistical analysis.
 *
 * Responsibilities:
 * - Detect patterns from SHIMMetrics
 * - Generate improvement hypotheses
 * - Calculate confidence intervals
 * - Rank opportunities by impact
 * - Export for Statsig experimentation
 *
 * Pattern Examples:
 * - checkpoint_interval=5 → crash_rate=0.12 → PROPOSE: interval=3
 * - routing_accuracy=0.75 → PROPOSE: route "architecture" to Opus
 * - checkpoint_time=150ms → PROPOSE: async compression
 */
import { SHIMMetrics } from './SHIMMetrics';
export type OpportunityType = 'checkpoint_interval_optimization' | 'checkpoint_performance' | 'resume_reliability' | 'model_routing_optimization' | 'token_optimization' | 'model_mapping' | 'supervisor_performance' | 'monitor_latency' | 'test_opportunity';
export interface Opportunity {
    id: string;
    type: OpportunityType;
    pattern: string;
    hypothesis: string;
    confidence: number;
    impact: string;
    currentValue: number | string;
    proposedValue: number | string;
    estimatedSavings?: number;
    sampleSize: number;
    detectedAt: string;
}
export interface Pattern {
    pattern: string;
    firstDetected: string;
    lastDetected: string;
    count: number;
    expired: boolean;
}
interface DetectorConfig {
    minConfidence: number;
    minImpact: number;
    minSampleSize: number;
    patternExpiryTime: number;
}
interface StatsigExperiment {
    name: string;
    control: Record<string, unknown>;
    treatment: Record<string, unknown>;
    successMetrics: string[];
    hypothesis: string;
}
interface StatsigExport {
    experiments: StatsigExperiment[];
}
export declare class OpportunityDetector {
    private metrics;
    private config;
    private patternHistory;
    constructor(metrics: SHIMMetrics);
    /**
     * Get detector configuration
     */
    getConfig(): DetectorConfig;
    /**
     * Set minimum confidence threshold
     */
    setMinConfidence(value: number): void;
    /**
     * Set minimum impact threshold
     */
    setMinImpact(value: number): void;
    /**
     * Set minimum sample size
     */
    setMinSampleSize(value: number): void;
    /**
     * Set pattern expiry time
     */
    setPatternExpiryTime(milliseconds: number): void;
    /**
     * Detect improvement opportunities from current metrics
     */
    detectOpportunities(): Promise<Opportunity[]>;
    /**
     * Detect crash prevention opportunities
     */
    private detectCrashPreventionOpportunities;
    /**
     * Detect model routing opportunities
     */
    private detectModelRoutingOpportunities;
    /**
     * Detect performance opportunities
     */
    private detectPerformanceOpportunities;
    /**
     * Calculate statistical confidence for samples
     */
    calculateConfidence(samples: number[]): number;
    /**
     * Calculate mean
     */
    calculateMean(samples: number[]): number;
    /**
     * Calculate standard deviation
     */
    calculateStdDev(samples: number[]): number;
    /**
     * Rank opportunities by priority
     */
    rankOpportunities(opportunities: Opportunity[]): Opportunity[];
    /**
     * Get pattern history
     */
    getPatternHistory(): Pattern[];
    /**
     * Track detected pattern
     */
    private trackPattern;
    /**
     * Expire old patterns
     */
    private expireOldPatterns;
    /**
     * Export opportunities in Statsig experiment format
     */
    exportForStatsig(opportunities: Opportunity[]): StatsigExport;
    /**
     * Get success metrics for opportunity type
     */
    private getSuccessMetrics;
    /**
     * Generate unique opportunity ID
     */
    private generateId;
}
export {};
//# sourceMappingURL=OpportunityDetector.d.ts.map