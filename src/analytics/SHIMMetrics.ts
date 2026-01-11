/**
 * SHIMMetrics - Prometheus metrics wrapper for SHIM
 * 
 * LEAN-OUT: Wraps prom-client (battle-tested) with SHIM-specific metrics.
 * 
 * Provides:
 * - Crash prevention metrics (prediction accuracy, checkpoint times, resume success)
 * - Model routing metrics (accuracy, token savings, selection counts)
 * - Performance metrics (restart time, recovery duration, latency)
 * - System health metrics (sessions, uptime, errors)
 * - Prometheus text exposition format export
 * - HTTP metrics server (/metrics endpoint)
 */

import * as promClient from 'prom-client';
import * as http from 'http';

export type MetricType = 'gauge' | 'counter' | 'histogram' | 'summary';

interface CheckpointSizeMetrics {
  uncompressed: number;
  compressed: number;
  compressionRatio: number;
}

interface HistogramStats {
  count: number;
  sum: number;
}

interface ModelSelectionCounts {
  haiku: number;
  sonnet: number;
  opus: number;
}

export class SHIMMetrics {
  private registry: promClient.Registry;
  private server: http.Server | null = null;
  
  // Crash Prevention Metrics
  private crashPredictionAccuracy: promClient.Gauge;
  private checkpointCreationTime: promClient.Histogram;
  private resumeSuccessRate: promClient.Gauge;
  private checkpointCompressedBytes: promClient.Gauge;
  private checkpointUncompressedBytes: promClient.Gauge;
  
  // Model Routing Metrics
  private modelRoutingAccuracy: promClient.Gauge;
  private tokenSavingsTotal: promClient.Counter;
  private modelSelections: promClient.Counter;
  
  // Performance Metrics
  private supervisorRestartTime: promClient.Histogram;
  private crashRecoveryDuration: promClient.Histogram;
  private processMonitorLatency: promClient.Histogram;
  
  // System Health Metrics
  private activeSessions: promClient.Gauge;
  private uptimeSeconds: promClient.Gauge;
  private errorsTotal: promClient.Counter;
  
  // Custom metrics storage
  private customMetrics: Map<string, promClient.Metric> = new Map();
  
  // Resume success tracking
  private resumeAttempts: number = 0;
  private resumeSuccesses: number = 0;
  
  constructor() {
    // Create registry
    this.registry = new promClient.Registry();
    
    // Initialize crash prevention metrics
    this.crashPredictionAccuracy = new promClient.Gauge({
      name: 'shim_crash_prediction_accuracy',
      help: 'Accuracy of crash prediction (0.0-1.0)',
      registers: [this.registry]
    });
    
    this.checkpointCreationTime = new promClient.Histogram({
      name: 'shim_checkpoint_creation_time',
      help: 'Time to create checkpoint (milliseconds)',
      buckets: [10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry]
    });
    
    this.resumeSuccessRate = new promClient.Gauge({
      name: 'shim_resume_success_rate',
      help: 'Resume success rate (0.0-1.0)',
      registers: [this.registry]
    });
    
    this.checkpointCompressedBytes = new promClient.Gauge({
      name: 'shim_checkpoint_compressed_bytes',
      help: 'Checkpoint size after compression (bytes)',
      registers: [this.registry]
    });
    
    this.checkpointUncompressedBytes = new promClient.Gauge({
      name: 'shim_checkpoint_uncompressed_bytes',
      help: 'Checkpoint size before compression (bytes)',
      registers: [this.registry]
    });
    
    // Initialize model routing metrics
    this.modelRoutingAccuracy = new promClient.Gauge({
      name: 'shim_model_routing_accuracy',
      help: 'Model routing accuracy (0.0-1.0)',
      registers: [this.registry]
    });
    
    this.tokenSavingsTotal = new promClient.Counter({
      name: 'shim_token_savings_total',
      help: 'Total tokens saved by intelligent routing',
      registers: [this.registry]
    });
    
    this.modelSelections = new promClient.Counter({
      name: 'shim_model_selections_total',
      help: 'Model selection counts by type',
      labelNames: ['model', 'reason'],
      registers: [this.registry]
    });
    
    // Initialize performance metrics
    this.supervisorRestartTime = new promClient.Histogram({
      name: 'shim_supervisor_restart_time',
      help: 'Supervisor restart time (milliseconds)',
      buckets: [500, 1000, 2000, 5000, 10000],
      registers: [this.registry]
    });
    
    this.crashRecoveryDuration = new promClient.Histogram({
      name: 'shim_crash_recovery_duration',
      help: 'Full crash recovery duration (milliseconds)',
      buckets: [1000, 2000, 5000, 10000, 30000],
      registers: [this.registry]
    });
    
    this.processMonitorLatency = new promClient.Histogram({
      name: 'shim_process_monitor_latency',
      help: 'Process monitor poll latency (milliseconds)',
      buckets: [5, 10, 25, 50, 100],
      registers: [this.registry]
    });
    
    // Initialize system health metrics
    this.activeSessions = new promClient.Gauge({
      name: 'shim_active_sessions',
      help: 'Number of active sessions',
      registers: [this.registry]
    });
    
    this.uptimeSeconds = new promClient.Gauge({
      name: 'shim_uptime_seconds',
      help: 'Supervisor uptime in seconds',
      registers: [this.registry]
    });
    
    this.errorsTotal = new promClient.Counter({
      name: 'shim_errors_total',
      help: 'Total errors by type',
      labelNames: ['type'],
      registers: [this.registry]
    });
  }
  
