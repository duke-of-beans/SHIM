/**
 * DeploymentManager
 *
 * Safe deployment of successful experiments with canary rollout.
 * LEAN-OUT: Safe deployment orchestration, not generic CD framework.
 *
 * Responsibilities:
 * - Canary deployments (gradual rollout)
 * - Health monitoring during deployment
 * - Automatic rollback on errors
 * - Deployment history tracking
 * - Rollback plan creation
 */
/**
 * Deployment configuration
 */
export interface DeploymentConfig {
    variantId: string;
    variant: Record<string, unknown>;
    rollbackThreshold: number;
    canaryPercent: number;
}
/**
 * Rollback plan
 */
export interface RollbackPlan {
    previousConfig: Record<string, unknown>;
    rollbackSteps: string[];
    createdAt: string;
}
/**
 * Deployment status
 */
export type DeploymentStatus = 'deployed' | 'deploying' | 'rolled_back' | 'failed';
/**
 * Deployment result
 */
export interface DeploymentResult {
    deploymentId: string;
    variantId: string;
    status: DeploymentStatus;
    canaryPercent: number;
    canaryActive: boolean;
    rollbackPlan?: RollbackPlan;
    deployedAt: string;
    currentConfig: Record<string, unknown>;
    rollbackReason?: string;
}
/**
 * Health check result
 */
export interface HealthCheck {
    healthy: boolean;
    errorRate: number;
    timestamp: string;
}
/**
 * DeploymentManager
 *
 * Orchestrates safe deployment of experiment winners.
 */
export declare class DeploymentManager {
    private deployments;
    private errorRates;
    private currentConfig;
    /**
     * Deploy a variant with canary rollout
     */
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    /**
     * Increase canary percentage
     */
    increaseCanary(deploymentId: string, newPercent: number): Promise<DeploymentResult>;
    /**
     * Check deployment health
     */
    checkHealth(deploymentId: string): Promise<HealthCheck>;
    /**
     * Simulate errors for testing
     */
    simulateErrors(deploymentId: string, errorRate: number): void;
    /**
     * Rollback deployment
     */
    rollback(deploymentId: string, reason?: string): Promise<DeploymentResult>;
    /**
     * Get deployment status
     */
    getStatus(deploymentId: string): Promise<DeploymentResult>;
    /**
     * Get deployment history
     */
    getHistory(): DeploymentResult[];
}
//# sourceMappingURL=DeploymentManager.d.ts.map