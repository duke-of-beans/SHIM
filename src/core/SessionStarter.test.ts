/**
 * Session Start Integration - Tests
 * 
 * Tests automatic crash detection and resume prompt on session startup.
 */

import { SessionStarter } from './SessionStarter';
import { ResumeDetector } from './ResumeDetector';
import { SessionRestorer } from './SessionRestorer';
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as fs from 'fs';
import * as path from 'path';

describe('SessionStarter', () => {
  let testDbPath: string;
  let checkpointRepo: CheckpointRepository;
  let resumeDetector: ResumeDetector;
  let sessionRestorer: SessionRestorer;
  let sessionStarter: SessionStarter;
  const sessionId = 'test-session-start';

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), 'test-data', `start-${Date.now()}.db`);
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    resumeDetector = new ResumeDetector(checkpointRepo);
    sessionRestorer = new SessionRestorer(checkpointRepo);
    sessionStarter = new SessionStarter(resumeDetector, sessionRestorer, checkpointRepo);
  });

  afterEach(async () => {
    await checkpointRepo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Startup sequence', () => {
    it('should detect no resume needed when no checkpoints exist', async () => {
      const result = await sessionStarter.checkSessionStart(sessionId);
      
      expect(result.resumeNeeded).toBe(false);
      expect(result.prompt).toBeNull();
    });

    it('should detect resume needed when crash detected', async () => {
      // Create unrestored checkpoint with danger risk
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'Critical task',
        progress: 0.75,
        crashRisk: 'danger'
      });
      
      const result = await sessionStarter.checkSessionStart(sessionId);
      
      expect(result.resumeNeeded).toBe(true);
      expect(result.prompt).toBeDefined();
      expect(result.detection).toBeDefined();
      expect(result.detection!.confidence).toBeGreaterThan(0.8);
    });

    it('should not detect resume when checkpoint already restored', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      await checkpointRepo.markRestored(checkpoint.id, true, 0.95);
      
      const result = await sessionStarter.checkSessionStart(sessionId);
      
      expect(result.resumeNeeded).toBe(false);
    });
  });

  describe('Resume prompt generation', () => {
    it('should generate formatted resume prompt', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'Authentication module',
        progress: 0.6,
        nextSteps: ['Add JWT validation', 'Write tests'],
        activeFiles: ['src/auth.ts'],
        crashRisk: 'warning'
      });
      
      const result = await sessionStarter.checkSessionStart(sessionId);
      
      expect(result.prompt).toBeDefined();
      expect(result.prompt).toContain('crash');
      expect(result.prompt).toContain('Authentication module');
      expect(result.prompt).toContain('60%');
    });

    it('should include formatted file list in prompt', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'Test',
        progress: 0.5,
        activeFiles: ['file1.ts', 'file2.ts', 'file3.ts']
      });
      
      const result = await sessionStarter.checkSessionStart(sessionId);
      
      expect(result.prompt).toContain('file1.ts');
      expect(result.prompt).toContain('file2.ts');
    });
  });

  describe('Auto-restore integration', () => {
    it('should auto-restore and mark checkpoint when user confirms', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'Critical task',
        progress: 0.8,
        crashRisk: 'danger'
      });
      
      const result = await sessionStarter.checkSessionStart(sessionId);
      expect(result.resumeNeeded).toBe(true);
      
      // Simulate user confirmation
      const restored = await sessionStarter.performRestore(checkpoint.id, true);
      
      expect(restored.success).toBe(true);
      expect(restored.state).toBeDefined();
      expect(restored.state!.task.operation).toBe('Critical task');
      
      // Verify checkpoint marked as restored
      const updated = await checkpointRepo.getById(checkpoint.id);
      expect(updated!.restored_at).toBeDefined();
    });

    it('should handle restore rejection', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId);
      
      const restored = await sessionStarter.performRestore(checkpoint.id, false);
      
      expect(restored.success).toBe(false);
      expect(restored.state).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should complete startup check in under 150ms', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId);
      
      const start = Date.now();
      await sessionStarter.checkSessionStart(sessionId);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(150);
    });
  });
});

/**
 * Helper function
 */
async function createTestCheckpoint(
  repo: CheckpointRepository,
  sessionId: string,
  options: {
    operation?: string;
    progress?: number;
    nextSteps?: string[];
    activeFiles?: string[];
    recentToolCalls?: string[];
    crashRisk?: 'safe' | 'warning' | 'danger';
    checkpointNumber?: number;
    conversationSummary?: string;
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
      keyDecisions: [],
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
      crashRisk: options.crashRisk || 'safe',
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
