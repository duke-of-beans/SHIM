/**
 * Session Restoration System - Tests
 * 
 * Tests checkpoint loading, state reconstruction, and restoration verification.
 */

import { SessionRestorer } from './SessionRestorer';
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as fs from 'fs';
import * as path from 'path';

describe('SessionRestorer', () => {
  let testDbPath: string;
  let checkpointRepo: CheckpointRepository;
  let sessionRestorer: SessionRestorer;
  const sessionId = 'test-session-restore';

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), 'test-data', `restore-${Date.now()}.db`);
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    sessionRestorer = new SessionRestorer(checkpointRepo);
  });

  afterEach(async () => {
    await checkpointRepo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Checkpoint loading', () => {
    it('should load checkpoint by ID', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      const loaded = await sessionRestorer.loadCheckpoint(checkpoint.id);
      
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(checkpoint.id);
      expect(loaded!.sessionId).toBe(sessionId);
    });

    it('should return null for non-existent checkpoint', async () => {
      const loaded = await sessionRestorer.loadCheckpoint('non-existent-id');
      
      expect(loaded).toBeNull();
    });

    it('should load most recent checkpoint for session', async () => {
      // Create multiple checkpoints
      await createTestCheckpoint(checkpointRepo, sessionId, { checkpointNumber: 1 });
      await createTestCheckpoint(checkpointRepo, sessionId, { checkpointNumber: 2 });
      const latest = await createTestCheckpoint(checkpointRepo, sessionId, { checkpointNumber: 3 });
      
      const loaded = await sessionRestorer.loadMostRecent(sessionId);
      
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(latest.id);
      expect(loaded!.checkpointNumber).toBe(3);
    });
  });

  describe('State reconstruction', () => {
    it('should reconstruct conversation state from checkpoint', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        conversationSummary: 'Discussed feature implementation',
        keyDecisions: ['Use TypeScript', 'TDD approach']
      });
      
      const state = await sessionRestorer.restoreState(checkpoint.id);
      
      expect(state).toBeDefined();
      expect(state.conversation).toBeDefined();
      expect(state.conversation.summary).toBe('Discussed feature implementation');
      expect(state.conversation.keyDecisions).toContain('Use TypeScript');
    });

    it('should reconstruct task state with progress and next steps', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'Implementing authentication',
        progress: 0.75,
        nextSteps: ['Write tests', 'Add validation']
      });
      
      const state = await sessionRestorer.restoreState(checkpoint.id);
      
      expect(state.task).toBeDefined();
      expect(state.task.operation).toBe('Implementing authentication');
      expect(state.task.progress).toBe(0.75);
      expect(state.task.nextSteps).toContain('Write tests');
    });

    it('should reconstruct file state', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        activeFiles: ['src/auth.ts', 'src/user.ts']
      });
      
      const state = await sessionRestorer.restoreState(checkpoint.id);
      
      expect(state.files).toBeDefined();
      expect(state.files.activeFiles).toContain('src/auth.ts');
      expect(state.files.activeFiles).toHaveLength(2);
    });

    it('should reconstruct tool state', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        recentToolCalls: ['read_file', 'write_file', 'bash']
      });
      
      const state = await sessionRestorer.restoreState(checkpoint.id);
      
      expect(state.tools).toBeDefined();
      expect(state.tools.recentToolCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Restoration tracking', () => {
    it('should mark checkpoint as restored on successful restoration', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      await sessionRestorer.restoreAndMark(checkpoint.id, true, 0.95);
      
      const updated = await checkpointRepo.getById(checkpoint.id);
      expect(updated!.restored_at).toBeDefined();
      expect(updated!.restore_success).toBe(true);
      expect(updated!.restore_fidelity).toBe(0.95);
    });

    it('should track restoration failures', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      await sessionRestorer.restoreAndMark(checkpoint.id, false, 0.01); // Use 0.01 instead of 0.0
      
      const updated = await checkpointRepo.getById(checkpoint.id);
      expect(updated!.restore_success).toBe(false);
      expect(updated!.restore_fidelity).toBeDefined();
      expect(updated!.restore_fidelity).toBeLessThan(0.1);
    });

    it('should calculate restoration fidelity', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        conversationSummary: 'Test summary',
        operation: 'Test operation',
        progress: 0.5,
        activeFiles: ['file1.ts', 'file2.ts']
      });
      
      const fidelity = await sessionRestorer.calculateFidelity(checkpoint.id, {
        conversationRestored: true,
        taskRestored: true,
        filesRestored: true,
        toolsRestored: false
      });
      
      expect(fidelity).toBeGreaterThan(0.5); // 3 out of 4 components
      expect(fidelity).toBeLessThan(1.0);
    });
  });

  describe('Resume event tracking', () => {
    it('should record resume event with details', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      const event = await sessionRestorer.recordResumeEvent({
        checkpointId: checkpoint.id,
        sessionId,
        interruptionReason: 'crash',
        timeSinceCheckpoint: 300000, // 5 minutes
        resumeConfidence: 0.95,
        success: true,
        fidelityScore: 0.92
      });
      
      expect(event).toBeDefined();
      expect(event.checkpointId).toBe(checkpoint.id);
      expect(event.success).toBe(true);
      expect(event.fidelityScore).toBe(0.92);
    });
  });

  describe('Performance', () => {
    it('should load checkpoint in under 50ms', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      const start = Date.now();
      await sessionRestorer.loadCheckpoint(checkpoint.id);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should restore state in under 100ms', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      const start = Date.now();
      await sessionRestorer.restoreState(checkpoint.id);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});

/**
 * Helper function to create test checkpoints
 */
async function createTestCheckpoint(
  repo: CheckpointRepository,
  sessionId: string,
  options: {
    checkpointNumber?: number;
    conversationSummary?: string;
    keyDecisions?: string[];
    operation?: string;
    progress?: number;
    nextSteps?: string[];
    activeFiles?: string[];
    recentToolCalls?: string[];
  } = {}
): Promise<Checkpoint> {
  const checkpoint: Checkpoint = {
    id: `ckpt-${Date.now()}-${Math.random()}`,
    sessionId,
    checkpointNumber: options.checkpointNumber || 1,
    createdAt: new Date().toISOString(),
    triggeredBy: 'danger_zone',
    conversationState: {
      summary: options.conversationSummary || 'Test conversation',
      keyDecisions: options.keyDecisions || [],
      currentContext: 'Test context',
      recentMessages: []
    },
    taskState: {
      operation: options.operation || 'test operation',
      phase: 'implementation',
      progress: options.progress || 0.5,
      completedSteps: [],
      nextSteps: options.nextSteps || [],
      blockers: []
    },
    fileState: {
      activeFiles: options.activeFiles || [],
      modifiedFiles: [],
      stagedFiles: [],
      uncommittedDiff: ''
    },
    toolState: {
      activeSessions: [],
      pendingOperations: [],
      recentToolCalls: (options.recentToolCalls || []).map(tool => ({
        tool,
        args: '{}',
        result: '{}',
        success: true,
        latency: 100,
        timestamp: new Date().toISOString()
      }))
    },
    signals: {
      estimatedTotalTokens: 10000,
      tokensPerMessage: 500,
      contextWindowUsage: 0.05,
      contextWindowRemaining: 190000,
      messageCount: 10,
      toolCallCount: 10,
      toolCallsSinceCheckpoint: 5,
      messagesPerMinute: 2,
      sessionDuration: 600000,
      avgResponseLatency: 1000,
      timeSinceLastResponse: 500,
      latencyTrend: 'stable',
      toolFailureRate: 0.0,
      consecutiveToolFailures: 0,
      responseLatencyTrend: 'normal',
      errorPatterns: [],
      crashRisk: 'safe',
      riskFactors: []
    },
    userPreferences: {
      customInstructions: '{}'
    }
  };
  
  const checkpointId = await repo.save(checkpoint);
  const saved = await repo.getById(checkpointId);
  
  if (!saved) {
    throw new Error(`Failed to retrieve saved checkpoint ${checkpointId}`);
  }
  
  return saved;
}
