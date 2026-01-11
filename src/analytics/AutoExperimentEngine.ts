/**
 * AutoExperimentEngine - Autonomous experiment orchestration
 * 
 * The "conductor" that makes SHIM self-improving by orchestrating
 * the complete Kaizen loop automatically.
 * 
 * Responsibilities:
 * - Continuous metrics monitoring
 * - Automatic opportunity detection
 * - Experiment creation from patterns
 * - Progress monitoring
 * - Safety validation
 * - Auto-deployment of winners
 * - Rollback on violations
 * - Improvement reporting
 * 
 * Kaizen Loop:
 * 1. Monitor metrics continuously
 * 2. Detect improvement opportunities
 * 3. Create A/B experiments
 * 4. Validate safety bounds
 * 5. Monitor experiment progress
 * 6. Deploy winners automatically
 * 7. Rollback on regressions
 * 8. Report improvements
 * 
 * Zero human intervention required!
 */

import { EventEmitter } from 'events';
import { SHIMMetrics } from './SHIMMetrics';
import { OpportunityDetector, Opportunity } from './OpportunityDetector';
import { StatsigIntegration, ExperimentConfig } from './StatsigIntegration';
import { SafetyBounds, BoundConfig, ValidationResult } from './SafetyBounds';

export interface EngineConfig {
  metrics: SHIMMetrics;
  detector: OpportunityDetector;
  statsig: StatsigIntegration;
  safety: SafetyBounds;
  detectionInterval?: number;        // How often to check for opportunities (ms)
  minSampleSize?: number;            // Min samples before deployment
  maxConcurrentExperiments?: number; // Max experiments running at once
  deploymentThreshold?: number;      // Min confidence for deployment (0-1)
  maxRetries?: number;               // Max retries for failed operations
}

export interface EngineStatus {
  running: boolean;
  paused: boolean;
  initialized: boolean;
  uptime: number;
  lastDetectionCycle: string;
  lastSafetyCheck: string;
  lastProgressCheck: string;
}

export interface ExperimentStatus {
  active: number;
  completed: number;
  rollbacks: number;
  deploymentsCompleted: number;
}

export interface AutoExperimentEngineEvents {
  started: () => void;
  stopped: () => void;
  paused: () => void;
  resumed: () => void;
  detection_cycle: () => void;
  detection_skipped: (reason: string) => void;
  opportunities_detected: (opportunities: Opportunity[]) => void;
  experiment_created: (experiment: ExperimentConfig) => void;
  experiment_rejected: (data: { opportunity: Opportunity; reason: string }) => void;
  max_experiments_reached: () => void;
  safety_check: () => void;
  safety_violation: (violations: any[]) => void;
  auto_rollback: (data: { experiment: ExperimentConfig; reason: string }) => void;
  progress_check: () => void;
  progress_update: (status: ExperimentStatus) => void;
  auto_deployed: (result: any) => void;
  deployment_rejected: (data: { experiment: ExperimentConfig; reason: string }) => void;
  error: (error: any) => void;
}

export declare interface AutoExperimentEngine {
  on<K extends keyof AutoExperimentEngineEvents>(
    event: K,
    listener: AutoExperimentEngineEvents[K]
  ): this;
  emit<K extends keyof AutoExperimentEngineEvents>(
    event: K,
    ...args: Parameters<AutoExperimentEngineEvents[K]>
  ): boolean;
}

export class AutoExperimentEngine extends EventEmitter {
  private metrics: SHIMMetrics;
  private detector: OpportunityDetector;
  private statsig: StatsigIntegration;
  private safety: SafetyBounds;
  
  private config: {
    detectionInterval: number;
    minSampleSize: number;
    maxConcurrentExperiments: number;
    deploymentThreshold: number;
    maxRetries: number;
  };
  
  private running: boolean = false;
  private paused: boolean = false;
  private initialized: boolean = false;
  
  private detectionTimer?: NodeJS.Timeout;
  private safetyTimer?: NodeJS.Timeout;
  private progressTimer?: NodeJS.Timeout;
  
