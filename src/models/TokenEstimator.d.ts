/**
 * TokenEstimator - Token Counting and Cost Tracking
 *
 * Tracks token usage and costs for model routing optimization.
 *
 * Features:
 * - Token estimation
 * - Cost calculation per model
 * - Usage tracking
 * - Savings calculation
 * - Budget monitoring
 * - Cost reports
 * - Data export/import
 *
 * Example:
 * ```typescript
 * const estimator = new TokenEstimator();
 *
 * // Track usage
 * estimator.trackUsage({
 *   model: 'haiku',
 *   inputTokens: 100,
 *   outputTokens: 50,
 *   totalCost: 0.001
 * });
 *
 * // Track savings
 * estimator.trackSavings({
 *   actualModel: 'haiku',
 *   alternativeModel: 'opus',
 *   tokens: 150,
 *   savedCost: 0.014
 * });
 *
 * // Get report
 * const report = estimator.getCostReport();
 * // {
 * //   totalTokens: 150,
 * //   totalCost: 0.001,
 * //   totalSavings: 0.014,
 * //   savingsPercentage: 93.3
 * // }
 * ```
 */
import { ModelType } from './PromptAnalyzer';
export interface TokenUsage {
    model: ModelType;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
}
export interface SavingsRecord {
    actualModel: ModelType;
    alternativeModel: ModelType;
    tokens: number;
    savedCost: number;
}
export interface CostReport {
    totalTokens: number;
    totalCost: number;
    tokensByModel: Record<ModelType, number>;
    costByModel: Record<ModelType, number>;
    totalSavings: number;
    savingsPercentage: number;
}
export declare class TokenEstimator {
    private readonly MODEL_COSTS;
    private totalTokens;
    private totalCost;
    private tokensByModel;
    private costByModel;
    private totalSavings;
    private dailyCost;
    private lastResetDate;
    /**
     * Estimate token count for text
     *
     * Uses simple heuristic: ~4 characters per token
     */
    estimateTokens(text: string): number;
    /**
     * Calculate cost for tokens
     */
    calculateCost(tokens: number, model: ModelType): number;
    /**
     * Track token usage
     */
    trackUsage(usage: TokenUsage): void;
    /**
     * Track savings from routing
     */
    trackSavings(savings: SavingsRecord): void;
    /**
     * Get comprehensive cost report
     */
    getCostReport(): CostReport;
    /**
     * Check if within budget
     */
    isWithinBudget(budget: number): boolean;
    /**
     * Get budget remaining
     */
    getBudgetRemaining(budget: number): number;
    /**
     * Get daily cost
     */
    getDailyCost(): number;
    /**
     * Reset daily tracking
     */
    resetDaily(): void;
    /**
     * Export usage data
     */
    exportData(): string;
    /**
     * Import usage data
     */
    importData(data: string): void;
    /**
     * Check if daily needs reset
     */
    private checkDailyReset;
}
//# sourceMappingURL=TokenEstimator.d.ts.map