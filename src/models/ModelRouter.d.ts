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
import { PromptAnalyzer, ModelType } from './PromptAnalyzer';
export type RoutingStrategy = 'quality' | 'cost' | 'balanced';
export interface RouterConfig {
    analyzer: PromptAnalyzer;
    costOptimization?: boolean;
    strategy?: RoutingStrategy;
    defaultModel?: ModelType;
    fallbackModel?: ModelType;
}
export interface RoutingDecision {
    selectedModel: ModelType;
    confidence: number;
    estimatedCost: {
        haiku: number;
        sonnet: number;
        opus: number;
    };
    costSavings: number;
    reason: string;
}
export interface ModelPerformance {
    model: ModelType;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageLatency: number;
    totalCost: number;
}
export interface RoutingStats {
    totalRoutes: number;
    routesByModel: Record<ModelType, number>;
    totalCostSavings: number;
    savingsPercentage: number;
    averageConfidence: number;
}
export interface RouteOptions {
    forceModel?: ModelType;
    minModel?: ModelType;
}
export declare class ModelRouter {
    private config;
    private analyzer;
    private readonly MODEL_COSTS;
    private performance;
    private stats;
    constructor(config: RouterConfig);
    /**
     * Get current configuration
     */
    getConfig(): {
        costOptimization: boolean;
        strategy: RoutingStrategy;
        defaultModel: ModelType;
        fallbackModel: ModelType;
    };
    /**
     * Route a prompt to optimal model
     */
    route(prompt: string, options?: RouteOptions): Promise<RoutingDecision>;
    /**
     * Route multiple prompts
     */
    routeMultiple(prompts: string[]): Promise<RoutingDecision[]>;
    /**
     * Record successful route
     */
    recordSuccess(model: ModelType, latencyMs: number): Promise<void>;
    /**
     * Record failed route
     */
    recordFailure(model: ModelType, reason: string): Promise<void>;
    /**
     * Get performance metrics for a model
     */
    getModelPerformance(model: ModelType): Promise<ModelPerformance>;
    /**
     * Get routing statistics
     */
    getRoutingStats(): Promise<RoutingStats>;
    /**
     * Select optimal model based on analysis
     */
    private selectOptimalModel;
    /**
     * Enforce minimum model tier
     */
    private enforceMinimumModel;
    /**
     * Create routing decision
     */
    private createDecision;
    /**
     * Generate reason for routing decision
     */
    private generateReason;
    /**
     * Update routing statistics
     */
    private updateStats;
}
//# sourceMappingURL=ModelRouter.d.ts.map