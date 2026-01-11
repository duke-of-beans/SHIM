/**
 * ImprovementIdentifier Tests
 *
 * Tests for identifying improvement opportunities from code analysis.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Detect refactoring, optimization, and enhancement opportunities.
 */

import { ImprovementIdentifier, Improvement, ImprovementCategory, ImprovementPriority } from './ImprovementIdentifier';
import { AnalysisReport, FileMetrics } from './CodeAnalyzer';

describe('ImprovementIdentifier', () => {
  let identifier: ImprovementIdentifier;

  beforeEach(() => {
    identifier = new ImprovementIdentifier();
  });

  describe('Construction', () => {
    it('should create ImprovementIdentifier instance', () => {
      expect(identifier).toBeInstanceOf(ImprovementIdentifier);
    });

    it('should accept custom thresholds', () => {
      const customIdentifier = new ImprovementIdentifier({
        minImpact: 5,
        maxEffort: 8,
      });

      expect(customIdentifier).toBeInstanceOf(ImprovementIdentifier);
    });
  });

  describe('Improvement Identification', () => {
    it('should identify improvements from analysis report', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 10,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 60,
        },
        metrics: [],
        issues: [],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements).toBeDefined();
      expect(Array.isArray(improvements)).toBe(true);
    });

    it('should detect refactoring opportunities', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 1000,
          averageComplexity: 20,
          maintainabilityScore: 40,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'complex.ts',
            description: 'Complexity 25 exceeds maximum',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      const refactoring = improvements.find((i: Improvement) => i.category === 'refactoring');
      expect(refactoring).toBeDefined();
    });

    it('should detect performance opportunities', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 10,
          maintainabilityScore: 70,
        },
        metrics: [],
        issues: [
          {
            severity: 'medium',
            type: 'duplication',
            file: 'slow.ts',
            description: 'Potential code duplication',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      const performance = improvements.find((i: Improvement) => i.category === 'performance');
      expect(performance).toBeDefined();
    });

    it('should detect maintainability improvements', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 10,
          totalLOC: 2000,
          averageComplexity: 8,
          maintainabilityScore: 45,
        },
        metrics: [],
        issues: [],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      const maintainability = improvements.find((i: Improvement) => i.category === 'maintainability');
      expect(maintainability).toBeDefined();
    });
  });

  describe('Priority Ranking', () => {
    it('should assign priorities to improvements', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'critical',
            type: 'high-complexity',
            file: 'critical.ts',
            description: 'Critical complexity issue',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.every((i: Improvement) => i.priority !== undefined)).toBe(true);
    });

    it('should prioritize critical issues highest', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'critical',
            type: 'bug',
            file: 'critical.ts',
            description: 'Critical issue',
          },
          {
            severity: 'low',
            type: 'style',
            file: 'minor.ts',
            description: 'Minor issue',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);
      const sorted = identifier.rankByPriority(improvements);

      expect(sorted[0].priority).toBe('critical');
    });

    it('should rank by impact when priorities equal', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'High impact',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'refactoring',
          priority: 'high',
          impact: 6,
          effort: 5,
          description: 'Medium impact',
          affectedFiles: [],
        },
      ];

      const ranked = identifier.rankByPriority(improvements);

      expect(ranked[0].impact).toBeGreaterThan(ranked[1].impact);
    });
  });

  describe('Impact Estimation', () => {
    it('should estimate impact for each improvement', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'test.ts',
            description: 'High complexity',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.every((i: Improvement) => i.impact >= 0 && i.impact <= 10)).toBe(true);
    });

    it('should estimate effort for each improvement', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'test.ts',
            description: 'High complexity',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.every((i: Improvement) => i.effort >= 0 && i.effort <= 10)).toBe(true);
    });

    it('should calculate ROI (impact / effort)', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 2,
          description: 'High ROI',
          affectedFiles: [],
        },
      ];

      const withROI = identifier.calculateROI(improvements);

      expect(withROI[0].roi).toBe(4.0); // 8 / 2
    });
  });

  describe('Category Detection', () => {
    it('should categorize as refactoring when high complexity', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 20,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'test.ts',
            description: 'Complexity issue',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.some((i: Improvement) => i.category === 'refactoring')).toBe(true);
    });

    it('should categorize as performance when duplication found', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 10,
          maintainabilityScore: 70,
        },
        metrics: [],
        issues: [
          {
            severity: 'medium',
            type: 'duplication',
            file: 'test.ts',
            description: 'Code duplication',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.some((i: Improvement) => i.category === 'performance')).toBe(true);
    });

    it('should categorize as maintainability when low score', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 10,
          totalLOC: 2000,
          averageComplexity: 8,
          maintainabilityScore: 40,
          },
        metrics: [],
        issues: [],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.some((i: Improvement) => i.category === 'maintainability')).toBe(true);
    });
  });

  describe('Filtering', () => {
    it('should filter by minimum impact', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'High impact',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'refactoring',
          priority: 'low',
          impact: 3,
          effort: 5,
          description: 'Low impact',
          affectedFiles: [],
        },
      ];

      const filtered = identifier.filterByImpact(improvements, 5);

      expect(filtered.length).toBe(1);
      expect(filtered[0].impact).toBeGreaterThanOrEqual(5);
    });

    it('should filter by maximum effort', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 3,
          description: 'Low effort',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 9,
          description: 'High effort',
          affectedFiles: [],
        },
      ];

      const filtered = identifier.filterByEffort(improvements, 5);

      expect(filtered.length).toBe(1);
      expect(filtered[0].effort).toBeLessThanOrEqual(5);
    });

    it('should filter by category', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Refactoring',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'performance',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Performance',
          affectedFiles: [],
        },
      ];

      const filtered = identifier.filterByCategory(improvements, 'refactoring');

      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe('refactoring');
    });
  });

  describe('Detailed Analysis', () => {
    it('should identify affected files', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'src/complex.ts',
            description: 'Complexity issue',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.some((i: Improvement) => i.affectedFiles.length > 0)).toBe(true);
    });

    it('should provide actionable recommendations', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 15,
          maintainabilityScore: 50,
        },
        metrics: [],
        issues: [
          {
            severity: 'high',
            type: 'high-complexity',
            file: 'test.ts',
            description: 'Complexity issue',
          },
        ],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements.every((i: Improvement) => i.description && i.description.length > 0)).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate improvement summary', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Test 1',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'performance',
          priority: 'medium',
          impact: 6,
          effort: 3,
          description: 'Test 2',
          affectedFiles: [],
        },
      ];

      const summary = identifier.generateSummary(improvements);

      expect(summary).toHaveProperty('totalImprovements');
      expect(summary).toHaveProperty('byCategory');
      expect(summary).toHaveProperty('byPriority');
      expect(summary).toHaveProperty('averageImpact');
      expect(summary).toHaveProperty('averageEffort');
    });

    it('should calculate category distribution', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Test 1',
          affectedFiles: [],
        },
        {
          id: '2',
          category: 'refactoring',
          priority: 'medium',
          impact: 6,
          effort: 3,
          description: 'Test 2',
          affectedFiles: [],
        },
        {
          id: '3',
          category: 'performance',
          priority: 'low',
          impact: 4,
          effort: 2,
          description: 'Test 3',
          affectedFiles: [],
        },
      ];

      const summary = identifier.generateSummary(improvements);

      expect(summary.byCategory.refactoring).toBe(2);
      expect(summary.byCategory.performance).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty analysis report', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 0,
          totalLOC: 0,
          averageComplexity: 0,
          maintainabilityScore: 100,
        },
        metrics: [],
        issues: [],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements).toBeDefined();
      expect(Array.isArray(improvements)).toBe(true);
    });

    it('should handle report with no issues', () => {
      const report: AnalysisReport = {
        summary: {
          totalFiles: 5,
          totalLOC: 500,
          averageComplexity: 5,
          maintainabilityScore: 90,
        },
        metrics: [],
        issues: [],
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(report);

      expect(improvements).toBeDefined();
    });
  });
});
