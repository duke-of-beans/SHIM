/**
 * Resume Protocol E2E Tests
 * 
 * End-to-end testing of the complete crash→resume workflow.
 * Tests the full integration: SignalCollector → CheckpointManager → ResumeDetector → SessionRestorer → SessionStarter
 */

import { SignalCollector } from './SignalCollector';
import { CheckpointManager } from './CheckpointManager';
import { CheckpointRepository } from './CheckpointRepository';
import { SignalHistoryRepository } from './SignalHistoryRepository';
import { ResumeDetector } from './ResumeDetector';
import { SessionRestorer } from './SessionRestorer';
import { SessionStarter } from './SessionStarter';
import * as fs from 'fs';
import * as path from 'path';

describe('Resume Protocol E2E', () => {
  let testDbPath: string;
  let signalHistoryRepo: SignalHistoryRepository;
  let checkpointRepo: CheckpointRepository;
  let signalCollector: SignalCollector;
  let checkpointManager: CheckpointManager;
  let resumeDetector: ResumeDetector;
  let sessionRestorer: SessionRestorer;
  let sessionStarter: SessionStarter;
  const sessionId = 'test-e2e-session';

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), 'test-data', `e2e-${Date.now()}.db`);
    
    signalHistoryRepo = new SignalHistoryRepository(testDbPath);
    await signalHistoryRepo.initialize();
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    signalCollector = new SignalCollector();
    checkpointManager = new CheckpointManager({
      signalCollector,
      checkpointRepo,
      toolCallInterval: 5,
      timeIntervalMs: 10 * 60 * 1000
    });
    resumeDetector = new ResumeDetector(checkpointRepo);
    sessionRestorer = new SessionRestorer(checkpointRepo);
    sessionStarter = new SessionStarter(resumeDetector, sessionRestorer, checkpointRepo);
  });

  afterEach(async () => {
    await signalHistoryRepo.close();
    await checkpointRepo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Complete crash→resume workflow', () => {
    it('should detect crash and enable resume on next session', async () => {
      // PHASE 1: Simulate working session with dangerous signal pattern
      // Create 25% error rate to trigger danger zone (threshold is 20%)
      for (let i = 0; i < 100; i++) {
        const isError = i % 4 === 0;
        signalCollector.onToolCall(
          'bash',
          {},
          isError ? { error: 'test error' } : { success: true },
          1500
        );
      }

      // PHASE 2: Danger zone triggers automatic checkpoint
      const result = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'Critical work in progress',
        progress: 0.75,
        userPreferences: '{}'
      });

      expect(result.created).toBe(true);
      expect(result.checkpoint).toBeDefined();

      // PHASE 3: Simulate session crash (leave checkpoint unrestored)
      // ... session ends unexpectedly ...

      // PHASE 4: New session starts - detect crash
      const startResult = await sessionStarter.checkSessionStart(sessionId);

      expect(startResult.resumeNeeded).toBe(true);
      expect(startResult.prompt).toBeDefined();
      expect(startResult.prompt).toContain('SESSION RESUME DETECTED');
      expect(startResult.detection!.confidence).toBeGreaterThan(0.8);
      expect(startResult.detection!.interruptionReason).toBe('crash');
    });

    it('should restore state when user confirms resume', async () => {
      // PHASE 1: Create danger checkpoint
      for (let i = 0; i < 100; i++) {
        const isError = i % 4 === 0;
        signalCollector.onToolCall('bash', {}, isError ? { error: 'test error' } : { success: true }, 1500);
      }

      const result = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'Test operation',
        progress: 0.5,
        userPreferences: '{}'
      });

      expect(result.created).toBe(true);

      // PHASE 2: Detect resume needed
      const startResult = await sessionStarter.checkSessionStart(sessionId);
      expect(startResult.resumeNeeded).toBe(true);

      // PHASE 3: User confirms - perform restore
      const checkpointId = startResult.detection!.lastCheckpoint!.id;
      const restoreResult = await sessionStarter.performRestore(checkpointId, true);

      // Verify restoration
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.state).toBeDefined();
      expect(restoreResult.fidelity).toBeGreaterThan(0);

      // Verify checkpoint marked as restored
      const checkpoint = await checkpointRepo.getById(checkpointId);
      expect(checkpoint!.restored_at).toBeDefined();
      expect(checkpoint!.restore_success).toBe(true);
    });

    it('should not resume when checkpoint already restored', async () => {
      // Create and immediately restore checkpoint (warning level)
      for (let i = 0; i < 100; i++) {
        const isError = i % 10 === 0; // 10% error rate = warning zone
        signalCollector.onToolCall('bash', {}, isError ? { error: 'test error' } : { success: true }, 1500);
      }

      const result = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'Test operation',
        progress: 0.5,
        userPreferences: '{}'
      });

      expect(result.created).toBe(true);
      const checkpoint = await checkpointRepo.getUnrestoredCheckpoint(sessionId);
      await checkpointRepo.markRestored(checkpoint!.id, true, 0.95);

      // Try to detect resume
      const startResult = await sessionStarter.checkSessionStart(sessionId);

      expect(startResult.resumeNeeded).toBe(false);
      expect(startResult.prompt).toBeNull();
    });
  });

  describe('Multiple checkpoint handling', () => {
    it('should resume from most recent unrestored checkpoint', async () => {
      // Create two checkpoints with different error rates
      // First checkpoint - warning level (10% error rate)
      for (let i = 0; i < 100; i++) {
        const isError = i % 10 === 0;
        signalCollector.onToolCall('bash', {}, isError ? { error: 'error' } : { success: true }, 1000);
      }

      await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'First task',
        progress: 0.3,
        userPreferences: '{}'
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second checkpoint - danger level (25% error rate)
      for (let i = 0; i < 100; i++) {
        const isError = i % 4 === 0;
        signalCollector.onToolCall('web_search', {}, isError ? { error: 'error' } : { success: true }, 2000);
      }

      const result2 = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'Second task',
        progress: 0.7,
        userPreferences: '{}'
      });

      expect(result2.created).toBe(true);

      // Should detect most recent (danger) checkpoint
      const startResult = await sessionStarter.checkSessionStart(sessionId);

      expect(startResult.resumeNeeded).toBe(true);
      expect(startResult.detection!.lastCheckpoint!.checkpointNumber).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should complete full crash→resume cycle in under 500ms', async () => {
      const start = Date.now();

      // Create checkpoint with danger signal
      for (let i = 0; i < 100; i++) {
        const isError = i % 4 === 0;
        signalCollector.onToolCall('bash', {}, isError ? { error: 'error' } : { success: true }, 1000);
      }

      await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'Performance test',
        progress: 0.5,
        userPreferences: '{}'
      });

      // Detect and restore
      const startResult = await sessionStarter.checkSessionStart(sessionId);
      if (startResult.resumeNeeded) {
        await sessionStarter.performRestore(
          startResult.detection!.lastCheckpoint!.id,
          true
        );
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});
