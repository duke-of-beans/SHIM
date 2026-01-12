/**
 * EvolutionMonitor
 *
 * Real-time monitoring of self-evolution metrics with reporting.
 * Part of Priority 4: Monitoring Dashboard
 */
export interface EvolutionMetrics {
    timestamp: Date;
    totalImprovements: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageComplexityReduction: number;
    averageMaintainabilityIncrease: number;
    totalLinesRefactored: number;
}
export interface DeploymentEvent {
    id: string;
    timestamp: Date;
    type: 'success' | 'failure' | 'rollback';
    impactScore: number;
    duration: number;
}
export interface DashboardSnapshot {
    current: EvolutionMetrics;
    trend: {
        improvementRate: number;
        successRate: number;
        velocity: number;
    };
    recentEvents: DeploymentEvent[];
    topPatterns: Array<{
        pattern: string;
        frequency: number;
        successRate: number;
    }>;
}
export declare class EvolutionMonitor {
    private metrics;
    private events;
    private startTime;
    constructor();
    recordMetrics(metrics: EvolutionMetrics): void;
    recordDeployment(event: DeploymentEvent): void;
    getCurrentSnapshot(): DashboardSnapshot;
    getMetricsHistory(hours?: number): EvolutionMetrics[];
    getSuccessRate(hours?: number): number;
    getVelocity(): number;
    exportReport(): string;
    private getCurrentMetrics;
    private calculateTrend;
    private getRecentEvents;
    private getTopPatterns;
}
//# sourceMappingURL=EvolutionMonitor.d.ts.map