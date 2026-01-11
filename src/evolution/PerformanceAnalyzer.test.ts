/**
 * PerformanceAnalyzer Tests
 * 
 * Tests for statistical analysis of experiment results.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Statistical rigor (domain logic), not generic analytics framework.
 */

import { PerformanceAnalyzer, ExperimentResults, AnalysisResult, Recommendation } from './PerformanceAnalyzer';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;
  
  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });
  
  describe('Construction', () => {
    it('should create PerformanceAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(PerformanceAnalyzer);
    });
  });
  
  describe('Statistical Significance', () => {
    it('should detect significant improvement', () => {
      const results: ExperimentResults = {
        control: { mean: 0.26, stddev: 0.05, n: 1000 },
        variant: { mean: 0.56, stddev: 0.08, n: 1000 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.significant).toBe(true);
      expect(analysis.pValue).toBeLessThan(0.05);
    });
    
    it('should detect no significance when difference is small', () => {
      const results: ExperimentResults = {
        control: { mean: 0.50, stddev: 0.10, n: 100 },
        variant: { mean: 0.51, stddev: 0.10, n: 100 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.significant).toBe(false);
      expect(analysis.pValue).toBeGreaterThanOrEqual(0.05);
    });
    
    it('should handle large effect sizes', () => {
      const results: ExperimentResults = {
        control: { mean: 10, stddev: 2, n: 500 },
        variant: { mean: 50, stddev: 5, n: 500 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.significant).toBe(true);
      expect(analysis.effectSize).toBeGreaterThan(1.0); // Cohen's d > 1 = large effect
    });
  });
  
  describe('Effect Size Calculation', () => {
    it('should calculate Cohen\'s d for effect size', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 15, n: 300 },
        variant: { mean: 120, stddev: 15, n: 300 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.effectSize).toBeDefined();
      expect(analysis.effectSize).toBeGreaterThan(0);
    });
    
    it('should classify small effect sizes', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 20, n: 200 },
        variant: { mean: 103, stddev: 20, n: 200 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.effectSize).toBeLessThan(0.5); // Cohen's d < 0.5 = small effect
    });
    
    it('should classify medium effect sizes', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 15, n: 200 },
        variant: { mean: 110, stddev: 15, n: 200 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.effectSize).toBeGreaterThan(0.5);
      expect(analysis.effectSize).toBeLessThan(0.8);
    });
  });
  
  describe('Confidence Intervals', () => {
    it('should calculate confidence intervals for improvement', () => {
      const results: ExperimentResults = {
        control: { mean: 0.80, stddev: 0.10, n: 500 },
        variant: { mean: 0.90, stddev: 0.10, n: 500 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.confidenceInterval).toBeDefined();
      expect(analysis.confidenceInterval.lower).toBeLessThan(analysis.improvement);
      expect(analysis.confidenceInterval.upper).toBeGreaterThan(analysis.improvement);
    });
    
    it('should have narrower intervals with larger samples', () => {
      const smallSample: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 50 },
        variant: { mean: 60, stddev: 10, n: 50 }
      };
      
      const largeSample: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 1000 },
        variant: { mean: 60, stddev: 10, n: 1000 }
      };
      
      const smallAnalysis = analyzer.analyze(smallSample);
      const largeAnalysis = analyzer.analyze(largeSample);
      
      const smallWidth = smallAnalysis.confidenceInterval.upper - smallAnalysis.confidenceInterval.lower;
      const largeWidth = largeAnalysis.confidenceInterval.upper - largeAnalysis.confidenceInterval.lower;
      
      expect(largeWidth).toBeLessThan(smallWidth);
    });
  });
  
  describe('Recommendations', () => {
    it('should recommend deploy for significant positive improvement', () => {
      const results: ExperimentResults = {
        control: { mean: 0.70, stddev: 0.08, n: 800 },
        variant: { mean: 0.90, stddev: 0.08, n: 800 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.recommendation).toBe('deploy');
      expect(analysis.confidence).toBeGreaterThan(0.90);
    });
    
    it('should recommend rollback for significant negative impact', () => {
      const results: ExperimentResults = {
        control: { mean: 0.90, stddev: 0.05, n: 600 },
        variant: { mean: 0.70, stddev: 0.08, n: 600 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.recommendation).toBe('rollback');
      expect(analysis.improvement).toBeLessThan(0);
    });
    
    it('should recommend continue when inconclusive', () => {
      const results: ExperimentResults = {
        control: { mean: 0.75, stddev: 0.12, n: 80 },
        variant: { mean: 0.78, stddev: 0.12, n: 80 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.recommendation).toBe('continue');
      expect(analysis.significant).toBe(false);
    });
  });
  
  describe('Performance Regression Detection', () => {
    it('should detect significant negative change', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 10, n: 400 },
        variant: { mean: 80, stddev: 10, n: 400 }
      };
      
      const analysis = analyzer.analyze(results);
      
      // Significant negative change flagged as regression
      expect(analysis.hasRegression).toBe(true);
      expect(analysis.improvement).toBeLessThan(0);
    });
    
    it('should not flag regression for positive changes', () => {
      const results: ExperimentResults = {
        control: { mean: 0.60, stddev: 0.08, n: 500 },
        variant: { mean: 0.85, stddev: 0.08, n: 500 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.hasRegression).toBe(false);
      expect(analysis.improvement).toBeGreaterThan(0);
    });
  });
  
  describe('Statistical Tests', () => {
    it('should perform t-test for continuous metrics', () => {
      const results: ExperimentResults = {
        control: { mean: 45, stddev: 8, n: 300 },
        variant: { mean: 55, stddev: 8, n: 300 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.testStatistic).toBeDefined();
      expect(analysis.degreesOfFreedom).toBeDefined();
    });
    
    it('should calculate correct degrees of freedom', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 15, n: 250 },
        variant: { mean: 110, stddev: 15, n: 250 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.degreesOfFreedom).toBeGreaterThan(0);
      expect(analysis.degreesOfFreedom).toBeLessThanOrEqual(500);
    });
  });
  
  describe('Minimum Sample Size', () => {
    it('should warn if sample size too small', () => {
      const results: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 10 },
        variant: { mean: 60, stddev: 10, n: 10 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.warnings).toBeDefined();
      expect(analysis.warnings).toContain('insufficient_sample_size');
    });
    
    it('should not warn with adequate sample', () => {
      const results: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 500 },
        variant: { mean: 60, stddev: 10, n: 500 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.warnings).not.toContain('insufficient_sample_size');
    });
  });
  
  describe('Improvement Calculation', () => {
    it('should calculate absolute improvement', () => {
      const results: ExperimentResults = {
        control: { mean: 0.60, stddev: 0.08, n: 400 },
        variant: { mean: 0.80, stddev: 0.08, n: 400 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.improvement).toBeCloseTo(0.20, 2);
    });
    
    it('should calculate relative improvement percentage', () => {
      const results: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 300 },
        variant: { mean: 75, stddev: 10, n: 300 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.relativeImprovement).toBeCloseTo(0.50, 2); // 50% improvement
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero variance', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 0, n: 100 },
        variant: { mean: 110, stddev: 0, n: 100 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis).toBeDefined();
      expect(analysis.significant).toBe(true);
    });
    
    it('should handle equal means', () => {
      const results: ExperimentResults = {
        control: { mean: 50, stddev: 10, n: 200 },
        variant: { mean: 50, stddev: 10, n: 200 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis.improvement).toBe(0);
      expect(analysis.significant).toBe(false);
      expect(analysis.recommendation).toBe('no_change');
    });
    
    it('should handle very large samples', () => {
      const results: ExperimentResults = {
        control: { mean: 100, stddev: 10, n: 100000 },
        variant: { mean: 101, stddev: 10, n: 100000 }
      };
      
      const analysis = analyzer.analyze(results);
      
      expect(analysis).toBeDefined();
      expect(analysis.pValue).toBeLessThan(0.05); // Large samples detect tiny effects
    });
  });
});
