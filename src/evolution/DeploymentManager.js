"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = void 0;
/**
 * DeploymentManager
 *
 * Orchestrates safe deployment of experiment winners.
 */
class DeploymentManager {
    deployments = new Map();
    errorRates = new Map();
    currentConfig = {};
    /**
     * Deploy a variant with canary rollout
     */
    async deploy(config) {
        // Validate canary percentage
        if (config.canaryPercent < 0 || config.canaryPercent > 100) {
            throw new Error('Invalid canary percentage: must be 0-100');
        }
        // Generate deployment ID
        const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Create rollback plan
        const rollbackPlan = {
            previousConfig: { ...this.currentConfig },
            rollbackSteps: [
                'Stop canary rollout',
                'Restore previous configuration',
                'Verify restoration successful'
            ],
            createdAt: new Date().toISOString()
        };
        // Create deployment result
        const result = {
            deploymentId,
            variantId: config.variantId,
            status: 'deployed',
            canaryPercent: config.canaryPercent,
            canaryActive: config.canaryPercent > 0 && config.canaryPercent < 100,
            rollbackPlan,
            deployedAt: new Date().toISOString(),
            currentConfig: config.variant
        };
        // Store deployment
        this.deployments.set(deploymentId, result);
        // Initialize error rate
        this.errorRates.set(deploymentId, 0);
        // Update current config (in real system, this would update actual running config)
        this.currentConfig = config.variant;
        return result;
    }
    /**
     * Increase canary percentage
     */
    async increaseCanary(deploymentId, newPercent) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        // Update canary percentage
        deployment.canaryPercent = newPercent;
        deployment.canaryActive = newPercent > 0 && newPercent < 100;
        // Update stored deployment
        this.deployments.set(deploymentId, deployment);
        return deployment;
    }
    /**
     * Check deployment health
     */
    async checkHealth(deploymentId) {
        const errorRate = this.errorRates.get(deploymentId) ?? 0;
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        const rollbackThreshold = deployment.rollbackPlan?.previousConfig
            ? 0.10 // Default threshold
            : 0.10;
        return {
            healthy: errorRate < rollbackThreshold,
            errorRate,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Simulate errors for testing
     */
    simulateErrors(deploymentId, errorRate) {
        this.errorRates.set(deploymentId, errorRate);
    }
    /**
     * Rollback deployment
     */
    async rollback(deploymentId, reason) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        if (deployment.status === 'rolled_back') {
            throw new Error(`Deployment ${deploymentId} already rolled back`);
        }
        // Execute rollback
        deployment.status = 'rolled_back';
        deployment.canaryActive = false;
        deployment.rollbackReason = reason ?? 'Rollback requested';
        // Restore previous config
        if (deployment.rollbackPlan) {
            deployment.currentConfig = deployment.rollbackPlan.previousConfig;
            this.currentConfig = deployment.rollbackPlan.previousConfig;
        }
        // Update stored deployment
        this.deployments.set(deploymentId, deployment);
        return deployment;
    }
    /**
     * Get deployment status
     */
    async getStatus(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        return deployment;
    }
    /**
     * Get deployment history
     */
    getHistory() {
        return Array.from(this.deployments.values());
    }
}
exports.DeploymentManager = DeploymentManager;
//# sourceMappingURL=DeploymentManager.js.map