/**
 * Analytics Service - MCP interface for SHIM analytics components
 * 
 * Exposes all analytics capabilities via MCP tools
 */

import { AutoExperimentEngine, EngineConfig } from '../../src/analytics/AutoExperimentEngine.js';
import { OpportunityDetector, DetectorConfig } from '../../src/analytics/OpportunityDetector.js';
import { SafetyBounds, BoundConfig } from '../../src/analytics/SafetyBounds.js';
import { SHIMMetrics } from '../../src/analytics/SHIMMetrics.js';
import { StatsigIntegration } from '../../src/analytics/StatsigIntegration.js';

export class AnalyticsService {
  private autoExperimentEngine?: AutoExperimentEngine;
  private opportunityDetector?: OpportunityDetector;
  private safetyBounds?: SafetyBounds;
  private shimMetrics?: SHIMMetrics;
  private statsig?: StatsigIntegration;

  constructor() {
    // Components initialized lazily on first use
  }

  /**
   * Start autonomous experimentation
   */
  async startAutoExperiments(config?: Partial<EngineConfig>) {
    if (!this.autoExperimentEngine) {
      this.autoExperimentEngine = new AutoExperimentEngine(
        config?.safetyBounds,
        config?.statsig,
        config?.opportunityDetector
      );
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
      return {
        success: false,
        error: 'AutoExperimentEngine not running'
      };
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
      return {
        running: false,
        experiments: [],
        totalExperiments: 0
      };
    }
    
    return await this.autoExperimentEngine.getStatus();
  }

  /**
   * Get improvement report
   */
  async getImprovementReport() {
    if (!this.autoExperimentEngine) {
      return {
        improvements: [],
        totalImprovements: 0,
        averageImprovement: 0,
        successRate: 0
      };
    }
    
    const status = await this.autoExperimentEngine.getStatus();
    const improvements = status.experiments
      ?.filter((exp: any) => exp.status === 'deployed' && exp.improvement > 0)
      ?.map((exp: any) => ({
        experimentId: exp.id,
        improvement: exp.improvement,
        deployedAt: exp.deployedAt
      })) || [];
    
    return {
      improvements,
      totalImprovements: improvements.length,
      averageImprovement: improvements.length > 0
        ? improvements.reduce((sum: number, imp: any) => sum + imp.improvement, 0) / improvements.length
        : 0,
      successRate: status.totalExperiments > 0
        ? improvements.length / status.totalExperiments
        : 0
    };
  }

  /**
   * Detect improvement opportunities
   */
  async detectOpportunities(metricsData: any) {
    if (!this.opportunityDetector) {
      this.opportunityDetector = new OpportunityDetector({
        minImprovement: 0.05,
        minConfidence: 0.7
      });
    }
    
    return await this.opportunityDetector.detect(metricsData);
  }

  /**
   * Get opportunity history
   */
  async getOpportunityHistory() {
    if (!this.opportunityDetector) {
      return {
        opportunities: [],
        totalDetected: 0
      };
    }
    
    return await this.opportunityDetector.getHistory();
  }

  /**
   * Validate safety bounds
   */
  async validateSafety(change: any, bounds?: BoundConfig) {
    if (!this.safetyBounds) {
      this.safetyBounds = new SafetyBounds({
        maxCostIncrease: 0.2,
        maxPerformanceDecrease: 0.1,
        maxQualityDecrease: 0.05
      });
    }
    
    return await this.safetyBounds.validate(change, bounds);
  }

  /**
   * Get safety configuration
   */
  async getSafetyConfig() {
    if (!this.safetyBounds) {
      this.safetyBounds = new SafetyBounds({
        maxCostIncrease: 0.2,
        maxPerformanceDecrease: 0.1,
        maxQualityDecrease: 0.05
      });
    }
    
    return await this.safetyBounds.getConfig();
  }

  /**
   * Collect Prometheus metrics
   */
  async collectMetrics() {
    if (!this.shimMetrics) {
      this.shimMetrics = new SHIMMetrics();
    }
    
    return await this.shimMetrics.collect();
  }

  /**
   * Export metrics in specified format
   */
  async exportMetrics(format: 'json' | 'prometheus') {
    if (!this.shimMetrics) {
      this.shimMetrics = new SHIMMetrics();
    }
    
    return await this.shimMetrics.export(format);
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary() {
    if (!this.shimMetrics) {
      this.shimMetrics = new SHIMMetrics();
    }
    
    return await this.shimMetrics.getSummary();
  }

  /**
   * Create A/B experiment
   */
  async createExperiment(config: any) {
    if (!this.statsig) {
      // Initialize Statsig with API key from env
      const apiKey = process.env.STATSIG_API_KEY;
      if (!apiKey) {
        throw new Error('STATSIG_API_KEY environment variable not set');
      }
      this.statsig = new StatsigIntegration(apiKey);
    }
    
    return await this.statsig.createExperiment(config);
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string) {
    if (!this.statsig) {
      throw new Error('StatsigIntegration not initialized - call createExperiment first');
    }
    
    return await this.statsig.getResults(experimentId);
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags() {
    if (!this.statsig) {
      // Initialize Statsig with API key from env
      const apiKey = process.env.STATSIG_API_KEY;
      if (!apiKey) {
        throw new Error('STATSIG_API_KEY environment variable not set');
      }
      this.statsig = new StatsigIntegration(apiKey);
    }
    
    return await this.statsig.getFeatureFlags();
  }
}
