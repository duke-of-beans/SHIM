/**
 * InfrastructureService
 * 
 * Handles infrastructure operations:
 * - Message bus (Redis Pub/Sub)
 * - Worker registry
 * - State management
 * - Checkpoint operations
 * - Signal processing
 * - Database operations
 */

import { MessageBusWrapper } from '@shim/infrastructure/MessageBusWrapper';
import { WorkerRegistry } from '@shim/infrastructure/WorkerRegistry';
import { StateManager } from '@shim/infrastructure/StateManager';
import { CheckpointRepository } from '@shim/core/CheckpointRepository';
import { SignalHistoryRepository } from '@shim/core/SignalHistoryRepository';
import { Database } from '@shim/infrastructure/database/Database';
import { RedisConnectionManager } from '@shim/core/RedisConnectionManager';

export class InfrastructureService {
  private messageBus?: MessageBusWrapper;
  private workerRegistry?: WorkerRegistry;
  private stateManager?: StateManager;
  private checkpointRepo?: CheckpointRepository;
  private signalRepo?: SignalHistoryRepository;
  private database?: Database;
  
  // Shared dependencies
  private redisManager?: RedisConnectionManager;
  private readonly dbPath: string;

  constructor() {
    // Default database path - should be configurable via environment/config
    this.dbPath = process.env.SHIM_DB_PATH || './data/shim.db';
  }

  // ============================================================================
  // PRIVATE: Dependency Management
  // ============================================================================

  private async getRedisManager(): Promise<RedisConnectionManager> {
    if (!this.redisManager) {
      this.redisManager = new RedisConnectionManager();
      await this.redisManager.connect();
    }
    return this.redisManager;
  }

  // ============================================================================
  // MESSAGE BUS OPERATIONS (4 methods)
  // ============================================================================

