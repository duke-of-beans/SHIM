import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as fs from 'fs';
import * as path from 'path';

describe('CheckpointRepository', () => {
  let repo: CheckpointRepository;
  let testDbPath: string;

  beforeEach(async () => {
    const testDataDir = path.join(__dirname, '../../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    testDbPath = path.join(testDataDir, `checkpoint-${Date.now()}.db`);
    repo = new CheckpointRepository(testDbPath);
    await repo.initialize();
  });

  afterEach(async () => {
    await repo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should create database file', async () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create checkpoints table', async () => {
      const tables = await repo.getTables();
      expect(tables).toContain('checkpoints');
    });

    it('should create resume_events table', async () => {
      const tables = await repo.getTables();
      expect(tables).toContain('resume_events');
    });

    it('should create indices for common queries', async () => {
      const indices = await repo.getIndices();
      expect(indices).toContain('idx_checkpoints_session');
      expect(indices).toContain('idx_checkpoints_risk');
      expect(indices).toContain('idx_checkpoints_unrestored');
    });

    it('should enable WAL mode for better concurrency', async () => {
      const walMode = await repo.getJournalMode();
      expect(walMode).toBe('wal');
    });
  });

  describe('Checkpoint Storage', () => {
    it('should save a checkpoint', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      const id = await repo.save(checkpoint);
      
      expect(id).toBe(checkpoint.id);
    });

    it('should retrieve checkpoint by ID', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      await repo.save(checkpoint);
      
      const retrieved = await repo.getById(checkpoint.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(checkpoint.id);
      expect(retrieved!.sessionId).toBe(checkpoint.sessionId);
      expect(retrieved!.checkpointNumber).toBe(checkpoint.checkpointNumber);
    });

    it('should compress checkpoint data', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      await repo.save(checkpoint);
      
      const size = await repo.getCheckpointSize(checkpoint.id);
      
      expect(size.compressed).toBeLessThan(size.uncompressed);
      expect(size.compressionRatio).toBeGreaterThan(1);
    });

    it('should decompress checkpoint data correctly', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      checkpoint.conversationState.summary = 'This is a detailed summary ' + 'x'.repeat(500);
      
      await repo.save(checkpoint);
      const retrieved = await repo.getById(checkpoint.id);
      
      expect(retrieved!.conversationState.summary).toBe(checkpoint.conversationState.summary);
    });

    it('should save multiple checkpoints for same session', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      const cp2 = createTestCheckpoint('session-1', 2);
      const cp3 = createTestCheckpoint('session-1', 3);
      
      await repo.save(cp1);
      await repo.save(cp2);
      await repo.save(cp3);
      
      const checkpoints = await repo.listBySession('session-1');
      expect(checkpoints).toHaveLength(3);
    });

    it('should enforce unique constraint on (session_id, checkpoint_number)', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      const cp2 = createTestCheckpoint('session-1', 1); // Same number
      
      await repo.save(cp1);
      await expect(repo.save(cp2)).rejects.toThrow();
    });

    it('should auto-increment checkpoint numbers if not specified', async () => {
      const cp1 = createTestCheckpoint('session-1', undefined);
      const cp2 = createTestCheckpoint('session-1', undefined);
      
      const id1 = await repo.save(cp1);
      const id2 = await repo.save(cp2);
      
      const retrieved1 = await repo.getById(id1);
      const retrieved2 = await repo.getById(id2);
      
      expect(retrieved1!.checkpointNumber).toBe(1);
      expect(retrieved2!.checkpointNumber).toBe(2);
    });
  });

  describe('Checkpoint Retrieval', () => {
    it('should retrieve most recent checkpoint for session', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      const cp2 = createTestCheckpoint('session-1', 2);
      const cp3 = createTestCheckpoint('session-1', 3);
      
      await repo.save(cp1);
      await repo.save(cp2);
      await repo.save(cp3);
      
      const latest = await repo.getMostRecent('session-1');
      
      expect(latest).toBeDefined();
      expect(latest!.checkpointNumber).toBe(3);
    });

    it('should return null for non-existent session', async () => {
      const latest = await repo.getMostRecent('non-existent');
      expect(latest).toBeNull();
    });

    it('should list checkpoints in chronological order', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      const cp2 = createTestCheckpoint('session-1', 2);
      const cp3 = createTestCheckpoint('session-1', 3);
      
      await repo.save(cp1);
      await new Promise(r => setTimeout(r, 10)); // Ensure different timestamps
      await repo.save(cp2);
      await new Promise(r => setTimeout(r, 10));
      await repo.save(cp3);
      
      const checkpoints = await repo.listBySession('session-1');
      
      expect(checkpoints[0].checkpointNumber).toBe(1);
      expect(checkpoints[1].checkpointNumber).toBe(2);
      expect(checkpoints[2].checkpointNumber).toBe(3);
    });

    it('should retrieve unrestored checkpoints', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      const cp2 = createTestCheckpoint('session-1', 2);
      
      await repo.save(cp1);
      await repo.save(cp2);
      await repo.markRestored(cp1.id, true, 0.95);
      
      const unrestored = await repo.getUnrestoredCheckpoint('session-1');
      
      expect(unrestored).toBeDefined();
      expect(unrestored!.id).toBe(cp2.id);
    });

    it('should filter checkpoints by crash risk', async () => {
      const cp1 = createTestCheckpoint('session-1', 1);
      cp1.signals.crashRisk = 'danger';
      
      const cp2 = createTestCheckpoint('session-2', 1);
      cp2.signals.crashRisk = 'warning';
      
      const cp3 = createTestCheckpoint('session-3', 1);
      cp3.signals.crashRisk = 'safe';
      
      await repo.save(cp1);
      await repo.save(cp2);
      await repo.save(cp3);
      
      const dangerCheckpoints = await repo.listByRisk('danger');
      
      expect(dangerCheckpoints).toHaveLength(1);
      expect(dangerCheckpoints[0].signals.crashRisk).toBe('danger');
    });
  });

  describe('Resume Tracking', () => {
    it('should mark checkpoint as restored', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      await repo.save(checkpoint);
      
      await repo.markRestored(checkpoint.id, true, 0.92);
      
      const retrieved = await repo.getById(checkpoint.id);
      expect(retrieved!.restored_at).toBeDefined();
      expect(retrieved!.restore_success).toBe(true);
      expect(retrieved!.restore_fidelity).toBe(0.92);
    });

    it('should record resume event', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      await repo.save(checkpoint);
      
      const resumeEvent = {
        checkpointId: checkpoint.id,
        sessionId: checkpoint.sessionId,
        interruptionReason: 'crash' as const,
        timeSinceCheckpoint: 30000,
        resumeConfidence: 0.88,
        userConfirmed: true,
        success: true,
        fidelityScore: 0.91,
        notes: 'Full context restored'
      };
      
      await repo.recordResumeEvent(resumeEvent);
      
      const events = await repo.getResumeEvents(checkpoint.sessionId);
      expect(events).toHaveLength(1);
      expect(events[0].interruptionReason).toBe('crash');
    });
  });

  describe('Cleanup Operations', () => {
    it('should delete old checkpoints beyond retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);
      
      const oldCheckpoint = createTestCheckpoint('session-1', 1);
      oldCheckpoint.createdAt = oldDate.toISOString();
      
      const recentCheckpoint = createTestCheckpoint('session-2', 1);
      
      await repo.save(oldCheckpoint);
      await repo.save(recentCheckpoint);
      
      const deleted = await repo.cleanup(30); // 30 day retention
      
      expect(deleted).toBe(1);
      
      const remaining = await repo.getById(oldCheckpoint.id);
      expect(remaining).toBeNull();
    });

    it('should keep checkpoints within retention period', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);
      
      const checkpoint = createTestCheckpoint('session-1', 1);
      checkpoint.createdAt = recentDate.toISOString();
      
      await repo.save(checkpoint);
      
      const deleted = await repo.cleanup(30);
      
      expect(deleted).toBe(0);
      
      const retrieved = await repo.getById(checkpoint.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should save checkpoint in <100ms', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      
      const start = Date.now();
      await repo.save(checkpoint);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should retrieve checkpoint in <50ms', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      await repo.save(checkpoint);
      
      const start = Date.now();
      await repo.getById(checkpoint.id);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should compress checkpoint to <100KB', async () => {
      const checkpoint = createTestCheckpoint('session-1', 1);
      // Add realistic data size
      checkpoint.conversationState.summary = 'x'.repeat(1000);
      checkpoint.conversationState.keyDecisions = Array(50).fill('Decision X');
      checkpoint.taskState.completedSteps = Array(100).fill('Step X');
      
      await repo.save(checkpoint);
      
      const size = await repo.getCheckpointSize(checkpoint.id);
      
      expect(size.compressed).toBeLessThan(100 * 1024); // 100KB
    });
  });
});

