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

export class TokenEstimator {
  // Pricing per 1M tokens (average of input + output)
  private readonly MODEL_COSTS = {
    haiku: 0.001,
    sonnet: 0.003,
    opus: 0.015
  };
  
  // Usage tracking
  private totalTokens: number = 0;
  private totalCost: number = 0;
  private tokensByModel: Record<ModelType, number> = {
    haiku: 0,
    sonnet: 0,
    opus: 0
  };
  private costByModel: Record<ModelType, number> = {
    haiku: 0,
    sonnet: 0,
    opus: 0
  };
  
  // Savings tracking
  private totalSavings: number = 0;
  
  // Daily tracking
  private dailyCost: number = 0;
  private lastResetDate: string = new Date().toISOString().split('T')[0];
  
  /**
   * Estimate token count for text
   * 
   * Uses simple heuristic: ~4 characters per token
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Calculate cost for tokens
   */
  calculateCost(tokens: number, model: ModelType): number {
    const costPerMillion = this.MODEL_COSTS[model];
    return (tokens / 1000000) * costPerMillion;
  }
  
  /**
   * Track token usage
   */
  trackUsage(usage: TokenUsage): void {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    
    // Update totals
    this.totalTokens += totalTokens;
    this.totalCost += usage.totalCost;
    
    // Update by model
    this.tokensByModel[usage.model] += totalTokens;
    this.costByModel[usage.model] += usage.totalCost;
    
    // Update daily
    this.checkDailyReset();
    this.dailyCost += usage.totalCost;
  }
  
  /**
   * Track savings from routing
   */
  trackSavings(savings: SavingsRecord): void {
    this.totalSavings += savings.savedCost;
  }
  
  /**
   * Get comprehensive cost report
   */
  getCostReport(): CostReport {
    const savingsPercentage = this.totalCost > 0
      ? (this.totalSavings / (this.totalCost + this.totalSavings)) * 100
      : 0;
    
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      tokensByModel: { ...this.tokensByModel },
      costByModel: { ...this.costByModel },
      totalSavings: this.totalSavings,
      savingsPercentage
    };
  }
  
  /**
   * Check if within budget
   */
  isWithinBudget(budget: number): boolean {
    return this.totalCost <= budget;
  }
  
  /**
   * Get budget remaining
   */
  getBudgetRemaining(budget: number): number {
    return Math.max(0, budget - this.totalCost);
  }
  
  /**
   * Get daily cost
   */
  getDailyCost(): number {
    this.checkDailyReset();
    return this.dailyCost;
  }
  
  /**
   * Reset daily tracking
   */
  resetDaily(): void {
    this.dailyCost = 0;
    this.lastResetDate = new Date().toISOString().split('T')[0];
  }
  
  /**
   * Export usage data
   */
  exportData(): string {
    return JSON.stringify({
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      tokensByModel: this.tokensByModel,
      costByModel: this.costByModel,
      totalSavings: this.totalSavings,
      dailyCost: this.dailyCost,
      lastResetDate: this.lastResetDate
    }, null, 2);
  }
  
  /**
   * Import usage data
   */
  importData(data: string): void {
    const parsed = JSON.parse(data);
    
    this.totalTokens = parsed.totalTokens || 0;
    this.totalCost = parsed.totalCost || 0;
    this.tokensByModel = parsed.tokensByModel || {
      haiku: 0,
      sonnet: 0,
      opus: 0
    };
    this.costByModel = parsed.costByModel || {
      haiku: 0,
      sonnet: 0,
      opus: 0
    };
    this.totalSavings = parsed.totalSavings || 0;
    this.dailyCost = parsed.dailyCost || 0;
    this.lastResetDate = parsed.lastResetDate || new Date().toISOString().split('T')[0];
  }
  
  /**
   * Check if daily needs reset
   */
  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (today !== this.lastResetDate) {
      this.resetDaily();
    }
  }
}
