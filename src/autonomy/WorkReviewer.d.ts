/**
 * WorkReviewer
 *
 * Assess quality of completed work and provide improvement recommendations.
 * Evaluates completeness, correctness, and maintainability.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 7/8
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';
export interface WorkItem {
    id: string;
    description: string;
    artifacts: string[];
}
export interface QualityIssue {
    severity: IssueSeverity;
    description: string;
    category: string;
}
export interface ReviewCriteria {
    completeness: number;
    correctness: number;
    maintainability: number;
}
export interface ReviewReport {
    workId: string;
    overallScore: number;
    criteriaScores: ReviewCriteria;
    issues: QualityIssue[];
    recommendations: string[];
    passed: boolean;
    timestamp: Date;
}
export interface ReviewHistoryRecord {
    report: ReviewReport;
    timestamp: Date;
}
export interface ReviewHistoryFilter {
    workId?: string;
    minScore?: number;
    maxScore?: number;
}
export interface QualityTrends {
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    recentScores: number[];
}
export interface WorkReviewerConfig {
    criteriaWeights?: Partial<ReviewCriteria>;
    passThreshold?: number;
}
export declare class WorkReviewer {
    private config;
    private history;
    constructor(config?: WorkReviewerConfig);
    /**
     * Assess work quality and generate review report
     */
    assess(workItem: WorkItem): ReviewReport;
    /**
     * Get review history
     */
    getReviewHistory(filter?: ReviewHistoryFilter): ReviewHistoryRecord[];
    /**
     * Get quality trends over time
     */
    getQualityTrends(): QualityTrends;
    /**
     * Assess completeness (are all expected artifacts present?)
     */
    private assessCompleteness;
    /**
     * Assess correctness (does the work appear correct?)
     */
    private assessCorrectness;
    /**
     * Assess maintainability (is the work maintainable?)
     */
    private assessMaintainability;
    /**
     * Detect quality issues
     */
    private detectIssues;
    /**
     * Generate improvement recommendations
     */
    private generateRecommendations;
}
//# sourceMappingURL=WorkReviewer.d.ts.map