  private activeExperiments: Map<string, ExperimentConfig> = new Map();
  private completedExperiments: ExperimentConfig[] = [];
  private rollbackedExperiments: ExperimentConfig[] = [];
  
  private startTime?: Date;
  private lastDetectionCycle?: Date;
  private lastSafetyCheck?: Date;
  private lastProgressCheck?: Date;
  
  private stats = {
    opportunitiesDetected: 0,
    experimentsCreated: 0,
    deploymentsCompleted: 0,
    rollbacksTriggered: 0,
    errors: 0
  };
  
  constructor(config: EngineConfig) {
    super();
    
    // Validate configuration
    if (config.detectionInterval !== undefined && config.detectionInterval < 0) {
      throw new Error('detectionInterval must be positive');
    }
    
    this.metrics = config.metrics;
    this.detector = config.detector;
    this.statsig = config.statsig;
    this.safety = config.safety;
    
    this.config = {
      detectionInterval: config.detectionInterval ?? 60000,  // 1 minute default
      minSampleSize: config.minSampleSize ?? 10,
      maxConcurrentExperiments: config.maxConcurrentExperiments ?? 5,
      deploymentThreshold: config.deploymentThreshold ?? 0.95,
      maxRetries: config.maxRetries ?? 3
    };
    
    // Set deployment threshold on statsig
    this.statsig.setDeploymentThreshold(this.config.deploymentThreshold);
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Initialize engine
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      // Initialize Statsig SDK
      await this.statsig.initialize();
      
      this.initialized = true;
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Start engine
   */
  async start(): Promise<boolean> {
    if (this.running) {
      return false;
    }
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.running = true;
    this.paused = false;
    this.startTime = new Date();
    
    // Start monitoring loops
    this.startDetectionLoop();
    this.startSafetyLoop();
    this.startProgressLoop();
    
    this.emit('started');
    return true;
  }
  
  /**
   * Stop engine
   */
  async stop(): Promise<boolean> {
    if (!this.running) {
      return false;
    }
    
    this.running = false;
    
    // Clear timers
    if (this.detectionTimer) clearInterval(this.detectionTimer);
    if (this.safetyTimer) clearInterval(this.safetyTimer);
    if (this.progressTimer) clearInterval(this.progressTimer);
    
    this.emit('stopped');
    return true;
  }
  
  /**
   * Pause engine (keep running, stop cycles)
   */
  async pause(): Promise<void> {
    this.paused = true;
    this.emit('paused');
  }
  
  /**
   * Resume engine
   */
  async resume(): Promise<void> {
    this.paused = false;
    this.emit('resumed');
  }
  
  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }
  
  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.paused;
  }
  
  /**
   * Get engine status
   */
  getStatus(): EngineStatus {
    return {
      running: this.running,
      paused: this.paused,
      initialized: this.initialized,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      lastDetectionCycle: this.lastDetectionCycle?.toISOString() || 'never',
      lastSafetyCheck: this.lastSafetyCheck?.toISOString() || 'never',
      lastProgressCheck: this.lastProgressCheck?.toISOString() || 'never'
    };
  }
  
  /**
   * Get experiment status
   */
  getExperimentStatus(): ExperimentStatus {
    return {
      active: this.activeExperiments.size,
      completed: this.completedExperiments.length,
      rollbacks: this.rollbackedExperiments.length,
      deploymentsCompleted: this.stats.deploymentsCompleted
    };
  }
  
  /**
   * Get active experiments
   */
  getActiveExperiments(): ExperimentConfig[] {
    return Array.from(this.activeExperiments.values());
  }
  
  /**
   * Start detection loop
   */
  private startDetectionLoop(): void {
    this.detectionTimer = setInterval(async () => {
      if (!this.paused) {
        await this.runDetectionCycle();
      }
    }, this.config.detectionInterval);
  }
  
  /**
   * Start safety loop
   */
  private startSafetyLoop(): void {
    this.safetyTimer = setInterval(async () => {
      if (!this.paused) {
        await this.runSafetyCheck();
      }
    }, this.config.detectionInterval / 2);  // Check safety twice as often
  }
  
  /**
   * Start progress loop
   */
  private startProgressLoop(): void {
    this.progressTimer = setInterval(async () => {
      if (!this.paused) {
        await this.runProgressCheck();
      }
    }, this.config.detectionInterval * 2);  // Check progress half as often
  }
  
  /**
   * Run detection cycle
   */
  async runDetectionCycle(): Promise<void> {
    try {
      this.emit('detection_cycle');
      this.lastDetectionCycle = new Date();
      
      // Skip if no metrics collected
      const metricsAvailable = this.hasNewMetrics();
      if (!metricsAvailable) {
        this.emit('detection_skipped', 'No new metrics available');
        return;
      }
      
      // Detect opportunities
      const opportunities = await this.detector.detectOpportunities();
      
      if (opportunities.length > 0) {
        this.stats.opportunitiesDetected += opportunities.length;
        this.emit('opportunities_detected', opportunities);
        
        // Create experiments from opportunities
        await this.createExperimentsFromOpportunities(opportunities);
      }
      
    } catch (error) {
      this.stats.errors++;
      this.emit('error', { phase: 'detection', error });
    }
  }
  
  /**
   * Run safety check
   */
  async runSafetyCheck(): Promise<void> {
    try {
      this.emit('safety_check');
      this.lastSafetyCheck = new Date();
      
      // Validate current metrics
      const validation = await this.safety.validate(this.metrics);
      
      if (!validation.passed) {
        this.emit('safety_violation', validation.violations);
        
        // Rollback on critical violations
        if (validation.shouldRollback) {
          await this.performAutoRollback(validation);
        }
      }
      
    } catch (error) {
      this.stats.errors++;
      this.emit('error', { phase: 'safety', error });
    }
  }
  
  /**
   * Run progress check
   */
  async runProgressCheck(): Promise<void> {
    try {
      this.emit('progress_check');
      this.lastProgressCheck = new Date();
      
      const status = this.getExperimentStatus();
      this.emit('progress_update', status);
      
      // Check if any experiments ready for deployment
      await this.checkForDeployments();
      
    } catch (error) {
      this.stats.errors++;
      this.emit('error', { phase: 'progress', error });
    }
  }
  
  /**
   * Create experiments from opportunities
   */
  private async createExperimentsFromOpportunities(opportunities: Opportunity[]): Promise<void> {
    // Check if at max concurrent experiments
    if (this.activeExperiments.size >= this.config.maxConcurrentExperiments) {
      this.emit('max_experiments_reached');
      return;
    }
    
    // Rank opportunities
    const ranked = this.detector.rankOpportunities(opportunities);
    
    for (const opportunity of ranked) {
      if (this.activeExperiments.size >= this.config.maxConcurrentExperiments) {
        break;
      }
      
      try {
        // Validate safety before creating experiment
        const validation = await this.safety.validate(this.metrics);
        
        if (!validation.passed) {
          this.emit('experiment_rejected', {
            opportunity,
            reason: validation.rollbackReason
          });
          continue;
        }
        
        // Create experiment
        const experiment = await this.statsig.createExperiment(opportunity);
        
        this.activeExperiments.set(experiment.id, experiment);
        this.stats.experimentsCreated++;
        
        this.emit('experiment_created', experiment);
        
      } catch (error) {
        this.emit('error', { phase: 'experiment_creation', opportunity, error });
      }
    }
  }
  
  /**
   * Perform auto-rollback
   */
  private async performAutoRollback(validation: ValidationResult): Promise<void> {
    for (const experiment of this.activeExperiments.values()) {
      try {
        await this.statsig.rollback(experiment.name, validation.rollbackReason);
        
        this.activeExperiments.delete(experiment.id);
        this.rollbackedExperiments.push(experiment);
        this.stats.rollbacksTriggered++;
        
        this.emit('auto_rollback', { experiment, reason: validation.rollbackReason });
        
      } catch (error) {
        this.emit('error', { phase: 'rollback', experiment, error });
      }
    }
  }
  
  /**
   * Check for ready deployments
   */
  private async checkForDeployments(): Promise<void> {
    for (const experiment of this.activeExperiments.values()) {
      try {
        // Get experiment results
        const results = await this.statsig.getExperimentResults(experiment.name);
        
        // Check if has sufficient samples
        if (results.control.sampleSize < this.config.minSampleSize ||
            results.treatment.sampleSize < this.config.minSampleSize) {
          continue;
        }
        
        // Check if ready for deployment
        if (results.isSignificant && results.winner && results.winner !== 'none') {
          // Validate safety before deployment
          const validation = await this.safety.validateExperiment(experiment, this.metrics);
          
          if (!validation.passed) {
            this.emit('deployment_rejected', {
              experiment,
              reason: validation.rollbackReason
            });
            continue;
          }
          
          // Deploy winner
          const deployed = await this.statsig.deployWinner(experiment.name);
          
          if (deployed.deployed) {
            this.activeExperiments.delete(experiment.id);
            this.completedExperiments.push(experiment);
            this.stats.deploymentsCompleted++;
            
            this.emit('auto_deployed', deployed);
          }
        }
        
      } catch (error) {
        this.emit('error', { phase: 'deployment', experiment, error });
      }
    }
  }
  
  /**
   * Check if new metrics available
   */
  private hasNewMetrics(): boolean {
    // Simple heuristic: check if any metrics have been recorded
    const accuracy = this.metrics.getMetricValue('shim_crash_prediction_accuracy');
    return accuracy !== undefined;
  }
  
  /**
   * Update detection interval
   */
  setDetectionInterval(interval: number): void {
    this.config.detectionInterval = interval;
    
    // Restart loop if running
    if (this.running) {
      if (this.detectionTimer) clearInterval(this.detectionTimer);
      this.startDetectionLoop();
    }
  }
  
  /**
   * Update safety bounds
   */
  updateSafetyBounds(bounds: BoundConfig): void {
    Object.entries(bounds).forEach(([key, value]) => {
      this.safety.updateBound(key, value);
    });
  }
  
  /**
   * Update deployment threshold
   */
  setDeploymentThreshold(threshold: number): void {
    this.config.deploymentThreshold = threshold;
    this.statsig.setDeploymentThreshold(threshold);
  }
  
  /**
   * Generate status report
   */
  generateStatusReport(): object {
    const status = this.getStatus();
    const experimentStatus = this.getExperimentStatus();
    
    return {
      uptime: status.uptime,
      experimentsCreated: this.stats.experimentsCreated,
      deploymentsCompleted: this.stats.deploymentsCompleted,
      rollbacksTriggered: this.stats.rollbacksTriggered,
      opportunitiesDetected: this.stats.opportunitiesDetected,
      activeExperiments: experimentStatus.active,
      completedExperiments: experimentStatus.completed,
      errors: this.stats.errors,
      lastDetectionCycle: status.lastDetectionCycle,
      lastSafetyCheck: status.lastSafetyCheck,
      lastProgressCheck: status.lastProgressCheck
    };
  }
  
  /**
   * Generate improvement report
   */
  generateImprovementReport(): object {
    return {
      totalImprovements: this.completedExperiments.length,
      metrics: {
        crashReduction: this.calculateCrashReduction(),
        performanceGain: this.calculatePerformanceGain(),
        tokenSavings: this.calculateTokenSavings()
      },
      experiments: this.completedExperiments.map(exp => ({
        name: exp.name,
        hypothesis: exp.hypothesis,
        outcome: 'deployed'
      }))
    };
  }
  
  /**
   * Calculate ROI
   */
  calculateROI(): object {
    return {
      crashReduction: this.calculateCrashReduction(),
      performanceGain: this.calculatePerformanceGain(),
      tokenSavings: this.calculateTokenSavings()
    };
  }
  
  /**
   * Calculate crash reduction
   */
  private calculateCrashReduction(): number {
    // Would compare baseline vs current crash rate
    // Simplified for now
    return 0;
  }
  
  /**
   * Calculate performance gain
   */
  private calculatePerformanceGain(): number {
    // Would compare baseline vs current performance metrics
    return 0;
  }
  
  /**
   * Calculate token savings
   */
  private calculateTokenSavings(): number {
    // Would compare baseline vs current token usage
    return 0;
  }
}
