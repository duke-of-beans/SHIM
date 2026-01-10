import { CheckpointManager } from './CheckpointManager';
import { SignalCollector } from './SignalCollector';
import { CheckpointRepository } from './CheckpointRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('CheckpointManager', () => {
  let manager: CheckpointManager;
  let signalCollector: SignalCollector;
  let checkpointRepo: CheckpointRepository;
  let testDbPath: string;

  beforeEach(async () => {
    const testDataDir = path.join(__dirname, '../../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    testDbPath = path.join(testDataDir, `manager-${Date.now()}.db`);
    signalCollector = new SignalCollector();
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    manager = new CheckpointManager({
      signalCollector,
      checkpointRepo,
      toolCallInterval: 5,
      timeIntervalMs: 10 * 60 * 1000 // 10 minutes
    });
  });

  afterEach(async () => {
    await checkpointRepo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should create with default configuration', () => {
      const defaultManager = new CheckpointManager({
        signalCollector,
        checkpointRepo
      });
      
      expect(defaultManager).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customManager = new CheckpointManager({
        signalCollector,
        checkpointRepo,
        toolCallInterval: 10,
        timeIntervalMs: 5 * 60 * 1000
      });
      
      expect(customManager).toBeDefined();
    });
  });

  describe('Trigger Detection', () => {
    it('should trigger on tool call interval', () => {
      // Simulate 5 tool calls
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('tool_call_interval');
    });

    it('should not trigger before tool call interval', () => {
      // Simulate 3 tool calls (less than interval of 5)
      for (let i = 0; i < 3; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(false);
    });

    it('should trigger on danger zone risk', () => {
      // Simulate conditions that put system in danger zone
      // Need 2+ danger signals: messageCount (50+) AND toolCallsSinceCheckpoint (15+)
      for (let i = 0; i < 51; i++) {
        signalCollector.onMessage('Test message content', 'user');
      }
      for (let i = 0; i < 15; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('danger_zone');
    });

    it('should trigger on warning zone risk', () => {
      // Simulate conditions that put system in warning zone
      for (let i = 0; i < 35; i++) {
        signalCollector.onMessage('Test message content', 'user');
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('warning_zone');
    });

    it('should trigger on time interval', async () => {
      const shortIntervalManager = new CheckpointManager({
        signalCollector,
        checkpointRepo,
        timeIntervalMs: 100 // 100ms for testing
      });
      
      // Wait for time interval to pass
      await new Promise(resolve => {
        setTimeout(resolve, 150);
      });
      
      const shouldCheckpoint = shortIntervalManager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('time_interval');
    });
  });

  describe('Checkpoint Creation', () => {
    it('should create checkpoint with proper metadata', async () => {
      const checkpoint = await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'tool_call_interval',
        operation: 'test operation',
        progress: 0.5
      });
      
      expect(checkpoint).toBeDefined();
      expect(checkpoint.sessionId).toBe('session-1');
      expect(checkpoint.triggeredBy).toBe('tool_call_interval');
      expect(checkpoint.taskState.operation).toBe('test operation');
      expect(checkpoint.taskState.progress).toBe(0.5);
    });

    it('should include current signals in checkpoint', async () => {
      // Record some activity
      signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      signalCollector.onMessage('Test message', 'user');
      
      const checkpoint = await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'user_requested',
        operation: 'test',
        progress: 0
      });
      
      expect(checkpoint.signals).toBeDefined();
      expect(checkpoint.signals.toolCallCount).toBe(1);
      expect(checkpoint.signals.messageCount).toBe(1);
    });

    it('should save checkpoint to repository', async () => {
      const checkpoint = await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'user_requested',
        operation: 'test',
        progress: 0
      });
      
      const retrieved = await checkpointRepo.getById(checkpoint.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(checkpoint.id);
    });

    it('should reset tool call counter after checkpoint', async () => {
      // Trigger checkpoint via tool calls
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'tool_call_interval',
        operation: 'test',
        progress: 0
      });
      
      // Counter should be reset
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      expect(shouldCheckpoint.shouldTrigger).toBe(false);
    });

    it('should reset time interval after checkpoint', async () => {
      const shortIntervalManager = new CheckpointManager({
        signalCollector,
        checkpointRepo,
        timeIntervalMs: 100
      });
      
      await new Promise(resolve => {
        setTimeout(resolve, 150);
      });
      
      await shortIntervalManager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'time_interval',
        operation: 'test',
        progress: 0
      });
      
      // Timer should be reset - not enough time passed
      const shouldCheckpoint = shortIntervalManager.shouldTriggerCheckpoint();
      expect(shouldCheckpoint.shouldTrigger).toBe(false);
    });
  });

  describe('Auto-Checkpoint Workflow', () => {
    it('should auto-checkpoint when triggered', async () => {
      // Record activity to trigger checkpoint
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const result = await manager.autoCheckpoint({
        sessionId: 'session-1',
        operation: 'test operation',
        progress: 0.5
      });
      
      expect(result.created).toBe(true);
      expect(result.checkpoint).toBeDefined();
      expect(result.reason).toBe('tool_call_interval');
    });

    it('should not create checkpoint when not triggered', async () => {
      // No activity recorded
      const result = await manager.autoCheckpoint({
        sessionId: 'session-1',
        operation: 'test',
        progress: 0
      });
      
      expect(result.created).toBe(false);
      expect(result.checkpoint).toBeNull();
    });

    it('should return existing checkpoint count', async () => {
      // Create first checkpoint
      await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'user_requested',
        operation: 'test',
        progress: 0.5
      });
      
      const stats = await manager.getCheckpointStats('session-1');
      
      expect(stats.totalCheckpoints).toBe(1);
      expect(stats.lastCheckpoint).toBeDefined();
    });
  });

  describe('Priority-Based Triggering', () => {
    it('should prioritize danger zone over other triggers', () => {
      // Set up danger zone (2+ signals) AND tool call trigger
      // Need 2+ danger signals for danger_zone
      for (let i = 0; i < 51; i++) {
        signalCollector.onMessage('Test message content', 'user');
      }
      for (let i = 0; i < 15; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('danger_zone');
    });

    it('should prioritize warning zone over interval triggers', () => {
      // Set up both warning zone and tool call trigger
      for (let i = 0; i < 35; i++) {
        signalCollector.onMessage('Test message content', 'user');
      }
      for (let i = 0; i < 5; i++) {
        signalCollector.onToolCall('test_tool', {}, { success: true }, 100);
      }
      
      const shouldCheckpoint = manager.shouldTriggerCheckpoint();
      
      expect(shouldCheckpoint.shouldTrigger).toBe(true);
      expect(shouldCheckpoint.reason).toBe('warning_zone');
    });
  });

  describe('Performance', () => {
    it('should check trigger status in <10ms', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        manager.shouldTriggerCheckpoint();
      }
      
      const duration = Date.now() - start;
      const avgDuration = duration / 100;
      
      expect(avgDuration).toBeLessThan(10);
    });

    it('should create checkpoint in <150ms', async () => {
      const start = Date.now();
      
      await manager.createCheckpoint({
        sessionId: 'session-1',
        trigger: 'user_requested',
        operation: 'test',
        progress: 0
      });
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(150);
    });
  });
});
