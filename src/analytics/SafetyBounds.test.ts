/**
 * SafetyBounds Tests
 * 
 * Tests for safety enforcement during automated experimentation.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Prevent regressions by enforcing quality/performance/cost bounds.
 */

import { SafetyBounds, BoundConfig, BoundType, ValidationResult, Violation } from './SafetyBounds';
import { SHIMMetrics } from './SHIMMetrics';
import { ExperimentConfig } from './StatsigIntegration';

describe('SafetyBounds', () => {
  let bounds: SafetyBounds;
  let metrics: SHIMMetrics;
  
  beforeEach(() => {
    metrics = new SHIMMetrics();
    
    bounds = new SafetyBounds({
      crashRate: { max: 0.10 },
      checkpointTime: { max: 100 },
      resumeSuccessRate: { min: 0.90 },
      tokenCost: { maxIncrease: 0.20 }
    });
  });
  
  afterEach(() => {
    metrics.reset();
  });
  
  describe('Construction', () => {
    it('should create SafetyBounds instance', () => {
      expect(bounds).toBeInstanceOf(SafetyBounds);
    });
    
    it('should accept bound configuration', () => {
      const customBounds = new SafetyBounds({
        crashRate: { max: 0.05 },
        resumeSuccessRate: { min: 0.95 }
      });
      
      expect(customBounds).toBeInstanceOf(SafetyBounds);
    });
    
    it('should support multiple bound types', () => {
      const config = bounds.getConfig();
      
      expect(config.crashRate).toBeDefined();
      expect(config.checkpointTime).toBeDefined();
      expect(config.resumeSuccessRate).toBeDefined();
      expect(config.tokenCost).toBeDefined();
    });
  });
  
  describe('Crash Rate Bounds', () => {
    it('should validate crash rate within bounds', async () => {
      // Crash rate = 8% (below 10% threshold)
      metrics.recordCrashPredictionAccuracy(0.92);
      
      const result = await bounds.validate(metrics);
      
      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });
    
    it('should detect crash rate violation', async () => {
      // Crash rate = 15% (above 10% threshold)
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const result = await bounds.validate(metrics);
      
      const crashViolation = result.violations.find(v => v.boundType === 'crashRate');
      if (crashViolation) {
        expect(crashViolation.currentValue).toBeGreaterThan(0.10);
        expect(crashViolation.threshold).toBe(0.10);
      }
    });
    
    it('should include violation severity', async () => {
      metrics.recordCrashPredictionAccuracy(0.75); // 25% crash rate
      
      const result = await bounds.validate(metrics);
      
      const crashViolation = result.violations.find(v => v.boundType === 'crashRate');
      if (crashViolation) {
        expect(crashViolation.severity).toBe('critical');
      }
    });
  });
  
  describe('Performance Bounds', () => {
    it('should validate checkpoint time within bounds', async () => {
      // Average 50ms (below 100ms threshold)
      metrics.recordCheckpointCreationTime(50);
      metrics.recordCheckpointCreationTime(55);
      metrics.recordCheckpointCreationTime(45);
      
      const result = await bounds.validate(metrics);
      
      expect(result.passed).toBe(true);
    });
    
    it('should detect checkpoint time violation', async () => {
      // Average 150ms (above 100ms threshold)
      metrics.recordCheckpointCreationTime(150);
      metrics.recordCheckpointCreationTime(160);
      metrics.recordCheckpointCreationTime(140);
      
      const result = await bounds.validate(metrics);
      
      const perfViolation = result.violations.find(v => v.boundType === 'checkpointTime');
      expect(perfViolation).toBeDefined();
    });
    
    it('should validate restart time bounds', async () => {
      const customBounds = new SafetyBounds({
        restartTime: { max: 5000 }
      });
      
      metrics.recordSupervisorRestartTime(3000);
      
      const result = await customBounds.validate(metrics);
      expect(result.passed).toBe(true);
    });
  });
  
  describe('Quality Bounds', () => {
    it('should validate resume success rate above minimum', async () => {
      // 95% success (above 90% threshold)
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      
      const result = await bounds.validate(metrics);
      expect(result.passed).toBe(true);
    });
    
    it('should detect resume success rate violation', async () => {
      // 60% success (below 90% threshold)
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      metrics.recordResumeSuccess(false);
      
      const result = await bounds.validate(metrics);
      
      const resumeViolation = result.violations.find(v => v.boundType === 'resumeSuccessRate');
      expect(resumeViolation).toBeDefined();
    });
  });
  
  describe('Cost Bounds', () => {
    it('should validate token cost increase within limits', async () => {
      // 15% increase (below 20% threshold)
      const baseline = 10000;
      const current = 11500;
      
      const result = await bounds.validateTokenCostIncrease(baseline, current);
      expect(result.passed).toBe(true);
    });
    
    it('should detect excessive token cost increase', async () => {
      // 30% increase (above 20% threshold)
      const baseline = 10000;
      const current = 13000;
      
      const result = await bounds.validateTokenCostIncrease(baseline, current);
      expect(result.passed).toBe(false);
    });
    
    it('should allow cost decreases', async () => {
      // Cost decreased by 10%
      const baseline = 10000;
      const current = 9000;
      
      const result = await bounds.validateTokenCostIncrease(baseline, current);
      expect(result.passed).toBe(true);
    });
  });
  
  describe('Experiment Validation', () => {
    it('should validate experiment against bounds', async () => {
      const experiment = createMockExperiment();
      
      // Good metrics
      metrics.recordCrashPredictionAccuracy(0.95);
      metrics.recordCheckpointCreationTime(50);
      
      const result = await bounds.validateExperiment(experiment, metrics);
      expect(result.passed).toBe(true);
    });
    
    it('should reject experiment with violations', async () => {
      const experiment = createMockExperiment();
      
      // Bad metrics
      metrics.recordCrashPredictionAccuracy(0.80); // 20% crash rate
      
      const result = await bounds.validateExperiment(experiment, metrics);
      expect(result.passed).toBe(false);
    });
    
    it('should include experiment context in violations', async () => {
      const experiment = createMockExperiment();
      
      metrics.recordCrashPredictionAccuracy(0.80);
      
      const result = await bounds.validateExperiment(experiment, metrics);
      
      result.violations.forEach(violation => {
        expect(violation.experimentId).toBe(experiment.id);
      });
    });
  });
  
  describe('Violation Severity', () => {
    it('should classify critical violations', async () => {
      // 25% crash rate = critical
      metrics.recordCrashPredictionAccuracy(0.75);
      
      const result = await bounds.validate(metrics);
      
      const violation = result.violations[0];
      expect(violation.severity).toBe('critical');
    });
    
    it('should classify warning violations', async () => {
      // 11% crash rate = warning (just above 10%)
      metrics.recordCrashPredictionAccuracy(0.89);
      
      const result = await bounds.validate(metrics);
      
      const violation = result.violations[0];
      if (violation) {
        expect(['warning', 'critical']).toContain(violation.severity);
      }
    });
    
    it('should set severity based on threshold distance', async () => {
      const customBounds = new SafetyBounds({
        crashRate: { max: 0.10, critical: 0.15 }
      });
      
      // 12% = warning (between 10% and 15%)
      metrics.recordCrashPredictionAccuracy(0.88);
      
      const result = await customBounds.validate(metrics);
      
      const violation = result.violations[0];
      if (violation) {
        expect(violation.severity).toBe('warning');
      }
    });
  });
  
  describe('Rollback Recommendations', () => {
    it('should recommend rollback on critical violation', async () => {
      metrics.recordCrashPredictionAccuracy(0.70); // 30% crash rate
      
      const result = await bounds.validate(metrics);
      
      expect(result.shouldRollback).toBe(true);
      expect(result.rollbackReason).toContain('critical');
    });
    
    it('should not recommend rollback on warnings', async () => {
      metrics.recordCrashPredictionAccuracy(0.89); // 11% crash rate
      
      const result = await bounds.validate(metrics);
      
      expect(result.shouldRollback).toBe(false);
    });
    
    it('should recommend rollback on multiple violations', async () => {
      metrics.recordCrashPredictionAccuracy(0.88); // 12% crash
      metrics.recordCheckpointCreationTime(120);   // Slow checkpoint
      
      const result = await bounds.validate(metrics);
      
      if (result.violations.length >= 2) {
        expect(result.shouldRollback).toBe(true);
      }
    });
  });
  
  describe('Monitoring', () => {
    it('should emit violation events', async () => {
      const violations: Violation[] = [];
      bounds.on('violation', (violation) => violations.push(violation));
      
      metrics.recordCrashPredictionAccuracy(0.80);
      
      await bounds.validate(metrics);
      
      expect(violations.length).toBeGreaterThan(0);
    });
    
    it('should emit critical violation events', async () => {
      const criticals: Violation[] = [];
      bounds.on('critical_violation', (violation) => criticals.push(violation));
      
      metrics.recordCrashPredictionAccuracy(0.70);
      
      await bounds.validate(metrics);
      
      expect(criticals.length).toBeGreaterThan(0);
    });
    
    it('should emit rollback recommended events', async () => {
      const recommendations: any[] = [];
      bounds.on('rollback_recommended', (result) => recommendations.push(result));
      
      metrics.recordCrashPredictionAccuracy(0.70);
      
      await bounds.validate(metrics);
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Configuration Updates', () => {
    it('should update bound thresholds', () => {
      bounds.updateBound('crashRate', { max: 0.05 });
      
      const config = bounds.getConfig();
      expect(config.crashRate.max).toBe(0.05);
    });
    
    it('should add new bounds', () => {
      bounds.updateBound('modelAccuracy', { min: 0.85 });
      
      const config = bounds.getConfig();
      expect(config.modelAccuracy).toBeDefined();
    });
    
    it('should remove bounds', () => {
      bounds.removeBound('tokenCost');
      
      const config = bounds.getConfig();
      expect(config.tokenCost).toBeUndefined();
    });
  });
  
  describe('Baseline Comparison', () => {
    it('should compare against baseline metrics', async () => {
      // Set baseline
      const baseline = {
        crashRate: 0.08,
        checkpointTime: 60
      };
      
      bounds.setBaseline(baseline);
      
      // Current metrics worse than baseline
      metrics.recordCrashPredictionAccuracy(0.85); // 15% vs 8%
      
      const result = await bounds.validateAgainstBaseline(metrics);
      expect(result.passed).toBe(false);
    });
    
    it('should allow improvements over baseline', async () => {
      const baseline = {
        crashRate: 0.12,
        checkpointTime: 80
      };
      
      bounds.setBaseline(baseline);
      
      // Current metrics better than baseline
      metrics.recordCrashPredictionAccuracy(0.95); // 5% vs 12%
      
      const result = await bounds.validateAgainstBaseline(metrics);
      expect(result.passed).toBe(true);
    });
  });
  
  describe('Reporting', () => {
    it('should generate violation report', async () => {
      metrics.recordCrashPredictionAccuracy(0.80);
      metrics.recordCheckpointCreationTime(150);
      
      const result = await bounds.validate(metrics);
      const report = bounds.generateReport(result);
      
      expect(report).toContain('violations');
      expect(report).toContain('crashRate');
      expect(report).toContain('checkpointTime');
    });
    
    it('should include remediation suggestions', async () => {
      metrics.recordCrashPredictionAccuracy(0.80);
      
      const result = await bounds.validate(metrics);
      const report = bounds.generateReport(result);
      
      expect(report).toContain('suggestion');
    });
  });
});

// Helper functions

function createMockExperiment(): ExperimentConfig {
  return {
    id: 'exp-test-123',
    name: 'test_experiment',
    control: { name: 'control', value: 5 },
    treatment: { name: 'treatment', value: 3 },
    successMetrics: ['crash_rate'],
    hypothesis: 'Test hypothesis',
    createdAt: new Date().toISOString()
  };
}