  /**
   * Get Prometheus registry
   */
  getRegistry(): promClient.Registry {
    return this.registry;
  }
  
  /**
   * Get all registered metric names
   */
  getMetricNames(): string[] {
    const metrics = this.registry.getMetricsAsJSON();
    return metrics.map(m => m.name);
  }
  
  /**
   * Record crash prediction accuracy
   */
  recordCrashPredictionAccuracy(accuracy: number): void {
    this.crashPredictionAccuracy.set(accuracy);
  }
  
  /**
   * Record checkpoint creation time
   */
  recordCheckpointCreationTime(milliseconds: number): void {
    this.checkpointCreationTime.observe(milliseconds);
  }
  
  /**
   * Record resume attempt (success or failure)
   */
  recordResumeSuccess(success: boolean): void {
    this.resumeAttempts++;
    if (success) {
      this.resumeSuccesses++;
    }
    
    const rate = this.resumeAttempts > 0 
      ? this.resumeSuccesses / this.resumeAttempts 
      : 0;
    
    this.resumeSuccessRate.set(rate);
  }
  
  /**
   * Record checkpoint size metrics
   */
  recordCheckpointSize(metrics: CheckpointSizeMetrics): void {
    this.checkpointUncompressedBytes.set(metrics.uncompressed);
    this.checkpointCompressedBytes.set(metrics.compressed);
  }
  
  /**
   * Record model routing accuracy
   */
  recordModelRoutingAccuracy(accuracy: number): void {
    this.modelRoutingAccuracy.set(accuracy);
  }
  
  /**
   * Record token savings
   */
  recordTokenSavings(tokens: number): void {
    this.tokenSavingsTotal.inc(tokens);
  }
  
  /**
   * Record model selection
   */
  recordModelSelection(model: string, reason: string): void {
    this.modelSelections.inc({ model, reason });
  }
  
  /**
   * Get model selection counts
   */
  getModelSelectionCounts(): ModelSelectionCounts {
    const metrics = this.registry.getMetricsAsJSON();
    const selections = metrics.find(m => m.name === 'shim_model_selections_total');
    
    const counts: ModelSelectionCounts = { haiku: 0, sonnet: 0, opus: 0 };
    
    if (selections && 'values' in selections) {
      for (const value of selections.values) {
        const model = value.labels?.model;
        if (model === 'haiku') counts.haiku += value.value || 0;
        if (model === 'sonnet') counts.sonnet += value.value || 0;
        if (model === 'opus') counts.opus += value.value || 0;
      }
    }
    
    return counts;
  }
  
  /**
   * Record supervisor restart time
   */
  recordSupervisorRestartTime(milliseconds: number): void {
    this.supervisorRestartTime.observe(milliseconds);
  }
  
  /**
   * Record crash recovery duration
   */
  recordCrashRecoveryDuration(milliseconds: number): void {
    this.crashRecoveryDuration.observe(milliseconds);
  }
  
  /**
   * Record process monitor latency
   */
  recordProcessMonitorLatency(milliseconds: number): void {
    this.processMonitorLatency.observe(milliseconds);
  }
  
  /**
   * Set active sessions count
   */
  setActiveSessions(count: number): void {
    this.activeSessions.set(count);
  }
  
  /**
   * Set uptime
   */
  setUptime(milliseconds: number): void {
    this.uptimeSeconds.set(milliseconds / 1000);
  }
  
