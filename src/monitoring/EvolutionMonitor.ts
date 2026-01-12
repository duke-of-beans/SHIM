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

export class EvolutionMonitor {
  private metrics: EvolutionMetrics[];
  private events: DeploymentEvent[];
  private startTime: Date;

  constructor() {
    this.metrics = [];
    this.events = [];
    this.startTime = new Date();
  }

  recordMetrics(metrics: EvolutionMetrics): void {
    this.metrics.push(metrics);
  }

  recordDeployment(event: DeploymentEvent): void {
    this.events.push(event);
  }

  getCurrentSnapshot(): DashboardSnapshot {
    const current = this.getCurrentMetrics();
    const trend = this.calculateTrend();
    const recentEvents = this.getRecentEvents(10);
    const topPatterns = this.getTopPatterns();

    return {
      current,
      trend,
      recentEvents,
      topPatterns,
    };
  }

  getMetricsHistory(hours: number = 24): EvolutionMetrics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter((m) => m.timestamp.getTime() > cutoff);
  }

  getSuccessRate(hours: number = 24): number {
    const recent = this.getRecentEvents(1000, hours);
    if (recent.length === 0) return 0;

    const successes = recent.filter((e) => e.type === 'success').length;
    return successes / recent.length;
  }

  getVelocity(): number {
    const hoursRunning = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    if (hoursRunning === 0) return 0;

    const totalImprovements = this.metrics.reduce(
      (sum, m) => sum + m.totalImprovements,
      0
    );

    return totalImprovements / hoursRunning;
  }

  exportReport(): string {
    const snapshot = this.getCurrentSnapshot();

    const report = `
# Self-Evolution Report
Generated: ${new Date().toISOString()}

## Current Status
- Total Improvements: ${snapshot.current.totalImprovements}
- Successful Deployments: ${snapshot.current.successfulDeployments}
- Failed Deployments: ${snapshot.current.failedDeployments}
- Success Rate: ${(snapshot.trend.successRate * 100).toFixed(1)}%

## Performance
- Average Complexity Reduction: ${snapshot.current.averageComplexityReduction.toFixed(2)}
- Average Maintainability Increase: ${snapshot.current.averageMaintainabilityIncrease.toFixed(2)}
- Total Lines Refactored: ${snapshot.current.totalLinesRefactored}

## Trends
- Improvement Rate: ${snapshot.trend.improvementRate.toFixed(2)}/day
- Velocity: ${snapshot.trend.velocity.toFixed(2)}/hour

## Top Patterns
${snapshot.topPatterns.map((p, i) => `${i + 1}. ${p.pattern} (${p.frequency}x, ${(p.successRate * 100).toFixed(1)}% success)`).join('\n')}

## Recent Events
${snapshot.recentEvents.slice(0, 5).map((e) => `- ${e.type.toUpperCase()}: ${e.id} (${e.duration}ms)`).join('\n')}
    `.trim();

    return report;
  }

  private getCurrentMetrics(): EvolutionMetrics {
    if (this.metrics.length === 0) {
      return {
        timestamp: new Date(),
        totalImprovements: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        averageComplexityReduction: 0,
        averageMaintainabilityIncrease: 0,
        totalLinesRefactored: 0,
      };
    }

    return this.metrics[this.metrics.length - 1];
  }

  private calculateTrend(): {
    improvementRate: number;
    successRate: number;
    velocity: number;
  } {
    const history = this.getMetricsHistory(24);

    const improvementRate =
      history.length > 1
        ? (history[history.length - 1].totalImprovements - history[0].totalImprovements) /
          (history.length / 24)
        : 0;

    return {
      improvementRate,
      successRate: this.getSuccessRate(24),
      velocity: this.getVelocity(),
    };
  }

  private getRecentEvents(limit: number = 10, hours?: number): DeploymentEvent[] {
    let events = this.events;

    if (hours) {
      const cutoff = Date.now() - hours * 60 * 60 * 1000;
      events = events.filter((e) => e.timestamp.getTime() > cutoff);
    }

    return events.slice(-limit);
  }

  private getTopPatterns(): Array<{
    pattern: string;
    frequency: number;
    successRate: number;
  }> {
    const patternMap = new Map<string, { successes: number; total: number }>();

    this.events.forEach((event) => {
      const pattern = event.id.split('-')[0];
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, { successes: 0, total: 0 });
      }

      const stats = patternMap.get(pattern)!;
      stats.total++;
      if (event.type === 'success') {
        stats.successes++;
      }
    });

    const patterns = Array.from(patternMap.entries()).map(([pattern, stats]) => ({
      pattern,
      frequency: stats.total,
      successRate: stats.successes / stats.total,
    }));

    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }
}
