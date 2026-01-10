/**
 * End-to-End Resume Protocol Tests
 * 
 * Tests the complete crash→detection→resume workflow.
 */

import { SignalCollector } from './SignalCollector';
import { CheckpointManager } from './CheckpointManager';
import { CheckpointRepository } from './CheckpointRepository';
import { ResumeDetector } from './ResumeDetector';
import { SessionRestorer } from './SessionRestorer';
import { SessionStarter } from './SessionStarter';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E Resume Protocol', () => {
  let testDbPath: string;
  let checkpointRepo: CheckpointRepository;
  let signalCollector: SignalCollector;
  let checkpointManager: CheckpointManager;
  let resumeDetector: ResumeDetector;
  let sessionRestorer: SessionRestorer;
  let sessionStarter: SessionStarter;
  const sessionId = 'e2e-test-session';

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), 'test-data', `e2e-${Date.now()}.db`);
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    signalCollector = new SignalCollector();
    checkpointManager = new CheckpointManager(checkpointRepo, signalCollector);
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

  describe('Complete crash→resume workflow', () => {
    it('should handle complete crash and resume cycle', async () => {
      // ============================================================
      // PHASE 1: Simulate working session with danger signals
      // ============================================================
      
      // Create signals indicating high crash risk
      signalCollector.recordMessage(sessionId, 500, 100000);
      signalCollector.recordToolCall(sessionId, 'bash', true, 1500);
      signalCollector.recordToolCall(sessionId, 'web_search', true, 2000);
      
      // Build up context window usage
      for (let i = 0; i < 100; i++) {
        signalCollector.recordMessage(sessionId, 800, 150000);
      }
      
      // Get signals and verify danger state
      const signals = signalCollector.getSignals(sessionId);
      expect(signals.crashRisk).toBe('danger');
      
      // ============================================================
      // PHASE 2: Checkpoint triggered by danger
      // ============================================================
      
      const checkpointId = await checkpointManager.createCheckpoint(sessionId, {
        conversation: {
          summary: 'Implementing authentication system',
          keyDecisions: ['Use JWT', 'TDD approach'],
          currentContext: 'Writing login endpoint tests',
          recentMessages: []
        },
        task: {
          operation: 'Build authentication module',
          phase: 'implementation',
          progress: 0.65,
          completedSteps: ['Setup project', 'Create user model'],
          nextSteps: ['Implement login', 'Add JWT validation'],
          blockers: []
        },
        files: {
          activeFiles: ['src/auth/login.ts', 'src/auth/jwt.ts'],
          modifiedFiles: ['src/auth/login.ts'],
          stagedFiles: [],
          uncommittedDiff: '+50 -10 lines'
        },
        tools: {
          activeSessions: [],
          pendingOperations: [],
          recentToolCalls: []
        }
      });
      
      expect(checkpointId).toBeDefined();
      
      // Verify checkpoint created
      const checkpoint = await checkpointRepo.getById(checkpointId);
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.signals.crashRisk).toBe('danger');
      
      // ============================================================
      // PHASE 3: Simulate crash (session ends abruptly)
      // ============================================================
      
      // [Session would crash here in real scenario]
      // Checkpoint remains unrestored
      
      // ============================================================
      // PHASE 4: New session starts - detect resume needed
      // ============================================================
      
      const startResult = await sessionStarter.checkSessionStart(sessionId);
      
      expect(startResult.resumeNeeded).toBe(true);
      expect(startResult.detection).toBeDefined();
      expect(startResult.detection!.shouldResume).toBe(true);
      expect(startResult.detection!.interruptionReason).toBe('crash');
      expect(startResult.detection!.confidence).toBeGreaterThan(0.8);
      
      // ============================================================
      // PHASE 5: Display resume prompt to user
      // ============================================================
      
      expect(startResult.prompt).toBeDefined();
      expect(startResult.prompt).toContain('SESSION RESUME DETECTED');
      expect(startResult.prompt).toContain('authentication');
      expect(startResult.prompt).toContain('65%');
      
      // ============================================================
      // PHASE 6: User confirms resume - restore state
      // ============================================================
      
      const restoreResult = await sessionStarter.performRestore(checkpointId, true);
      
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.state).toBeDefined();
      expect(restoreResult.state!.task.operation).toBe('Build authentication module');
      expect(restoreResult.state!.task.progress).toBe(0.65);
      expect(restoreResult.state!.files.activeFiles).toContain('src/auth/login.ts');
      expect(restoreResult.fidelity).toBeGreaterThan(0.9);
      
      // ============================================================
      // PHASE 7: Verify checkpoint marked as restored
      // ============================================================
      
      const restored = await checkpointRepo.getById(checkpointId);
      expect(restored!.restored_at).toBeDefined();
      expect(restored!.restore_success).toBe(true);
      expect(restored!.restore_fidelity).toBeGreaterThan(0.9);
      
      // ============================================================
      // PHASE 8: Verify no resume on next session start
      // ============================================================
      
      const secondStart = await sessionStarter.checkSessionStart(sessionId);
      expect(secondStart.resumeNeeded).toBe(false);
    });

    it('should handle user declining resume', async () => {
      // Create checkpoint
      const signals = signalCollector.getSignals(sessionId);
      signals.crashRisk = 'danger';
      
      const checkpointId = await checkpointManager.createCheckpoint(sessionId, {
        conversation: { summary: 'Test', keyDecisions: [], currentContext: '', recentMessages: [] },
        task: { operation: 'Test', phase: 'test', progress: 0.5, completedSteps: [], nextSteps: [], blockers: [] },
        files: { activeFiles: [], modifiedFiles: [], stagedFiles: [], uncommittedDiff: '' },
        tools: { activeSessions: [], pendingOperations: [], recentToolCalls: [] }
      });
      
      // Detect resume
      const startResult = await sessionStarter.checkSessionStart(sessionId);
      expect(startResult.resumeNeeded).toBe(true);
      
      // User declines
      const restoreResult = await sessionStarter.performRestore(checkpointId, false);
      
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.state).toBeNull();
      
      // Checkpoint remains unrestored
      const checkpoint = await checkpointRepo.getById(checkpointId);
      expect(checkpoint!.restored_at).toBeUndefined();
    });
  });

  describe('Multiple checkpoint scenarios', () => {
    it('should resume from most recent checkpoint', async () => {
      // Create multiple checkpoints
      await checkpointManager.createCheckpoint(sessionId, {
        conversation: { summary: 'Old work', keyDecisions: [], currentContext: '', recentMessages: [] },
        task: { operation: 'Old task', phase: 'test', progress: 0.3, completedSteps: [], nextSteps: [], blockers: [] },
        files: { activeFiles: [], modifiedFiles: [], stagedFiles: [], uncommittedDiff: '' },
        tools: { activeSessions: [], pendingOperations: [], recentToolCalls: [] }
      });
      
      await checkpointManager.createCheckpoint(sessionId, {
        conversation: { summary: 'Recent work', keyDecisions: [], currentContext: '', recentMessages: [] },
        task: { operation: 'Current task', phase: 'test', progress: 0.7, completedSteps: [], nextSteps: [], blockers: [] },
        files: { activeFiles: [], modifiedFiles: [], stagedFiles: [], uncommittedDiff: '' },
        tools: { activeSessions: [], pendingOperations: [], recentToolCalls: [] }
      });
      
      // Should resume from most recent
      const startResult = await sessionStarter.checkSessionStart(sessionId);
      
      expect(startResult.resumeNeeded).toBe(true);
      expect(startResult.detection!.lastCheckpoint!.taskState.operation).toBe('Current task');
    });
  });

  describe('Performance benchmarks', () => {
    it('should complete full workflow in under 500ms', async () => {
      const start = Date.now();
      
      // Create checkpoint
      const checkpointId = await checkpointManager.createCheckpoint(sessionId, {
        conversation: { summary: 'Test', keyDecisions: [], currentContext: '', recentMessages: [] },
        task: { operation: 'Test', phase: 'test', progress: 0.5, completedSteps: [], nextSteps: [], blockers: [] },
        files: { activeFiles: [], modifiedFiles: [], stagedFiles: [], uncommittedDiff: '' },
        tools: { activeSessions: [], pendingOperations: [], recentToolCalls: [] }
      });
      
      // Detect resume
      await sessionStarter.checkSessionStart(sessionId);
      
      // Restore
      await sessionStarter.performRestore(checkpointId, true);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});
