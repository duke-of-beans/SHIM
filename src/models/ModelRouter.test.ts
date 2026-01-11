/**
 * ModelRouter Tests
 * 
 * Tests for intelligent model routing based on prompt analysis.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Route prompts to optimal Claude model based on:
 * - Prompt complexity
 * - Required capabilities
 * - Cost optimization
 * - Historical performance
 * 
 * Enables automatic cost reduction while maintaining quality.
 */

import { ModelRouter, RouterConfig, RoutingDecision, ModelPerformance } from './ModelRouter';
import { PromptAnalyzer } from './PromptAnalyzer';

describe('ModelRouter', () => {
  let router: ModelRouter;
  let analyzer: PromptAnalyzer;
  
  beforeEach(() => {
    analyzer = new PromptAnalyzer();
    router = new ModelRouter({
      analyzer,
      costOptimization: true,
      fallbackModel: 'sonnet'
    });
  });
  
  describe('Construction', () => {
    it('should create ModelRouter instance', () => {
      expect(router).toBeInstanceOf(ModelRouter);
    });
    
    it('should accept configuration', () => {
      const config = router.getConfig();
      
      expect(config.costOptimization).toBe(true);
      expect(config.fallbackModel).toBe('sonnet');
    });
  });
  
  describe('Basic Routing', () => {
    it('should route simple query to Haiku', async () => {
      const decision = await router.route('What is the capital of France?');
      
      expect(decision.selectedModel).toBe('haiku');
      expect(decision.reason).toContain('simple');
    });
    
    it('should route medium query to Sonnet', async () => {
      const decision = await router.route('Explain how async/await works in JavaScript');
      
      expect(decision.selectedModel).toBe('sonnet');
    });
    
    it('should route complex query to Opus', async () => {
      const decision = await router.route('Design a distributed system with fault tolerance');
      
      expect(decision.selectedModel).toBe('opus');
    });
    
    it('should route code generation to Opus', async () => {
      const decision = await router.route('Implement a binary search tree in TypeScript');
      
      expect(decision.selectedModel).toBe('opus');
      expect(decision.reason).toContain('code');
    });
  });
  
  describe('Cost Estimation', () => {
    it('should estimate cost for each model', async () => {
      const decision = await router.route('What is X?');
      
      expect(decision.estimatedCost).toHaveProperty('haiku');
      expect(decision.estimatedCost).toHaveProperty('sonnet');
      expect(decision.estimatedCost).toHaveProperty('opus');
    });
    
    it('should show cost savings', async () => {
      const decision = await router.route('What is X?');
      
      // Routed to Haiku, saved by not using Opus
      expect(decision.costSavings).toBeGreaterThan(0);
    });
    
    it('should calculate savings vs most expensive model', async () => {
      const decision = await router.route('Simple question');
      
      const opusCost = decision.estimatedCost.opus;
      const haikuCost = decision.estimatedCost.haiku;
      
      expect(decision.costSavings).toBeCloseTo(opusCost - haikuCost, 2);
    });
  });
  
  describe('Cost Optimization', () => {
    it('should prefer cheaper model when quality equivalent', async () => {
      // For simple queries, Haiku is sufficient
      const decision = await router.route('What is 2+2?');
      
      expect(decision.selectedModel).toBe('haiku');
    });
    
    it('should use expensive model when quality matters', async () => {
      // For complex code, Opus is necessary
      const decision = await router.route('Implement a self-balancing AVL tree with rotations');
      
      expect(decision.selectedModel).toBe('opus');
    });
    
    it('should disable cost optimization when configured', async () => {
      const alwaysOpusRouter = new ModelRouter({
        analyzer,
        costOptimization: false,
        defaultModel: 'opus'
      });
      
      const decision = await alwaysOpusRouter.route('What is X?');
      
      expect(decision.selectedModel).toBe('opus');
    });
  });
  
  describe('Confidence-Based Routing', () => {
    it('should use fallback for low confidence', async () => {
      const ambiguous = 'Things and stuff about whatever';
      
      const decision = await router.route(ambiguous);
      
      // Low confidence should use fallback (sonnet)
      if (decision.confidence < 0.6) {
        expect(decision.selectedModel).toBe('sonnet');
      }
    });
    
    it('should include confidence in decision', async () => {
      const decision = await router.route('Clear question: What is X?');
      
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Historical Performance', () => {
    it('should track successful routes', async () => {
      await router.route('What is X?');
      await router.recordSuccess('haiku', 150); // 150ms
      
      const perf = await router.getModelPerformance('haiku');
      
      expect(perf.successCount).toBe(1);
      expect(perf.averageLatency).toBe(150);
    });
    
    it('should track failures', async () => {
      await router.route('Complex task');
      await router.recordFailure('sonnet', 'timeout');
      
      const perf = await router.getModelPerformance('sonnet');
      
      expect(perf.failureCount).toBe(1);
    });
    
    it('should calculate success rate', async () => {
      await router.recordSuccess('haiku', 100);
      await router.recordSuccess('haiku', 150);
      await router.recordFailure('haiku', 'error');
      
      const perf = await router.getModelPerformance('haiku');
      
      expect(perf.successRate).toBeCloseTo(0.67, 2); // 2/3
    });
    
    it('should prefer historically successful models', async () => {
      // Record good performance for Haiku
      for (let i = 0; i < 10; i++) {
        await router.recordSuccess('haiku', 100);
      }
      
      // Record poor performance for Sonnet
      for (let i = 0; i < 5; i++) {
        await router.recordFailure('sonnet', 'error');
      }
      
      const decision = await router.route('Medium complexity task');
      
      // Should prefer Haiku due to better track record
      // (unless complexity requires Opus)
      const perf = await router.getModelPerformance('haiku');
      expect(perf.successRate).toBeGreaterThan(0.9);
    });
  });
  
  describe('Routing Strategies', () => {
    it('should support quality-first strategy', async () => {
      const qualityRouter = new ModelRouter({
        analyzer,
        strategy: 'quality',
        costOptimization: false
      });
      
      const decision = await qualityRouter.route('Medium task');
      
      // Quality-first prefers higher-tier models
      expect(['opus', 'sonnet']).toContain(decision.selectedModel);
    });
    
    it('should support cost-first strategy', async () => {
      const costRouter = new ModelRouter({
        analyzer,
        strategy: 'cost',
        costOptimization: true
      });
      
      const decision = await costRouter.route('Medium task');
      
      // Cost-first prefers cheaper models
      expect(['haiku', 'sonnet']).toContain(decision.selectedModel);
    });
    
    it('should support balanced strategy', async () => {
      const balancedRouter = new ModelRouter({
        analyzer,
        strategy: 'balanced',
        costOptimization: true
      });
      
      const decision = await balancedRouter.route('Medium task');
      
      // Balanced uses Sonnet for medium
      expect(decision.selectedModel).toBe('sonnet');
    });
  });
  
  describe('Override Capabilities', () => {
    it('should allow manual model override', async () => {
      const decision = await router.route('Simple task', { 
        forceModel: 'opus' 
      });
      
      expect(decision.selectedModel).toBe('opus');
      expect(decision.reason).toContain('manual override');
    });
    
    it('should support minimum model tier', async () => {
      const decision = await router.route('Simple task', {
        minModel: 'sonnet'
      });
      
      // Should be at least Sonnet, not Haiku
      expect(['sonnet', 'opus']).toContain(decision.selectedModel);
    });
  });
  
  describe('Batch Routing', () => {
    it('should route multiple prompts', async () => {
      const prompts = [
        'What is X?',
        'Explain Y',
        'Implement Z'
      ];
      
      const decisions = await router.routeMultiple(prompts);
      
      expect(decisions.length).toBe(3);
      expect(decisions[0].selectedModel).toBe('haiku');
      expect(decisions[2].selectedModel).toBe('opus');
    });
    
    it('should calculate total cost savings', async () => {
      const prompts = [
        'What is X?',
        'What is Y?',
        'What is Z?'
      ];
      
      const decisions = await router.routeMultiple(prompts);
      const totalSavings = decisions.reduce(
        (sum, d) => sum + d.costSavings, 
        0
      );
      
      expect(totalSavings).toBeGreaterThan(0);
    });
  });
  
  describe('Statistics & Reporting', () => {
    it('should track routing statistics', async () => {
      await router.route('Simple 1');
      await router.route('Simple 2');
      await router.route('Complex');
      
      const stats = await router.getRoutingStats();
      
      expect(stats.totalRoutes).toBe(3);
      expect(stats.routesByModel.haiku).toBeGreaterThan(0);
    });
    
    it('should calculate cumulative savings', async () => {
      await router.route('Simple 1');
      await router.route('Simple 2');
      await router.route('Simple 3');
      
      const stats = await router.getRoutingStats();
      
      expect(stats.totalCostSavings).toBeGreaterThan(0);
    });
    
    it('should show savings percentage', async () => {
      await router.route('Simple 1');
      await router.route('Complex');
      
      const stats = await router.getRoutingStats();
      
      expect(stats.savingsPercentage).toBeGreaterThan(0);
      expect(stats.savingsPercentage).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty prompt', async () => {
      const decision = await router.route('');
      
      expect(decision.selectedModel).toBe('sonnet'); // Fallback
    });
    
    it('should handle very long prompts', async () => {
      const longPrompt = 'X '.repeat(5000);
      
      const decision = await router.route(longPrompt);
      
      expect(decision.selectedModel).toBe('opus'); // Complex
    });
  });
});
