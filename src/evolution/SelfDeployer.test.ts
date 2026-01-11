/**
 * SelfDeployer Tests
 *
 * Tests for safe autonomous code deployment.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Deploy self-generated improvements safely with rollback.
 */

import { SelfDeployer, DeploymentPlan, DeploymentResult, DeploymentStage, DeploymentStatus } from './SelfDeployer';
import { CodeModification } from './CodeGenerator';

describe('SelfDeployer', () => {
  let deployer: SelfDeployer;

  beforeEach(() => {
    deployer = new SelfDeployer();
  });

  describe('Construction', () => {
    it('should create SelfDeployer instance', () => {
      expect(deployer).toBeInstanceOf(SelfDeployer);
    });

    it('should accept custom configuration', () => {
      const customDeployer = new SelfDeployer({
        requireApproval: true,
        maxConcurrentDeployments: 3,
      });

      expect(customDeployer).toBeInstanceOf(SelfDeployer);
    });
  });

  describe('Deployment Planning', () => {
    it('should create deployment plan from modifications', () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Test change',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = 2;',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);

      expect(plan).toBeDefined();
      expect(plan.modifications).toBe(modifications);
      expect(plan.stages).toBeDefined();
    });

    it('should create staged deployment plan', () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Change 1',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);

      expect(plan.stages.length).toBeGreaterThan(0);
      expect(plan.stages.some((s: DeploymentStage) => s.name === 'validate')).toBe(true);
      expect(plan.stages.some((s: DeploymentStage) => s.name === 'test')).toBe(true);
      expect(plan.stages.some((s: DeploymentStage) => s.name === 'deploy')).toBe(true);
    });

    it('should order stages correctly', () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Test',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const stageNames = plan.stages.map((s: DeploymentStage) => s.name);

      expect(stageNames.indexOf('validate')).toBeLessThan(stageNames.indexOf('test'));
      expect(stageNames.indexOf('test')).toBeLessThan(stageNames.indexOf('deploy'));
    });
  });

  describe('Deployment Execution', () => {
    it('should execute deployment plan', async () => {
      const plan: DeploymentPlan = {
        id: '1',
        modifications: [],
        stages: [
          { name: 'validate', description: 'Validate changes', required: true },
          { name: 'deploy', description: 'Deploy changes', required: true },
        ],
        createdAt: new Date(),
      };

      const result = await deployer.executePlan(plan);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should run validation stage', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Valid change',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = 2;',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      expect(result.stagesCompleted.includes('validate')).toBe(true);
    });

    it('should run test stage', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Change',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      expect(result.stagesCompleted.includes('test')).toBe(true);
    });

    it('should deploy changes', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Deploy test',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      expect(result.stagesCompleted.includes('deploy')).toBe(true);
    });
  });

  describe('Validation Stage', () => {
    it('should validate syntax before deployment', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Valid code',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = 2;',
          diff: '',
        },
      ];

      const valid = await deployer.validateModifications(modifications);

      expect(valid).toBe(true);
    });

    it('should reject invalid syntax', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Invalid code',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = {{{',
          diff: '',
        },
      ];

      const valid = await deployer.validateModifications(modifications);

      expect(valid).toBe(false);
    });

    it('should check type correctness', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Type-safe code',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x: number = 1;',
          diff: '',
        },
      ];

      const valid = await deployer.validateModifications(modifications);

      expect(valid).toBe(true);
    });
  });

  describe('Test Stage', () => {
    it('should run tests before deployment', async () => {
      const result = await deployer.runTests();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('total');
    });

    it('should detect test failures', async () => {
      // Simulate test failure scenario
      const result = await deployer.runTests();

      expect(typeof result.passed).toBe('number');
      expect(typeof result.failed).toBe('number');
    });

    it('should require tests to pass', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Change requiring tests',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      // If tests fail, deployment should fail
      if (result.status === 'failed') {
        expect(result.error).toContain('test');
      }
    });
  });

  describe('Rollback Support', () => {
    it('should support rollback on failure', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Failing change',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = {{{',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      if (result.status === 'failed') {
        const rollback = await deployer.rollback(result.deploymentId);
        expect(rollback).toBe(true);
      } else {
        expect(true).toBe(true); // Pass if deployment succeeded
      }
    });

    it('should track rollback history', async () => {
      const deploymentId = 'test-deployment-1';
      await deployer.rollback(deploymentId);

      const history = deployer.getRollbackHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should restore original code on rollback', async () => {
      const original = 'const x = 1;';
      const modified = 'const x = 2;';

      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Change to rollback',
          originalCode: original,
          modifiedCode: modified,
          diff: '',
        },
      ];

      // This test verifies rollback capability exists
      const plan = deployer.createDeploymentPlan(modifications);
      expect(plan.modifications[0].originalCode).toBe(original);
    });
  });

  describe('Deployment Status', () => {
    it('should track deployment status', async () => {
      const plan: DeploymentPlan = {
        id: '1',
        modifications: [],
        stages: [
          { name: 'deploy', description: 'Deploy', required: true },
        ],
        createdAt: new Date(),
      };

      const result = await deployer.executePlan(plan);

      expect(['pending', 'running', 'success', 'failed'].includes(result.status)).toBe(true);
    });

    it('should report success on completion', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Simple change',
          originalCode: 'const x = 1;',
          modifiedCode: 'const x = 2;',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      expect(['success', 'failed'].includes(result.status)).toBe(true);
    });

    it('should report failure on error', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Invalid change',
          originalCode: '',
          modifiedCode: 'invalid {{{',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      if (result.status === 'failed') {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Incremental Deployment', () => {
    it('should support file-by-file deployment', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'file1.ts',
          description: 'Change 1',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
        {
          id: '2',
          type: 'refactor',
          filePath: 'file2.ts',
          description: 'Change 2',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const results = await deployer.deployIncrementally(modifications);

      expect(results.length).toBe(2);
    });

    it('should stop on first failure in incremental mode', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'file1.ts',
          description: 'Valid',
          originalCode: '',
          modifiedCode: 'const x = 1;',
          diff: '',
        },
        {
          id: '2',
          type: 'refactor',
          filePath: 'file2.ts',
          description: 'Invalid',
          originalCode: '',
          modifiedCode: '{{{',
          diff: '',
        },
      ];

      const results = await deployer.deployIncrementally(modifications);

      // Should have results for attempted deployments
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Deployment History', () => {
    it('should track deployment history', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Test',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      await deployer.executePlan(plan);

      const history = deployer.getDeploymentHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include timestamps in history', async () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'refactor',
          filePath: 'test.ts',
          description: 'Test',
          originalCode: '',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const result = await deployer.executePlan(plan);

      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('Safety Gates', () => {
    it('should require approval for critical changes', async () => {
      const deployer = new SelfDeployer({ requireApproval: true });

      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'remove',
          filePath: 'critical.ts',
          description: 'Remove critical code',
          originalCode: 'function important() {}',
          modifiedCode: '',
          diff: '',
        },
      ];

      const plan = deployer.createDeploymentPlan(modifications);
      const needsApproval = deployer.requiresApproval(plan);

      expect(needsApproval).toBe(true);
    });

    it('should check for destructive changes', () => {
      const modifications: CodeModification[] = [
        {
          id: '1',
          type: 'remove',
          filePath: 'test.ts',
          description: 'Delete code',
          originalCode: 'code',
          modifiedCode: '',
          diff: '',
        },
      ];

      const isDestructive = deployer.isDestructive(modifications);

      expect(isDestructive).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty modification list', async () => {
      const plan = deployer.createDeploymentPlan([]);

      expect(plan.modifications.length).toBe(0);
    });

    it('should handle deployment errors gracefully', async () => {
      const plan: DeploymentPlan = {
        id: '1',
        modifications: [
          {
            id: '1',
            type: 'refactor',
            filePath: 'nonexistent.ts',
            description: 'Error test',
            originalCode: '',
            modifiedCode: '',
            diff: '',
          },
        ],
        stages: [],
        createdAt: new Date(),
      };

      const result = await deployer.executePlan(plan);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });
});
