/**
 * TokenEstimator Tests
 * 
 * Tests for token counting and cost calculation.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Track token usage and costs for:
 * - Individual queries
 * - Cumulative usage
 * - Cost savings from routing
 * - Budget monitoring
 */

import { TokenEstimator, TokenUsage, CostReport } from './TokenEstimator';

describe('TokenEstimator', () => {
  let estimator: TokenEstimator;
  
  beforeEach(() => {
    estimator = new TokenEstimator();
  });
  
  describe('Construction', () => {
    it('should create TokenEstimator instance', () => {
      expect(estimator).toBeInstanceOf(TokenEstimator);
    });
  });
  
  describe('Token Counting', () => {
    it('should estimate tokens for simple text', () => {
      const text = 'Hello world';
      const tokens = estimator.estimateTokens(text);
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });
    
    it('should estimate tokens for longer text', () => {
      const text = 'This is a longer piece of text '.repeat(10);
      const tokens = estimator.estimateTokens(text);
      
      expect(tokens).toBeGreaterThan(50);
    });
    
    it('should handle empty text', () => {
      const tokens = estimator.estimateTokens('');
      
      expect(tokens).toBe(0);
    });
  });
  
  describe('Cost Calculation', () => {
    it('should calculate cost for Haiku', () => {
      const cost = estimator.calculateCost(1000, 'haiku');
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01);
    });
    
    it('should calculate cost for Sonnet', () => {
      const cost = estimator.calculateCost(1000, 'sonnet');
      
      expect(cost).toBeGreaterThan(0);
    });
    
    it('should calculate cost for Opus', () => {
      const cost = estimator.calculateCost(1000, 'opus');
      
      expect(cost).toBeGreaterThan(0);
    });
    
    it('should show Opus costs more than Haiku', () => {
      const haikuCost = estimator.calculateCost(1000, 'haiku');
      const opusCost = estimator.calculateCost(1000, 'opus');
      
      expect(opusCost).toBeGreaterThan(haikuCost);
    });
  });
  
  describe('Usage Tracking', () => {
    it('should track token usage', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      const report = estimator.getCostReport();
      
      expect(report.totalTokens).toBe(150);
      expect(report.totalCost).toBe(0.001);
    });
    
    it('should accumulate usage', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      estimator.trackUsage({
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 100,
        totalCost: 0.003
      });
      
      const report = estimator.getCostReport();
      
      expect(report.totalTokens).toBe(450); // 150 + 300
      expect(report.totalCost).toBeCloseTo(0.004, 3);
    });
    
    it('should track by model', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      const report = estimator.getCostReport();
      
      expect(report.tokensByModel.haiku).toBe(150);
    });
  });
  
  describe('Savings Calculation', () => {
    it('should calculate savings from routing', () => {
      // Used Haiku instead of Opus
      estimator.trackSavings({
        actualModel: 'haiku',
        alternativeModel: 'opus',
        tokens: 1000,
        savedCost: 0.014
      });
      
      const report = estimator.getCostReport();
      
      expect(report.totalSavings).toBeCloseTo(0.014, 3);
    });
    
    it('should accumulate savings', () => {
      estimator.trackSavings({
        actualModel: 'haiku',
        alternativeModel: 'opus',
        tokens: 1000,
        savedCost: 0.014
      });
      
      estimator.trackSavings({
        actualModel: 'sonnet',
        alternativeModel: 'opus',
        tokens: 1000,
        savedCost: 0.012
      });
      
      const report = estimator.getCostReport();
      
      expect(report.totalSavings).toBeCloseTo(0.026, 3);
    });
  });
  
  describe('Cost Reports', () => {
    it('should generate comprehensive cost report', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      const report = estimator.getCostReport();
      
      expect(report).toHaveProperty('totalTokens');
      expect(report).toHaveProperty('totalCost');
      expect(report).toHaveProperty('tokensByModel');
      expect(report).toHaveProperty('costByModel');
      expect(report).toHaveProperty('totalSavings');
    });
    
    it('should show savings percentage', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.001
      });
      
      estimator.trackSavings({
        actualModel: 'haiku',
        alternativeModel: 'opus',
        tokens: 1500,
        savedCost: 0.014
      });
      
      const report = estimator.getCostReport();
      
      expect(report.savingsPercentage).toBeGreaterThan(0);
    });
  });
  
  describe('Budget Monitoring', () => {
    it('should check if within budget', () => {
      const budget = 1.0; // $1
      
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.5
      });
      
      const withinBudget = estimator.isWithinBudget(budget);
      
      expect(withinBudget).toBe(true);
    });
    
    it('should detect budget exceeded', () => {
      const budget = 0.001; // $0.001
      
      estimator.trackUsage({
        model: 'opus',
        inputTokens: 10000,
        outputTokens: 5000,
        totalCost: 0.150
      });
      
      const withinBudget = estimator.isWithinBudget(budget);
      
      expect(withinBudget).toBe(false);
    });
    
    it('should calculate budget remaining', () => {
      const budget = 1.0;
      
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.3
      });
      
      const remaining = estimator.getBudgetRemaining(budget);
      
      expect(remaining).toBeCloseTo(0.7, 2);
    });
  });
  
  describe('Time-Based Reports', () => {
    it('should track daily costs', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      const daily = estimator.getDailyCost();
      
      expect(daily).toBeCloseTo(0.001, 3);
    });
    
    it('should reset daily on new day', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      estimator.resetDaily();
      
      const daily = estimator.getDailyCost();
      
      expect(daily).toBe(0);
    });
  });
  
  describe('Export & Import', () => {
    it('should export usage data', () => {
      estimator.trackUsage({
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.001
      });
      
      const exported = estimator.exportData();
      
      expect(exported).toContain('totalTokens');
      expect(exported).toContain('totalCost');
    });
    
    it('should import usage data', () => {
      const data = JSON.stringify({
        totalTokens: 1000,
        totalCost: 0.01,
        tokensByModel: { haiku: 1000, sonnet: 0, opus: 0 },
        costByModel: { haiku: 0.01, sonnet: 0, opus: 0 },
        totalSavings: 0.05
      });
      
      estimator.importData(data);
      
      const report = estimator.getCostReport();
      
      expect(report.totalTokens).toBe(1000);
      expect(report.totalCost).toBeCloseTo(0.01, 3);
    });
  });
});
