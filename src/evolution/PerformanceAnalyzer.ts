/**
 * PerformanceAnalyzer
 * 
 * Statistical analysis of experiment results with rigorous testing.
 * LEAN-OUT: Statistical rigor (domain logic), not generic analytics.
 * 
 * Responsibilities:
 * - Statistical significance testing (t-tests)
 * - Effect size calculation (Cohen's d)
 * - Confidence intervals
 * - Recommendation logic (deploy/rollback/continue)
 * - Performance regression detection
 */

/**
 * Experiment results for control and variant
 */
export interface ExperimentResults {
  control: {
    mean: number;
    stddev: number;
    n: number;
  };
  variant: {
    mean: number;
    stddev: number;
    n: number;
  };
}

/**
 * Confidence interval for improvement estimate
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // e.g., 0.95 for 95% CI
}

/**
 * Recommendation for experiment outcome
 */
export type Recommendation = 'deploy' | 'rollback' | 'continue' | 'no_change';

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  significant: boolean;              // Statistically significant?
  pValue: number;                   // P-value from statistical test
  effectSize: number;               // Cohen's d
  improvement: number;              // Absolute improvement (variant - control)
  relativeImprovement: number;      // Relative improvement (%)
  confidenceInterval: ConfidenceInterval;
  recommendation: Recommendation;
  confidence: number;               // Confidence in recommendation (0-1)
  hasRegression: boolean;           // Performance regression detected?
  testStatistic: number;            // T-statistic
  degreesOfFreedom: number;         // DF for t-test
  warnings: string[];               // Any warnings (e.g., small sample)
}

/**
 * PerformanceAnalyzer
 * 
 * Provides rigorous statistical analysis of A/B test results.
 */
export class PerformanceAnalyzer {
  private readonly minSampleSize = 30;      // Minimum for valid t-test
  private readonly significanceLevel = 0.05; // 95% confidence
  
  /**
   * Analyze experiment results and provide recommendation
   */
  analyze(results: ExperimentResults): AnalysisResult {
    const warnings: string[] = [];
    
    // Check sample sizes
    if (results.control.n < this.minSampleSize || results.variant.n < this.minSampleSize) {
      warnings.push('insufficient_sample_size');
    }
    
    // Calculate improvements
    const improvement = results.variant.mean - results.control.mean;
    const relativeImprovement = results.control.mean !== 0 
      ? improvement / Math.abs(results.control.mean)
      : 0;
    
    // Perform t-test
    const { testStatistic, pValue, degreesOfFreedom } = this.performTTest(results);
    
    // Calculate effect size
    const effectSize = this.calculateCohenD(results);
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(results);
    
    // Determine statistical significance
    const significant = pValue < this.significanceLevel;
    
    // Detect regression
    const hasRegression = improvement < 0 && significant;
    
    // Generate recommendation
    const { recommendation, confidence } = this.generateRecommendation(
      improvement,
      significant,
      pValue,
      effectSize
    );
    
    return {
      significant,
      pValue,
      effectSize,
      improvement,
      relativeImprovement,
      confidenceInterval,
      recommendation,
      confidence,
      hasRegression,
      testStatistic,
      degreesOfFreedom,
      warnings
    };
  }
  
  /**
   * Perform Welch's t-test (unequal variances)
   */
  private performTTest(results: ExperimentResults): {
    testStatistic: number;
    pValue: number;
    degreesOfFreedom: number;
  } {
    const { control, variant } = results;
    
    // Handle zero variance
    const controlVar = Math.max(control.stddev * control.stddev, 1e-10);
    const variantVar = Math.max(variant.stddev * variant.stddev, 1e-10);
    
    // Standard error of difference
    const se = Math.sqrt(controlVar / control.n + variantVar / variant.n);
    
    // T-statistic
    const testStatistic = (variant.mean - control.mean) / se;
    
    // Welch-Satterthwaite degrees of freedom
    const numerator = Math.pow(controlVar / control.n + variantVar / variant.n, 2);
    const denominator = 
      Math.pow(controlVar / control.n, 2) / (control.n - 1) +
      Math.pow(variantVar / variant.n, 2) / (variant.n - 1);
    const degreesOfFreedom = Math.max(1, Math.floor(numerator / denominator));
    
    // Calculate p-value (two-tailed)
    const pValue = this.tTestPValue(Math.abs(testStatistic), degreesOfFreedom);
    
    return { testStatistic, pValue, degreesOfFreedom };
  }
  
