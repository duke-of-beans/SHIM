/**
 * ImprovementIdentifier
 *
 * Identify specific improvement opportunities from code analysis results.
 * Categorizes, prioritizes, and estimates impact/effort for improvements.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 2/4
 */
import { AnalysisReport } from './CodeAnalyzer';
export type ImprovementCategory = 'refactoring' | 'performance' | 'maintainability' | 'security' | 'testing' | 'documentation';
export type ImprovementPriority = 'critical' | 'high' | 'medium' | 'low';
export interface Improvement {
    id: string;
    category: ImprovementCategory;
    priority: ImprovementPriority;
    impact: number;
    effort: number;
    description: string;
    affectedFiles: string[];
    roi?: number;
}
export interface ImprovementIdentifierConfig {
    minImpact?: number;
    maxEffort?: number;
}
export interface ImprovementSummary {
    totalImprovements: number;
    byCategory: Record<ImprovementCategory, number>;
    byPriority: Record<ImprovementPriority, number>;
    averageImpact: number;
    averageEffort: number;
    averageROI: number;
}
export declare class ImprovementIdentifier {
    private config;
    private idCounter;
    constructor(config?: ImprovementIdentifierConfig);
    /**
     * Identify improvements from analysis report
     */
    identifyImprovements(report: AnalysisReport): Improvement[];
    /**
     * Rank improvements by priority and impact
     */
    rankByPriority(improvements: Improvement[]): Improvement[];
    /**
     * Calculate ROI for improvements
     */
    calculateROI(improvements: Improvement[]): Improvement[];
    /**
     * Filter improvements by minimum impact
     */
    filterByImpact(improvements: Improvement[], minImpact: number): Improvement[];
    /**
     * Filter improvements by maximum effort
     */
    filterByEffort(improvements: Improvement[], maxEffort: number): Improvement[];
    /**
     * Filter improvements by category
     */
    filterByCategory(improvements: Improvement[], category: ImprovementCategory): Improvement[];
    /**
     * Generate improvement summary
     */
    generateSummary(improvements: Improvement[]): ImprovementSummary;
    /**
     * Generate unique improvement ID
     */
    private generateId;
    /**
     * Map severity to priority
     */
    private mapSeverityToPriority;
    /**
     * Categorize issue type to improvement category
     */
    private categorizeIssueType;
    /**
     * Estimate impact of an improvement
     */
    private estimateImpact;
    /**
     * Estimate effort for an improvement type
     */
    private estimateEffort;
    /**
     * Estimate impact based on maintainability score
     */
    private estimateMaintainabilityImpact;
    /**
     * Estimate impact based on complexity
     */
    private estimateComplexityImpact;
}
//# sourceMappingURL=ImprovementIdentifier.d.ts.map