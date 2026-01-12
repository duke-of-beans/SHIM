/**
 * Coordination Service - MCP interface for SHIM multi-agent coordination components
 * 
 * Exposes all coordination capabilities via MCP tools
 */

import { ChatRegistry } from '../../src/coordination/ChatRegistry';
import { ConflictResolver } from '../../src/coordination/ConflictResolver';
import { ResultAggregator } from '../../src/coordination/ResultAggregator';
import { WorkDistributor } from '../../src/coordination/WorkDistributor';

export class CoordinationService {
  private chatRegistry?: ChatRegistry;
  private conflictResolver?: ConflictResolver;
  private resultAggregator?: ResultAggregator;
  private workDistributor?: WorkDistributor;

  constructor() {
    // Initialize components lazily
  }

  /**
   * Register chat worker
   */
  async registerWorker(config: any) {
    if (!this.chatRegistry) {
      this.chatRegistry = new ChatRegistry();
    }
    
    return await this.chatRegistry.register(config);
  }

  /**
   * List all registered workers
   */
  async getWorkerList() {
    if (!this.chatRegistry) {
      this.chatRegistry = new ChatRegistry();
    }
    
    return await this.chatRegistry.list();
  }

  /**
   * Resolve state conflicts
   */
  async resolveConflicts(conflicts: any[]) {
    if (!this.conflictResolver) {
      this.conflictResolver = new ConflictResolver();
    }
    
    return await this.conflictResolver.resolve(conflicts);
  }

  /**
   * Get conflict resolution history
   */
  async getConflictHistory() {
    if (!this.conflictResolver) {
      this.conflictResolver = new ConflictResolver();
    }
    
    return await this.conflictResolver.getHistory();
  }

  /**
   * Aggregate multi-chat results
   */
  async aggregateResults(taskId: string) {
    if (!this.resultAggregator) {
      this.resultAggregator = new ResultAggregator();
    }
    
    return await this.resultAggregator.aggregate(taskId);
  }

  /**
   * Get aggregation status
   */
  async getAggregationStatus(taskId: string) {
    if (!this.resultAggregator) {
      this.resultAggregator = new ResultAggregator();
    }
    
    return await this.resultAggregator.getStatus(taskId);
  }

  /**
   * Distribute task to workers
   */
  async distributeTask(task: any, numWorkers: number) {
    if (!this.workDistributor) {
      this.workDistributor = new WorkDistributor();
    }
    
    return await this.workDistributor.distribute(task, numWorkers);
  }

  /**
   * Get distribution status
   */
  async getDistributionStatus(taskId: string) {
    if (!this.workDistributor) {
      this.workDistributor = new WorkDistributor();
    }
    
    return await this.workDistributor.getStatus(taskId);
  }

  /**
   * Cancel task distribution
   */
  async cancelDistribution(taskId: string) {
    if (!this.workDistributor) {
      this.workDistributor = new WorkDistributor();
    }
    
    return await this.workDistributor.cancel(taskId);
  }
}
