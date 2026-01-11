/**
 * DeploymentManager Tests
 * 
 * Tests for safe deployment of successful experiments.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Safe deployment orchestration (domain logic), not generic CD framework.
 */

import { DeploymentManager, DeploymentConfig, DeploymentResult, DeploymentStatus } from './DeploymentManager';

describe('DeploymentManager', () => {
  let manager: DeploymentManager;
  
  beforeEach(() => {
    manager = new DeploymentManager();
  });
  
  describe('Construction', () => {
    it('should create DeploymentManager instance', () => {
      expect(manager).toBeInstanceOf(DeploymentManager);
    });
  });
  
  describe('Deployment Execution', () => {
    it('should deploy variant with canary rollout', async () => {
      const config: DeploymentConfig = {
        variantId: 'test-variant-1',
        variant: { strategy: 'new-algorithm', threshold: 0.85 },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const result = await manager.deploy(config);
      
      expect(result.status).toBe('deployed');
      expect(result.canaryActive).toBe(true);
      expect(result.deploymentId).toBeDefined();
    });
    
    it('should create rollback plan on deployment', async () => {
      const config: DeploymentConfig = {
        variantId: 'variant-2',
        variant: { mode: 'experimental' },
        rollbackThreshold: 0.05,
        canaryPercent: 10
      };
      
      const result = await manager.deploy(config);
      
      expect(result.rollbackPlan).toBeDefined();
      expect(result.rollbackPlan?.previousConfig).toBeDefined();
    });
  });
  
  describe('Canary Deployments', () => {
    it('should start with small canary percentage', async () => {
      const config: DeploymentConfig = {
        variantId: 'canary-test',
        variant: { value: 42 },
        rollbackThreshold: 0.15,
        canaryPercent: 5
      };
      
      const result = await manager.deploy(config);
      
      expect(result.canaryPercent).toBe(5);
      expect(result.canaryActive).toBe(true);
    });
    
    it('should gradually increase canary percentage', async () => {
      const config: DeploymentConfig = {
        variantId: 'gradual-test',
        variant: { setting: 'enabled' },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      
      // Simulate successful canary phase
      const increased = await manager.increaseCanary(deployment.deploymentId, 25);
      
      expect(increased.canaryPercent).toBe(25);
      expect(increased.status).toBe('deployed');
    });
    
    it('should complete deployment at 100% canary', async () => {
      const config: DeploymentConfig = {
        variantId: 'complete-test',
        variant: { enabled: true },
        rollbackThreshold: 0.05,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      const completed = await manager.increaseCanary(deployment.deploymentId, 100);
      
      expect(completed.canaryPercent).toBe(100);
      expect(completed.canaryActive).toBe(false); // No longer canary, fully deployed
    });
  });
  
  describe('Health Monitoring', () => {
    it('should monitor deployment health', async () => {
      const config: DeploymentConfig = {
        variantId: 'health-test',
        variant: { feature: 'enabled' },
        rollbackThreshold: 0.10,
        canaryPercent: 10
      };
      
      const deployment = await manager.deploy(config);
      const health = await manager.checkHealth(deployment.deploymentId);
      
      expect(health).toBeDefined();
      expect(health.healthy).toBeDefined();
      expect(health.errorRate).toBeDefined();
    });
    
    it('should detect unhealthy deployments', async () => {
      const config: DeploymentConfig = {
        variantId: 'unhealthy-test',
        variant: { buggy: true },
        rollbackThreshold: 0.05,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      
      // Simulate high error rate
      manager.simulateErrors(deployment.deploymentId, 0.15);
      
      const health = await manager.checkHealth(deployment.deploymentId);
      
      expect(health.healthy).toBe(false);
      expect(health.errorRate).toBeGreaterThan(0.05);
    });
  });
  
  describe('Automatic Rollback', () => {
    it('should rollback on error threshold exceeded', async () => {
      const config: DeploymentConfig = {
        variantId: 'rollback-test',
        variant: { breaking: true },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      
      // Trigger rollback condition
      manager.simulateErrors(deployment.deploymentId, 0.20);
      
      const rolled = await manager.rollback(deployment.deploymentId);
      
      expect(rolled.status).toBe('rolled_back');
      expect(rolled.rollbackReason).toBeDefined();
    });
    
    it('should restore previous configuration on rollback', async () => {
      const config: DeploymentConfig = {
        variantId: 'restore-test',
        variant: { new: 'config' },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      const rolled = await manager.rollback(deployment.deploymentId);
      
      expect(rolled.currentConfig).toEqual(deployment.rollbackPlan?.previousConfig);
    });
    
    it('should record rollback reason', async () => {
      const config: DeploymentConfig = {
        variantId: 'reason-test',
        variant: { test: true },
        rollbackThreshold: 0.08,
        canaryPercent: 10
      };
      
      const deployment = await manager.deploy(config);
      manager.simulateErrors(deployment.deploymentId, 0.15);
      
      const rolled = await manager.rollback(deployment.deploymentId, 'High error rate detected');
      
      expect(rolled.rollbackReason).toContain('High error rate');
    });
  });
  
  describe('Deployment History', () => {
    it('should track deployment history', async () => {
      const config: DeploymentConfig = {
        variantId: 'history-test',
        variant: { version: '2.0' },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      await manager.deploy(config);
      
      const history = manager.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0]?.variantId).toBe('history-test');
    });
    
    it('should record deployment timestamps', async () => {
      const config: DeploymentConfig = {
        variantId: 'timestamp-test',
        variant: { timestamp: Date.now() },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      
      expect(deployment.deployedAt).toBeDefined();
      expect(new Date(deployment.deployedAt).getTime()).toBeGreaterThan(0);
    });
    
    it('should maintain deployment sequence', async () => {
      const configs = [
        { variantId: 'v1', variant: {}, rollbackThreshold: 0.1, canaryPercent: 5 },
        { variantId: 'v2', variant: {}, rollbackThreshold: 0.1, canaryPercent: 5 },
        { variantId: 'v3', variant: {}, rollbackThreshold: 0.1, canaryPercent: 5 }
      ];
      
      for (const config of configs) {
        await manager.deploy(config);
      }
      
      const history = manager.getHistory();
      
      expect(history).toHaveLength(3);
      expect(history.map(d => d.variantId)).toEqual(['v1', 'v2', 'v3']);
    });
  });
  
  describe('Deployment Status', () => {
    it('should get current deployment status', async () => {
      const config: DeploymentConfig = {
        variantId: 'status-test',
        variant: { active: true },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      const status = await manager.getStatus(deployment.deploymentId);
      
      expect(status.status).toBe('deployed');
      expect(status.variantId).toBe('status-test');
    });
    
    it('should update status during canary increase', async () => {
      const config: DeploymentConfig = {
        variantId: 'update-test',
        variant: { value: 100 },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      await manager.increaseCanary(deployment.deploymentId, 50);
      
      const status = await manager.getStatus(deployment.deploymentId);
      
      expect(status.canaryPercent).toBe(50);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle deployment with zero canary', async () => {
      const config: DeploymentConfig = {
        variantId: 'zero-canary',
        variant: { immediate: true },
        rollbackThreshold: 0.10,
        canaryPercent: 0
      };
      
      const result = await manager.deploy(config);
      
      expect(result.canaryPercent).toBe(0);
      expect(result.status).toBe('deployed');
    });
    
    it('should handle deployment with 100% canary', async () => {
      const config: DeploymentConfig = {
        variantId: 'full-deploy',
        variant: { full: true },
        rollbackThreshold: 0.10,
        canaryPercent: 100
      };
      
      const result = await manager.deploy(config);
      
      expect(result.canaryPercent).toBe(100);
      expect(result.canaryActive).toBe(false);
    });
    
    it('should reject invalid canary percentages', async () => {
      const config: DeploymentConfig = {
        variantId: 'invalid-canary',
        variant: { test: true },
        rollbackThreshold: 0.10,
        canaryPercent: 150
      };
      
      await expect(manager.deploy(config)).rejects.toThrow('Invalid canary percentage');
    });
    
    it('should handle rollback of already rolled back deployment', async () => {
      const config: DeploymentConfig = {
        variantId: 'double-rollback',
        variant: { test: true },
        rollbackThreshold: 0.10,
        canaryPercent: 5
      };
      
      const deployment = await manager.deploy(config);
      await manager.rollback(deployment.deploymentId);
      
      // Second rollback should handle gracefully
      await expect(manager.rollback(deployment.deploymentId)).rejects.toThrow('already rolled back');
    });
  });
});
