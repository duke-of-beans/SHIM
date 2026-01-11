/**
 * AutonomousOrchestrator Tests
 *
 * Tests for 24/7 autonomous goal execution coordination.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Orchestrate decomposition → execution → tracking → reporting cycle.
 */

import { AutonomousOrchestrator, ExecutionState } from './AutonomousOrchestrator';
import { Goal } from './GoalDecomposer';

describe('AutonomousOrchestrator', () => {
  let orchestrator: AutonomousOrchestrator;

  beforeEach(() => {
    orchestrator = new AutonomousOrchestrator();
  });

  afterEach(async () => {
    // Clean up any running processes
    if (orchestrator.getState() === 'running') {
      await orchestrator.stop();
    }
  });

  describe('Construction', () => {
    it('should create AutonomousOrchestrator instance', () => {
      expect(orchestrator).toBeInstanceOf(AutonomousOrchestrator);
    });

    it('should initialize in stopped state', () => {
      expect(orchestrator.getState()).toBe('stopped');
    });
  });

  describe('State Management', () => {
    it('should start execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      expect(orchestrator.getState()).toBe('running');
    });

    it('should stop execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);
      await orchestrator.stop();

      expect(orchestrator.getState()).toBe('stopped');
    });

    it('should pause execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);
      await orchestrator.pause();

      expect(orchestrator.getState()).toBe('paused');
    });

    it('should resume execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);
      await orchestrator.pause();
      await orchestrator.resume();

      expect(orchestrator.getState()).toBe('running');
    });

    it('should throw when starting already running orchestrator', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await expect(orchestrator.start(goal)).rejects.toThrow();
    });

    it('should throw when stopping already stopped orchestrator', async () => {
      await expect(orchestrator.stop()).rejects.toThrow();
    });
  });

  describe('Goal Execution', () => {
    it('should execute goal with full cycle', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      // Give it time to execute at least one cycle
      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = orchestrator.getStatus();
      expect(status.currentGoal).toBe('goal-1');
      expect(status.cyclesCompleted).toBeGreaterThan(0);

      await orchestrator.stop();
    });

    it('should track progress during execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const progress = orchestrator.getProgress('goal-1');
      expect(progress).toBeDefined();
      expect(progress.goalId).toBe('goal-1');

      await orchestrator.stop();
    });

    it('should generate reports during execution', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const report = orchestrator.generateReport('goal-1', 'text');
      expect(report).toContain('goal-1');
      expect(report).toContain('Progress:');

      await orchestrator.stop();
    });
  });

  describe('Configuration', () => {
    it('should accept custom execution interval', async () => {
      const customOrchestrator = new AutonomousOrchestrator({ executionIntervalMs: 50 });

      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await customOrchestrator.start(goal);

      // Shorter interval should complete more cycles
      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = customOrchestrator.getStatus();
      expect(status.cyclesCompleted).toBeGreaterThan(0);

      await customOrchestrator.stop();
    });

    it('should respect max cycles limit', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal, { maxCycles: 3 });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      const status = orchestrator.getStatus();
      expect(status.cyclesCompleted).toBe(3);
      expect(orchestrator.getState()).toBe('stopped');
    });
  });

  describe('Multi-Goal Execution', () => {
    it('should execute multiple goals sequentially', async () => {
      const goal1: Goal = {
        id: 'goal-1',
        description: 'Feature A',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal1);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status1 = orchestrator.getStatus();
      expect(status1.currentGoal).toBe('goal-1');

      await orchestrator.stop();

      const goal2: Goal = {
        id: 'goal-2',
        description: 'Feature B',
        type: 'testing',
        priority: 1,
      };

      await orchestrator.start(goal2);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status2 = orchestrator.getStatus();
      expect(status2.currentGoal).toBe('goal-2');

      await orchestrator.stop();
    });

    it('should track progress for all executed goals', async () => {
      const goal1: Goal = {
        id: 'goal-1',
        description: 'Feature A',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal1);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await orchestrator.stop();

      const goal2: Goal = {
        id: 'goal-2',
        description: 'Feature B',
        type: 'testing',
        priority: 1,
      };

      await orchestrator.start(goal2);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await orchestrator.stop();

      const progress1 = orchestrator.getProgress('goal-1');
      const progress2 = orchestrator.getProgress('goal-2');

      expect(progress1).toBeDefined();
      expect(progress2).toBeDefined();
    });
  });

  describe('Status Reporting', () => {
    it('should provide execution status', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      const status = orchestrator.getStatus();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('currentGoal');
      expect(status).toHaveProperty('cyclesCompleted');
      expect(status).toHaveProperty('startedAt');

      await orchestrator.stop();
    });

    it('should include uptime in status', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = orchestrator.getStatus();
      expect(status.uptimeMs).toBeGreaterThan(0);

      await orchestrator.stop();
    });

    it('should track last cycle time', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = orchestrator.getStatus();
      expect(status.lastCycleAt).toBeInstanceOf(Date);

      await orchestrator.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during execution gracefully', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      // Orchestrator should continue running even if individual cycles have issues
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(orchestrator.getState()).toBe('running');

      await orchestrator.stop();
    });

    it('should throw when getting progress for unknown goal', () => {
      expect(() => orchestrator.getProgress('unknown')).toThrow();
    });

    it('should throw when generating report for unknown goal', () => {
      expect(() => orchestrator.generateReport('unknown', 'text')).toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on stop', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);
      await orchestrator.stop();

      const status = orchestrator.getStatus();
      expect(status.state).toBe('stopped');
    });

    it('should allow restart after stop', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);
      await orchestrator.stop();
      await orchestrator.start(goal);

      expect(orchestrator.getState()).toBe('running');

      await orchestrator.stop();
    });
  });

  describe('Execution Cycle', () => {
    it('should complete full decompose → track → report cycle', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await orchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should have decomposed goal
      const progress = orchestrator.getProgress('goal-1');
      expect(progress.totalSubGoals).toBeGreaterThan(0);

      // Should be able to generate report
      const report = orchestrator.generateReport('goal-1', 'text');
      expect(report).toBeTruthy();

      await orchestrator.stop();
    });

    it('should execute cycles at configured interval', async () => {
      const customOrchestrator = new AutonomousOrchestrator({ executionIntervalMs: 100 });

      const goal: Goal = {
        id: 'goal-1',
        description: 'Build feature X',
        type: 'development',
        priority: 1,
      };

      await customOrchestrator.start(goal);

      await new Promise((resolve) => setTimeout(resolve, 350));

      const status = customOrchestrator.getStatus();
      // Should have completed ~3 cycles in 350ms with 100ms interval
      expect(status.cyclesCompleted).toBeGreaterThanOrEqual(3);

      await customOrchestrator.stop();
    });
  });
});
