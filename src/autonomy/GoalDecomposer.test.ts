/**
 * GoalDecomposer Tests
 * 
 * Tests for intelligent goal decomposition into executable sub-goals.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Break high-level goals into actionable sub-goals with dependencies.
 */

import { GoalDecomposer, Goal, SubGoal, GoalDecomposition } from './GoalDecomposer';

describe('GoalDecomposer', () => {
  let decomposer: GoalDecomposer;
  
  beforeEach(() => {
    decomposer = new GoalDecomposer();
  });
  
  describe('Construction', () => {
    it('should create GoalDecomposer instance', () => {
      expect(decomposer).toBeInstanceOf(GoalDecomposer);
    });
  });
  
  describe('Goal Decomposition', () => {
    it('should decompose simple goal into sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-1',
        description: 'Build a simple web API',
        type: 'development',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.subGoals.length).toBeGreaterThan(0);
      expect(decomposition.subGoals.length).toBeLessThanOrEqual(20);
    });
    
    it('should decompose complex goal into many sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-2',
        description: 'Implement complete authentication system with OAuth, 2FA, and session management',
        type: 'development',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.subGoals.length).toBeGreaterThan(5);
    });
    
    it('should create dependency graph', async () => {
      const goal: Goal = {
        id: 'goal-3',
        description: 'Deploy application to production',
        type: 'deployment',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.dependencyGraph).toBeDefined();
      expect(Object.keys(decomposition.dependencyGraph).length).toBeGreaterThan(0);
    });
  });
  
  describe('Sub-Goal Properties', () => {
    it('should assign unique IDs to sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-4',
        description: 'Create documentation',
        type: 'documentation',
        priority: 2
      };
      
      const decomposition = await decomposer.decompose(goal);
      const ids = decomposition.subGoals.map(sg => sg.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
    
    it('should assign priorities to sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-5',
        description: 'Optimize database performance',
        type: 'optimization',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      decomposition.subGoals.forEach(subGoal => {
        expect(subGoal.priority).toBeDefined();
        expect(subGoal.priority).toBeGreaterThanOrEqual(1);
        expect(subGoal.priority).toBeLessThanOrEqual(3);
      });
    });
    
    it('should estimate effort for sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-6',
        description: 'Write unit tests',
        type: 'testing',
        priority: 2
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      decomposition.subGoals.forEach(subGoal => {
        expect(subGoal.estimatedHours).toBeDefined();
        expect(subGoal.estimatedHours).toBeGreaterThan(0);
      });
    });
    
    it('should define success criteria', async () => {
      const goal: Goal = {
        id: 'goal-7',
        description: 'Improve test coverage',
        type: 'quality',
        priority: 2
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      decomposition.subGoals.forEach(subGoal => {
        expect(subGoal.successCriteria).toBeDefined();
        expect(subGoal.successCriteria.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Dependency Management', () => {
    it('should identify dependencies between sub-goals', async () => {
      const goal: Goal = {
        id: 'goal-8',
        description: 'Build and deploy application',
        type: 'development',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      // Some sub-goals should have dependencies
      const withDeps = decomposition.subGoals.filter(sg => sg.dependencies && sg.dependencies.length > 0);
      expect(withDeps.length).toBeGreaterThan(0);
    });
    
    it('should not create circular dependencies', async () => {
      const goal: Goal = {
        id: 'goal-9',
        description: 'Complex multi-step workflow',
        type: 'workflow',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      // Check for cycles
      const hasCircular = decomposer.hasCircularDependencies(decomposition);
      expect(hasCircular).toBe(false);
    });
    
    it('should order sub-goals topologically', async () => {
      const goal: Goal = {
        id: 'goal-10',
        description: 'Sequential process',
        type: 'process',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      const ordered = decomposer.topologicalSort(decomposition);
      
      expect(ordered.length).toBe(decomposition.subGoals.length);
      
      // Verify each sub-goal appears after its dependencies
      const indexMap = new Map(ordered.map((sg, idx) => [sg.id, idx]));
      ordered.forEach(subGoal => {
        if (subGoal.dependencies) {
          subGoal.dependencies.forEach(depId => {
            const depIndex = indexMap.get(depId);
            const subGoalIndex = indexMap.get(subGoal.id);
            expect(depIndex).toBeLessThan(subGoalIndex!);
          });
        }
      });
    });
  });
  
  describe('Goal Types', () => {
    it('should handle development goals', async () => {
      const goal: Goal = {
        id: 'dev-1',
        description: 'Implement new feature',
        type: 'development',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.subGoals.length).toBeGreaterThan(0);
      expect(decomposition.goalType).toBe('development');
    });
    
    it('should handle testing goals', async () => {
      const goal: Goal = {
        id: 'test-1',
        description: 'Write comprehensive tests',
        type: 'testing',
        priority: 2
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.goalType).toBe('testing');
    });
    
    it('should handle documentation goals', async () => {
      const goal: Goal = {
        id: 'doc-1',
        description: 'Create user documentation',
        type: 'documentation',
        priority: 3
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.goalType).toBe('documentation');
    });
  });
  
  describe('Effort Estimation', () => {
    it('should sum total estimated hours', async () => {
      const goal: Goal = {
        id: 'effort-1',
        description: 'Complete project',
        type: 'development',
        priority: 1
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.totalEstimatedHours).toBeDefined();
      expect(decomposition.totalEstimatedHours).toBeGreaterThan(0);
      
      // Verify sum
      const sum = decomposition.subGoals.reduce((acc, sg) => acc + sg.estimatedHours, 0);
      expect(decomposition.totalEstimatedHours).toBe(sum);
    });
    
    it('should estimate larger efforts for complex goals', async () => {
      const simpleGoal: Goal = {
        id: 'simple',
        description: 'Fix a bug',
        type: 'development',
        priority: 1
      };
      
      const complexGoal: Goal = {
        id: 'complex',
        description: 'Build complete microservices architecture with service mesh, monitoring, and CI/CD',
        type: 'development',
        priority: 1
      };
      
      const simpleDecomp = await decomposer.decompose(simpleGoal);
      const complexDecomp = await decomposer.decompose(complexGoal);
      
      expect(complexDecomp.totalEstimatedHours).toBeGreaterThan(simpleDecomp.totalEstimatedHours);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle very simple goals', async () => {
      const goal: Goal = {
        id: 'simple-1',
        description: 'Update README',
        type: 'documentation',
        priority: 3
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.subGoals.length).toBeGreaterThanOrEqual(1);
      expect(decomposition.subGoals.length).toBeLessThanOrEqual(5);
    });
    
    it('should handle goals with constraints', async () => {
      const goal: Goal = {
        id: 'constrained-1',
        description: 'Optimize performance',
        type: 'optimization',
        priority: 1,
        constraints: {
          maxHours: 20,
          deadline: '2026-01-15'
        }
      };
      
      const decomposition = await decomposer.decompose(goal);
      
      expect(decomposition.constraints).toEqual(goal.constraints);
      expect(decomposition.totalEstimatedHours).toBeLessThanOrEqual(20);
    });
    
    it('should reject invalid goals', async () => {
      const goal: Goal = {
        id: '',
        description: '',
        type: 'development',
        priority: 1
      };
      
      await expect(decomposer.decompose(goal)).rejects.toThrow('Invalid goal');
    });
  });
});
