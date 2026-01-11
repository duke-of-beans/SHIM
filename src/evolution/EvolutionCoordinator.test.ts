/**
 * EvolutionCoordinator Tests
 * 
 * Tests for coordinating autonomous system evolution across all components.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Coordinate continuous improvement experiments across:
 * - Crash prediction models
 * - Model routing strategies
 * - Load balancing algorithms
 * - Prompt analysis heuristics
 * - Checkpoint strategies
 * 
 * The EvolutionCoordinator is the "meta-brain" that manages multiple
 * AutoExperimentEngines, each evolving different aspects of SHIM.
 */

import { 
  EvolutionCoordinator, 
  CoordinatorConfig, 
  EvolutionArea,
  EvolutionStatus
} from './EvolutionCoordinator';

describe('EvolutionCoordinator', () => {
  let coordinator: EvolutionCoordinator;
  
  beforeEach(() => {
    coordinator = new EvolutionCoordinator({
      maxConcurrentExperiments: 3,
      minExperimentGap: 86400000 // 24 hours
    });
  });
  
  afterEach(async () => {
    await coordinator.stop();
  });
  
  describe('Construction', () => {
    it('should create EvolutionCoordinator instance', () => {
      expect(coordinator).toBeInstanceOf(EvolutionCoordinator);
    });
    
    it('should accept configuration', () => {
      const config = coordinator.getConfig();
      
      expect(config.maxConcurrentExperiments).toBe(3);
      expect(config.minExperimentGap).toBe(86400000);
    });
    
    it('should validate configuration', () => {
      expect(() => {
        new EvolutionCoordinator({
          maxConcurrentExperiments: 0 // Invalid
        });
      }).toThrow();
    });
  });
  
  describe('Evolution Area Management', () => {
    it('should register evolution area', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy', 'latency']
      });
      
      const areas = await coordinator.listAreas();
      
      expect(areas).toContain('crash_prediction');
    });
    
    it('should get area status', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy']
      });
      
      const status = await coordinator.getAreaStatus('crash_prediction');
      
      expect(status.currentVersion).toBe('1.0.0');
      expect(status.activeExperiments).toBe(0);
    });
  });
  
  describe('Experiment Prioritization', () => {
    it('should prioritize by impact potential', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy'],
        priority: 1 // High
      });
      
      await coordinator.registerArea({
        name: 'load_balancing',
        currentVersion: '1.0.0',
        metrics: ['throughput'],
        priority: 3 // Low
      });
      
      const next = await coordinator.getNextExperiment();
      
      expect(next?.area).toBe('crash_prediction');
    });
  });
  
  describe('Concurrent Experiments', () => {
    it('should enforce max concurrent limit', async () => {
      // Create coordinator with shorter gap for this test
      const testCoordinator = new EvolutionCoordinator({
        maxConcurrentExperiments: 3,
        minExperimentGap: 100 // 100ms between experiments
      });
      
      await testCoordinator.registerArea({
        name: 'area1',
        currentVersion: '1.0.0',
        metrics: ['m1']
      });
      
      // Helper to wait
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Start max experiments (3) with delays
      await testCoordinator.startExperiment('area1', { hypothesis: 'H1', treatment: {} });
      await wait(150);
      await testCoordinator.startExperiment('area1', { hypothesis: 'H2', treatment: {} });
      await wait(150);
      await testCoordinator.startExperiment('area1', { hypothesis: 'H3', treatment: {} });
      await wait(150);
      
      // Should reject 4th
      await expect(
        testCoordinator.startExperiment('area1', { hypothesis: 'H4', treatment: {} })
      ).rejects.toThrow('Maximum concurrent experiments');
      
      await testCoordinator.stop();
    });
  });
  
  describe('Version Management', () => {
    it('should upgrade version on success', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy']
      });
      
      await coordinator.upgradeVersion('crash_prediction', '1.1.0', {
        improvement: 0.05
      });
      
      const status = await coordinator.getAreaStatus('crash_prediction');
      
      expect(status.currentVersion).toBe('1.1.0');
    });
    
    it('should maintain version history', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy']
      });
      
      await coordinator.upgradeVersion('crash_prediction', '1.1.0', { improvement: 0.05 });
      await coordinator.upgradeVersion('crash_prediction', '1.2.0', { improvement: 0.03 });
      
      const history = await coordinator.getVersionHistory('crash_prediction');
      
      expect(history.length).toBe(3); // 1.0.0, 1.1.0, 1.2.0
    });
  });
  
  describe('Rollback', () => {
    it('should rollback to previous version', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.2.0',
        metrics: ['accuracy']
      });
      
      await coordinator.rollbackToVersion('crash_prediction', '1.0.0');
      
      const status = await coordinator.getAreaStatus('crash_prediction');
      
      expect(status.currentVersion).toBe('1.0.0');
    });
  });
  
  describe('Reporting', () => {
    it('should generate evolution report', async () => {
      await coordinator.registerArea({
        name: 'crash_prediction',
        currentVersion: '1.0.0',
        metrics: ['accuracy']
      });
      
      const report = await coordinator.generateReport('crash_prediction');
      
      expect(report).toHaveProperty('area');
      expect(report).toHaveProperty('currentVersion');
      expect(report).toHaveProperty('totalExperiments');
    });
    
    it('should generate overall summary', async () => {
      await coordinator.registerArea({
        name: 'area1',
        currentVersion: '1.0.0',
        metrics: ['m1']
      });
      
      await coordinator.registerArea({
        name: 'area2',
        currentVersion: '1.0.0',
        metrics: ['m2']
      });
      
      const summary = await coordinator.generateSummary();
      
      expect(summary.totalAreas).toBe(2);
    });
  });
  
  describe('Lifecycle', () => {
    it('should start and stop', async () => {
      await coordinator.start();
      expect(coordinator.isRunning()).toBe(true);
      
      await coordinator.stop();
      expect(coordinator.isRunning()).toBe(false);
    });
  });
});
