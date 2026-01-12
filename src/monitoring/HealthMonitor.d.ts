/**
 * HealthMonitor
 * Monitors system health and component status
 */
export interface MonitorConfig {
    interval?: number;
    thresholds?: {
        memory?: number;
        cpu?: number;
    };
}
export interface HealthStatus {
    overall: 'healthy' | 'degraded' | 'critical';
    components: {
        [key: string]: 'up' | 'down' | 'degraded';
    };
    metrics: {
        memory: number;
        cpu: number;
        uptime: number;
    };
}
export declare class HealthMonitor {
    private monitoring;
    private config;
    private startTime;
    constructor();
    start(config?: MonitorConfig): Promise<void>;
    getStatus(): Promise<HealthStatus>;
    stop(): Promise<void>;
}
//# sourceMappingURL=HealthMonitor.d.ts.map