  async initializeRedis(config?: { host?: string; port?: number }): Promise<any> {
    try {
      if (!this.messageBus) {
        const redisManager = await this.getRedisManager();
        this.messageBus = new MessageBusWrapper(redisManager);
      }
      
      await this.messageBus.connect();
      
      return {
        success: true,
        message: 'Redis message bus initialized',
        config: config || { host: 'localhost', port: 6379 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Redis'
      };
    }
  }

  async publishMessage(channel: string, message: any): Promise<any> {
    try {
      if (!this.messageBus) {
        throw new Error('Message bus not initialized. Call initializeRedis first.');
      }
      
      await this.messageBus.publish(channel, message);
      
      return {
        success: true,
        channel,
        message: 'Message published successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish message'
      };
    }
  }

  async subscribeChannel(channel: string): Promise<any> {
    try {
      if (!this.messageBus) {
        throw new Error('Message bus not initialized. Call initializeRedis first.');
      }
      
      await this.messageBus.subscribe(channel, (msg) => {
        console.log(`Received message on ${channel}:`, msg);
      });
      
      return {
        success: true,
        channel,
        message: 'Subscribed to channel successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to channel'
      };
    }
  }

  async getBusStatus(): Promise<any> {
    try {
      if (!this.messageBus) {
        return {
          success: true,
          status: 'not_initialized',
          connected: false
        };
      }
      
      const status = await this.messageBus.getStatus();
      
      return {
        success: true,
        status: 'initialized',
        connected: status.connected,
        channels: status.subscribedChannels
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bus status'
      };
    }
  }

  // ============================================================================
  // WORKER REGISTRY OPERATIONS (3 methods)
  // ============================================================================

  async registerWorker(workerId: string, metadata: any): Promise<any> {
    try {
      if (!this.workerRegistry) {
        const redisManager = await this.getRedisManager();
        this.workerRegistry = new WorkerRegistry(redisManager);
      }
      
      await this.workerRegistry.register(workerId, metadata);
      
      return {
        success: true,
        workerId,
        message: 'Worker registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register worker'
      };
    }
  }

  async listWorkers(): Promise<any> {
    try {
      if (!this.workerRegistry) {
        const redisManager = await this.getRedisManager();
        this.workerRegistry = new WorkerRegistry(redisManager);
      }
      
      const workers = await this.workerRegistry.listAll();
      
      return {
        success: true,
        workers,
        count: workers.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list workers'
      };
    }
  }

  async getWorkerHealth(workerId: string): Promise<any> {
    try {
      if (!this.workerRegistry) {
        const redisManager = await this.getRedisManager();
        this.workerRegistry = new WorkerRegistry(redisManager);
      }
      
      const health = await this.workerRegistry.getHealth(workerId);
      
      return {
        success: true,
        workerId,
        health
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get worker health'
      };
    }
  }

  // ============================================================================
  // STATE MANAGEMENT OPERATIONS (3 methods)
  // ============================================================================

  async saveState(key: string, state: any): Promise<any> {
    try {
      if (!this.stateManager) {
        this.stateManager = new StateManager();
      }
      
      await this.stateManager.save(key, state);
      
      return {
        success: true,
        key,
        message: 'State saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save state'
      };
    }
  }

  async loadState(key: string): Promise<any> {
    try {
      if (!this.stateManager) {
        this.stateManager = new StateManager();
      }
      
      const state = await this.stateManager.load(key);
      
      return {
        success: true,
        key,
        state
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load state'
      };
    }
  }

  async clearState(key: string): Promise<any> {
    try {
      if (!this.stateManager) {
        this.stateManager = new StateManager();
      }
      
      await this.stateManager.clear(key);
      
      return {
        success: true,
        key,
        message: 'State cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear state'
      };
    }
  }

  // ============================================================================
  // CHECKPOINT OPERATIONS (3 methods)
  // ============================================================================

  async listCheckpoints(filters?: { limit?: number; offset?: number }): Promise<any> {
    try {
      if (!this.checkpointRepo) {
        this.checkpointRepo = new CheckpointRepository(this.dbPath);
        await this.checkpointRepo.initialize();
      }
      
      const checkpoints = await this.checkpointRepo.list(filters);
      
      return {
        success: true,
        checkpoints,
        count: checkpoints.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list checkpoints'
      };
    }
  }

  async restoreCheckpoint(checkpointId: string): Promise<any> {
    try {
      if (!this.checkpointRepo) {
        this.checkpointRepo = new CheckpointRepository(this.dbPath);
        await this.checkpointRepo.initialize();
      }
      
      const checkpoint = await this.checkpointRepo.restore(checkpointId);
      
      return {
        success: true,
        checkpointId,
        checkpoint,
        message: 'Checkpoint restored successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore checkpoint'
      };
    }
  }

  async deleteCheckpoint(checkpointId: string): Promise<any> {
    try {
      if (!this.checkpointRepo) {
        this.checkpointRepo = new CheckpointRepository(this.dbPath);
        await this.checkpointRepo.initialize();
      }
      
      await this.checkpointRepo.delete(checkpointId);
      
      return {
        success: true,
        checkpointId,
        message: 'Checkpoint deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete checkpoint'
      };
    }
  }

  // ============================================================================
  // SIGNAL PROCESSING OPERATIONS (3 methods)
  // ============================================================================

  async getSignalHistory(filters?: any): Promise<any> {
    try {
      if (!this.signalRepo) {
        this.signalRepo = new SignalHistoryRepository(this.dbPath);
        await this.signalRepo.initialize();
      }
      
      const signals = await this.signalRepo.query(filters);
      
      return {
        success: true,
        signals,
        count: signals.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get signal history'
      };
    }
  }

  async analyzeSignalPatterns(): Promise<any> {
    try {
      if (!this.signalRepo) {
        this.signalRepo = new SignalHistoryRepository(this.dbPath);
        await this.signalRepo.initialize();
      }
      
      const patterns = await this.signalRepo.analyzePatterns();
      
      return {
        success: true,
        patterns
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze signal patterns'
      };
    }
  }

  async clearSignals(olderThan?: Date): Promise<any> {
    try {
      if (!this.signalRepo) {
        this.signalRepo = new SignalHistoryRepository(this.dbPath);
        await this.signalRepo.initialize();
      }
      
      const deleted = await this.signalRepo.clearOld(olderThan);
      
      return {
        success: true,
        deleted,
        message: `Cleared ${deleted} signal records`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear signals'
      };
    }
  }

  // ============================================================================
  // DATABASE OPERATIONS (3 methods)
  // ============================================================================

  async queryDatabase(query: string): Promise<any> {
    try {
      if (!this.database) {
        this.database = new Database();
      }
      
      const results = await this.database.query(query);
      
      return {
        success: true,
        results,
        count: Array.isArray(results) ? results.length : 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query database'
      };
    }
  }

  async backupDatabase(path: string): Promise<any> {
    try {
      if (!this.database) {
        this.database = new Database();
      }
      
      await this.database.backup(path);
      
      return {
        success: true,
        path,
        message: 'Database backed up successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to backup database'
      };
    }
  }

  async optimizeDatabase(): Promise<any> {
    try {
      if (!this.database) {
        this.database = new Database();
      }
      
      await this.database.optimize();
      
      return {
        success: true,
        message: 'Database optimized successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to optimize database'
      };
    }
  }
}
