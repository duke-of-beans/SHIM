"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentGenerator = void 0;
const uuid_1 = require("uuid");
/**
 * ExperimentGenerator
 *
 * Converts opportunities into executable experiments with:
 * - Intelligent variant generation
 * - Statistical rigor
 * - Safety guarantees
 */
class ExperimentGenerator {
    /**
     * Generate experiment from opportunity
     */
    generateExperiment(opportunity) {
        const id = (0, uuid_1.v4)();
        const timestamp = new Date().toISOString();
        // Generate variants
        const control = this.generateControlVariant(opportunity);
        const treatment = this.generateTreatmentVariant(opportunity);
        // Calculate success criteria
        const successCriteria = this.calculateSuccessCriteria(opportunity);
        // Set safety bounds
        const safetyBounds = this.calculateSafetyBounds(opportunity);
        // Configure sampling
        const sampleConfig = this.calculateSampleConfig(opportunity);
        return {
            id,
            name: `${opportunity.area}-${timestamp}`,
            hypothesis: `Changing ${opportunity.area} configuration can improve ${opportunity.metric} from ${opportunity.currentValue} to ${opportunity.targetValue}`,
            area: opportunity.area,
            metric: opportunity.metric,
            variants: [control, treatment],
            successCriteria,
            safetyBounds,
            sampleConfig,
            createdAt: timestamp
        };
    }
    /**
     * Generate control variant (current configuration)
     */
    generateControlVariant(opportunity) {
        return {
            name: 'control',
            description: `Current ${opportunity.area} configuration`,
            isControl: true,
            config: this.getCurrentConfig(opportunity.area)
        };
    }
    /**
     * Generate treatment variant (experimental configuration)
     */
    generateTreatmentVariant(opportunity) {
        return {
            name: 'treatment',
            description: `Experimental ${opportunity.area} configuration targeting ${opportunity.targetValue}`,
            isControl: false,
            config: this.generateExperimentalConfig(opportunity)
        };
    }
    /**
     * Get current configuration for area
     */
    getCurrentConfig(area) {
        // Area-specific current configs
        const configs = {
            'crash-prevention': {
                predictionWindow: 60000,
                thresholdConfidence: 0.80,
                checkpointStrategy: 'periodic'
            },
            'model-routing': {
                routingStrategy: 'complexity-based',
                fallbackModel: 'sonnet',
                costThreshold: 0.5
            },
            'cost-optimization': {
                savingsTarget: 0.26,
                qualityThreshold: 0.90,
                optimizationMode: 'balanced'
            },
            'performance': {
                latencyTarget: 100,
                throughputTarget: 1000,
                cacheStrategy: 'lru'
            },
            'load-balancing': {
                algorithm: 'round-robin',
                healthCheckInterval: 30000,
                maxConcurrent: 5
            }
        };
        return configs[area] || { strategy: 'default' };
    }
    /**
     * Generate experimental configuration
     */
    generateExperimentalConfig(opportunity) {
        const base = this.getCurrentConfig(opportunity.area);
        const experimental = { ...base };
        // Area-specific experimental variations
        switch (opportunity.area) {
            case 'crash-prevention':
                experimental.predictionWindow = 30000; // Shorter window
                experimental.thresholdConfidence = 0.85; // Higher confidence
                break;
            case 'model-routing':
                experimental.routingStrategy = 'ml-optimized';
                experimental.costThreshold = 0.3; // More aggressive savings
                break;
            case 'cost-optimization':
                experimental.savingsTarget = opportunity.targetValue;
                experimental.optimizationMode = 'aggressive';
                break;
            case 'performance':
                experimental.latencyTarget = opportunity.targetValue;
                experimental.cacheStrategy = 'adaptive';
                break;
            case 'load-balancing':
                experimental.algorithm = 'least-connections';
                experimental.maxConcurrent = 10; // Higher concurrency
                break;
            default:
                experimental.experimentalMode = true;
        }
        return experimental;
    }
    /**
     * Calculate success criteria
     */
    calculateSuccessCriteria(opportunity) {
        const improvement = Math.abs(opportunity.targetValue - opportunity.currentValue);
        const relativeImprovement = improvement / Math.abs(opportunity.currentValue);
        // Larger samples needed for small effects
        const baseSize = 100;
        const sizeMultiplier = relativeImprovement < 0.05 ? 15 : relativeImprovement < 0.1 ? 10 : relativeImprovement < 0.2 ? 5 : 2;
        return {
            targetMetricValue: opportunity.targetValue,
            minImprovement: improvement * 0.5, // Accept 50% of target improvement
            significanceLevel: 0.05, // 95% confidence
            minSampleSize: baseSize * sizeMultiplier
        };
    }
    /**
     * Calculate safety bounds
     */
    calculateSafetyBounds(opportunity) {
        // Stricter bounds for critical areas
        const isCritical = opportunity.impact === 'critical';
        const isHigh = opportunity.impact === 'high';
        return {
            maxPerformanceRegression: isCritical ? 0.02 : isHigh ? 0.05 : 0.10,
            rollbackThreshold: isCritical ? 0.05 : isHigh ? 0.10 : 0.15,
            maxErrorRate: isCritical ? 0.01 : isHigh ? 0.02 : 0.05
        };
    }
    /**
     * Calculate sample configuration
     */
    calculateSampleConfig(opportunity) {
        const criteria = this.calculateSuccessCriteria(opportunity);
        return {
            minSampleSize: criteria.minSampleSize,
            maxDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
            checkpointInterval: 60 * 60 * 1000 // 1 hour
        };
    }
}
exports.ExperimentGenerator = ExperimentGenerator;
//# sourceMappingURL=ExperimentGenerator.js.map