/**
 * Integration tests for checkpoint system
 * Tests the complete workflow: SignalCollector → CheckpointManager → CheckpointRepository
 */

import { SignalCollector } from './SignalCollector';
import { CheckpointManager } from './CheckpointManager';
import { CheckpointRepository } from './CheckpointRepository';
import { SignalHistoryRepository } from './SignalHistoryRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('Checkpoint System Integration', () => {
  let testDbPath: string;
  let signalCollector: SignalCollector;
  let checkpointManager: CheckpointManager;
  let checkpointRepo: CheckpointRepository;
  let signalHistoryRepo: SignalHistoryRepository;
  const sessionId = 'test-session-integration';

  beforeEach(async () => {
    // Create unique test database for each test
    testDbPath = path.join(process.cwd(), 'test-data', `integration-${Date.now()}.db`);
    
    // Initialize repositories
    signalHistoryRepo = new SignalHistoryRepository(testDbPath);
    await signalHistoryRepo.initialize();
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    // Initialize signal collector
    signalCollector = new SignalCollector();
    
    // Initialize checkpoint manager with signal collector
    checkpointManager = new CheckpointManager({
      signalCollector,
      checkpointRepo,
      toolCallInterval: 5,
      timeIntervalMs: 10 * 60 * 1000 // 10 minutes
    });
  });

  afterEach(async () => {
    // Close databases
    await signalHistoryRepo.close();
    await checkpointRepo.close();
    
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Full checkpoint workflow', () => {
    it('should create checkpoint when signals indicate danger', async () => {
      // Simulate dangerous signal pattern - need HIGH error rate for danger
      // Default danger threshold is 20% tool failure rate
      for (let i = 0; i < 100; i++) {
        // Create 25% error rate (above 20% danger threshold)
        const isError = i % 4 === 0;
        signalCollector.onToolCall('test_tool', {}, isError ? { error: 'test error' } : { success: true }, 100);
      }
      
      // Check for trigger
      const shouldCheckpoint = checkpointManager.shouldTriggerCheckpoint();
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('danger_zone');
      expect(shouldCheckpoint.risk).toBe('danger');
      
      // Create checkpoint via auto-checkpoint workflow
      const result = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'integration testing',
        progress: 0.5,
        userPreferences: JSON.stringify({ theme: 'dark' })
      });
      
      expect(result.created).toBe(true);
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint!.sessionId).toBe(sessionId);
      expect(result.checkpoint!.signals.crashRisk).toBe('danger');
      expect(result.checkpoint!.checkpointNumber).toBe(1);
    });

    it('should increment checkpoint numbers within session', async () => {
      // Force trigger via tool call interval (5 calls)
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      // Create first checkpoint
      const result1 = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'task1',
        progress: 0.3,
        userPreferences: JSON.stringify({})
      });
      
      expect(result1.created).toBe(true);
      expect(result1.checkpoint!.checkpointNumber).toBe(1);
      
      // Force another trigger
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      // Create second checkpoint
      const result2 = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'task2',
        progress: 0.6,
        userPreferences: JSON.stringify({})
      });
      
      expect(result2.created).toBe(true);
      expect(result2.checkpoint!.checkpointNumber).toBe(2);
    });

    it('should retrieve and restore checkpoint state', async () => {
      // Force trigger via tool call interval
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      // Create checkpoint with known operation
      await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'important task',
        progress: 0.75,
        userPreferences: JSON.stringify({ theme: 'dark', autoSave: true })
      });
      
      // Retrieve checkpoint
      const checkpoint = await checkpointRepo.getMostRecent(sessionId);
      
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.sessionId).toBe(sessionId);
      expect(checkpoint!.taskState.operation).toBe('important task');
      expect(checkpoint!.taskState.progress).toBe(0.75);
      
      // Verify user preferences preserved
      const prefs = checkpoint!.userPreferences;
      expect(prefs.customInstructions).toBeDefined();
      const parsedPrefs = JSON.parse(prefs.customInstructions!);
      expect(parsedPrefs.theme).toBe('dark');
      expect(parsedPrefs.autoSave).toBe(true);
    });
  });

  describe('Trigger integration', () => {
    it('should respect priority order: danger > warning > intervals', () => {
      // Simulate warning-level signals (15-19% error rate = warning threshold)
      for (let i = 0; i < 100; i++) {
        // 17% error rate (above 15% warning, below 20% danger)
        const isError = i % 6 === 0;
        signalCollector.onToolCall('test_tool', {}, isError ? { error: 'test error' } : { success: true }, 100);
      }
      
      const warningCheck = checkpointManager.shouldTriggerCheckpoint();
      expect(warningCheck.shouldTrigger).toBe(true);
      expect(warningCheck.reason).toBe('warning_zone');
      expect(warningCheck.risk).toBe('warning');
      
      // Now add danger signals (push error rate to 25% = danger)
      for (let i = 0; i < 50; i++) {
        signalCollector.onToolCall('test_tool', {}, { error: 'test error' }, 100);
      }
      
      const dangerCheck = checkpointManager.shouldTriggerCheckpoint();
      expect(dangerCheck.shouldTrigger).toBe(true);
      expect(dangerCheck.reason).toBe('danger_zone');
      expect(dangerCheck.risk).toBe('danger');
    });

    it('should reset counters after checkpoint creation', async () => {
      // Trigger via tool call interval
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const firstCheck = checkpointManager.shouldTriggerCheckpoint();
      expect(firstCheck.shouldTrigger).toBe(true);
      expect(firstCheck.reason).toBe('tool_call_interval');
      
      // Create checkpoint (should reset counters)
      await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'reset test',
        progress: 0.5,
        userPreferences: JSON.stringify({})
      });
      
      // Immediately after checkpoint, should NOT trigger
      const secondCheck = checkpointManager.shouldTriggerCheckpoint();
      expect(secondCheck.shouldTrigger).toBe(false);
      
      // Need to accumulate again
      for (let i = 0; i < 4; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      expect(checkpointManager.shouldTriggerCheckpoint().shouldTrigger).toBe(false);
      
      signalCollector.onToolCall('test_tool', {}, { success: true }, 100); // 5th call
      expect(checkpointManager.shouldTriggerCheckpoint().shouldTrigger).toBe(true);
    });
  });

  describe('Signal history integration', () => {
    it('should track signal snapshots alongside checkpoints', async () => {
      // Record signals
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      // Save signal snapshot
      const signals = signalCollector.getSignals();
      await signalHistoryRepo.saveSnapshot(sessionId, signals);
      
      // Create checkpoint
      const result = await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'signal test',
        progress: 0.5,
        userPreferences: JSON.stringify({})
      });
      
      // Verify checkpoint has signal data
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint!.signals).toBeDefined();
      expect(result.checkpoint!.signals.crashRisk).toBe('safe');
      
      // Verify signal history can be retrieved
      const history = await signalHistoryRepo.getSessionSnapshots(sessionId);
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].sessionId).toBe(sessionId);
    });
  });

  describe('Performance under integration', () => {
    it('should complete full workflow in acceptable time', async () => {
      const start = Date.now();
      
      // Simulate realistic signal pattern
      for (let i = 0; i < 10; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      // Check trigger (should be fast)
      const triggerStart = Date.now();
      const _shouldCheckpoint = checkpointManager.shouldTriggerCheckpoint();
      const triggerDuration = Date.now() - triggerStart;
      
      expect(triggerDuration).toBeLessThan(10); // <10ms trigger check
      
      // Create checkpoint (including compression)
      const checkpointStart = Date.now();
      await checkpointManager.autoCheckpoint({
        sessionId,
        operation: 'performance test',
        progress: 0.5,
        userPreferences: JSON.stringify({ test: 'data' })
      });
      const checkpointDuration = Date.now() - checkpointStart;
      
      expect(checkpointDuration).toBeLessThan(150); // <150ms checkpoint creation
      
      const totalDuration = Date.now() - start;
      expect(totalDuration).toBeLessThan(200); // <200ms end-to-end
    });
  });
});
