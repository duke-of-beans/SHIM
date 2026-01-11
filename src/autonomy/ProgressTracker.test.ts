/**
 * ProgressTracker Tests
 *
 * Tests for real-time progress monitoring of autonomous goal execution.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Track sub-goal completion, detect blockers, estimate time to completion.
 */

import { ProgressTracker } from './ProgressTracker';
import { GoalDecomposer, Goal, SubGoal } from './GoalDecomposer';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;
  let decomposer: GoalDecomposer;

  beforeEach(() => {
    tracker = new ProgressTracker();
    decomposer = new GoalDecomposer();
  });

  describe('Construction', () => {
    it('should create ProgressTracker instance', () => {
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });
  });

  describe('Tracking Initialization', () => {
    it('should start tracking a goal', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      const progress = tracker.getProgress('goal-1');

      expect(progress).toBeDefined();
      expect(progress.goalId).toBe('goal-1');
      expect(progress.totalSubGoals).toBe(decomposition.subGoals.length);
      expect(progress.completedSubGoals).toBe(0);
      expect(progress.completionPercentage).toBe(0);
    });

    it('should reject tracking same goal twice', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      expect(() => tracker.startTracking('goal-1', decomposition)).toThrow();
    });

    it('should track multiple goals concurrently', async () => {
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

      expect(tracker.getProgress('goal-1')).toBeDefined();
      expect(tracker.getProgress('goal-2')).toBeDefined();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate completion percentage', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature with 4 sub-goals',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete first sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');
      let progress = tracker.getProgress('goal-1');
      expect(progress.completedSubGoals).toBe(1);
      const expectedFirstPercentage = Math.round((1 / decomposition.subGoals.length) * 100);
      expect(progress.completionPercentage).toBe(expectedFirstPercentage);

      // Complete second sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'complete');
      progress = tracker.getProgress('goal-1');
      expect(progress.completedSubGoals).toBe(2);
      const expectedSecondPercentage = Math.round((2 / decomposition.subGoals.length) * 100);
      expect(progress.completionPercentage).toBe(expectedSecondPercentage);
    });

    it('should handle 100% completion', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Simple goal',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete all sub-goals
      decomposition.subGoals.forEach((subGoal: SubGoal) => {
        tracker.updateSubGoal('goal-1', subGoal.id, 'complete');
      });

      const progress = tracker.getProgress('goal-1');
      expect(progress.completionPercentage).toBe(100);
    });

    it('should handle zero progress', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Not started',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      const progress = tracker.getProgress('goal-1');

      expect(progress.completionPercentage).toBe(0);
    });
  });

  describe('Blocker Detection', () => {
    it('should detect blocked sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with blocker',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked');

      const progress = tracker.getProgress('goal-1');
      expect(progress.blockers.length).toBeGreaterThan(0);
      expect(progress.blockers[0].subGoalId).toBe(decomposition.subGoals[0].id);
    });

    it('should track blocker severity', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with blocker',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'high');

      const progress = tracker.getProgress('goal-1');
      expect(progress.blockers[0].severity).toBe('high');
    });

    it('should determine if goal is blocked', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with blocker',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      expect(tracker.isBlocked('goal-1')).toBe(false);

      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'high');
      expect(tracker.isBlocked('goal-1')).toBe(true);
    });
  });

  describe('Velocity Tracking', () => {
    it('should calculate velocity (sub-goals per hour)', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with velocity',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete first sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Complete second sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'complete');

      const progress = tracker.getProgress('goal-1');
      expect(progress.velocity).toBeGreaterThan(0);
    });

    it('should handle zero velocity (no completions yet)', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Not started',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      const progress = tracker.getProgress('goal-1');

      expect(progress.velocity).toBe(0);
    });
  });

  describe('ETA Estimation', () => {
    it('should estimate completion time based on velocity', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with ETA',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete first sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Complete second sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'complete');

      const eta = tracker.estimateCompletion('goal-1');
      expect(eta).toBeInstanceOf(Date);
      expect(eta.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return current time for completed goals', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Completed goal',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete all sub-goals
      decomposition.subGoals.forEach((subGoal: SubGoal) => {
        tracker.updateSubGoal('goal-1', subGoal.id, 'complete');
      });

      const eta = tracker.estimateCompletion('goal-1');
      const now = Date.now();
      expect(Math.abs(eta.getTime() - now)).toBeLessThan(1000); // Within 1 second
    });

    it('should handle no velocity case', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Not started',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      const eta = tracker.estimateCompletion('goal-1');

      // Should return far future or throw
      expect(eta).toBeInstanceOf(Date);
    });

    it('should calculate estimated hours remaining', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with remaining hours',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete first sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'complete');

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Complete second sub-goal
      tracker.updateSubGoal('goal-1', decomposition.subGoals[1].id, 'complete');

      const progress = tracker.getProgress('goal-1');
      expect(progress.estimatedHoursRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Milestone Tracking', () => {
    it('should track default milestones (25%, 50%, 75%, 100%)', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with milestones',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      const progress = tracker.getProgress('goal-1');

      expect(progress.milestones.length).toBe(4);
      expect(progress.milestones[0].targetPercentage).toBe(25);
      expect(progress.milestones[1].targetPercentage).toBe(50);
      expect(progress.milestones[2].targetPercentage).toBe(75);
      expect(progress.milestones[3].targetPercentage).toBe(100);
    });

    it('should mark milestones as achieved', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with milestones',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete 25%
      const quarterPoint = Math.ceil(decomposition.subGoals.length * 0.25);
      for (let i = 0; i < quarterPoint; i++) {
        tracker.updateSubGoal('goal-1', decomposition.subGoals[i].id, 'complete');
      }

      const milestones = tracker.checkMilestones('goal-1');
      const milestone25 = milestones.find((m) => m.targetPercentage === 25);

      expect(milestone25?.achieved).toBe(true);
      expect(milestone25?.achievedAt).toBeInstanceOf(Date);
    });

    it('should track multiple milestone achievements', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with multiple milestones',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete all sub-goals
      decomposition.subGoals.forEach((subGoal: SubGoal) => {
        tracker.updateSubGoal('goal-1', subGoal.id, 'complete');
      });

      const milestones = tracker.checkMilestones('goal-1');
      const achievedMilestones = milestones.filter((m) => m.achieved);

      expect(achievedMilestones.length).toBe(4); // All milestones
    });

    it('should handle custom milestones', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal with custom milestones',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      const customMilestones = [
        { name: 'Phase 1', targetPercentage: 33 },
        { name: 'Phase 2', targetPercentage: 66 },
        { name: 'Complete', targetPercentage: 100 },
      ];

      tracker.startTracking('goal-1', decomposition, customMilestones);
      const progress = tracker.getProgress('goal-1');

      expect(progress.milestones.length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw for unknown goal', () => {
      expect(() => tracker.getProgress('unknown')).toThrow();
    });

    it('should throw when updating unknown goal', () => {
      expect(() => tracker.updateSubGoal('unknown', 'sub-1', 'complete')).toThrow();
    });

    it('should throw when updating unknown sub-goal', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      expect(() => tracker.updateSubGoal('goal-1', 'unknown', 'complete')).toThrow();
    });

    it('should throw for invalid status', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      expect(() => tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'invalid' as any)).toThrow();
    });

    it('should throw for invalid severity', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Goal',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);
      expect(() => tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked', 'invalid' as any)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single sub-goal', () => {
      // Force a very simple goal with minimal sub-goals
      const decomposition = {
        goalId: 'goal-1',
        goalType: 'development' as const,
        subGoals: [
          {
            id: 'sub-1',
            description: 'Single task',
            dependencies: [],
            priority: 1 as const,
            estimatedHours: 1,
            successCriteria: ['Complete'],
          },
        ],
        totalEstimatedHours: 1,
        dependencyGraph: {},
      };

      tracker.startTracking('goal-1', decomposition);
      tracker.updateSubGoal('goal-1', 'sub-1', 'complete');

      const progress = tracker.getProgress('goal-1');
      expect(progress.completionPercentage).toBe(100);
    });

    it('should handle instant completion', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Instant',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Complete all immediately
      decomposition.subGoals.forEach((subGoal: SubGoal) => {
        tracker.updateSubGoal('goal-1', subGoal.id, 'complete');
      });

      const progress = tracker.getProgress('goal-1');
      expect(progress.completionPercentage).toBe(100);
      expect(progress.velocity).toBeGreaterThanOrEqual(0);
    });

    it('should handle blocked then unblocked', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Block and unblock',
        type: 'development',
        priority: 1,
      };

      const decomposition = await decomposer.decompose(goal);

      tracker.startTracking('goal-1', decomposition);

      // Block
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'blocked');
      expect(tracker.isBlocked('goal-1')).toBe(true);

      // Unblock
      tracker.updateSubGoal('goal-1', decomposition.subGoals[0].id, 'in_progress');
      expect(tracker.isBlocked('goal-1')).toBe(false);
    });
  });
});
