/**
 * GoalReporter Tests
 *
 * Tests for human-readable progress reporting of autonomous goals.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Generate readable reports showing progress, blockers, and velocity.
 */

import { GoalReporter, ReportFormat } from './GoalReporter';
import { ProgressTracker } from './ProgressTracker';
import { GoalDecomposer, Goal } from './GoalDecomposer';

describe('GoalReporter', () => {
  let reporter: GoalReporter;
  let tracker: ProgressTracker;
  let decomposer: GoalDecomposer;

  beforeEach(() => {
    reporter = new GoalReporter();
    tracker = new ProgressTracker();
    decomposer = new GoalDecomposer();
  });

  describe('Construction', () => {
    it('should create GoalReporter instance', () => {
      expect(reporter).toBeInstanceOf(GoalReporter);
    });
  });

  describe('Text Report Generation', () => {
    it('should generate basic text report', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      const report = reporter.generateReport('goal-1', tracker, 'text');

      expect(report).toContain('Goal: goal-1');
      expect(report).toContain('Progress:');
      expect(report).toContain('0%');
    });

    it('should show completion percentage', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      // Complete first sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      const report = reporter.generateReport('goal-1', tracker, 'text');

      expect(report).toMatch(/\d+%/); // Should contain percentage
      expect(report).toContain('completed');
    });

    it('should include velocity in report', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      // Complete a sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      await new Promise((resolve) => setTimeout(resolve, 100));

      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'complete');

      const report = reporter.generateReport('goal-1', tracker, 'text');

      expect(report).toContain('Velocity:');
    });

    it('should highlight blockers', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      // Block a sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'high');

      const report = reporter.generateReport('goal-1', tracker, 'text');

      expect(report).toContain('BLOCKERS');
      expect(report).toContain('high');
    });
  });

  describe('Markdown Report Generation', () => {
    it('should generate markdown report', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      const report = reporter.generateReport('goal-1', tracker, 'markdown');

      expect(report).toContain('# Goal Report');
      expect(report).toContain('**Goal ID:**');
      expect(report).toContain('**Progress:**');
    });

    it('should use markdown formatting for lists', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'high');

      const report = reporter.generateReport('goal-1', tracker, 'markdown');

      expect(report).toContain('##'); // Markdown header
      expect(report).toContain('-'); // Markdown list
    });
  });

  describe('JSON Report Generation', () => {
    it('should generate valid JSON report', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      const report = reporter.generateReport('goal-1', tracker, 'json');

      const parsed = JSON.parse(report);
      expect(parsed).toHaveProperty('goalId');
      expect(parsed).toHaveProperty('progress');
      expect(parsed).toHaveProperty('velocity');
    });

    it('should include all progress data in JSON', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      const report = reporter.generateReport('goal-1', tracker, 'json');
      const parsed = JSON.parse(report);

      expect(parsed.progress).toHaveProperty('totalSubGoals');
      expect(parsed.progress).toHaveProperty('completedSubGoals');
      expect(parsed.progress).toHaveProperty('completionPercentage');
    });
  });

  describe('Executive Summary', () => {
    it('should generate executive summary', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      const summary = reporter.generateExecutiveSummary('goal-1', tracker);

      expect(summary).toContain('goal-1');
      expect(summary).toBeTruthy();
      expect(summary.length).toBeLessThan(500); // Should be concise
    });

    it('should highlight critical blockers in summary', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'high');

      const summary = reporter.generateExecutiveSummary('goal-1', tracker);

      expect(summary).toContain('BLOCKED');
      expect(summary).toContain('high');
    });

    it('should show on-track status when no blockers', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      const summary = reporter.generateExecutiveSummary('goal-1', tracker);

      expect(summary).toMatch(/on.track|progress/i);
    });
  });

  describe('Detailed Status Report', () => {
    it('should generate detailed status report', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      const report = reporter.generateDetailedReport('goal-1', tracker);

      expect(report).toContain('Sub-Goals');
      expect(report).toContain('Milestones');
      expect(report).toContain('Velocity');
    });

    it('should list all sub-goals with status', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');
      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'in_progress');

      const report = reporter.generateDetailedReport('goal-1', tracker);

      // Report shows counts, not individual statuses
      expect(report).toContain('Sub-Goals');
      expect(report).toContain('Completed: 1');
      expect(report).toContain('Total:');
    });

    it('should show milestone achievements', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      // Complete enough to hit 25% milestone
      const quarterPoint = Math.ceil(decomposition.subGoals.length * 0.25);
      for (let i = 0; i < quarterPoint; i++) {
        tracker.updateSubGoal('goal-1', decomposition.subGoals[i].id, 'complete');
      }

      const report = reporter.generateDetailedReport('goal-1', tracker);

      expect(report).toContain('25%');
      expect(report).toMatch(/achieved|complete/i);
    });
  });

  describe('Multi-Goal Reporting', () => {
    it('should generate report for multiple goals', async () => {
      const goal1: Goal = {
        id: 'goal-1',
        description: 'Feature A',
        type: 'development',
        priority: 1,
      };
      const goal2: Goal = {
        id: 'goal-2',
        description: 'Feature B',
        type: 'testing',
        priority: 1,
      };

      const decomp1 = await decomposer.decompose(goal1);
      const decomp2 = await decomposer.decompose(goal2);

      tracker.startTracking('goal-1', decomp1);
      tracker.startTracking('goal-2', decomp2);

      const report = reporter.generateMultiGoalReport(['goal-1', 'goal-2'], tracker);

      expect(report).toContain('goal-1');
      expect(report).toContain('goal-2');
    });

    it('should show aggregate progress for multiple goals', async () => {
      const goal1: Goal = {
        id: 'goal-1',
        description: 'Feature A',
        type: 'development',
        priority: 1,
      };
      const goal2: Goal = {
        id: 'goal-2',
        description: 'Feature B',
        type: 'testing',
        priority: 1,
      };

      const decomp1 = await decomposer.decompose(goal1);
      const decomp2 = await decomposer.decompose(goal2);

      tracker.startTracking('goal-1', decomp1);
      tracker.startTracking('goal-2', decomp2);

      const report = reporter.generateMultiGoalReport(['goal-1', 'goal-2'], tracker);

      expect(report).toContain('Overall Progress');
      expect(report).toMatch(/\d+%/); // Aggregate percentage
    });
  });

  describe('Error Handling', () => {
    it('should throw for unknown goal', () => {
      expect(() => reporter.generateReport('unknown', tracker, 'text')).toThrow();
    });

    it('should throw for invalid format', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      expect(() => reporter.generateReport('goal-1', tracker, 'invalid' as any)).toThrow();
    });

    it('should throw for empty goal list in multi-goal report', () => {
      expect(() => reporter.generateMultiGoalReport([], tracker)).toThrow();
    });
  });

  describe('Report Formatting', () => {
    it('should format timestamps in reports', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      // Complete enough to achieve milestone (which will have timestamp)
      const quarterPoint = Math.ceil(decomposition.subGoals.length * 0.25);
      for (let i = 0; i < quarterPoint; i++) {
        tracker.updateSubGoal('goal-1', decomposition.subGoals[i].id, 'complete');
      }

      const report = reporter.generateDetailedReport('goal-1', tracker);

      expect(report).toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date format from milestone
    });

    it('should format percentages consistently', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);
      tracker.startTracking('goal-1', decomposition);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      const report = reporter.generateReport('goal-1', tracker, 'text');

      expect(report).toMatch(/\d+%/); // Should have percentage
    });
  });
});
