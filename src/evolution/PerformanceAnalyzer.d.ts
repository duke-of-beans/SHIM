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
    level: number;
}
/**
 * Recommendation for experiment outcome
 */
export type Recommendation = 'deploy' | 'rollback' | 'continue' | 'no_change';
/**
 * Complete analysis result
 */
export interface AnalysisResult {
    significant: boolean;
    pValue: number;
    effectSize: number;
    improvement: number;
    relativeImprovement: number;
    confidenceInterval: ConfidenceInterval;
    recommendation: Recommendation;
    confidence: number;
    hasRegression: boolean;
    testStatistic: number;
    degreesOfFreedom: number;
    warnings: string[];
}
/**
 * PerformanceAnalyzer
 *
 * Provides rigorous statistical analysis of A/B test results.
 */
export declare class PerformanceAnalyzer {
    private readonly minSampleSize;
    private readonly significanceLevel;
    /**
     * Analyze experiment results and provide recommendation
     */
    analyze(results: ExperimentResults): AnalysisResult;
    /**
     * Perform Welch's t-test (unequal variances)
     */
    private performTTest;
    /**
     * Calculate p-value for t-test
     * Approximation for large DF, exact for common cases
     */
    private tTestPValue;
    /**
     * Normal CDF approximation
     */
    private normalCDF;
    /**
     * Calculate Cohen's d effect size
     */
    private calculateCohenD;
    /**
     * Calculate 95% confidence interval for improvement
     */
    private calculateConfidenceInterval;
    /**
     * Generate recommendation based on results
     */
    private generateRecommendation;
}
//# sourceMappingURL=PerformanceAnalyzer.d.ts.map