/**
 * StatsigIntegration Tests
 * 
 * Tests for Statsig SDK wrapper for automated A/B testing.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Wraps statsig-node (battle-tested) with SHIM-specific logic.
 */

import { StatsigIntegration, ExperimentConfig, ExperimentResult, Variant } from './StatsigIntegration';
import { Opportunity, OpportunityType } from './OpportunityDetector';

describe('StatsigIntegration', () => {
  let statsig: StatsigIntegration;
  const testApiKey = 'test-secret-key-123';
  
  beforeEach(() => {
    statsig = new StatsigIntegration(testApiKey, { enableLogging: false });
  });
  
  afterEach(async () => {
    await statsig.shutdown();
  });
  
  describe('Construction', () => {
    it('should create StatsigIntegration instance', () => {
      expect(statsig).toBeInstanceOf(StatsigIntegration);
    });
    
    it('should accept API key', () => {
      const customStatsig = new StatsigIntegration('custom-key');
      expect(customStatsig).toBeInstanceOf(StatsigIntegration);
    });
    
    it('should initialize Statsig SDK', async () => {
      const initialized = await statsig.initialize();
      expect(initialized).toBe(true);
    });
    
    it('should support options', () => {
      const statsigWithOptions = new StatsigIntegration(testApiKey, {
        environment: 'development',
        enableLogging: true
      });
      
      expect(statsigWithOptions).toBeInstanceOf(StatsigIntegration);
    });
  });
  
  describe('Experiment Creation', () => {
    it('should create experiment from opportunity', async () => {
      const opportunity = createMockOpportunity({
        type: 'checkpoint_interval_optimization',
        currentValue: 5,
        proposedValue: 3
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment).toHaveProperty('id');
      expect(experiment).toHaveProperty('name');
      expect(experiment).toHaveProperty('control');
      expect(experiment).toHaveProperty('treatment');
    });
    
    it('should generate experiment name from opportunity type', async () => {
      const opportunity = createMockOpportunity({
        type: 'model_routing_optimization'
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.name).toContain('model_routing');
    });
    
    it('should define control variant', async () => {
      const opportunity = createMockOpportunity({
        currentValue: 5
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.control.value).toBe(5);
    });
    
    it('should define treatment variant', async () => {
      const opportunity = createMockOpportunity({
        proposedValue: 3
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.treatment.value).toBe(3);
    });
    
    it('should include success metrics', async () => {
      const opportunity = createMockOpportunity({
        type: 'checkpoint_performance'
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.successMetrics).toBeDefined();
      expect(Array.isArray(experiment.successMetrics)).toBe(true);
      expect(experiment.successMetrics.length).toBeGreaterThan(0);
    });
  });
  
  describe('Variant Assignment', () => {
    it('should get variant for user', async () => {
      await statsig.initialize();
      
      const variant = await statsig.getVariant('checkpoint_interval', 'user-123');
      
      expect(variant).toHaveProperty('name');
      expect(variant).toHaveProperty('value');
    });
    
    it('should assign control or treatment', async () => {
      await statsig.initialize();
      
      const variant = await statsig.getVariant('test_experiment', 'user-456');
      
      expect(['control', 'treatment']).toContain(variant.name);
    });
    
    it('should maintain consistent assignment for same user', async () => {
      await statsig.initialize();
      
      const variant1 = await statsig.getVariant('test_experiment', 'user-789');
      const variant2 = await statsig.getVariant('test_experiment', 'user-789');
      
      expect(variant1.name).toBe(variant2.name);
      expect(variant1.value).toBe(variant2.value);
    });
    
    it('should support custom user attributes', async () => {
      await statsig.initialize();
      
      const variant = await statsig.getVariant('test_experiment', 'user-abc', {
        sessionType: 'development',
        crashRate: 0.12
      });
      
      expect(variant).toBeDefined();
    });
  });
  
  describe('Event Logging', () => {
    it('should log experiment exposure', async () => {
      await statsig.initialize();
      
      const logged = await statsig.logExposure('checkpoint_interval', 'user-123', 'treatment');
      
      expect(logged).toBe(true);
    });
    
    it('should log custom events', async () => {
      await statsig.initialize();
      
      const logged = await statsig.logEvent('crash_occurred', {
        interval: 3,
        sessionId: 'session-456'
      });
      
      expect(logged).toBe(true);
    });
    
    it('should log with user context', async () => {
      await statsig.initialize();
      
      const logged = await statsig.logEvent('crash_occurred', {
        interval: 5
      }, 'user-789');
      
      expect(logged).toBe(true);
    });
    
    it('should batch events for performance', async () => {
      await statsig.initialize();
      
      for (let i = 0; i < 10; i++) {
        await statsig.logEvent('test_event', { value: i });
      }
      
      // Events should be batched, not sent individually
      const flushed = await statsig.flush();
      expect(flushed).toBe(true);
    });
  });
  
  describe('Experiment Results', () => {
    it('should get experiment results', async () => {
      await statsig.initialize();
      
      const results = await statsig.getExperimentResults('checkpoint_interval');
      
      expect(results).toHaveProperty('control');
      expect(results).toHaveProperty('treatment');
    });
    
    it('should include sample sizes', async () => {
      await statsig.initialize();
      
      const results = await statsig.getExperimentResults('test_experiment');
      
      expect(results.control).toHaveProperty('sampleSize');
      expect(results.treatment).toHaveProperty('sampleSize');
    });
    
    it('should include metric values', async () => {
      await statsig.initialize();
      
      const results = await statsig.getExperimentResults('checkpoint_interval');
      
      expect(results.control).toHaveProperty('metrics');
      expect(results.treatment).toHaveProperty('metrics');
    });
    
    it('should calculate statistical significance', async () => {
      await statsig.initialize();
      
      const results = await statsig.getExperimentResults('test_experiment');
      
      expect(results).toHaveProperty('isSignificant');
      expect(results).toHaveProperty('pValue');
    });
    
    it('should determine winner', async () => {
      await statsig.initialize();
      
      const results = await statsig.getExperimentResults('checkpoint_interval');
      
      if (results.isSignificant) {
        expect(results).toHaveProperty('winner');
        expect(['control', 'treatment', 'none']).toContain(results.winner);
      }
    });
  });
  
  describe('Experiment Management', () => {
    it('should list active experiments', async () => {
      await statsig.initialize();
      
      const experiments = await statsig.listExperiments();
      
      expect(Array.isArray(experiments)).toBe(true);
    });
    
    it('should get experiment config', async () => {
      await statsig.initialize();
      
      const config = await statsig.getExperimentConfig('checkpoint_interval');
      
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('variants');
    });
    
    it('should stop experiment', async () => {
      await statsig.initialize();
      
      const stopped = await statsig.stopExperiment('test_experiment');
      
      expect(stopped).toBe(true);
    });
    
    it('should archive experiment', async () => {
      await statsig.initialize();
      
      const archived = await statsig.archiveExperiment('old_experiment');
      
      expect(archived).toBe(true);
    });
  });
  
  describe('Rollback', () => {
    it('should rollback to control', async () => {
      await statsig.initialize();
      
      const rolledBack = await statsig.rollback('checkpoint_interval');
      
      expect(rolledBack).toBe(true);
    });
    
    it('should set all users to control variant', async () => {
      await statsig.initialize();
      
      await statsig.rollback('test_experiment');
      
      // After rollback, all users should get control
      const variant = await statsig.getVariant('test_experiment', 'user-999');
      expect(variant.name).toBe('control');
    });
    
    it('should log rollback event', async () => {
      await statsig.initialize();
      
      const logged = await statsig.rollback('checkpoint_interval', 'Safety threshold violated');
      
      expect(logged).toBe(true);
    });
  });
  
  describe('Auto-Deployment', () => {
    it('should auto-deploy winning variant', async () => {
      await statsig.initialize();
      
      const deployed = await statsig.deployWinner('checkpoint_interval');
      
      expect(deployed).toHaveProperty('deployed');
      expect(deployed).toHaveProperty('variant');
    });
    
    it('should require statistical significance for deployment', async () => {
      await statsig.initialize();
      
      const deployed = await statsig.deployWinner('inconclusive_experiment');
      
      if (!deployed.deployed) {
        expect(deployed.reason).toContain('not significant');
      }
    });
    
    it('should set deployment threshold', () => {
      statsig.setDeploymentThreshold(0.95);
      
      const threshold = statsig.getDeploymentThreshold();
      expect(threshold).toBe(0.95);
    });
    
    it('should include deployment metadata', async () => {
      await statsig.initialize();
      
      const deployed = await statsig.deployWinner('checkpoint_interval');
      
      if (deployed.deployed) {
        expect(deployed).toHaveProperty('deployedAt');
        expect(deployed).toHaveProperty('previousValue');
        expect(deployed).toHaveProperty('newValue');
      }
    });
  });
  
  describe('Integration with OpportunityDetector', () => {
    it('should create experiment from opportunity', async () => {
      const opportunity = createMockOpportunity({
        type: 'checkpoint_interval_optimization',
        currentValue: 5,
        proposedValue: 3,
        hypothesis: 'Decreasing interval reduces crashes'
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.name).toContain('checkpoint_interval');
      expect(experiment.control.value).toBe(5);
      expect(experiment.treatment.value).toBe(3);
    });
    
    it('should map opportunity type to success metrics', async () => {
      const opportunity = createMockOpportunity({
        type: 'model_routing_optimization'
      });
      
      const experiment = await statsig.createExperiment(opportunity);
      
      expect(experiment.successMetrics).toContain('model_routing_accuracy');
    });
    
    it('should create multiple experiments from opportunities', async () => {
      const opportunities = [
        createMockOpportunity({ type: 'checkpoint_interval_optimization' }),
        createMockOpportunity({ type: 'model_routing_optimization' }),
        createMockOpportunity({ type: 'checkpoint_performance' })
      ];
      
      const experiments = await statsig.createExperiments(opportunities);
      
      expect(experiments.length).toBe(3);
      experiments.forEach(exp => {
        expect(exp).toHaveProperty('id');
        expect(exp).toHaveProperty('name');
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle initialization failure', async () => {
      const badStatsig = new StatsigIntegration('invalid-key');
      
      const initialized = await badStatsig.initialize();
      
      // Should handle gracefully
      expect(typeof initialized).toBe('boolean');
    });
    
    it('should handle network errors', async () => {
      await statsig.initialize();
      
      // Simulate network error
      const results = await statsig.getExperimentResults('nonexistent');
      
      expect(results).toBeDefined();
      expect(results).toHaveProperty('error');
    });
    
    it('should validate experiment name', async () => {
      await expect(statsig.createExperiment({
        ...createMockOpportunity(),
        type: '' as OpportunityType
      })).rejects.toThrow();
    });
    
    it('should handle missing variants', async () => {
      await statsig.initialize();
      
      const variant = await statsig.getVariant('nonexistent_experiment', 'user-123');
      
      // Should return default control
      expect(variant.name).toBe('control');
    });
  });
  
  describe('Shutdown', () => {
    it('should flush pending events on shutdown', async () => {
      await statsig.initialize();
      
      await statsig.logEvent('test_event', { value: 1 });
      await statsig.logEvent('test_event', { value: 2 });
      
      const shutdown = await statsig.shutdown();
      
      expect(shutdown).toBe(true);
    });
    
    it('should cleanup resources', async () => {
      await statsig.initialize();
      await statsig.shutdown();
      
      const isShutdown = statsig.isShutdown();
      expect(isShutdown).toBe(true);
    });
  });
});

// Helper functions

function createMockOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    type: 'checkpoint_interval_optimization',
    pattern: 'Test pattern',
    hypothesis: 'Test hypothesis',
    confidence: 0.85,
    impact: 'Test impact',
    currentValue: 5,
    proposedValue: 3,
    estimatedSavings: 100,
    sampleSize: 10,
    detectedAt: new Date().toISOString(),
    ...overrides
  };
}
