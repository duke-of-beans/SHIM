/**
 * ExperimentGenerator Tests
 * 
 * Tests for experiment generation from opportunities.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Generates intelligent experiments (domain logic), not random configs.
 */

import { ExperimentGenerator, Experiment, ExperimentOpportunity, ExperimentVariant } from './ExperimentGenerator';

describe('ExperimentGenerator', () => {
  let generator: ExperimentGenerator;
  
  beforeEach(() => {
    generator = new ExperimentGenerator();
  });
  
  describe('Construction', () => {
    it('should create ExperimentGenerator instance', () => {
      expect(generator).toBeInstanceOf(ExperimentGenerator);
    });
  });
  
  describe('Experiment Generation', () => {
    it('should generate experiment from cost optimization opportunity', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'cost-optimization',
        metric: 'savings_rate',
        currentValue: 0.26,
        targetValue: 0.56,
        confidence: 0.85,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.name).toContain('cost-optimization');
      expect(experiment.area).toBe('cost-optimization');
      expect(experiment.metric).toBe('savings_rate');
      expect(experiment.variants).toHaveLength(2); // control + variant
    });
    
    it('should generate control variant with current config', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'crash-prevention',
        metric: 'accuracy',
        currentValue: 0.85,
        targetValue: 0.95,
        confidence: 0.90,
        impact: 'critical'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      const control = experiment.variants.find(v => v.name === 'control');
      
      expect(control).toBeDefined();
      expect(control?.isControl).toBe(true);
      expect(control?.config).toBeDefined();
    });
    
    it('should generate treatment variant with experimental config', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'model-routing',
        metric: 'quality',
        currentValue: 0.75,
        targetValue: 0.90,
        confidence: 0.80,
        impact: 'medium'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      const treatment = experiment.variants.find(v => v.name === 'treatment');
      
      expect(treatment).toBeDefined();
      expect(treatment?.isControl).toBe(false);
      expect(treatment?.config).toBeDefined();
      expect(treatment?.config).not.toEqual(experiment.variants[0]?.config);
    });
  });
  
  describe('Success Criteria', () => {
    it('should define success criteria based on target value', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'performance',
        metric: 'latency',
        currentValue: 100,
        targetValue: 50,
        confidence: 0.85,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.successCriteria).toBeDefined();
      expect(experiment.successCriteria.targetMetricValue).toBe(50);
      expect(experiment.successCriteria.minImprovement).toBeGreaterThan(0);
    });
    
    it('should set significance level for statistical testing', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'quality',
        metric: 'accuracy',
        currentValue: 0.80,
        targetValue: 0.90,
        confidence: 0.95,
        impact: 'critical'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.successCriteria.significanceLevel).toBe(0.05);
      expect(experiment.successCriteria.minSampleSize).toBeGreaterThan(0);
    });
  });
  
  describe('Safety Bounds', () => {
    it('should set rollback threshold for critical areas', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'crash-prevention',
        metric: 'accuracy',
        currentValue: 0.90,
        targetValue: 0.95,
        confidence: 0.90,
        impact: 'critical'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.safetyBounds).toBeDefined();
      expect(experiment.safetyBounds.maxPerformanceRegression).toBeLessThan(0.05);
      expect(experiment.safetyBounds.rollbackThreshold).toBeLessThan(0.10);
    });
    
    it('should allow more risk for medium impact areas', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'ui-optimization',
        metric: 'responsiveness',
        currentValue: 0.70,
        targetValue: 0.85,
        confidence: 0.75,
        impact: 'medium'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.safetyBounds.maxPerformanceRegression).toBeGreaterThanOrEqual(0.05);
      expect(experiment.safetyBounds.rollbackThreshold).toBeGreaterThanOrEqual(0.05);
    });
  });
  
  describe('Sample Configuration', () => {
    it('should configure appropriate sample sizes', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'performance',
        metric: 'throughput',
        currentValue: 1000,
        targetValue: 1500,
        confidence: 0.85,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.sampleConfig).toBeDefined();
      expect(experiment.sampleConfig.minSampleSize).toBeGreaterThan(100);
      expect(experiment.sampleConfig.maxDuration).toBeGreaterThan(0);
    });
    
    it('should set appropriate duration limits', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'cost-optimization',
        metric: 'savings',
        currentValue: 100,
        targetValue: 200,
        confidence: 0.80,
        impact: 'medium'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.sampleConfig.maxDuration).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000); // 7 days
      expect(experiment.sampleConfig.checkpointInterval).toBeGreaterThan(0);
    });
  });
  
  describe('Variant Configuration', () => {
    it('should generate different configs for different areas', () => {
      const crashOpp: ExperimentOpportunity = {
        area: 'crash-prevention',
        metric: 'accuracy',
        currentValue: 0.85,
        targetValue: 0.95,
        confidence: 0.90,
        impact: 'critical'
      };
      
      const modelOpp: ExperimentOpportunity = {
        area: 'model-routing',
        metric: 'cost',
        currentValue: 100,
        targetValue: 50,
        confidence: 0.85,
        impact: 'high'
      };
      
      const crashExp = generator.generateExperiment(crashOpp);
      const modelExp = generator.generateExperiment(modelOpp);
      
      expect(crashExp.variants[1]?.config).not.toEqual(modelExp.variants[1]?.config);
    });
    
    it('should include metadata for each variant', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'load-balancing',
        metric: 'distribution',
        currentValue: 0.60,
        targetValue: 0.80,
        confidence: 0.85,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      experiment.variants.forEach(variant => {
        expect(variant.name).toBeDefined();
        expect(variant.description).toBeDefined();
        expect(variant.config).toBeDefined();
        expect(typeof variant.isControl).toBe('boolean');
      });
    });
  });
  
  describe('Experiment Metadata', () => {
    it('should include creation timestamp', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'performance',
        metric: 'latency',
        currentValue: 100,
        targetValue: 50,
        confidence: 0.85,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.createdAt).toBeDefined();
      expect(new Date(experiment.createdAt).getTime()).toBeGreaterThan(0);
    });
    
    it('should generate unique experiment IDs', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'test',
        metric: 'value',
        currentValue: 1,
        targetValue: 2,
        confidence: 0.8,
        impact: 'low'
      };
      
      const exp1 = generator.generateExperiment(opportunity);
      const exp2 = generator.generateExperiment(opportunity);
      
      expect(exp1.id).toBeDefined();
      expect(exp2.id).toBeDefined();
      expect(exp1.id).not.toBe(exp2.id);
    });
    
    it('should include hypothesis description', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'crash-prevention',
        metric: 'accuracy',
        currentValue: 0.85,
        targetValue: 0.95,
        confidence: 0.90,
        impact: 'critical'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.hypothesis).toBeDefined();
      expect(experiment.hypothesis).toContain('crash-prevention');
      expect(experiment.hypothesis).toContain('accuracy');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle very small target improvements', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'micro-optimization',
        metric: 'efficiency',
        currentValue: 0.95,
        targetValue: 0.96,
        confidence: 0.85,
        impact: 'low'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.successCriteria.minImprovement).toBeGreaterThan(0);
      expect(experiment.sampleConfig.minSampleSize).toBeGreaterThan(1000); // Need large sample for small effect
    });
    
    it('should handle very large target improvements', () => {
      const opportunity: ExperimentOpportunity = {
        area: 'radical-change',
        metric: 'performance',
        currentValue: 10,
        targetValue: 100,
        confidence: 0.70,
        impact: 'high'
      };
      
      const experiment = generator.generateExperiment(opportunity);
      
      expect(experiment.safetyBounds.maxPerformanceRegression).toBeDefined();
      expect(experiment.successCriteria.minImprovement).toBeLessThan(experiment.successCriteria.targetMetricValue);
    });
  });
});
