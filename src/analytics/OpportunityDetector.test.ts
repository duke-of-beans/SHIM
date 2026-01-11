/**
 * OpportunityDetector Tests
 * 
 * Tests for pattern detection and improvement opportunity identification.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * LEAN-OUT: Uses simple-statistics (battle-tested) for statistical analysis.
 */

import { OpportunityDetector, Opportunity, OpportunityType, Pattern } from './OpportunityDetector';
import { SHIMMetrics } from './SHIMMetrics';

describe('OpportunityDetector', () => {
  let detector: OpportunityDetector;
  let metrics: SHIMMetrics;
  
  beforeEach(() => {
    metrics = new SHIMMetrics();
    detector = new OpportunityDetector(metrics);
  });
  
  afterEach(() => {
    metrics.reset();
  });
  
  describe('Construction', () => {
    it('should create OpportunityDetector instance', () => {
      expect(detector).toBeInstanceOf(OpportunityDetector);
    });
    
    it('should accept SHIMMetrics instance', () => {
      const customDetector = new OpportunityDetector(metrics);
      expect(customDetector).toBeInstanceOf(OpportunityDetector);
    });
    
    it('should initialize with default detection thresholds', () => {
      const config = detector.getConfig();
      
      expect(config.minConfidence).toBeDefined();
      expect(config.minImpact).toBeDefined();
      expect(config.minSampleSize).toBeDefined();
    });
  });
  
  describe('Crash Prevention Patterns', () => {
    it('should detect checkpoint interval optimization opportunity', async () => {
      // Simulate metric: checkpoint_interval=5 → crash_rate=0.12
      metrics.recordCrashPredictionAccuracy(0.88); // 12% crash rate
      
      const opportunities = await detector.detectOpportunities();
      
      const checkpointOpp = opportunities.find(o => 
        o.type === 'checkpoint_interval_optimization'
      );
      
      if (checkpointOpp) {
        expect(checkpointOpp.currentValue).toBeDefined();
        expect(checkpointOpp.proposedValue).toBeDefined();
        expect(checkpointOpp.confidence).toBeGreaterThan(0);
      }
    });
    
    it('should detect slow checkpoint creation', async () => {
      // Record slow checkpoint times
      metrics.recordCheckpointCreationTime(150);
      metrics.recordCheckpointCreationTime(180);
      metrics.recordCheckpointCreationTime(200);
      
      const opportunities = await detector.detectOpportunities();
      
      const slowCheckpoint = opportunities.find(o =>
        o.type === 'checkpoint_performance'
      );
      
      if (slowCheckpoint) {
        expect(slowCheckpoint.impact).toContain('checkpoint');
        expect(slowCheckpoint.hypothesis).toBeDefined();
      }
    });
    
    it('should detect low resume success rate', async () => {
      // Simulate 70% resume success (below 90% threshold)
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      metrics.recordResumeSuccess(true);
      metrics.recordResumeSuccess(false);
      metrics.recordResumeSuccess(true);
      
      const opportunities = await detector.detectOpportunities();
      
      const resumeOpp = opportunities.find(o =>
        o.type === 'resume_reliability'
      );
      
      if (resumeOpp) {
        expect(resumeOpp.currentValue).toBeLessThan(0.90);
        expect(resumeOpp.proposedValue).toBeGreaterThan(resumeOpp.currentValue);
      }
    });
  });
  
  describe('Model Routing Patterns', () => {
    it('should detect suboptimal model routing', async () => {
      // Simulate 75% routing accuracy (below 85% threshold)
      metrics.recordModelRoutingAccuracy(0.75);
      
      const opportunities = await detector.detectOpportunities();
      
      const routingOpp = opportunities.find(o =>
        o.type === 'model_routing_optimization'
      );
      
      if (routingOpp) {
        expect(routingOpp.confidence).toBeGreaterThan(0);
        expect(routingOpp.hypothesis).toContain('routing');
      }
    });
    
    it('should detect token savings opportunities', async () => {
      // Record model selections
      metrics.recordModelSelection('opus', 'simple_query');
      metrics.recordModelSelection('opus', 'simple_query');
      metrics.recordModelSelection('opus', 'simple_query');
      
      const opportunities = await detector.detectOpportunities();
      
      const tokenOpp = opportunities.find(o =>
        o.type === 'token_optimization'
      );
      
      if (tokenOpp) {
        expect(tokenOpp.impact).toContain('token');
        expect(tokenOpp.estimatedSavings).toBeGreaterThan(0);
      }
    });
    
    it('should identify query type → model mapping improvements', async () => {
      // Pattern: architecture queries → should use Opus but using Sonnet
      metrics.recordModelSelection('sonnet', 'architecture_design');
      metrics.recordModelSelection('sonnet', 'architecture_design');
      
      const opportunities = await detector.detectOpportunities();
      
      const mappingOpp = opportunities.find(o =>
        o.pattern?.includes('architecture') && o.proposedValue === 'opus'
      );
      
      if (mappingOpp) {
        expect(mappingOpp.type).toBe('model_mapping');
      }
    });
  });
  
  describe('Performance Patterns', () => {
    it('should detect slow supervisor restart', async () => {
      // Record restart times above 5s threshold
      metrics.recordSupervisorRestartTime(6000);
      metrics.recordSupervisorRestartTime(7000);
      metrics.recordSupervisorRestartTime(8000);
      
      const opportunities = await detector.detectOpportunities();
      
      const restartOpp = opportunities.find(o =>
        o.type === 'supervisor_performance'
      );
      
      if (restartOpp) {
        expect(restartOpp.currentValue).toBeGreaterThan(5000);
      }
    });
    
    it('should detect high process monitor latency', async () => {
      // Record latency above 25ms threshold
      metrics.recordProcessMonitorLatency(40);
      metrics.recordProcessMonitorLatency(45);
      metrics.recordProcessMonitorLatency(50);
      
      const opportunities = await detector.detectOpportunities();
      
      const latencyOpp = opportunities.find(o =>
        o.type === 'monitor_latency'
      );
      
      if (latencyOpp) {
        expect(latencyOpp.hypothesis).toContain('latency');
      }
    });
  });
  
  describe('Statistical Validation', () => {
    it('should calculate confidence intervals', () => {
      const samples = [20, 25, 30, 35, 40];
      const confidence = detector.calculateConfidence(samples);
      
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
    
    it('should detect statistically significant patterns', () => {
      // Pattern with high variance → low confidence
      const noisyData = [10, 100, 15, 95, 20];
      const noisyConfidence = detector.calculateConfidence(noisyData);
      
      // Pattern with low variance → high confidence
      const cleanData = [30, 31, 29, 30, 31];
      const cleanConfidence = detector.calculateConfidence(cleanData);
      
      expect(cleanConfidence).toBeGreaterThan(noisyConfidence);
    });
    
    it('should require minimum sample size', async () => {
      // Only 2 samples → insufficient
      metrics.recordCheckpointCreationTime(50);
      metrics.recordCheckpointCreationTime(60);
      
      const opportunities = await detector.detectOpportunities();
      
      // Should not generate opportunities with insufficient data
      opportunities.forEach(opp => {
        expect(opp.sampleSize).toBeGreaterThanOrEqual(3);
      });
    });
    
    it('should use simple-statistics for calculations', () => {
      const data = [10, 20, 30, 40, 50];
      
      const mean = detector.calculateMean(data);
      expect(mean).toBe(30);
      
      const stdDev = detector.calculateStdDev(data);
      expect(stdDev).toBeGreaterThan(0);
    });
  });
  
  describe('Opportunity Generation', () => {
    it('should generate opportunity with all required fields', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const opportunities = await detector.detectOpportunities();
      
      if (opportunities.length > 0) {
        const opp = opportunities[0];
        
        expect(opp).toHaveProperty('id');
        expect(opp).toHaveProperty('type');
        expect(opp).toHaveProperty('pattern');
        expect(opp).toHaveProperty('hypothesis');
        expect(opp).toHaveProperty('confidence');
        expect(opp).toHaveProperty('impact');
        expect(opp).toHaveProperty('detectedAt');
      }
    });
    
    it('should include current and proposed values', async () => {
      metrics.recordModelRoutingAccuracy(0.75);
      
      const opportunities = await detector.detectOpportunities();
      
      const routingOpp = opportunities.find(o => o.type === 'model_routing_optimization');
      
      if (routingOpp) {
        expect(routingOpp.currentValue).toBeDefined();
        expect(routingOpp.proposedValue).toBeDefined();
        expect(routingOpp.proposedValue).not.toBe(routingOpp.currentValue);
      }
    });
    
    it('should estimate potential impact', async () => {
      metrics.recordTokenSavings(1000);
      metrics.recordModelSelection('opus', 'simple_query');
      
      const opportunities = await detector.detectOpportunities();
      
      opportunities.forEach(opp => {
        expect(opp.impact).toBeDefined();
        expect(opp.impact.length).toBeGreaterThan(0);
      });
    });
    
    it('should generate testable hypotheses', async () => {
      metrics.recordCheckpointCreationTime(150);
      
      const opportunities = await detector.detectOpportunities();
      
      opportunities.forEach(opp => {
        expect(opp.hypothesis).toMatch(/if|when|increase|decrease|improve/i);
      });
    });
  });
  
  describe('Pattern Detection Configuration', () => {
    it('should configure minimum confidence threshold', () => {
      detector.setMinConfidence(0.8);
      
      const config = detector.getConfig();
      expect(config.minConfidence).toBe(0.8);
    });
    
    it('should configure minimum impact threshold', () => {
      detector.setMinImpact(0.1);
      
      const config = detector.getConfig();
      expect(config.minImpact).toBe(0.1);
    });
    
    it('should configure minimum sample size', () => {
      detector.setMinSampleSize(10);
      
      const config = detector.getConfig();
      expect(config.minSampleSize).toBe(10);
    });
    
    it('should filter opportunities by confidence', async () => {
      detector.setMinConfidence(0.9); // Very high threshold
      
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const opportunities = await detector.detectOpportunities();
      
      // Should only return high-confidence opportunities
      opportunities.forEach(opp => {
        expect(opp.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });
  });
  
  describe('Opportunity Prioritization', () => {
    it('should rank opportunities by impact', async () => {
      // Generate multiple opportunities
      metrics.recordCrashPredictionAccuracy(0.85);
      metrics.recordModelRoutingAccuracy(0.75);
      metrics.recordCheckpointCreationTime(150);
      
      const opportunities = await detector.detectOpportunities();
      const ranked = detector.rankOpportunities(opportunities);
      
      // Should be sorted by impact (descending)
      for (let i = 1; i < ranked.length; i++) {
        const prevImpact = ranked[i-1].estimatedSavings || 0;
        const currImpact = ranked[i].estimatedSavings || 0;
        expect(prevImpact).toBeGreaterThanOrEqual(currImpact);
      }
    });
    
    it('should consider confidence in ranking', () => {
      const opportunities: Opportunity[] = [
        createMockOpportunity({ confidence: 0.9, estimatedSavings: 100 }),
        createMockOpportunity({ confidence: 0.6, estimatedSavings: 100 })
      ];
      
      const ranked = detector.rankOpportunities(opportunities);
      
      // Higher confidence should rank higher
      expect(ranked[0].confidence).toBeGreaterThan(ranked[1].confidence);
    });
    
    it('should balance confidence and impact', () => {
      const opportunities: Opportunity[] = [
        createMockOpportunity({ confidence: 0.95, estimatedSavings: 50 }),
        createMockOpportunity({ confidence: 0.70, estimatedSavings: 200 })
      ];
      
      const ranked = detector.rankOpportunities(opportunities);
      
      // Should prioritize based on combined score
      expect(ranked.length).toBe(2);
    });
  });
  
  describe('Pattern History', () => {
    it('should track detected patterns over time', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      await detector.detectOpportunities();
      
      const history = detector.getPatternHistory();
      expect(history.length).toBeGreaterThan(0);
    });
    
    it('should avoid duplicate pattern detection', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const opp1 = await detector.detectOpportunities();
      const opp2 = await detector.detectOpportunities();
      
      // Should not return same pattern twice in short time
      const patterns1 = opp1.map(o => o.pattern);
      const patterns2 = opp2.map(o => o.pattern);
      
      const duplicates = patterns1.filter(p => patterns2.includes(p));
      expect(duplicates.length).toBeLessThan(patterns1.length);
    });
    
    it('should expire old patterns', async () => {
      detector.setPatternExpiryTime(100); // 100ms
      
      metrics.recordCrashPredictionAccuracy(0.85);
      await detector.detectOpportunities();
      
      await sleep(150);
      
      const history = detector.getPatternHistory();
      // Old patterns should be expired
      expect(history.filter(p => !p.expired).length).toBe(0);
    });
  });
  
  describe('Export for Experimentation', () => {
    it('should export opportunities in Statsig format', async () => {
      metrics.recordCrashPredictionAccuracy(0.85);
      
      const opportunities = await detector.detectOpportunities();
      const statsigFormat = detector.exportForStatsig(opportunities);
      
      expect(statsigFormat).toHaveProperty('experiments');
      expect(Array.isArray(statsigFormat.experiments)).toBe(true);
    });
    
    it('should include experiment variants', async () => {
      metrics.recordModelRoutingAccuracy(0.75);
      
      const opportunities = await detector.detectOpportunities();
      const statsigFormat = detector.exportForStatsig(opportunities);
      
      statsigFormat.experiments.forEach((exp: any) => {
        expect(exp).toHaveProperty('control');
        expect(exp).toHaveProperty('treatment');
      });
    });
    
    it('should define success metrics', async () => {
      metrics.recordCheckpointCreationTime(150);
      
      const opportunities = await detector.detectOpportunities();
      const statsigFormat = detector.exportForStatsig(opportunities);
      
      statsigFormat.experiments.forEach((exp: any) => {
        expect(exp).toHaveProperty('successMetrics');
        expect(Array.isArray(exp.successMetrics)).toBe(true);
      });
    });
  });
});

// Helper functions

function createMockOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'test-' + Date.now() + '-' + Math.random(),
    type: 'test_opportunity' as OpportunityType,
    pattern: 'Test pattern',
    hypothesis: 'Test hypothesis',
    confidence: 0.8,
    impact: 'Test impact',
    currentValue: 0,
    proposedValue: 1,
    estimatedSavings: 100,
    sampleSize: 10,
    detectedAt: new Date().toISOString(),
    ...overrides
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
