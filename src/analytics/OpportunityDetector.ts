/**
 * OpportunityDetector - Pattern detection and improvement opportunity identification
 * 
 * LEAN-OUT: Uses simple-statistics (battle-tested) for statistical analysis.
 * 
 * Responsibilities:
 * - Detect patterns from SHIMMetrics
 * - Generate improvement hypotheses
 * - Calculate confidence intervals
 * - Rank opportunities by impact
 * - Export for Statsig experimentation
 * 
 * Pattern Examples:
 * - checkpoint_interval=5 → crash_rate=0.12 → PROPOSE: interval=3
 * - routing_accuracy=0.75 → PROPOSE: route "architecture" to Opus
 * - checkpoint_time=150ms → PROPOSE: async compression
 */

import { SHIMMetrics } from './SHIMMetrics';
import * as stats from 'simple-statistics';

export type OpportunityType =
  | 'checkpoint_interval_optimization'
  | 'checkpoint_performance'
  | 'resume_reliability'
  | 'model_routing_optimization'
  | 'token_optimization'
  | 'model_mapping'
  | 'supervisor_performance'
  | 'monitor_latency'
  | 'test_opportunity';

export interface Opportunity {
  id: string;
  type: OpportunityType;
  pattern: string;                       // Detected pattern description
  hypothesis: string;                    // Improvement hypothesis
  confidence: number;                    // Statistical confidence (0-1)
  impact: string;                        // Impact description
  currentValue: number | string;         // Current metric value
  proposedValue: number | string;        // Proposed new value
  estimatedSavings?: number;             // Estimated improvement
  sampleSize: number;                    // Number of samples
  detectedAt: string;                    // ISO timestamp
}

export interface Pattern {
  pattern: string;
  firstDetected: string;
  lastDetected: string;
  count: number;
  expired: boolean;
}

interface DetectorConfig {
  minConfidence: number;                 // Minimum confidence threshold
  minImpact: number;                     // Minimum impact threshold
  minSampleSize: number;                 // Minimum samples required
  patternExpiryTime: number;             // Pattern expiry (milliseconds)
}

interface StatsigExperiment {
  name: string;
  control: Record<string, unknown>;
  treatment: Record<string, unknown>;
  successMetrics: string[];
  hypothesis: string;
}

interface StatsigExport {
  experiments: StatsigExperiment[];
}

export class OpportunityDetector {
  private metrics: SHIMMetrics;
  private config: DetectorConfig = {
    minConfidence: 0.7,
    minImpact: 0.05,
    minSampleSize: 3,
    patternExpiryTime: 3600000  // 1 hour
  };
  
  private patternHistory: Pattern[] = [];
  
  constructor(metrics: SHIMMetrics) {
    this.metrics = metrics;
  }
  
  /**
   * Get detector configuration
   */
  getConfig(): DetectorConfig {
    return { ...this.config };
  }
  
  /**
   * Set minimum confidence threshold
   */
  setMinConfidence(value: number): void {
    this.config.minConfidence = value;
  }
  
  /**
   * Set minimum impact threshold
   */
  setMinImpact(value: number): void {
    this.config.minImpact = value;
  }
  
  /**
   * Set minimum sample size
   */
  setMinSampleSize(value: number): void {
    this.config.minSampleSize = value;
  }
  
  /**
   * Set pattern expiry time
   */
  setPatternExpiryTime(milliseconds: number): void {
    this.config.patternExpiryTime = milliseconds;
  }
  
  /**
   * Detect improvement opportunities from current metrics
   */
  async detectOpportunities(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Clean up expired patterns
    this.expireOldPatterns();
    
    // Detect crash prevention opportunities
    opportunities.push(...await this.detectCrashPreventionOpportunities());
    
    // Detect model routing opportunities
    opportunities.push(...await this.detectModelRoutingOpportunities());
    
    // Detect performance opportunities
    opportunities.push(...await this.detectPerformanceOpportunities());
    
    // Filter by confidence and impact
    const filtered = opportunities.filter(opp =>
      opp.confidence >= this.config.minConfidence &&
      opp.sampleSize >= this.config.minSampleSize
    );
    
    // Track patterns
    filtered.forEach(opp => this.trackPattern(opp.pattern));
    
    return filtered;
  }
  
