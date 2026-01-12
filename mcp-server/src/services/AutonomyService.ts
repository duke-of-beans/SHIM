/**
 * Autonomy Service - MCP interface for SHIM autonomous operation components
 * 
 * Exposes all autonomy capabilities via MCP tools
 */

import { AutonomousOrchestrator } from '../../src/autonomy/AutonomousOrchestrator.js';
import { DecisionEngine } from '../../src/autonomy/DecisionEngine.js';
import { FailureRecovery } from '../../src/autonomy/FailureRecovery.js';
import { FeedbackProcessor } from '../../src/autonomy/FeedbackProcessor.js';
import { GoalDecomposer } from '../../src/autonomy/GoalDecomposer.js';
import { GoalReporter } from '../../src/autonomy/GoalReporter.js';
import { ProgressTracker } from '../../src/autonomy/ProgressTracker.js';
import { WorkReviewer } from '../../src/autonomy/WorkReviewer.js';

export class AutonomyService {
  private orchestrator?: AutonomousOrchestrator;
  private decisionEngine?: DecisionEngine;
  private failureRecovery?: FailureRecovery;
  private feedbackProcessor?: FeedbackProcessor;
  private goalDecomposer?: GoalDecomposer;
  private goalReporter?: GoalReporter;
  private progressTracker?: ProgressTracker;
  private workReviewer?: WorkReviewer;

  constructor() {
    // Components initialized lazily on first use
  }

  /**
   * Execute goal autonomously
   */
  async autonomousExecute(goal: string, context?: any) {
    if (!this.orchestrator) {
      this.orchestrator = new AutonomousOrchestrator();
    }
    
    return await this.orchestrator.execute(goal, context);
  }

  /**
   * Get autonomous orchestrator status
   */
  async getAutonomousStatus() {
    if (!this.orchestrator) {
      return {
        active: false,
        currentGoal: null,
        progress: 0
      };
    }
    
    return await this.orchestrator.getStatus();
  }

  /**
   * Make strategic decision
   */
  async makeDecision(context: any, options: any[]) {
    if (!this.decisionEngine) {
      this.decisionEngine = new DecisionEngine();
    }
    
    return await this.decisionEngine.decide(context, options);
  }

  /**
   * Explain decision reasoning
   */
  async explainDecision(decisionId: string) {
    if (!this.decisionEngine) {
      throw new Error('No decisions made yet - call makeDecision first');
    }
    
    return await this.decisionEngine.explain(decisionId);
  }

  /**
   * Auto-recover from failure
   */
  async recoverFromFailure(failure: any) {
    if (!this.failureRecovery) {
      this.failureRecovery = new FailureRecovery();
    }
    
    return await this.failureRecovery.recover(failure);
  }

  /**
   * Get recovery history
   */
  async getRecoveryHistory() {
    if (!this.failureRecovery) {
      return {
        recoveries: [],
        successRate: 0
      };
    }
    
    return await this.failureRecovery.getHistory();
  }

  /**
   * Process user feedback
   */
  async processFeedback(feedback: any) {
    if (!this.feedbackProcessor) {
      this.feedbackProcessor = new FeedbackProcessor();
    }
    
    return await this.feedbackProcessor.process(feedback);
  }

  /**
   * Get feedback insights
   */
  async getFeedbackInsights() {
    if (!this.feedbackProcessor) {
      return {
        insights: [],
        totalFeedback: 0
      };
    }
    
    return await this.feedbackProcessor.getInsights();
  }

  /**
   * Decompose goal into steps
   */
  async decomposeGoal(goal: string) {
    if (!this.goalDecomposer) {
      this.goalDecomposer = new GoalDecomposer();
    }
    
    return await this.goalDecomposer.decompose(goal);
  }

  /**
   * Get decomposition details
   */
  async getDecomposition(goalId: string) {
    if (!this.goalDecomposer) {
      throw new Error('No goals decomposed yet - call decomposeGoal first');
    }
    
    return await this.goalDecomposer.getDecomposition(goalId);
  }

  /**
   * Report progress on goals
   */
  async reportProgress(taskId: string) {
    if (!this.goalReporter) {
      this.goalReporter = new GoalReporter();
    }
    
    return await this.goalReporter.report(taskId);
  }

  /**
   * Track progress update
   */
  async trackProgress(taskId: string, update: any) {
    if (!this.progressTracker) {
      this.progressTracker = new ProgressTracker();
    }
    
    return await this.progressTracker.track(taskId, update);
  }

  /**
   * Get progress status
   */
  async getProgress(taskId: string) {
    if (!this.progressTracker) {
      return {
        taskId,
        progress: 0,
        status: 'not_started'
      };
    }
    
    return await this.progressTracker.getProgress(taskId);
  }

  /**
   * Quality review of work product
   */
  async reviewWork(workProduct: any) {
    if (!this.workReviewer) {
      this.workReviewer = new WorkReviewer();
    }
    
    return await this.workReviewer.review(workProduct);
  }

  /**
   * Get review criteria
   */
  async getReviewCriteria() {
    if (!this.workReviewer) {
      this.workReviewer = new WorkReviewer();
    }
    
    return await this.workReviewer.getCriteria();
  }
}