  /**
   * Record error
   */
  recordError(type: string): void {
    this.errorsTotal.inc({ type });
  }
  
  /**
   * Export metrics in Prometheus format
   */
  async exportMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
  
  /**
   * Register custom gauge
   */
  registerCustomGauge(name: string, help: string, labelNames?: string[]): void {
    this.validateMetricName(name);
    
    if (!this.customMetrics.has(name)) {
      const gauge = new promClient.Gauge({
        name,
        help,
        labelNames,
        registers: [this.registry]
      });
      this.customMetrics.set(name, gauge);
    }
  }
  
  /**
   * Register custom counter
   */
  registerCustomCounter(name: string, help: string, labelNames?: string[]): void {
    this.validateMetricName(name);
    
    if (!this.customMetrics.has(name)) {
      const counter = new promClient.Counter({
        name,
        help,
        labelNames,
        registers: [this.registry]
      });
      this.customMetrics.set(name, counter);
    }
  }
  
  /**
   * Increment counter
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = this.customMetrics.get(name);
    if (metric && metric instanceof promClient.Counter) {
      metric.inc(labels);
    }
  }
  
  /**
   * Get counter value
   */
  getCounterValue(name: string, labels?: Record<string, string>): number {
    const metrics = this.registry.getMetricsAsJSON();
    const metric = metrics.find(m => m.name === name);
    
    if (!metric || !('values' in metric)) {
      return 0;
    }
    
    if (labels) {
      const value = metric.values.find(v => 
        v.labels && Object.entries(labels).every(([k, val]) => v.labels![k] === val)
      );
      return value?.value || 0;
    }
    
    return metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
  }
  
  /**
   * Get gauge value
   */
  getGaugeValue(name: string): number | undefined {
    return this.getMetricValue(name);
  }
  
  /**
   * Get metric value (generic)
   */
  getMetricValue(name: string): number | undefined {
    const metrics = this.registry.getMetricsAsJSON();
    const metric = metrics.find(m => m.name === name);
    
    if (!metric) {
      return undefined;
    }
    
    if ('values' in metric && metric.values.length > 0) {
      return metric.values[0].value;
    }
    
    return undefined;
  }
  
  /**
   * Get histogram
   */
  getHistogram(name: string): promClient.Histogram | undefined {
    const metric = this.customMetrics.get(name);
    if (metric instanceof promClient.Histogram) {
      return metric;
    }
    
    // Check built-in histograms
    const builtIn: Record<string, promClient.Histogram> = {
      'shim_checkpoint_creation_time': this.checkpointCreationTime,
      'shim_supervisor_restart_time': this.supervisorRestartTime,
      'shim_crash_recovery_duration': this.crashRecoveryDuration,
      'shim_process_monitor_latency': this.processMonitorLatency
    };
    
    return builtIn[name];
  }
  
  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string): HistogramStats {
    const metrics = this.registry.getMetricsAsJSON();
    const metric = metrics.find(m => m.name === name);
    
    if (!metric || !('values' in metric)) {
      return { count: 0, sum: 0 };
    }
    
    // Find count and sum labels
    const countValue = metric.values.find(v => v.metricName?.includes('_count'));
    const sumValue = metric.values.find(v => v.metricName?.includes('_sum'));
    
    return {
      count: countValue?.value || 0,
      sum: sumValue?.value || 0
    };
  }
  
  /**
   * Start HTTP metrics server
   */
  async startServer(port: number = 9090): Promise<number> {
    if (this.server) {
      throw new Error('Server already running');
    }
    
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        if (req.url === '/metrics') {
          res.setHeader('Content-Type', this.registry.contentType);
          const metrics = await this.registry.metrics();
          res.end(metrics);
        } else {
          res.statusCode = 404;
          res.end('Not Found');
        }
      });
      
      this.server.listen(port, () => {
        resolve(port);
      });
      
      this.server.on('error', reject);
    });
  }
  
  /**
   * Stop HTTP metrics server
   */
  async stopServer(): Promise<void> {
    if (!this.server) {
      return;
    }
    
    return new Promise((resolve) => {
      this.server!.close(() => {
        this.server = null;
        resolve();
      });
    });
  }
  
  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.server !== null;
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.registry.resetMetrics();
    this.resumeAttempts = 0;
    this.resumeSuccesses = 0;
  }
  
  /**
   * Validate metric name
   */
  private validateMetricName(name: string): void {
    if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(name)) {
      throw new Error('Invalid metric name');
    }
  }
}
