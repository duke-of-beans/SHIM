/**
 * StatsigIntegration - Automated A/B testing wrapper
 *
 * LEAN-OUT: Wraps statsig-node (battle-tested) with SHIM-specific logic.
 *
 * Responsibilities:
 * - Create experiments from opportunities
 * - Assign control/treatment variants
 * - Log experiment outcomes
 * - Calculate statistical significance
 * - Auto-deploy winning variants
 * - Rollback on regression
 *
 * Integration with OpportunityDetector:
 * 1. OpportunityDetector finds patterns
 * 2. StatsigIntegration creates experiments
 * 3. Variants assigned to sessions
 * 4. Outcomes logged to Statsig
 * 5. Results analyzed for significance
 * 6. Winners auto-deployed OR rolled back
 */
import { Opportunity } from './OpportunityDetector';
export interface ExperimentConfig {
    id: string;
    name: string;
    control: Variant;
    treatment: Variant;
    successMetrics: string[];
    hypothesis: string;
    createdAt: string;
}
export interface Variant {
    name: string;
    value: number | string;
    description?: string;
}
export interface ExperimentResult {
    control: {
        sampleSize: number;
        metrics: Record<string, number>;
    };
    treatment: {
        sampleSize: number;
        metrics: Record<string, number>;
    };
    isSignificant: boolean;
    pValue: number;
    winner?: 'control' | 'treatment' | 'none';
    error?: string;
}
export interface DeploymentResult {
    deployed: boolean;
    variant?: string;
    previousValue?: number | string;
    newValue?: number | string;
    deployedAt?: string;
    reason?: string;
}
interface StatsigOptions {
    environment?: string;
    enableLogging?: boolean;
}
export declare class StatsigIntegration {
    private apiKey;
    private options;
    private initialized;
    private shutdownFlag;
    private deploymentThreshold;
    private experiments;
    constructor(apiKey: string, options?: StatsigOptions);
    /**
     * Initialize Statsig SDK
     */
    initialize(): Promise<boolean>;
    /**
     * Create experiment from opportunity
     */
    createExperiment(opportunity: Opportunity): Promise<ExperimentConfig>;
    /**
     * Create multiple experiments from opportunities
     */
    createExperiments(opportunities: Opportunity[]): Promise<ExperimentConfig[]>;
    /**
     * Get variant for user
     */
    getVariant(experimentName: string, userId: string, customAttributes?: Record<string, unknown>): Promise<Variant>;
    /**
     * Log experiment exposure
     */
    logExposure(experimentName: string, userId: string, variantName: string): Promise<boolean>;
    /**
     * Log custom event
     */
    logEvent(eventName: string, metadata?: Record<string, unknown>, userId?: string): Promise<boolean>;
    /**
     * Flush pending events
     */
    flush(): Promise<boolean>;
    /**
     * Get experiment results
     */
    getExperimentResults(experimentName: string): Promise<ExperimentResult>;
    /**
     * List active experiments
     */
    listExperiments(): Promise<ExperimentConfig[]>;
    /**
     * Get experiment configuration
     */
    getExperimentConfig(experimentName: string): Promise<ExperimentConfig | null>;
    /**
     * Stop experiment
     */
    stopExperiment(experimentName: string): Promise<boolean>;
    /**
     * Archive experiment
     */
    archiveExperiment(experimentName: string): Promise<boolean>;
    /**
     * Rollback to control variant
     */
    rollback(experimentName: string, reason?: string): Promise<boolean>;
    /**
     * Auto-deploy winning variant
     */
    deployWinner(experimentName: string): Promise<DeploymentResult>;
    /**
     * Set deployment threshold
     */
    setDeploymentThreshold(threshold: number): void;
    /**
     * Get deployment threshold
     */
    getDeploymentThreshold(): number;
    /**
     * Shutdown Statsig SDK
     */
    shutdown(): Promise<boolean>;
    /**
     * Check if shut down
     */
    isShutdown(): boolean;
    /**
     * Generate experiment name from opportunity type
     */
    private generateExperimentName;
    /**
     * Get success metrics for opportunity type
     */
    private getSuccessMetrics;
    /**
     * Generate unique ID
     */
    private generateId;
}
export {};
//# sourceMappingURL=StatsigIntegration.d.ts.map