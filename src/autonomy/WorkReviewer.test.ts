/**
 * WorkReviewer Tests
 *
 * Tests for autonomous work quality assessment.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Assess quality of completed work and provide improvement recommendations.
 */

import { WorkReviewer, ReviewCriteria, QualityIssue, ReviewReport, IssueSeverity } from './WorkReviewer';

describe('WorkReviewer', () => {
  let reviewer: WorkReviewer;

  beforeEach(() => {
    reviewer = new WorkReviewer();
  });

  describe('Construction', () => {
    it('should create WorkReviewer instance', () => {
      expect(reviewer).toBeInstanceOf(WorkReviewer);
    });

    it('should accept custom criteria weights', () => {
      const customReviewer = new WorkReviewer({
        criteriaWeights: {
          completeness: 0.4,
          correctness: 0.4,
          maintainability: 0.2,
        },
      });

      expect(customReviewer).toBeInstanceOf(WorkReviewer);
    });
  });

  describe('Quality Assessment', () => {
    it('should assess work and return review report', () => {
      const workItem = {
        id: 'work-1',
        description: 'Implement feature X',
        artifacts: ['file1.ts', 'file2.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report).toHaveProperty('workId');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
    });

    it('should calculate overall quality score (0-100)', () => {
      const workItem = {
        id: 'work-1',
        description: 'Complete implementation',
        artifacts: ['implementation.ts', 'tests.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('should assess multiple criteria', () => {
      const workItem = {
        id: 'work-1',
        description: 'Feature implementation',
        artifacts: ['code.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report).toHaveProperty('criteriaScores');
      expect(report.criteriaScores).toHaveProperty('completeness');
      expect(report.criteriaScores).toHaveProperty('correctness');
      expect(report.criteriaScores).toHaveProperty('maintainability');
    });
  });

  describe('Issue Detection', () => {
    it('should detect quality issues', () => {
      const workItem = {
        id: 'work-1',
        description: 'Incomplete work',
        artifacts: [],
      };

      const report = reviewer.assess(workItem);

      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('should categorize issues by severity', () => {
      const workItem = {
        id: 'work-1',
        description: 'Work with issues',
        artifacts: ['file.ts'],
      };

      const report = reviewer.assess(workItem);

      report.issues.forEach((issue) => {
        expect(['critical', 'major', 'minor']).toContain(issue.severity);
      });
    });

    it('should include issue descriptions', () => {
      const workItem = {
        id: 'work-1',
        description: 'Work item',
        artifacts: [],
      };

      const report = reviewer.assess(workItem);

      report.issues.forEach((issue) => {
        expect(issue.description).toBeTruthy();
        expect(typeof issue.description).toBe('string');
      });
    });

    it('should detect missing tests', () => {
      const workItem = {
        id: 'work-1',
        description: 'Feature without tests',
        artifacts: ['implementation.ts'],
      };

      const report = reviewer.assess(workItem);

      const missingTestsIssue = report.issues.find((i) => i.description.toLowerCase().includes('test'));
      expect(missingTestsIssue).toBeDefined();
    });
  });

  describe('Completeness Assessment', () => {
    it('should give high completeness score when all artifacts present', () => {
      const workItem = {
        id: 'work-1',
        description: 'Complete implementation',
        artifacts: ['implementation.ts', 'implementation.test.ts', 'documentation.md'],
      };

      const report = reviewer.assess(workItem);

      expect(report.criteriaScores.completeness).toBeGreaterThan(70);
    });

    it('should give low completeness score when artifacts missing', () => {
      const workItem = {
        id: 'work-1',
        description: 'Incomplete work',
        artifacts: [],
      };

      const report = reviewer.assess(workItem);

      expect(report.criteriaScores.completeness).toBeLessThan(50);
    });
  });

  describe('Correctness Assessment', () => {
    it('should assess correctness based on file naming', () => {
      const workItem = {
        id: 'work-1',
        description: 'Implementation',
        artifacts: ['implementation.ts', 'implementation.test.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report.criteriaScores.correctness).toBeGreaterThan(0);
    });

    it('should boost score when tests present', () => {
      const withTests = {
        id: 'work-1',
        description: 'With tests',
        artifacts: ['code.ts', 'code.test.ts'],
      };

      const withoutTests = {
        id: 'work-2',
        description: 'Without tests',
        artifacts: ['code.ts'],
      };

      const reportWith = reviewer.assess(withTests);
      const reportWithout = reviewer.assess(withoutTests);

      expect(reportWith.criteriaScores.correctness).toBeGreaterThan(
        reportWithout.criteriaScores.correctness
      );
    });
  });

  describe('Maintainability Assessment', () => {
    it('should assess maintainability', () => {
      const workItem = {
        id: 'work-1',
        description: 'Implementation',
        artifacts: ['code.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report.criteriaScores.maintainability).toBeGreaterThanOrEqual(0);
      expect(report.criteriaScores.maintainability).toBeLessThanOrEqual(100);
    });

    it('should boost score when documentation present', () => {
      const withDocs = {
        id: 'work-1',
        description: 'With documentation',
        artifacts: ['code.ts', 'README.md'],
      };

      const withoutDocs = {
        id: 'work-2',
        description: 'Without documentation',
        artifacts: ['code.ts'],
      };

      const reportWith = reviewer.assess(withDocs);
      const reportWithout = reviewer.assess(withoutDocs);

      expect(reportWith.criteriaScores.maintainability).toBeGreaterThan(
        reportWithout.criteriaScores.maintainability
      );
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for improvement', () => {
      const workItem = {
        id: 'work-1',
        description: 'Needs improvement',
        artifacts: ['code.ts'],
      };

      const report = reviewer.assess(workItem);

      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend adding tests when missing', () => {
      const workItem = {
        id: 'work-1',
        description: 'No tests',
        artifacts: ['implementation.ts'],
      };

      const report = reviewer.assess(workItem);

      const testRecommendation = report.recommendations.find((r) =>
        r.toLowerCase().includes('test')
      );
      expect(testRecommendation).toBeDefined();
    });

    it('should recommend adding documentation when missing', () => {
      const workItem = {
        id: 'work-1',
        description: 'No documentation',
        artifacts: ['code.ts'],
      };

      const report = reviewer.assess(workItem);

      const docsRecommendation = report.recommendations.find((r) =>
        r.toLowerCase().includes('document')
      );
      expect(docsRecommendation).toBeDefined();
    });
  });

  describe('Review History', () => {
    it('should track review history', () => {
      const workItem = {
        id: 'work-1',
        description: 'Work item',
        artifacts: ['file.ts'],
      };

      reviewer.assess(workItem);

      const history = reviewer.getReviewHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include timestamps in history', () => {
      const workItem = {
        id: 'work-1',
        description: 'Work item',
        artifacts: ['file.ts'],
      };

      reviewer.assess(workItem);

      const history = reviewer.getReviewHistory();
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should retrieve reviews by work ID', () => {
      const work1 = { id: 'work-1', description: 'Work 1', artifacts: ['a.ts'] };
      const work2 = { id: 'work-2', description: 'Work 2', artifacts: ['b.ts'] };

      reviewer.assess(work1);
      reviewer.assess(work2);

      const history = reviewer.getReviewHistory({ workId: 'work-1' });
      expect(history.length).toBe(1);
      expect(history[0].report.workId).toBe('work-1');
    });

    it('should filter reviews by minimum score', () => {
      const goodWork = {
        id: 'good',
        description: 'High quality',
        artifacts: ['impl.ts', 'impl.test.ts', 'README.md'],
      };

      const poorWork = {
        id: 'poor',
        description: 'Low quality',
        artifacts: [],
      };

      reviewer.assess(goodWork);
      reviewer.assess(poorWork);

      const highQuality = reviewer.getReviewHistory({ minScore: 70 });
      expect(highQuality.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Trends', () => {
    it('should calculate quality trends', () => {
      const work1 = { id: 'w1', description: 'Work 1', artifacts: ['a.ts'] };
      const work2 = { id: 'w2', description: 'Work 2', artifacts: ['b.ts', 'b.test.ts'] };
      const work3 = {
        id: 'w3',
        description: 'Work 3',
        artifacts: ['c.ts', 'c.test.ts', 'README.md'],
      };

      reviewer.assess(work1);
      reviewer.assess(work2);
      reviewer.assess(work3);

      const trends = reviewer.getQualityTrends();
      expect(trends).toHaveProperty('averageScore');
      expect(trends).toHaveProperty('trend');
    });

    it('should detect improving quality trend', () => {
      const work1 = { id: 'w1', description: 'Basic', artifacts: ['a.ts'] };
      const work2 = { id: 'w2', description: 'Better', artifacts: ['b.ts', 'b.test.ts'] };
      const work3 = {
        id: 'w3',
        description: 'Best',
        artifacts: ['c.ts', 'c.test.ts', 'README.md'],
      };

      reviewer.assess(work1);
      reviewer.assess(work2);
      reviewer.assess(work3);

      const trends = reviewer.getQualityTrends();
      expect(trends.trend).toBe('improving');
    });

    it('should detect declining quality trend', () => {
      const work1 = {
        id: 'w1',
        description: 'Best',
        artifacts: ['a.ts', 'a.test.ts', 'README.md'],
      };
      const work2 = { id: 'w2', description: 'Worse', artifacts: ['b.ts', 'b.test.ts'] };
      const work3 = { id: 'w3', description: 'Worst', artifacts: ['c.ts'] };

      reviewer.assess(work1);
      reviewer.assess(work2);
      reviewer.assess(work3);

      const trends = reviewer.getQualityTrends();
      expect(trends.trend).toBe('declining');
    });
  });

  describe('Pass/Fail Determination', () => {
    it('should mark high-quality work as passing', () => {
      const highQuality = {
        id: 'work-1',
        description: 'Excellent work',
        artifacts: ['impl.ts', 'impl.test.ts', 'README.md', 'examples.md'],
      };

      const report = reviewer.assess(highQuality);

      expect(report.passed).toBe(true);
    });

    it('should mark low-quality work as failing', () => {
      const lowQuality = {
        id: 'work-1',
        description: 'Poor work',
        artifacts: [],
      };

      const report = reviewer.assess(lowQuality);

      expect(report.passed).toBe(false);
    });

    it('should use custom pass threshold', () => {
      const customReviewer = new WorkReviewer({ passThreshold: 90 });

      const decentWork = {
        id: 'work-1',
        description: 'Decent work',
        artifacts: ['code.ts', 'tests.ts'],
      };

      const report = customReviewer.assess(decentWork);

      // With high threshold, decent work should fail
      expect(report.passed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing work ID', () => {
      const workItem = {
        id: '',
        description: 'Work',
        artifacts: ['file.ts'],
      };

      expect(() => reviewer.assess(workItem)).toThrow();
    });

    it('should validate criteria weights sum to 1.0', () => {
      expect(() => {
        new WorkReviewer({
          criteriaWeights: {
            completeness: 0.5,
            correctness: 0.3,
            maintainability: 0.1, // Sum is 0.9, not 1.0
          },
        });
      }).toThrow();
    });
  });
});
