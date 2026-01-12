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
export declare class SHIMMetrics {
    private registry;
    private server;
    private crashPredictionAccuracy;
    private checkpointCreationTime;
    private resumeSuccessRate;
    private checkpointCompressedBytes;
    private checkpointUncompressedBytes;
    private modelRoutingAccuracy;
    private tokenSavingsTotal;
    private modelSelections;
    private supervisorRestartTime;
    private crashRecoveryDuration;
    private processMonitorLatency;
    private activeSessions;
    private uptimeSeconds;
    private errorsTotal;
    private customMetrics;
    private resumeAttempts;
    private resumeSuccesses;
    constructor();
    /**
     * Get Prometheus registry
     */
    getRegistry(): promClient.Registry;
    /**
     * Get all registered metric names
     */
    getMetricNames(): Promise<string[]>;
    /**
     * Record crash prediction accuracy
     */
    recordCrashPredictionAccuracy(accuracy: number): void;
    /**
     * Record checkpoint creation time
     */
    recordCheckpointCreationTime(milliseconds: number): void;
    /**
     * Record resume attempt (success or failure)
     */
    recordResumeSuccess(success: boolean): void;
    /**
     * Record checkpoint size metrics
     */
    recordCheckpointSize(metrics: CheckpointSizeMetrics): void;
    /**
     * Record model routing accuracy
     */
    recordModelRoutingAccuracy(accuracy: number): void;
    /**
     * Record token savings
     */
    recordTokenSavings(tokens: number): void;
    /**
     * Record model selection
     */
    recordModelSelection(model: string, reason: string): void;
    /**
     * Get model selection counts
     */
    getModelSelectionCounts(): Promise<ModelSelectionCounts>;
    /**
     * Record supervisor restart time
     */
    recordSupervisorRestartTime(milliseconds: number): void;
    /**
     * Record crash recovery duration
     */
    recordCrashRecoveryDuration(milliseconds: number): void;
    /**
     * Record process monitor latency
     */
    recordProcessMonitorLatency(milliseconds: number): void;
    /**
     * Set active sessions count
     */
    setActiveSessions(count: number): void;
    /**
     * Set uptime
     */
    setUptime(milliseconds: number): void;
    /**
     * Record error
     */
    recordError(type: string): void;
    /**
     * Export metrics in Prometheus format
     */
    exportMetrics(): Promise<string>;
    /**
     * Register custom gauge
     */
    registerCustomGauge(name: string, help: string, labelNames?: string[]): void;
    /**
     * Register custom counter
     */
    registerCustomCounter(name: string, help: string, labelNames?: string[]): void;
    /**
     * Increment counter
     */
    incrementCounter(name: string, labels?: Record<string, string>): void;
    /**
     * Get counter value
     */
    getCounterValue(name: string, labels?: Record<string, string>): Promise<number>;
    /**
     * Get gauge value
     */
    getGaugeValue(name: string): Promise<number | undefined>;
    /**
     * Get metric value (generic)
     */
    getMetricValue(name: string): Promise<number | undefined>;
    /**
     * Get histogram
     */
    getHistogram(name: string): promClient.Histogram | undefined;
    /**
     * Get histogram statistics
     */
    getHistogramStats(name: string): Promise<HistogramStats>;
    /**
     * Start HTTP metrics server
     */
    startServer(port?: number): Promise<number>;
    /**
     * Stop HTTP metrics server
     */
    stopServer(): Promise<void>;
    /**
     * Check if server is running
     */
    isServerRunning(): boolean;
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Validate metric name
     */
    private validateMetricName;
}
export {};
//# sourceMappingURL=SHIMMetrics.d.ts.map