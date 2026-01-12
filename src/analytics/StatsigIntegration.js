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
import Statsig from 'statsig-node';
export class StatsigIntegration {
    apiKey;
    options;
    initialized = false;
    shutdownFlag = false;
    deploymentThreshold = 0.95;
    // Experiment storage (in-memory for testing)
    experiments = new Map();
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.options = {
            environment: options.environment || 'production',
            enableLogging: options.enableLogging ?? false
        };
    }
    /**
     * Initialize Statsig SDK
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }
        try {
            await Statsig.initialize(this.apiKey, {
                environment: { tier: this.options.environment }
            });
            this.initialized = true;
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Statsig initialization failed:', error);
            }
            return false;
        }
    }
    /**
     * Create experiment from opportunity
     */
    async createExperiment(opportunity) {
        if (!opportunity.type) {
            throw new Error('Opportunity type is required');
        }
        const experimentName = this.generateExperimentName(opportunity.type);
        const experiment = {
            id: this.generateId(),
            name: experimentName,
            control: {
                name: 'control',
                value: opportunity.currentValue,
                description: 'Current configuration'
            },
            treatment: {
                name: 'treatment',
                value: opportunity.proposedValue,
                description: opportunity.hypothesis
            },
            successMetrics: this.getSuccessMetrics(opportunity.type),
            hypothesis: opportunity.hypothesis,
            createdAt: new Date().toISOString()
        };
        // Store experiment
        this.experiments.set(experimentName, experiment);
        return experiment;
    }
    /**
     * Create multiple experiments from opportunities
     */
    async createExperiments(opportunities) {
        const experiments = [];
        for (const opportunity of opportunities) {
            const experiment = await this.createExperiment(opportunity);
            experiments.push(experiment);
        }
        return experiments;
    }
    /**
     * Get variant for user
     */
    async getVariant(experimentName, userId, customAttributes) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            const experiment = await Statsig.getExperiment({
                userID: userId,
                custom: customAttributes
            }, experimentName);
            const variantName = experiment.get('variant', 'control');
            const variantValue = experiment.get('value', null);
            return {
                name: variantName,
                value: variantValue ?? 0
            };
        }
        catch (error) {
            // Return control on error
            return {
                name: 'control',
                value: this.experiments.get(experimentName)?.control.value ?? 0
            };
        }
    }
    /**
     * Log experiment exposure
     */
    async logExposure(experimentName, userId, variantName) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            Statsig.logEvent({ userID: userId }, 'experiment_exposure', null, {
                experiment: experimentName,
                variant: variantName
            });
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Failed to log exposure:', error);
            }
            return false;
        }
    }
    /**
     * Log custom event
     */
    async logEvent(eventName, metadata, userId) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            Statsig.logEvent({ userID: userId || 'system' }, eventName, null, metadata);
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Failed to log event:', error);
            }
            return false;
        }
    }
    /**
     * Flush pending events
     */
    async flush() {
        try {
            await Statsig.flush();
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Failed to flush events:', error);
            }
            return false;
        }
    }
    /**
     * Get experiment results
     */
    async getExperimentResults(experimentName) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            // In production, this would query Statsig Console API
            // For now, return mock results structure
            const result = {
                control: {
                    sampleSize: 0,
                    metrics: {}
                },
                treatment: {
                    sampleSize: 0,
                    metrics: {}
                },
                isSignificant: false,
                pValue: 1.0,
                winner: 'none'
            };
            return result;
        }
        catch (error) {
            return {
                control: { sampleSize: 0, metrics: {} },
                treatment: { sampleSize: 0, metrics: {} },
                isSignificant: false,
                pValue: 1.0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * List active experiments
     */
    async listExperiments() {
        return Array.from(this.experiments.values());
    }
    /**
     * Get experiment configuration
     */
    async getExperimentConfig(experimentName) {
        return this.experiments.get(experimentName) || null;
    }
    /**
     * Stop experiment
     */
    async stopExperiment(experimentName) {
        // In production, this would call Statsig API to stop experiment
        // For now, just mark as stopped in local storage
        const experiment = this.experiments.get(experimentName);
        if (experiment) {
            // Mark as stopped (could add metadata)
            return true;
        }
        return false;
    }
    /**
     * Archive experiment
     */
    async archiveExperiment(experimentName) {
        this.experiments.delete(experimentName);
        return true;
    }
    /**
     * Rollback to control variant
     */
    async rollback(experimentName, reason) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            // Log rollback event
            await this.logEvent('experiment_rollback', {
                experiment: experimentName,
                reason: reason || 'Manual rollback'
            });
            // In production, this would update Statsig to force control
            // For now, stop the experiment
            await this.stopExperiment(experimentName);
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Rollback failed:', error);
            }
            return false;
        }
    }
    /**
     * Auto-deploy winning variant
     */
    async deployWinner(experimentName) {
        const results = await this.getExperimentResults(experimentName);
        // Check statistical significance
        if (!results.isSignificant || results.pValue > (1 - this.deploymentThreshold)) {
            return {
                deployed: false,
                reason: `Results not significant (p=${results.pValue.toFixed(3)})`
            };
        }
        // Check for winner
        if (!results.winner || results.winner === 'none') {
            return {
                deployed: false,
                reason: 'No clear winner'
            };
        }
        // Deploy winner
        const experiment = this.experiments.get(experimentName);
        if (!experiment) {
            return {
                deployed: false,
                reason: 'Experiment not found'
            };
        }
        const winningVariant = results.winner === 'treatment'
            ? experiment.treatment
            : experiment.control;
        // Log deployment
        await this.logEvent('experiment_deployed', {
            experiment: experimentName,
            variant: results.winner,
            previousValue: experiment.control.value,
            newValue: winningVariant.value
        });
        return {
            deployed: true,
            variant: results.winner,
            previousValue: experiment.control.value,
            newValue: winningVariant.value,
            deployedAt: new Date().toISOString()
        };
    }
    /**
     * Set deployment threshold
     */
    setDeploymentThreshold(threshold) {
        this.deploymentThreshold = threshold;
    }
    /**
     * Get deployment threshold
     */
    getDeploymentThreshold() {
        return this.deploymentThreshold;
    }
    /**
     * Shutdown Statsig SDK
     */
    async shutdown() {
        if (this.shutdownFlag) {
            return true;
        }
        try {
            await this.flush();
            await Statsig.shutdown();
            this.shutdownFlag = true;
            this.initialized = false;
            return true;
        }
        catch (error) {
            if (this.options.enableLogging) {
                console.error('Shutdown failed:', error);
            }
            return false;
        }
    }
    /**
     * Check if shut down
     */
    isShutdown() {
        return this.shutdownFlag;
    }
    /**
     * Generate experiment name from opportunity type
     */
    generateExperimentName(type) {
        const timestamp = Date.now();
        return `${type}_${timestamp}`;
    }
    /**
     * Get success metrics for opportunity type
     */
    getSuccessMetrics(type) {
        const metricMap = {
            'checkpoint_interval_optimization': ['crash_rate', 'crash_prediction_accuracy'],
            'checkpoint_performance': ['checkpoint_creation_time'],
            'resume_reliability': ['resume_success_rate'],
            'model_routing_optimization': ['model_routing_accuracy', 'token_savings'],
            'token_optimization': ['token_savings_total', 'response_quality'],
            'model_mapping': ['model_routing_accuracy'],
            'supervisor_performance': ['supervisor_restart_time'],
            'monitor_latency': ['process_monitor_latency'],
            'test_opportunity': ['test_metric']
        };
        return metricMap[type] || [];
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=StatsigIntegration.js.map