  /**
   * Detect crash prevention opportunities
   */
  private async detectCrashPreventionOpportunities(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Check crash prediction accuracy
    const crashAccuracy = this.metrics.getMetricValue('shim_crash_prediction_accuracy');
    if (crashAccuracy !== undefined && crashAccuracy < 0.90) {
      const crashRate = 1 - crashAccuracy;
      
      if (crashRate > 0.10) {
        opportunities.push({
          id: this.generateId(),
          type: 'checkpoint_interval_optimization',
          pattern: `High crash rate detected: ${(crashRate * 100).toFixed(1)}%`,
          hypothesis: 'Decreasing checkpoint interval may reduce crash risk',
          confidence: 0.85,
          impact: 'Reduce crash rate by 30-50%',
          currentValue: 5,  // Assume current interval
          proposedValue: 3,
          estimatedSavings: crashRate * 0.4 * 1000,  // Savings in prevented crashes
          sampleSize: 10,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    // Check checkpoint creation time
    const checkpointStats = this.metrics.getHistogramStats('shim_checkpoint_creation_time');
    if (checkpointStats.count >= this.config.minSampleSize) {
      const avgTime = checkpointStats.sum / checkpointStats.count;
      
      if (avgTime > 100) {  // 100ms threshold
        opportunities.push({
          id: this.generateId(),
          type: 'checkpoint_performance',
          pattern: `Slow checkpoint creation: ${avgTime.toFixed(1)}ms average`,
          hypothesis: 'Async compression or incremental checkpointing could improve performance',
          confidence: 0.80,
          impact: 'Reduce checkpoint time by 40-60%',
          currentValue: avgTime,
          proposedValue: avgTime * 0.5,
          estimatedSavings: (avgTime - avgTime * 0.5) * checkpointStats.count,
          sampleSize: checkpointStats.count,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    // Check resume success rate
    const resumeRate = this.metrics.getMetricValue('shim_resume_success_rate');
    if (resumeRate !== undefined && resumeRate < 0.90) {
      opportunities.push({
        id: this.generateId(),
        type: 'resume_reliability',
        pattern: `Low resume success rate: ${(resumeRate * 100).toFixed(1)}%`,
        hypothesis: 'Additional state capture or validation could improve resume reliability',
        confidence: 0.75,
        impact: 'Increase resume success rate to 95%+',
        currentValue: resumeRate,
        proposedValue: 0.95,
        estimatedSavings: (0.95 - resumeRate) * 100,
        sampleSize: 5,
        detectedAt: new Date().toISOString()
      });
    }
    
    return opportunities;
  }
  
  /**
   * Detect model routing opportunities
   */
  private async detectModelRoutingOpportunities(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Check model routing accuracy
    const routingAccuracy = this.metrics.getMetricValue('shim_model_routing_accuracy');
    if (routingAccuracy !== undefined && routingAccuracy < 0.85) {
      opportunities.push({
        id: this.generateId(),
        type: 'model_routing_optimization',
        pattern: `Suboptimal model routing: ${(routingAccuracy * 100).toFixed(1)}% accuracy`,
        hypothesis: 'Query type classification improvements could increase routing accuracy',
        confidence: 0.80,
        impact: 'Improve routing accuracy to 90%+',
        currentValue: routingAccuracy,
        proposedValue: 0.90,
        estimatedSavings: (0.90 - routingAccuracy) * 1000,  // Token savings estimate
        sampleSize: 8,
        detectedAt: new Date().toISOString()
      });
    }
    
    // Check for token optimization opportunities
    const selectionCounts = this.metrics.getModelSelectionCounts();
    const totalSelections = selectionCounts.haiku + selectionCounts.sonnet + selectionCounts.opus;
    
    if (totalSelections >= this.config.minSampleSize) {
      // Check if Opus is overused for simple queries
      const opusRatio = selectionCounts.opus / totalSelections;
      
      if (opusRatio > 0.3) {  // More than 30% Opus usage
        opportunities.push({
          id: this.generateId(),
          type: 'token_optimization',
          pattern: `High Opus usage: ${(opusRatio * 100).toFixed(1)}% of queries`,
          hypothesis: 'Route simple queries to Haiku/Sonnet to reduce token costs',
          confidence: 0.85,
          impact: 'Reduce token costs by 40-60%',
          currentValue: opusRatio,
          proposedValue: 0.15,
          estimatedSavings: (opusRatio - 0.15) * totalSelections * 1000,  // Rough token estimate
          sampleSize: totalSelections,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Detect performance opportunities
   */
  private async detectPerformanceOpportunities(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Check supervisor restart time
    const restartStats = this.metrics.getHistogramStats('shim_supervisor_restart_time');
    if (restartStats.count >= this.config.minSampleSize) {
      const avgRestart = restartStats.sum / restartStats.count;
      
      if (avgRestart > 5000) {  // 5 second threshold
        opportunities.push({
          id: this.generateId(),
          type: 'supervisor_performance',
          pattern: `Slow supervisor restart: ${(avgRestart / 1000).toFixed(1)}s average`,
          hypothesis: 'Parallel initialization or cached state could reduce restart time',
          confidence: 0.75,
          impact: 'Reduce restart time by 30-50%',
          currentValue: avgRestart,
          proposedValue: avgRestart * 0.6,
          estimatedSavings: (avgRestart - avgRestart * 0.6) * restartStats.count,
          sampleSize: restartStats.count,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    // Check process monitor latency
    const latencyStats = this.metrics.getHistogramStats('shim_process_monitor_latency');
    if (latencyStats.count >= this.config.minSampleSize) {
      const avgLatency = latencyStats.sum / latencyStats.count;
      
      if (avgLatency > 25) {  // 25ms threshold
        opportunities.push({
          id: this.generateId(),
          type: 'monitor_latency',
          pattern: `High monitor latency: ${avgLatency.toFixed(1)}ms average`,
          hypothesis: 'Optimized process polling or caching could reduce latency',
          confidence: 0.70,
          impact: 'Reduce latency by 40-60%',
          currentValue: avgLatency,
          proposedValue: avgLatency * 0.5,
          estimatedSavings: (avgLatency - avgLatency * 0.5) * latencyStats.count,
          sampleSize: latencyStats.count,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Calculate statistical confidence for samples
   */
  calculateConfidence(samples: number[]): number {
    if (samples.length < 2) {
      return 0;
    }
    
    const mean = stats.mean(samples);
    const stdDev = stats.standardDeviation(samples);
    
    // Coefficient of variation (inverse for confidence)
    // Lower variance = higher confidence
    const cv = stdDev / mean;
    const confidence = Math.max(0, Math.min(1, 1 - cv));
    
    return confidence;
  }
  
  /**
   * Calculate mean
   */
  calculateMean(samples: number[]): number {
    return stats.mean(samples);
  }
  
  /**
   * Calculate standard deviation
   */
  calculateStdDev(samples: number[]): number {
    return stats.standardDeviation(samples);
  }
  
  /**
   * Rank opportunities by priority
   */
  rankOpportunities(opportunities: Opportunity[]): Opportunity[] {
    return opportunities.sort((a, b) => {
      // Combined score: confidence * impact
      const scoreA = a.confidence * (a.estimatedSavings || 0);
      const scoreB = b.confidence * (b.estimatedSavings || 0);
      
      return scoreB - scoreA;  // Descending
    });
  }
  
  /**
   * Get pattern history
   */
  getPatternHistory(): Pattern[] {
    return [...this.patternHistory];
  }
  
  /**
   * Track detected pattern
   */
  private trackPattern(patternDescription: string): void {
    const existing = this.patternHistory.find(p => p.pattern === patternDescription);
    
    if (existing) {
      existing.lastDetected = new Date().toISOString();
      existing.count++;
    } else {
      this.patternHistory.push({
        pattern: patternDescription,
        firstDetected: new Date().toISOString(),
        lastDetected: new Date().toISOString(),
        count: 1,
        expired: false
      });
    }
  }
  
  /**
   * Expire old patterns
   */
  private expireOldPatterns(): void {
    const now = Date.now();
    
    this.patternHistory.forEach(pattern => {
      const lastDetectedTime = new Date(pattern.lastDetected).getTime();
      const age = now - lastDetectedTime;
      
      if (age > this.config.patternExpiryTime) {
        pattern.expired = true;
      }
    });
  }
  
  /**
   * Export opportunities in Statsig experiment format
   */
  exportForStatsig(opportunities: Opportunity[]): StatsigExport {
    const experiments: StatsigExperiment[] = opportunities.map(opp => ({
      name: `${opp.type}_${Date.now()}`,
      control: {
        value: opp.currentValue,
        description: 'Current configuration'
      },
      treatment: {
        value: opp.proposedValue,
        description: opp.hypothesis
      },
      successMetrics: this.getSuccessMetrics(opp.type),
      hypothesis: opp.hypothesis
    }));
    
    return { experiments };
  }
  
  /**
   * Get success metrics for opportunity type
   */
  private getSuccessMetrics(type: OpportunityType): string[] {
    const metricMap: Record<OpportunityType, string[]> = {
      'checkpoint_interval_optimization': ['crash_rate', 'crash_prediction_accuracy'],
      'checkpoint_performance': ['checkpoint_creation_time'],
      'resume_reliability': ['resume_success_rate'],
      'model_routing_optimization': ['model_routing_accuracy', 'token_savings'],
      'token_optimization': ['token_savings_total', 'response_quality'],
      'model_mapping': ['model_routing_accuracy'],
      'supervisor_performance': ['supervisor_restart_time'],
      'monitor_latency': ['process_monitor_latency'],
      'test_opportunity': ['test_metric']
    };
    
    return metricMap[type] || [];
  }
  
  /**
   * Generate unique opportunity ID
   */
  private generateId(): string {
    return `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
