/**
 * ExperimentGenerator
 *
 * Generates intelligent A/B test configurations from opportunities.
 * LEAN-OUT: Domain-specific experiment logic, not generic framework.
 *
 * Responsibilities:
 * - Convert opportunities into executable experiments
 * - Generate control vs treatment variants
 * - Define success criteria and safety bounds
 * - Configure sample sizes and duration
 */
/**
 * Opportunity for improvement identified by OpportunityDetector
 */
export interface ExperimentOpportunity {
    area: string;
    metric: string;
    currentValue: number;
    targetValue: number;
    confidence: number;
    impact: 'critical' | 'high' | 'medium' | 'low';
}
/**
 * Experiment variant configuration
 */
export interface ExperimentVariant {
    name: string;
    description: string;
    isControl: boolean;
    config: Record<string, unknown>;
}
/**
 * Success criteria for experiment
 */
export interface SuccessCriteria {
    targetMetricValue: number;
    minImprovement: number;
    significanceLevel: number;
    minSampleSize: number;
}
/**
 * Safety bounds for experiment
 */
export interface SafetyBounds {
    maxPerformanceRegression: number;
    rollbackThreshold: number;
    maxErrorRate: number;
}
/**
 * Sample configuration for experiment
 */
export interface SampleConfig {
    minSampleSize: number;
    maxDuration: number;
    checkpointInterval: number;
}
/**
 * Complete experiment configuration
 */
export interface Experiment {
    id: string;
    name: string;
    hypothesis: string;
    area: string;
    metric: string;
    variants: ExperimentVariant[];
    successCriteria: SuccessCriteria;
    safetyBounds: SafetyBounds;
    sampleConfig: SampleConfig;
    createdAt: string;
}
/**
 * ExperimentGenerator
 *
 * Converts opportunities into executable experiments with:
 * - Intelligent variant generation
 * - Statistical rigor
 * - Safety guarantees
 */
export declare class ExperimentGenerator {
    /**
     * Generate experiment from opportunity
     */
    generateExperiment(opportunity: ExperimentOpportunity): Experiment;
    /**
     * Generate control variant (current configuration)
     */
    private generateControlVariant;
    /**
     * Generate treatment variant (experimental configuration)
     */
    private generateTreatmentVariant;
    /**
     * Get current configuration for area
     */
    private getCurrentConfig;
    /**
     * Generate experimental configuration
     */
    private generateExperimentalConfig;
    /**
     * Calculate success criteria
     */
    private calculateSuccessCriteria;
    /**
     * Calculate safety bounds
     */
    private calculateSafetyBounds;
    /**
     * Calculate sample configuration
     */
    private calculateSampleConfig;
}
//# sourceMappingURL=ExperimentGenerator.d.ts.map