// Helper function to create test checkpoint
function createTestCheckpoint(sessionId: string, checkpointNumber?: number): Checkpoint {
  return {
    id: `checkpoint-${Date.now()}-${Math.random()}`,
    sessionId,
    checkpointNumber: checkpointNumber ?? 0,
    createdAt: new Date().toISOString(),
    triggeredBy: 'tool_call_interval',
    conversationState: {
      summary: 'Test summary',
      keyDecisions: ['Decision 1', 'Decision 2'],
      currentContext: 'Working on tests',
      recentMessages: [
        { role: 'user', content: 'Test message', timestamp: new Date().toISOString() }
      ]
    },
    taskState: {
      operation: 'testing',
      phase: 'implementation',
      progress: 0.5,
      completedSteps: ['Step 1', 'Step 2'],
      nextSteps: ['Step 3'],
      blockers: []
    },
    fileState: {
      activeFiles: ['test.ts'],
      modifiedFiles: [],
      stagedFiles: [],
      uncommittedDiff: ''
    },
    toolState: {
      activeSessions: [],
      pendingOperations: [],
      recentToolCalls: []
    },
    signals: {
      estimatedTotalTokens: 5000,
      tokensPerMessage: 250,
      contextWindowUsage: 0.025,
      contextWindowRemaining: 195000,
      messageCount: 20,
      toolCallCount: 10,
      toolCallsSinceCheckpoint: 5,
      messagesPerMinute: 2,
      sessionDuration: 600000,
      avgResponseLatency: 1500,
      timeSinceLastResponse: 5000,
      latencyTrend: 'stable',
      toolFailureRate: 0.05,
      consecutiveToolFailures: 0,
      responseLatencyTrend: 'normal',
      errorPatterns: [],
      crashRisk: 'safe',
      riskFactors: []
    },
    userPreferences: {}
  };
}
