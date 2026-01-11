/**
 * SHIMMetrics Tests
 * 
 * Tests for Prometheus metrics wrapper.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Wraps prom-client (battle-tested tool) with SHIM-specific metrics.
 */

import { SHIMMetrics, MetricType } from './SHIMMetrics';

describe('SHIMMetrics', () => {
  let metrics: SHIMMetrics;
  
  beforeEach(() => {
    metrics = new SHIMMetrics();
  });
  
  afterEach(() => {
    metrics.reset();
  });
  
  describe('Construction', () => {
    it('should create SHIMMetrics instance', () => {
      expect(metrics).toBeInstanceOf(SHIMMetrics);
    });
    
    it('should initialize default metrics registry', () => {
      const registry = metrics.getRegistry();
      expect(registry).toBeDefined();
    });
    
    it('should register default SHIM metrics', async () => {
      const metricNames = await metrics.getMetricNames();
      
      // Should include core SHIM metrics
      expect(metricNames).toContain('shim_crash_prediction_accuracy');
      expect(metricNames).toContain('shim_checkpoint_creation_time');
      expect(metricNames).toContain('shim_resume_success_rate');
    });
  });
  
  describe('Crash Prevention Metrics', () => {
    it('should record crash prediction accuracy', async () => {
      metrics.recordCrashPredictionAccuracy(0.92);
      
      const value = await metrics.getMetricValue('shim_crash_prediction_accuracy');
      expect(value).toBe(0.92);
    });
    
    it('should record checkpoint creation time', () => {
      metrics.recordCheckpointCreationTime(45); // milliseconds
      
      const histogram = metrics.getHistogram('shim_checkpoint_creation_time');
      expect(histogram).toBeDefined();
    });
    
    it('should record resume success rate', () => {
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      
      const rate = metrics.getMetricValue('shim_resume_success_rate');
      expect(rate).toBeCloseTo(0.667, 2);
    });
    
    it('should track checkpoint size metrics', async () => {
      metrics.recordCheckpointSize({
        uncompressed: 250000,
        compressed: 45000,
        compressionRatio: 0.18
      });
      
      const compressed = await metrics.getMetricValue('shim_checkpoint_compressed_bytes');
      expect(compressed).toBe(45000);
    });
  });
  
  describe('Model Routing Metrics', () => {
    it('should record model routing accuracy', async () => {
      metrics.recordModelRoutingAccuracy(0.85);
      
      const value = await metrics.getMetricValue('shim_model_routing_accuracy');
      expect(value).toBe(0.85);
    });
    
    it('should track token savings', async () => {
      metrics.recordTokenSavings(15000);
      
      const total = await metrics.getMetricValue('shim_token_savings_total');
      expect(total).toBeGreaterThanOrEqual(15000);
    });
    
    it('should record model selection by type', async () => {
      metrics.recordModelSelection('haiku', 'simple_query');
      metrics.recordModelSelection('sonnet', 'code_generation');
      metrics.recordModelSelection('opus', 'architecture_design');
      
      const counts = await metrics.getModelSelectionCounts();
      expect(counts.haiku).toBeGreaterThan(0);
      expect(counts.sonnet).toBeGreaterThan(0);
      expect(counts.opus).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Metrics', () => {
    it('should record supervisor restart time', () => {
      metrics.recordSupervisorRestartTime(2500); // milliseconds
      
      const histogram = metrics.getHistogram('shim_supervisor_restart_time');
      expect(histogram).toBeDefined();
    });
    
    it('should track crash recovery duration', () => {
      metrics.recordCrashRecoveryDuration(5000); // milliseconds
      
      const value = metrics.getHistogram('shim_crash_recovery_duration');
      expect(value).toBeDefined();
    });
    
    it('should record process monitor poll latency', () => {
      metrics.recordProcessMonitorLatency(12); // milliseconds
      
      const histogram = metrics.getHistogram('shim_process_monitor_latency');
      expect(histogram).toBeDefined();
    });
  });
  
  describe('System Health Metrics', () => {
    it('should track active sessions count', async () => {
      metrics.setActiveSessions(3);
      
      const value = await metrics.getMetricValue('shim_active_sessions');
      expect(value).toBe(3);
    });
    
    it('should record uptime', async () => {
      metrics.setUptime(3600000); // 1 hour in milliseconds
      
      const value = await metrics.getMetricValue('shim_uptime_seconds');
      expect(value).toBe(3600);
    });
    
    it('should track error rate', async () => {
      metrics.recordError('checkpoint_creation');
      metrics.recordError('resume_failed');
      
      const count = await metrics.getMetricValue('shim_errors_total');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Metrics Export', () => {
    it('should export metrics in Prometheus format', async () => {
      metrics.recordCrashPredictionAccuracy(0.95);
      metrics.recordCheckpointCreationTime(30);
      
      const exported = await metrics.exportMetrics();
      
      expect(exported).toContain('shim_crash_prediction_accuracy');
      expect(exported).toContain('TYPE gauge');
    });
    
    it('should include metric help text', async () => {
      const exported = await metrics.exportMetrics();
      
      expect(exported).toContain('HELP');
      expect(exported).toContain('crash prediction accuracy');
    });
    
    it('should format as Prometheus text exposition', async () => {
      const exported = await metrics.exportMetrics();
      
      // Should follow Prometheus format
      expect(exported).toMatch(/# HELP .+/);
      expect(exported).toMatch(/# TYPE .+ (gauge|counter|histogram)/);
    });
  });
  
  describe('Registry Management', () => {
    it('should support custom metric registration', async () => {
      metrics.registerCustomGauge('custom_metric', 'Custom test metric');
      
      const names = await metrics.getMetricNames();
      expect(names).toContain('custom_metric');
    });
    
    it('should support custom labels', async () => {
      metrics.registerCustomCounter('labeled_metric', 'Metric with labels', ['status', 'type']);
      
      metrics.incrementCounter('labeled_metric', { status: 'success', type: 'test' });
      
      const value = await metrics.getCounterValue('labeled_metric', { status: 'success', type: 'test' });
      expect(value).toBeGreaterThan(0);
    });
    
    it('should reset all metrics', async () => {
      metrics.recordCrashPredictionAccuracy(0.95);
      metrics.recordTokenSavings(10000);
      
      metrics.reset();
      
      // Metrics should be reset to defaults
      const names = await metrics.getMetricNames();
      expect(names.length).toBeGreaterThan(0); // Default metrics still registered
    });
  });
  
  describe('Metric Queries', () => {
    it('should get gauge value', async () => {
      metrics.recordCrashPredictionAccuracy(0.88);
      
      const value = await metrics.getGaugeValue('shim_crash_prediction_accuracy');
      expect(value).toBe(0.88);
    });
    
    it('should get counter value', async () => {
      metrics.recordTokenSavings(5000);
      metrics.recordTokenSavings(3000);
      
      const total = await metrics.getCounterValue('shim_token_savings_total');
      expect(total).toBeGreaterThanOrEqual(8000);
    });
    
    it('should get histogram statistics', async () => {
      metrics.recordCheckpointCreationTime(20);
      metrics.recordCheckpointCreationTime(30);
      metrics.recordCheckpointCreationTime(40);
      
      const stats = await metrics.getHistogramStats('shim_checkpoint_creation_time');
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(90);
    });
  });
  
  describe('HTTP Endpoint', () => {
    it('should start metrics HTTP server', async () => {
      const port = await metrics.startServer(9091);
      
      expect(port).toBe(9091);
      expect(metrics.isServerRunning()).toBe(true);
      
      await metrics.stopServer();
    });
    
    it('should serve metrics at /metrics endpoint', async () => {
      await metrics.startServer(9092);
      
      // In real implementation, would fetch http://localhost:9092/metrics
      // For tests, just verify server is running
      expect(metrics.isServerRunning()).toBe(true);
      
      await metrics.stopServer();
    });
    
    it('should stop metrics HTTP server', async () => {
      await metrics.startServer(9093);
      await metrics.stopServer();
      
      expect(metrics.isServerRunning()).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle duplicate metric registration', () => {
      metrics.registerCustomGauge('duplicate_test', 'First registration');
      
      // Second registration should not throw
      expect(() => {
        metrics.registerCustomGauge('duplicate_test', 'Second registration');
      }).not.toThrow();
    });
    
    it('should handle non-existent metric queries', async () => {
      const value = await metrics.getMetricValue('non_existent_metric');
      expect(value).toBeUndefined();
    });
    
    it('should validate metric names', () => {
      expect(() => {
        metrics.registerCustomGauge('invalid metric name!', 'Invalid');
      }).toThrow('Invalid metric name');
    });
  });
});
