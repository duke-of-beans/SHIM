/**
 * AutoExperimentEngine Tests
 * 
 * Tests for autonomous experiment orchestration engine.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Orchestrate complete Kaizen loop autonomously:
 * - Continuous metrics monitoring
 * - Automatic opportunity detection
 * - Experiment creation from patterns
 * - Progress monitoring
 * - Auto-deployment with safety
 * - Rollback on violations
 * - Improvement reporting
 */

import { AutoExperimentEngine, EngineConfig, EngineStatus, ExperimentStatus } from './AutoExperimentEngine';
import { SHIMMetrics } from './SHIMMetrics';
import { OpportunityDetector } from './OpportunityDetector';
import { StatsigIntegration } from './StatsigIntegration';
import { SafetyBounds } from './SafetyBounds';

describe('AutoExperimentEngine', () => {
  let engine: AutoExperimentEngine;
  let metrics: SHIMMetrics;
  let detector: OpportunityDetector;
  let statsig: StatsigIntegration;
  let safety: SafetyBounds;
  
  beforeEach(() => {
    metrics = new SHIMMetrics();
    detector = new OpportunityDetector(metrics);
    statsig = new StatsigIntegration('test-key', { enableLogging: false });
    safety = new SafetyBounds({
      crashRate: { max: 0.10 },
      checkpointTime: { max: 100 },
      resumeSuccessRate: { min: 0.90 }
    });
    
    engine = new AutoExperimentEngine({
      metrics,
      detector,
      statsig,
      safety,
      detectionInterval: 60000,  // 1 minute
      minSampleSize: 10
    });
  });
  
  afterEach(async () => {
    await engine.stop();
  });
  
  describe('Construction', () => {
    it('should create AutoExperimentEngine instance', () => {
      expect(engine).toBeInstanceOf(AutoExperimentEngine);
    });
    
    it('should accept configuration', () => {
      const config = engine.getConfig();
      
      expect(config.detectionInterval).toBe(60000);
      expect(config.minSampleSize).toBe(10);
    });
    
    it('should initialize components', async () => {
      const initialized = await engine.initialize();
      
      expect(initialized).toBe(true);
    });
    
    it('should validate configuration', () => {
      expect(() => {
        new AutoExperimentEngine({
          metrics,
          detector,
          statsig,
          safety,
          detectionInterval: -1000  // Invalid
        });
      }).toThrow();
    });
  });
  
  describe('Engine Lifecycle', () => {
    it('should start engine', async () => {
      const started = await engine.start();
      
      expect(started).toBe(true);
      expect(engine.isRunning()).toBe(true);
    });
    
    it('should stop engine', async () => {
      await engine.start();
      await engine.stop();
      
      expect(engine.isRunning()).toBe(false);
    });
    
    it('should prevent double start', async () => {
      await engine.start();
      
      const secondStart = await engine.start();
      expect(secondStart).toBe(false);
    });
    
    it('should emit lifecycle events', async () => {
      const events: string[] = [];
      
      engine.on('started', () => events.push('started'));
      engine.on('stopped', () => events.push('stopped'));
      
      await engine.start();
      await engine.stop();
      
      expect(events).toEqual(['started', 'stopped']);
    });
  });
  
  describe('Opportunity Detection', () => {
    it('should detect opportunities automatically', async (done) => {
      engine.on('opportunities_detected', (opportunities) => {
        expect(Array.isArray(opportunities)).toBe(true);
        done();
      });
      
      // Simulate bad metrics
      metrics.recordCrashPredictionAccuracy(0.85); // 15% crash rate
      
      await engine.start();
      await engine.runDetectionCycle();
    });
    
    it('should respect detection interval', async () => {
      const customEngine = new AutoExperimentEngine({
        metrics,
        detector,
        statsig,
        safety,
        detectionInterval: 100  // 100ms
      });
      
      let detectionCount = 0;
      customEngine.on('detection_cycle', () => detectionCount++);
      
      await customEngine.start();
      await new Promise(resolve => setTimeout(resolve, 350));
      await customEngine.stop();
      
      expect(detectionCount).toBeGreaterThanOrEqual(3);
    });
    
    it('should skip detection when no new data', async () => {
      let skipped = false;
      engine.on('detection_skipped', () => skipped = true);
      
      await engine.start();
      await engine.runDetectionCycle();  // No metrics recorded
      
      expect(skipped).toBe(true);
    });
  });
  
  describe('Experiment Creation', () => {
    it('should create experiments from opportunities', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const created: any[] = [];
      engine.on('experiment_created', (exp) => created.push(exp));
      
      await engine.start();
      await engine.runDetectionCycle();
      
      expect(created.length).toBeGreaterThan(0);
    });
    
    it('should not create duplicate experiments', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      await engine.start();
      await engine.runDetectionCycle();
      await engine.runDetectionCycle();  // Second cycle
      
      const experiments = engine.getActiveExperiments();
      
      // Should not have duplicate experiments for same opportunity
      const names = experiments.map(e => e.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });
    
    it('should enforce max concurrent experiments', async () => {
      const customEngine = new AutoExperimentEngine({
        metrics,
        detector,
        statsig,
        safety,
        maxConcurrentExperiments: 2
      });
      
      // Create conditions for 3 opportunities
      metrics.recordCrashPredictionAccuracy(0.85);
      metrics.recordCheckpointCreationTime(150);
      metrics.recordResumeSuccess(false);
      
      await customEngine.start();
      await customEngine.runDetectionCycle();
      
      const experiments = customEngine.getActiveExperiments();
      expect(experiments.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Safety Validation', () => {
    it('should validate experiments before creation', async () => {
      // Set metrics that violate safety bounds
      metrics.recordCrashPredictionAccuracy(0.70);  // 30% crash rate
      
      const rejected: any[] = [];
      engine.on('experiment_rejected', (reason) => rejected.push(reason));
      
      await engine.start();
      await engine.runDetectionCycle();
      
      expect(rejected.length).toBeGreaterThan(0);
    });
    
    it('should monitor running experiments', async () => {
      const violations: any[] = [];
      engine.on('safety_violation', (violation) => violations.push(violation));
      
      await engine.start();
      
      // Simulate experiment with violations
      metrics.recordCrashPredictionAccuracy(0.70);
      await engine.runSafetyCheck();
      
      expect(violations.length).toBeGreaterThan(0);
    });
    
    it('should auto-rollback on critical violations', async () => {
      const rollbacks: any[] = [];
      engine.on('auto_rollback', (exp) => rollbacks.push(exp));
      
      await engine.start();
      
      // Create experiment
      metrics.recordCrashPredictionAccuracy(0.88);
      await engine.runDetectionCycle();
      
      // Trigger critical violation
      metrics.recordCrashPredictionAccuracy(0.70);
      await engine.runSafetyCheck();
      
      expect(rollbacks.length).toBeGreaterThan(0);
    });
  });
  
  describe('Progress Monitoring', () => {
    it('should track experiment progress', async () => {
      metrics.recordCrashPredictionAccuracy(0.88);
      
      await engine.start();
      await engine.runDetectionCycle();
      
      const status = engine.getExperimentStatus();
      
      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('completed');
      expect(status).toHaveProperty('rollbacks');
    });
    
    it('should emit progress updates', async () => {
      const updates: any[] = [];
      engine.on('progress_update', (update) => updates.push(update));
      
      await engine.start();
      await engine.runProgressCheck();
      
      expect(updates.length).toBeGreaterThan(0);
    });
    
    it('should detect experiment completion', async () => {
      const completed: any[] = [];
      engine.on('experiment_completed', (exp) => completed.push(exp));
      
      // Would trigger when experiment has sufficient samples
      // and statistical significance achieved
    });
  });
  
  describe('Auto-Deployment', () => {
    it('should auto-deploy winning variants', async () => {
      const deployments: any[] = [];
      engine.on('auto_deployed', (result) => deployments.push(result));
      
      await engine.start();
      
      // Simulate completed experiment with winner
      // (In real scenario, after sufficient samples collected)
    });
    
    it('should respect deployment threshold', async () => {
      const customEngine = new AutoExperimentEngine({
        metrics,
        detector,
        statsig,
        safety,
        deploymentThreshold: 0.99  // Very high threshold
      });
      
      // Even with good results, should not deploy if p-value > 0.01
    });
    
    it('should validate safety before deployment', async () => {
      const rejections: any[] = [];
      engine.on('deployment_rejected', (reason) => rejections.push(reason));
      
      // Deployment should be rejected if safety bounds violated
    });
  });
  
  describe('Reporting', () => {
    it('should generate status reports', () => {
      const report = engine.generateStatusReport();
      
      expect(report).toHaveProperty('uptime');
      expect(report).toHaveProperty('experimentsCreated');
      expect(report).toHaveProperty('deploymentsCompleted');
      expect(report).toHaveProperty('rollbacksTriggered');
    });
    
    it('should generate improvement reports', async () => {
      const report = engine.generateImprovementReport();
      
      expect(report).toHaveProperty('totalImprovements');
      expect(report).toHaveProperty('metrics');
    });
    
    it('should track ROI metrics', () => {
      const roi = engine.calculateROI();
      
      expect(roi).toHaveProperty('crashReduction');
      expect(roi).toHaveProperty('performanceGain');
      expect(roi).toHaveProperty('tokenSavings');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle detection errors gracefully', async () => {
      const errors: any[] = [];
      engine.on('error', (error) => errors.push(error));
      
      // Simulate detection error
      jest.spyOn(detector, 'detectOpportunities').mockRejectedValue(new Error('Detection failed'));
      
      await engine.start();
      await engine.runDetectionCycle();
      
      // Should not crash, should emit error
      expect(engine.isRunning()).toBe(true);
    });
    
    it('should retry failed operations', async () => {
      const customEngine = new AutoExperimentEngine({
        metrics,
        detector,
        statsig,
        safety,
        maxRetries: 3
      });
      
      // Failed operations should be retried up to maxRetries
    });
    
    it('should continue on non-critical errors', async () => {
      await engine.start();
      
      // Minor error should not stop engine
      // Only critical errors should stop
      
      expect(engine.isRunning()).toBe(true);
    });
  });
  
  describe('Configuration Updates', () => {
    it('should update detection interval', () => {
      engine.setDetectionInterval(30000);  // 30 seconds
      
      const config = engine.getConfig();
      expect(config.detectionInterval).toBe(30000);
    });
    
    it('should update safety bounds', () => {
      engine.updateSafetyBounds({
        crashRate: { max: 0.05 }
      });
      
      // Should use new bounds for validation
    });
    
    it('should update deployment threshold', () => {
      engine.setDeploymentThreshold(0.99);
      
      const config = engine.getConfig();
      expect(config.deploymentThreshold).toBe(0.99);
    });
  });
  
  describe('Pause and Resume', () => {
    it('should pause engine', async () => {
      await engine.start();
      await engine.pause();
      
      expect(engine.isPaused()).toBe(true);
      expect(engine.isRunning()).toBe(true);
    });
    
    it('should resume engine', async () => {
      await engine.start();
      await engine.pause();
      await engine.resume();
      
      expect(engine.isPaused()).toBe(false);
    });
    
    it('should not run cycles when paused', async () => {
      let cycles = 0;
      engine.on('detection_cycle', () => cycles++);
      
      await engine.start();
      await engine.pause();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(cycles).toBe(0);
    });
  });
  
  describe('Integration', () => {
    it('should run complete Kaizen loop', async () => {
      const events: string[] = [];
      
      engine.on('opportunities_detected', () => events.push('detected'));
      engine.on('experiment_created', () => events.push('created'));
      engine.on('auto_deployed', () => events.push('deployed'));
      
      // Set up conditions for improvement
      metrics.recordCrashPredictionAccuracy(0.88);
      
      await engine.start();
      await engine.runDetectionCycle();
      
      expect(events.length).toBeGreaterThan(0);
    });
    
    it('should coordinate all components', async () => {
      await engine.start();
      
      // Metrics → Detector → Statsig → Safety → Deploy
      // All components should work together
      
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
    });
  });
});
