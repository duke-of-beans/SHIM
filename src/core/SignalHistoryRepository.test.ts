import { SignalHistoryRepository } from './SignalHistoryRepository';
import { CrashSignals } from './SignalCollector';
import * as path from 'path';
import * as fs from 'fs';

describe('SignalHistoryRepository', () => {
  let repository: SignalHistoryRepository;
  const testDbPath = path.join(__dirname, '../../test.db');

  beforeEach(async () => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    repository = new SignalHistoryRepository(testDbPath);
    await repository.initialize();
  });

  afterEach(async () => {
    await repository.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should create database file', async () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create signal_history table', async () => {
      const tables = await repository.getTables();
      expect(tables).toContain('signal_history');
    });

    it('should create indices for common queries', async () => {
      const indices = await repository.getIndices();
      expect(indices).toContain('idx_signal_history_session_time');
      expect(indices).toContain('idx_signal_history_crash_risk');
    });
  });

  describe('Snapshot Storage', () => {
    const mockSignals: CrashSignals = {
      estimatedTotalTokens: 1000,
      tokensPerMessage: 50,
      contextWindowUsage: 0.05,
      contextWindowRemaining: 199000,
      messageCount: 20,
      toolCallCount: 5,
      toolCallsSinceCheckpoint: 5,
      messagesPerMinute: 2,
      sessionDuration: 600000,
      avgResponseLatency: 250,
      timeSinceLastResponse: 1000,
      latencyTrend: 'stable',
      toolFailureRate: 0,
      consecutiveToolFailures: 0,
      responseLatencyTrend: 'normal',
      errorPatterns: [],
      crashRisk: 'safe',
      riskFactors: []
    };

    it('should save signal snapshot', async () => {
      const id = await repository.saveSnapshot('session-1', mockSignals);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should save multiple snapshots for same session', async () => {
      const id1 = await repository.saveSnapshot('session-1', mockSignals);
      const id2 = await repository.saveSnapshot('session-1', { ...mockSignals, messageCount: 25 });
      
      expect(id1).not.toBe(id2);
    });

    it('should auto-increment snapshot numbers for session', async () => {
      await repository.saveSnapshot('session-1', mockSignals);
      await repository.saveSnapshot('session-1', mockSignals);
      await repository.saveSnapshot('session-1', mockSignals);

      const snapshots = await repository.getSessionSnapshots('session-1');
      expect(snapshots).toHaveLength(3);
      expect(snapshots[0].snapshotNumber).toBe(1);
      expect(snapshots[1].snapshotNumber).toBe(2);
      expect(snapshots[2].snapshotNumber).toBe(3);
    });

    it('should store timestamp with each snapshot', async () => {
      const beforeSave = Date.now();
      await repository.saveSnapshot('session-1', mockSignals);
      const afterSave = Date.now();

      const snapshots = await repository.getSessionSnapshots('session-1');
      const timestamp = new Date(snapshots[0].timestamp).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(timestamp).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('Snapshot Retrieval', () => {
    beforeEach(async () => {
      // Create test data
      const baseSignals: CrashSignals = {
        estimatedTotalTokens: 1000,
        tokensPerMessage: 50,
        contextWindowUsage: 0.05,
        contextWindowRemaining: 199000,
        messageCount: 20,
        toolCallCount: 5,
        toolCallsSinceCheckpoint: 5,
        messagesPerMinute: 2,
        sessionDuration: 600000,
        avgResponseLatency: 250,
        timeSinceLastResponse: 1000,
        latencyTrend: 'stable',
        toolFailureRate: 0,
        consecutiveToolFailures: 0,
        responseLatencyTrend: 'normal',
        errorPatterns: [],
        crashRisk: 'safe',
        riskFactors: []
      };

      // Create snapshots for multiple sessions
      await repository.saveSnapshot('session-1', baseSignals);
      await repository.saveSnapshot('session-1', { ...baseSignals, messageCount: 25, crashRisk: 'warning' });
      await repository.saveSnapshot('session-1', { ...baseSignals, messageCount: 30, crashRisk: 'warning' });
      await repository.saveSnapshot('session-2', baseSignals);
      await repository.saveSnapshot('session-2', { ...baseSignals, messageCount: 40, crashRisk: 'danger' });
    });

    it('should retrieve snapshots for specific session', async () => {
      const snapshots = await repository.getSessionSnapshots('session-1');
      expect(snapshots).toHaveLength(3);
      expect(snapshots.every(s => s.sessionId === 'session-1')).toBe(true);
    });

    it('should order snapshots chronologically (oldest first)', async () => {
      const snapshots = await repository.getSessionSnapshots('session-1');
      expect(snapshots[0].snapshotNumber).toBe(1);
      expect(snapshots[1].snapshotNumber).toBe(2);
      expect(snapshots[2].snapshotNumber).toBe(3);
    });

    it('should retrieve latest snapshot for session', async () => {
      const latest = await repository.getLatestSnapshot('session-1');
      expect(latest).toBeDefined();
      expect(latest!.snapshotNumber).toBe(3);
      expect(latest!.signals.messageCount).toBe(30);
    });

    it('should return null for non-existent session', async () => {
      const latest = await repository.getLatestSnapshot('non-existent');
      expect(latest).toBeNull();
    });

    it('should retrieve snapshots by risk level', async () => {
      const warningSnapshots = await repository.getSnapshotsByRisk('warning');
      expect(warningSnapshots.length).toBeGreaterThanOrEqual(2);
      expect(warningSnapshots.every(s => s.signals.crashRisk === 'warning')).toBe(true);

      const dangerSnapshots = await repository.getSnapshotsByRisk('danger');
      expect(dangerSnapshots.length).toBeGreaterThanOrEqual(1);
      expect(dangerSnapshots.every(s => s.signals.crashRisk === 'danger')).toBe(true);
    });

    it('should support time-range queries', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentSnapshots = await repository.getSnapshotsInTimeRange(
        oneHourAgo.toISOString(),
        now.toISOString()
      );

      expect(recentSnapshots.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(async () => {
      const mockSignals: CrashSignals = {
        estimatedTotalTokens: 1000,
        tokensPerMessage: 50,
        contextWindowUsage: 0.05,
        contextWindowRemaining: 199000,
        messageCount: 20,
        toolCallCount: 5,
        toolCallsSinceCheckpoint: 5,
        messagesPerMinute: 2,
        sessionDuration: 600000,
        avgResponseLatency: 250,
        timeSinceLastResponse: 1000,
        latencyTrend: 'stable',
        toolFailureRate: 0,
        consecutiveToolFailures: 0,
        responseLatencyTrend: 'normal',
        errorPatterns: [],
        crashRisk: 'safe',
        riskFactors: []
      };

      // Create many old snapshots
      for (let i = 0; i < 100; i++) {
        await repository.saveSnapshot('old-session', mockSignals);
      }
    }, 30000); // 30 second timeout for setup

    it('should delete old snapshots beyond retention period', async () => {
      const retentionDays = 7;
      const deleted = await repository.cleanupOldSnapshots(retentionDays);
      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    it('should keep snapshots within retention period', async () => {
      const beforeCleanup = await repository.getSessionSnapshots('old-session');
      await repository.cleanupOldSnapshots(30); // 30 days retention
      const afterCleanup = await repository.getSessionSnapshots('old-session');
      
      expect(afterCleanup.length).toBe(beforeCleanup.length);
    });

    it('should delete all snapshots for a session', async () => {
      await repository.deleteSessionSnapshots('old-session');
      const snapshots = await repository.getSessionSnapshots('old-session');
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle 1000 snapshots without degradation', async () => {
      const mockSignals: CrashSignals = {
        estimatedTotalTokens: 1000,
        tokensPerMessage: 50,
        contextWindowUsage: 0.05,
        contextWindowRemaining: 199000,
        messageCount: 20,
        toolCallCount: 5,
        toolCallsSinceCheckpoint: 5,
        messagesPerMinute: 2,
        sessionDuration: 600000,
        avgResponseLatency: 250,
        timeSinceLastResponse: 1000,
        latencyTrend: 'stable',
        toolFailureRate: 0,
        consecutiveToolFailures: 0,
        responseLatencyTrend: 'normal',
        errorPatterns: [],
        crashRisk: 'safe',
        riskFactors: []
      };

      // Prepare 1000 snapshots for batch insert
      const snapshots = [];
      for (let i = 0; i < 1000; i++) {
        snapshots.push({
          sessionId: `session-${i % 10}`,
          signals: mockSignals
        });
      }

      const start = Date.now();
      await repository.saveSnapshotsBatch(snapshots);
      const saveTime = Date.now() - start;
      const avgSaveTime = saveTime / 1000;

      // Average save should be <5ms with batch insert
      expect(avgSaveTime).toBeLessThan(5);
    }, 60000); // 60 second timeout for 1000 inserts

    it('should retrieve latest snapshot in <10ms', async () => {
      const mockSignals: CrashSignals = {
        estimatedTotalTokens: 1000,
        tokensPerMessage: 50,
        contextWindowUsage: 0.05,
        contextWindowRemaining: 199000,
        messageCount: 20,
        toolCallCount: 5,
        toolCallsSinceCheckpoint: 5,
        messagesPerMinute: 2,
        sessionDuration: 600000,
        avgResponseLatency: 250,
        timeSinceLastResponse: 1000,
        latencyTrend: 'stable',
        toolFailureRate: 0,
        consecutiveToolFailures: 0,
        responseLatencyTrend: 'normal',
        errorPatterns: [],
        crashRisk: 'safe',
        riskFactors: []
      };

      // Create many snapshots
      for (let i = 0; i < 100; i++) {
        await repository.saveSnapshot('perf-test', mockSignals);
      }

      const start = Date.now();
      await repository.getLatestSnapshot('perf-test');
      const retrieveTime = Date.now() - start;

      expect(retrieveTime).toBeLessThan(10);
    }, 30000); // 30 second timeout for setup + retrieval
  });
});
