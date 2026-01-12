"use strict";
/**
 * ModelRouter - Intelligent Model Selection
 *
 * Routes prompts to optimal Claude model based on complexity,
 * cost optimization, and historical performance.
 *
 * Features:
 * - Automatic model selection (Haiku/Sonnet/Opus)
 * - Cost estimation and optimization
 * - Historical performance tracking
 * - Multiple routing strategies
 * - Manual override support
 * - Batch routing
 * - Statistics and reporting
 *
 * Example:
 * ```typescript
 * const router = new ModelRouter({
 *   analyzer: new PromptAnalyzer(),
 *   costOptimization: true,
 *   strategy: 'balanced'
 * });
 *
 * const decision = await router.route('What is X?');
 * // {
 * //   selectedModel: 'haiku',
 * //   estimatedCost: { haiku: 0.001, sonnet: 0.003, opus: 0.015 },
 * //   costSavings: 0.014,
 * //   reason: 'Simple query - Haiku sufficient'
 * // }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
class ModelRouter {
    config;
    analyzer;
    // Pricing per 1M tokens (input + output average)
    MODEL_COSTS = {
        haiku: 0.001, // Cheapest
        sonnet: 0.003, // Mid-tier
        opus: 0.015 // Most expensive
    };
    // Performance tracking
    performance = new Map();
    // Routing statistics
    stats = {
        totalRoutes: 0,
        routesByModel: { haiku: 0, sonnet: 0, opus: 0 },
        totalCostSavings: 0,
        confidenceSum: 0
    };
    constructor(config) {
        this.analyzer = config.analyzer;
        this.config = {
            costOptimization: config.costOptimization ?? true,
            strategy: config.strategy ?? 'balanced',
            defaultModel: config.defaultModel ?? 'sonnet',
            fallbackModel: config.fallbackModel ?? 'sonnet'
        };
        // Initialize performance tracking
        this.performance.set('haiku', { successes: [], failures: [], totalCost: 0 });
        this.performance.set('sonnet', { successes: [], failures: [], totalCost: 0 });
        this.performance.set('opus', { successes: [], failures: [], totalCost: 0 });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Route a prompt to optimal model
     */
    async route(prompt, options) {
        // Handle manual override
        if (options?.forceModel) {
            return this.createDecision(options.forceModel, 0.8, prompt, 'Manual model override');
        }
        // Analyze prompt
        const analysis = this.analyzer.analyze(prompt);
        // Select model based on strategy
        let selectedModel;
        if (this.config.costOptimization) {
            selectedModel = this.selectOptimalModel(analysis, options);
        }
        else {
            selectedModel = this.config.defaultModel;
        }
        // Apply minimum model constraint
        if (options?.minModel) {
            selectedModel = this.enforceMinimumModel(selectedModel, options.minModel);
        }
        // Create decision
        const decision = this.createDecision(selectedModel, analysis.confidence, prompt, this.generateReason(analysis, selectedModel));
        // Update statistics
        this.updateStats(decision);
        return decision;
    }
    /**
     * Route multiple prompts
     */
    async routeMultiple(prompts) {
        return Promise.all(prompts.map(p => this.route(p)));
    }
    /**
     * Record successful route
     */
    async recordSuccess(model, latencyMs) {
        const perf = this.performance.get(model);
        if (perf) {
            perf.successes.push(latencyMs);
            // Keep only last 100
            if (perf.successes.length > 100) {
                perf.successes.shift();
            }
        }
    }
    /**
     * Record failed route
     */
    async recordFailure(model, reason) {
        const perf = this.performance.get(model);
        if (perf) {
            perf.failures.push(reason);
            // Keep only last 100
            if (perf.failures.length > 100) {
                perf.failures.shift();
            }
        }
    }
    /**
     * Get performance metrics for a model
     */
    async getModelPerformance(model) {
        const perf = this.performance.get(model);
        if (!perf) {
            return {
                model,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                averageLatency: 0,
                totalCost: 0
            };
        }
        const successCount = perf.successes.length;
        const failureCount = perf.failures.length;
        const totalCount = successCount + failureCount;
        return {
            model,
            successCount,
            failureCount,
            successRate: totalCount > 0 ? successCount / totalCount : 0,
            averageLatency: successCount > 0
                ? perf.successes.reduce((a, b) => a + b, 0) / successCount
                : 0,
            totalCost: perf.totalCost
        };
    }
    /**
     * Get routing statistics
     */
    async getRoutingStats() {
        const totalRoutes = this.stats.totalRoutes;
        // Calculate savings percentage
        const totalCost = Object.entries(this.stats.routesByModel).reduce((sum, [model, count]) => sum + (this.MODEL_COSTS[model] * count), 0);
        const opusCost = totalRoutes * this.MODEL_COSTS.opus;
        const savingsPercentage = opusCost > 0
            ? ((opusCost - totalCost) / opusCost) * 100
            : 0;
        return {
            totalRoutes,
            routesByModel: { ...this.stats.routesByModel },
            totalCostSavings: this.stats.totalCostSavings,
            savingsPercentage,
            averageConfidence: totalRoutes > 0
                ? this.stats.confidenceSum / totalRoutes
                : 0
        };
    }
    /**
     * Select optimal model based on analysis
     */
    selectOptimalModel(analysis, options) {
        // Use analyzer's recommendation as baseline
        let selected = analysis.recommendedModel;
        // Apply strategy
        if (this.config.strategy === 'quality') {
            // Always prefer higher tier for quality
            if (selected === 'haiku')
                selected = 'sonnet';
        }
        else if (this.config.strategy === 'cost') {
            // Prefer lower tier for cost
            if (selected === 'opus' && analysis.complexity !== 'complex') {
                selected = 'sonnet';
            }
        }
        // 'balanced' uses analyzer recommendation as-is
        // Low confidence fallback
        if (analysis.confidence < 0.6) {
            selected = this.config.fallbackModel;
        }
        return selected;
    }
    /**
     * Enforce minimum model tier
     */
    enforceMinimumModel(selected, minimum) {
        const tiers = { haiku: 1, sonnet: 2, opus: 3 };
        if (tiers[selected] < tiers[minimum]) {
            return minimum;
        }
        return selected;
    }
    /**
     * Create routing decision
     */
    createDecision(model, confidence, prompt, reason) {
        const estimatedTokens = Math.ceil(prompt.length / 4);
        const estimatedCost = {
            haiku: this.MODEL_COSTS.haiku * (estimatedTokens / 1000000),
            sonnet: this.MODEL_COSTS.sonnet * (estimatedTokens / 1000000),
            opus: this.MODEL_COSTS.opus * (estimatedTokens / 1000000)
        };
        // Calculate savings vs most expensive (Opus)
        const costSavings = estimatedCost.opus - estimatedCost[model];
        return {
            selectedModel: model,
            confidence,
            estimatedCost,
            costSavings,
            reason
        };
    }
    /**
     * Generate reason for routing decision
     */
    generateReason(analysis, model) {
        const reasons = [];
        // Complexity
        reasons.push(`${analysis.complexity} complexity`);
        // Capabilities
        if (analysis.hasCodeGeneration) {
            reasons.push('code generation required');
        }
        if (analysis.requiresReasoning) {
            reasons.push('reasoning needed');
        }
        // Task type
        reasons.push(`${analysis.taskType} task`);
        // Model selection
        reasons.push(`→ ${model} selected`);
        return reasons.join(', ');
    }
    /**
     * Update routing statistics
     */
    updateStats(decision) {
        this.stats.totalRoutes++;
        this.stats.routesByModel[decision.selectedModel]++;
        this.stats.totalCostSavings += decision.costSavings;
        this.stats.confidenceSum += decision.confidence;
    }
}
exports.ModelRouter = ModelRouter;
//# sourceMappingURL=ModelRouter.js.map