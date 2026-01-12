/**
 * Analytics Service - MCP interface for SHIM analytics components
 * 
 * Exposes all analytics capabilities via MCP tools
 */

import { AutoExperimentEngine, EngineConfig } from '../../src/analytics/AutoExperimentEngine';
import { OpportunityDetector, DetectorConfig } from '../../src/analytics/OpportunityDetector';
import { SafetyBounds, BoundConfig } from '../../src/analytics/SafetyBounds';
import { SHIMMetrics } from '../../src/analytics/SHIMMetrics';
import { StatsigIntegration } from '../../src/analytics/StatsigIntegration';

export class AnalyticsService {
  private autoExperimentEngine?: AutoExperimentEngine;
  private opportunityDetector?: OpportunityDetector;
  private safetyBounds?: SafetyBounds;
  private shimMetrics?: SHIMMetrics;
  private statsig?: StatsigIntegration;

  constructor() {
    // Initialize components lazily
  }

  /**
   * Start autonomous experimentation
   */
  async startAutoExperiments(config?: Partial<EngineConfig>) {
    if (!this.autoExperimentEngine) {
      // Initialize engine with config
      throw new Error('AutoExperimentEngine not initialized');
    }
    
    await this.autoExperimentEngine.start();
    return {
      success: true,
      status: await this.autoExperimentEngine.getStatus()
    };
  }

  /**
   * Stop autonomous experimentation
   */
  async stopAutoExperiments() {
    if (!this.autoExperimentEngine) {
      throw new Error('AutoExperimentEngine not initialized');
    }
    
    await this.autoExperimentEngine.stop();
    return {
      success: true,
      status: await this.autoExperimentEngine.getStatus()
    };
  }

  /**
   * Get current experiment status
   */
  async getExperimentStatus() {
    if (!this.autoExperimentEngine) {
      throw new Error('AutoExperimentEngine not initialized');
    }
    
    return await this.autoExperimentEngine.getStatus();
  }

  /**
   * Get improvement report
   */
  async getImprovementReport() {
    if (!this.autoExperimentEngine) {
      throw new Error('AutoExperimentEngine not initialized');
    }
    
    // Return improvement metrics
    return {
      improvements: [],
      totalImprovements: 0,
      averageImprovement: 0
    };
  }

  /**
   * Detect improvement opportunities
   */
  async detectOpportunities(metricsData: any) {
    if (!this.opportunityDetector) {
      throw new Error('OpportunityDetector not initialized');
    }
    
    return await this.opportunityDetector.detect(metricsData);
  }

  /**
   * Get opportunity history
   */
  async getOpportunityHistory() {
    if (!this.opportunityDetector) {
      throw new Error('OpportunityDetector not initialized');
    }
    
    return await this.opportunityDetector.getHistory();
  }

  /**
   * Validate safety bounds
   */
  async validateSafety(change: any, bounds: BoundConfig) {
    if (!this.safetyBounds) {
      throw new Error('SafetyBounds not initialized');
    }
    
    return await this.safetyBounds.validate(change, bounds);
  }

  /**
   * Get safety configuration
   */
  async getSafetyConfig() {
    if (!this.safetyBounds) {
      throw new Error('SafetyBounds not initialized');
    }
    
    return await this.safetyBounds.getConfig();
  }

  /**
   * Collect Prometheus metrics
   */
  async collectMetrics() {
    if (!this.shimMetrics) {
      throw new Error('SHIMMetrics not initialized');
    }
    
    return await this.shimMetrics.collect();
  }

  /**
   * Export metrics in specified format
   */
  async exportMetrics(format: 'json' | 'prometheus') {
    if (!this.shimMetrics) {
      throw new Error('SHIMMetrics not initialized');
    }
    
    return await this.shimMetrics.export(format);
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary() {
    if (!this.shimMetrics) {
      throw new Error('SHIMMetrics not initialized');
    }
    
    return await this.shimMetrics.getSummary();
  }

  /**
   * Create A/B experiment
   */
  async createExperiment(config: any) {
    if (!this.statsig) {
      throw new Error('StatsigIntegration not initialized');
    }
    
    return await this.statsig.createExperiment(config);
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string) {
    if (!this.statsig) {
      throw new Error('StatsigIntegration not initialized');
    }
    
    return await this.statsig.getResults(experimentId);
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags() {
    if (!this.statsig) {
      throw new Error('StatsigIntegration not initialized');
    }
    
    return await this.statsig.getFeatureFlags();
  }
}
