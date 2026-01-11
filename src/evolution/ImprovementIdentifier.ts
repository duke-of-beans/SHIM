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

export type ImprovementCategory =
  | 'refactoring'
  | 'performance'
  | 'maintainability'
  | 'security'
  | 'testing'
  | 'documentation';

export type ImprovementPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Improvement {
  id: string;
  category: ImprovementCategory;
  priority: ImprovementPriority;
  impact: number; // 0-10 scale
  effort: number; // 0-10 scale
  description: string;
  affectedFiles: string[];
  roi?: number; // Return on investment (impact / effort)
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

export class ImprovementIdentifier {
  private config: Required<ImprovementIdentifierConfig>;
  private idCounter: number;

  constructor(config?: ImprovementIdentifierConfig) {
    this.config = {
      minImpact: config?.minImpact ?? 3,
      maxEffort: config?.maxEffort ?? 10,
    };
    this.idCounter = 0;
  }

  /**
   * Identify improvements from analysis report
   */
  identifyImprovements(report: AnalysisReport): Improvement[] {
    const improvements: Improvement[] = [];

    // Analyze high complexity issues
    const complexityIssues = report.issues.filter(
      (i) => i.type === 'high-complexity' && i.severity !== 'low'
    );
    complexityIssues.forEach((issue) => {
      improvements.push({
        id: this.generateId(),
        category: 'refactoring',
        priority: this.mapSeverityToPriority(issue.severity),
        impact: this.estimateImpact(issue.severity, report.summary.averageComplexity),
        effort: this.estimateEffort(issue.type),
        description: `Reduce complexity in ${issue.file}`,
        affectedFiles: [issue.file],
      });
    });

    // Analyze duplication issues
    const duplicationIssues = report.issues.filter((i) => i.type === 'duplication');
    duplicationIssues.forEach((issue) => {
      improvements.push({
        id: this.generateId(),
        category: 'performance',
        priority: this.mapSeverityToPriority(issue.severity),
        impact: this.estimateImpact(issue.severity, report.summary.totalLOC),
        effort: this.estimateEffort(issue.type),
        description: `Extract duplicated code in ${issue.file}`,
        affectedFiles: [issue.file],
      });
    });

    // Analyze other issues (bugs, security, etc.)
    const otherIssues = report.issues.filter(
      (i) => i.type !== 'high-complexity' && i.type !== 'duplication'
    );
    otherIssues.forEach((issue) => {
      improvements.push({
        id: this.generateId(),
        category: this.categorizeIssueType(issue.type),
        priority: this.mapSeverityToPriority(issue.severity),
        impact: this.estimateImpact(issue.severity, report.summary.totalLOC),
        effort: this.estimateEffort(issue.type),
        description: `Address ${issue.type} in ${issue.file}`,
        affectedFiles: [issue.file],
      });
    });

    // Analyze maintainability
    if (report.summary.maintainabilityScore < 60) {
      improvements.push({
        id: this.generateId(),
        category: 'maintainability',
        priority: report.summary.maintainabilityScore < 40 ? 'high' : 'medium',
        impact: this.estimateMaintainabilityImpact(report.summary.maintainabilityScore),
        effort: 7,
        description: 'Improve overall codebase maintainability',
        affectedFiles: [],
      });
    }

    // Analyze average complexity
    if (report.summary.averageComplexity > 15) {
      improvements.push({
        id: this.generateId(),
        category: 'refactoring',
        priority: report.summary.averageComplexity > 20 ? 'high' : 'medium',
        impact: this.estimateComplexityImpact(report.summary.averageComplexity),
        effort: 8,
        description: 'Reduce average complexity across codebase',
        affectedFiles: [],
      });
    }

    return improvements;
  }

  /**
   * Rank improvements by priority and impact
   */
  rankByPriority(improvements: Improvement[]): Improvement[] {
    const priorityOrder: Record<ImprovementPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...improvements].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If priorities equal, sort by impact (descending)
      return b.impact - a.impact;
    });
  }

  /**
   * Calculate ROI for improvements
   */
  calculateROI(improvements: Improvement[]): Improvement[] {
    return improvements.map((improvement) => ({
      ...improvement,
      roi: improvement.effort > 0 ? improvement.impact / improvement.effort : 0,
    }));
  }

  /**
   * Filter improvements by minimum impact
   */
  filterByImpact(improvements: Improvement[], minImpact: number): Improvement[] {
    return improvements.filter((i) => i.impact >= minImpact);
  }

  /**
   * Filter improvements by maximum effort
   */
  filterByEffort(improvements: Improvement[], maxEffort: number): Improvement[] {
    return improvements.filter((i) => i.effort <= maxEffort);
  }

  /**
   * Filter improvements by category
   */
  filterByCategory(improvements: Improvement[], category: ImprovementCategory): Improvement[] {
    return improvements.filter((i) => i.category === category);
  }

  /**
   * Generate improvement summary
   */
  generateSummary(improvements: Improvement[]): ImprovementSummary {
    const byCategory: Record<ImprovementCategory, number> = {
      refactoring: 0,
      performance: 0,
      maintainability: 0,
      security: 0,
      testing: 0,
      documentation: 0,
    };

    const byPriority: Record<ImprovementPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    let totalImpact = 0;
    let totalEffort = 0;
    let totalROI = 0;

    improvements.forEach((improvement) => {
      byCategory[improvement.category]++;
      byPriority[improvement.priority]++;
      totalImpact += improvement.impact;
      totalEffort += improvement.effort;
      totalROI += improvement.roi || 0;
    });

    return {
      totalImprovements: improvements.length,
      byCategory,
      byPriority,
      averageImpact: improvements.length > 0 ? totalImpact / improvements.length : 0,
      averageEffort: improvements.length > 0 ? totalEffort / improvements.length : 0,
      averageROI: improvements.length > 0 ? totalROI / improvements.length : 0,
    };
  }

  /**
   * Generate unique improvement ID
   */
  private generateId(): string {
    return `improvement-${++this.idCounter}`;
  }

  /**
   * Map severity to priority
   */
  private mapSeverityToPriority(
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): ImprovementPriority {
    const mapping: Record<string, ImprovementPriority> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return mapping[severity] || 'medium';
  }

  /**
   * Categorize issue type to improvement category
   */
  private categorizeIssueType(issueType: string): ImprovementCategory {
    const categoryMap: Record<string, ImprovementCategory> = {
      bug: 'refactoring',
      security: 'security',
      test: 'testing',
      documentation: 'documentation',
      style: 'maintainability',
      'long-function': 'refactoring',
    };

    return categoryMap[issueType] || 'maintainability';
  }

  /**
   * Estimate impact of an improvement
   */
  private estimateImpact(severity: string, contextMetric: number): number {
    // Base impact from severity
    let impact = 0;
    switch (severity) {
      case 'critical':
        impact = 9;
        break;
      case 'high':
        impact = 7;
        break;
      case 'medium':
        impact = 5;
        break;
      case 'low':
        impact = 3;
        break;
      default:
        impact = 5;
    }

    // Adjust based on context (higher metrics = higher impact)
    if (contextMetric > 20) {
      impact = Math.min(10, impact + 1);
    }

    return impact;
  }

  /**
   * Estimate effort for an improvement type
   */
  private estimateEffort(issueType: string): number {
    const effortMap: Record<string, number> = {
      'high-complexity': 6,
      duplication: 4,
      'long-function': 5,
      maintainability: 7,
    };

    return effortMap[issueType] || 5;
  }

  /**
   * Estimate impact based on maintainability score
   */
  private estimateMaintainabilityImpact(score: number): number {
    if (score < 30) return 9;
    if (score < 40) return 7;
    if (score < 50) return 6;
    return 4;
  }

  /**
   * Estimate impact based on complexity
   */
  private estimateComplexityImpact(complexity: number): number {
    if (complexity > 25) return 8;
    if (complexity > 20) return 7;
    if (complexity > 15) return 6;
    return 4;
  }
}