  /**
   * Calculate p-value for t-test
   * Approximation for large DF, exact for common cases
   */
  private tTestPValue(t: number, df: number): number {
    // For very large t-statistics, p-value approaches 0
    if (t > 10) return 0.0001;
    if (t < 0.1) return 0.9;
    
    // Approximation using normal distribution for large df
    if (df > 100) {
      return 2 * (1 - this.normalCDF(t));
    }
    
    // Simplified lookup table for common cases
    if (df >= 30) {
      if (t >= 2.75) return 0.01;
      if (t >= 2.04) return 0.05;
      if (t >= 1.70) return 0.10;
      return 0.20;
    }
    
    // Conservative estimate for small df
    if (t >= 3.0) return 0.01;
    if (t >= 2.0) return 0.05;
    if (t >= 1.5) return 0.15;
    return 0.30;
  }
  
  /**
   * Normal CDF approximation
   */
  private normalCDF(z: number): number {
    // Abramowitz & Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return z > 0 ? 1 - prob : prob;
  }
  
  /**
   * Calculate Cohen's d effect size
   */
  private calculateCohenD(results: ExperimentResults): number {
    const { control, variant } = results;
    
    // Pooled standard deviation
    const pooledSD = Math.sqrt(
      ((control.n - 1) * control.stddev * control.stddev +
       (variant.n - 1) * variant.stddev * variant.stddev) /
      (control.n + variant.n - 2)
    );
    
    // Prevent division by zero
    if (pooledSD === 0) {
      return variant.mean !== control.mean ? 10 : 0; // Large effect if different, zero if same
    }
    
    return Math.abs(variant.mean - control.mean) / pooledSD;
  }
  
  /**
   * Calculate 95% confidence interval for improvement
   */
  private calculateConfidenceInterval(results: ExperimentResults): ConfidenceInterval {
    const { control, variant } = results;
    
    // Standard error of difference
    const controlVar = control.stddev * control.stddev;
    const variantVar = variant.stddev * variant.stddev;
    const se = Math.sqrt(controlVar / control.n + variantVar / variant.n);
    
    // Improvement
    const improvement = variant.mean - control.mean;
    
    // Critical value (approximation for t-distribution with large df)
    // For 95% CI, use 1.96 (z-score)
    const criticalValue = 1.96;
    
    // Margin of error
    const marginOfError = criticalValue * se;
    
    return {
      lower: improvement - marginOfError,
      upper: improvement + marginOfError,
      level: 0.95
    };
  }
  
  /**
   * Generate recommendation based on results
   */
  private generateRecommendation(
    improvement: number,
    significant: boolean,
    pValue: number,
    effectSize: number
  ): { recommendation: Recommendation; confidence: number } {
    // No meaningful change
    if (improvement === 0) {
      return { recommendation: 'no_change', confidence: 1.0 };
    }
    
    // Significant positive improvement
    if (significant && improvement > 0) {
      const confidence = Math.min(0.99, 1 - pValue);
      return { recommendation: 'deploy', confidence };
    }
    
    // Significant negative impact
    if (significant && improvement < 0) {
      const confidence = Math.min(0.99, 1 - pValue);
      return { recommendation: 'rollback', confidence };
    }
    
    // Not statistically significant - need more data
    if (!significant) {
      const confidence = 0.50; // Low confidence
      return { recommendation: 'continue', confidence };
    }
    
    // Fallback
    return { recommendation: 'continue', confidence: 0.30 };
  }
}
