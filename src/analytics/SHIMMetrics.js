"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIMMetrics = void 0;
const promClient = __importStar(require("prom-client"));
const http = __importStar(require("http"));
class SHIMMetrics {
    registry;
    server = null;
    // Crash Prevention Metrics
    crashPredictionAccuracy;
    checkpointCreationTime;
    resumeSuccessRate;
    checkpointCompressedBytes;
    checkpointUncompressedBytes;
    // Model Routing Metrics
    modelRoutingAccuracy;
    tokenSavingsTotal;
    modelSelections;
    // Performance Metrics
    supervisorRestartTime;
    crashRecoveryDuration;
    processMonitorLatency;
    // System Health Metrics
    activeSessions;
    uptimeSeconds;
    errorsTotal;
    // Custom metrics storage
    customMetrics = new Map();
    // Resume success tracking
    resumeAttempts = 0;
    resumeSuccesses = 0;
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
    getRegistry() {
        return this.registry;
    }
    /**
     * Get all registered metric names
     */
    async getMetricNames() {
        const metrics = await this.registry.getMetricsAsJSON();
        return metrics.map((m) => m.name);
    }
    /**
     * Record crash prediction accuracy
     */
    recordCrashPredictionAccuracy(accuracy) {
        this.crashPredictionAccuracy.set(accuracy);
    }
    /**
     * Record checkpoint creation time
     */
    recordCheckpointCreationTime(milliseconds) {
        this.checkpointCreationTime.observe(milliseconds);
    }
    /**
     * Record resume attempt (success or failure)
     */
    recordResumeSuccess(success) {
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
    recordCheckpointSize(metrics) {
        this.checkpointUncompressedBytes.set(metrics.uncompressed);
        this.checkpointCompressedBytes.set(metrics.compressed);
    }
    /**
     * Record model routing accuracy
     */
    recordModelRoutingAccuracy(accuracy) {
        this.modelRoutingAccuracy.set(accuracy);
    }
    /**
     * Record token savings
     */
    recordTokenSavings(tokens) {
        this.tokenSavingsTotal.inc(tokens);
    }
    /**
     * Record model selection
     */
    recordModelSelection(model, reason) {
        this.modelSelections.inc({ model, reason });
    }
    /**
     * Get model selection counts
     */
    async getModelSelectionCounts() {
        const metrics = await this.registry.getMetricsAsJSON();
        const selections = metrics.find((m) => m.name === 'shim_model_selections_total');
        const counts = { haiku: 0, sonnet: 0, opus: 0 };
        if (selections && 'values' in selections) {
            for (const value of selections.values) {
                const model = value.labels?.model;
                if (model === 'haiku')
                    counts.haiku += value.value || 0;
                if (model === 'sonnet')
                    counts.sonnet += value.value || 0;
                if (model === 'opus')
                    counts.opus += value.value || 0;
            }
        }
        return counts;
    }
    /**
     * Record supervisor restart time
     */
    recordSupervisorRestartTime(milliseconds) {
        this.supervisorRestartTime.observe(milliseconds);
    }
    /**
     * Record crash recovery duration
     */
    recordCrashRecoveryDuration(milliseconds) {
        this.crashRecoveryDuration.observe(milliseconds);
    }
    /**
     * Record process monitor latency
     */
    recordProcessMonitorLatency(milliseconds) {
        this.processMonitorLatency.observe(milliseconds);
    }
    /**
     * Set active sessions count
     */
    setActiveSessions(count) {
        this.activeSessions.set(count);
    }
    /**
     * Set uptime
     */
    setUptime(milliseconds) {
        this.uptimeSeconds.set(milliseconds / 1000);
    }
    /**
     * Record error
     */
    recordError(type) {
        this.errorsTotal.inc({ type });
    }
    /**
     * Export metrics in Prometheus format
     */
    async exportMetrics() {
        return await this.registry.metrics();
    }
    /**
     * Register custom gauge
     */
    registerCustomGauge(name, help, labelNames) {
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
    registerCustomCounter(name, help, labelNames) {
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
    incrementCounter(name, labels) {
        const metric = this.customMetrics.get(name);
        if (metric && metric instanceof promClient.Counter) {
            if (labels) {
                metric.inc(labels);
            }
            else {
                metric.inc();
            }
        }
    }
    /**
     * Get counter value
     */
    async getCounterValue(name, labels) {
        const metrics = await this.registry.getMetricsAsJSON();
        const metric = metrics.find((m) => m.name === name);
        if (!metric || !('values' in metric)) {
            return 0;
        }
        if (labels) {
            const value = metric.values.find((v) => v.labels && Object.entries(labels).every(([k, val]) => v.labels[k] === val));
            return value?.value || 0;
        }
        return metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
    }
    /**
     * Get gauge value
     */
    async getGaugeValue(name) {
        return await this.getMetricValue(name);
    }
    /**
     * Get metric value (generic)
     */
    async getMetricValue(name) {
        const metrics = await this.registry.getMetricsAsJSON();
        const metric = metrics.find((m) => m.name === name);
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
    getHistogram(name) {
        const metric = this.customMetrics.get(name);
        if (metric instanceof promClient.Histogram) {
            return metric;
        }
        // Check built-in histograms
        const builtIn = {
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
    async getHistogramStats(name) {
        const metrics = await this.registry.getMetricsAsJSON();
        const metric = metrics.find((m) => m.name === name);
        if (!metric || !('values' in metric)) {
            return { count: 0, sum: 0 };
        }
        // For histograms, the count and sum are in separate metrics with _count and _sum suffixes
        const countMetric = metrics.find((m) => m.name === `${name}_count`);
        const sumMetric = metrics.find((m) => m.name === `${name}_sum`);
        const countValue = countMetric && 'values' in countMetric ? countMetric.values[0]?.value : undefined;
        const sumValue = sumMetric && 'values' in sumMetric ? sumMetric.values[0]?.value : undefined;
        return {
            count: countValue || 0,
            sum: sumValue || 0
        };
    }
    /**
     * Start HTTP metrics server
     */
    async startServer(port = 9090) {
        if (this.server) {
            throw new Error('Server already running');
        }
        return new Promise((resolve, reject) => {
            this.server = http.createServer(async (req, res) => {
                if (req.url === '/metrics') {
                    res.setHeader('Content-Type', this.registry.contentType);
                    const metrics = await this.registry.metrics();
                    res.end(metrics);
                }
                else {
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
    async stopServer() {
        if (!this.server) {
            return;
        }
        return new Promise((resolve) => {
            this.server.close(() => {
                this.server = null;
                resolve();
            });
        });
    }
    /**
     * Check if server is running
     */
    isServerRunning() {
        return this.server !== null;
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.registry.resetMetrics();
        this.resumeAttempts = 0;
        this.resumeSuccesses = 0;
    }
    /**
     * Validate metric name
     */
    validateMetricName(name) {
        if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(name)) {
            throw new Error('Invalid metric name');
        }
    }
}
exports.SHIMMetrics = SHIMMetrics;
//# sourceMappingURL=SHIMMetrics.js.map