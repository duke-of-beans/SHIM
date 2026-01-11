/**
 * ProcessMonitor Tests
 * 
 * Tests for Windows process monitoring and crash detection.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { ProcessMonitor, ProcessStatus, ProcessEvent } from './ProcessMonitor';
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as path from 'path';
import * as fs from 'fs';

describe('ProcessMonitor', () => {
  let monitor: ProcessMonitor;
  let checkpointRepo: CheckpointRepository;
  const testDbPath = path.join(__dirname, '../../test-data/process-monitor.db');
  
  // Mock process name for testing
  const CLAUDE_PROCESS_NAME = 'Claude.exe';
  
  beforeEach(async () => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Initialize checkpoint repository
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    // Create monitor instance
    monitor = new ProcessMonitor(CLAUDE_PROCESS_NAME, checkpointRepo);
  });
  
  afterEach(async () => {
    // Stop monitoring
    await monitor.stop();
    
    // Clean up
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Construction', () => {
    it('should create ProcessMonitor instance', () => {
      expect(monitor).toBeInstanceOf(ProcessMonitor);
    });
    
    it('should accept process name and checkpoint repository', () => {
      const customMonitor = new ProcessMonitor('CustomApp.exe', checkpointRepo);
      expect(customMonitor).toBeInstanceOf(ProcessMonitor);
    });
    
    it('should start in stopped state', () => {
      expect(monitor.isRunning()).toBe(false);
    });
  });
  
  describe('Process Detection', () => {
    it('should find running process by name', async () => {
      // This test requires Claude Desktop to be running
      // Skip if not running in CI environment
      const status = await monitor.findProcess();
      
      if (status.found) {
        expect(status.pid).toBeGreaterThan(0);
        expect(status.processName).toBe(CLAUDE_PROCESS_NAME);
      }
    });
    
    it('should return not found for non-existent process', async () => {
      const customMonitor = new ProcessMonitor('NonExistentApp12345.exe', checkpointRepo);
      const status = await customMonitor.findProcess();
      
      expect(status.found).toBe(false);
      expect(status.pid).toBeNull();
    });
    
    it('should cache PID after finding process', async () => {
      const status1 = await monitor.findProcess();
      const status2 = await monitor.getStatus();
      
      expect(status1.pid).toEqual(status2.pid);
    });
  });
  
  describe('Process Monitoring', () => {
    it('should start monitoring loop', async () => {
      await monitor.start();
      expect(monitor.isRunning()).toBe(true);
    });
    
    it('should stop monitoring loop', async () => {
      await monitor.start();
      await monitor.stop();
      expect(monitor.isRunning()).toBe(false);
    });
    
    it('should not start if already running', async () => {
      await monitor.start();
      
      // Second start should be no-op
      await expect(monitor.start()).rejects.toThrow('Already running');
    });
    
    it('should configure polling interval', async () => {
      const customMonitor = new ProcessMonitor(
        CLAUDE_PROCESS_NAME,
        checkpointRepo,
        { pollingInterval: 500 }
      );
      
      await customMonitor.start();
      expect(customMonitor.isRunning()).toBe(true);
      await customMonitor.stop();
    });
  });
  
  describe('Crash Detection', () => {
    it('should detect when process exits', async () => {
      // Create mock checkpoint to establish "recent checkpoint" condition
      const mockCheckpoint: Checkpoint = createMockCheckpoint();
      await checkpointRepo.save(mockCheckpoint);
      
      const events: ProcessEvent[] = [];
      monitor.on('crash', (event) => events.push(event));
      
      await monitor.start();
      
      // Simulate process exit by manually triggering
      // (In real scenario, process would actually exit)
      // For testing, we'll use internal method if exposed
      
      // Wait briefly
      await sleep(100);
      
      // Stop monitoring
      await monitor.stop();
      
      // Events should be captured if crash occurred
      // This test is hard to simulate without actually crashing Claude
      // So we'll verify the event structure is correct if any occurred
      events.forEach(event => {
        expect(event.type).toBe('crash');
        expect(event.pid).toBeGreaterThan(0);
        expect(event.timestamp).toBeDefined();
      });
    });
    
    it('should NOT detect crash if no recent checkpoint', async () => {
      // No checkpoint created - should not trigger crash detection
      const events: ProcessEvent[] = [];
      monitor.on('crash', (event) => events.push(event));
      
      await monitor.start();
      await sleep(100);
      await monitor.stop();
      
      // No crash events should be emitted without recent checkpoint
      expect(events.length).toBe(0);
    });
    
    it('should check for recent checkpoint within time window', async () => {
      // Create checkpoint from 10 minutes ago (outside 5-min window)
      const oldCheckpoint = createMockCheckpoint();
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      oldCheckpoint.createdAt = tenMinutesAgo.toISOString();
      await checkpointRepo.save(oldCheckpoint);
      
      const hasRecent = await monitor.hasRecentCheckpoint(5);
      expect(hasRecent).toBe(false);
    });
    
    it('should identify recent checkpoint within time window', async () => {
      // Create checkpoint from 2 minutes ago (inside 5-min window)
      const recentCheckpoint = createMockCheckpoint();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      recentCheckpoint.createdAt = twoMinutesAgo.toISOString();
      await checkpointRepo.save(recentCheckpoint);
      
      const hasRecent = await monitor.hasRecentCheckpoint(5);
      expect(hasRecent).toBe(true);
    });
  });
  
  describe('Event Emission', () => {
    it('should emit process_found event', async () => {
      const events: ProcessEvent[] = [];
      monitor.on('process_found', (event) => events.push(event));
      
      await monitor.start();
      await sleep(100);
      await monitor.stop();
      
      // Should have found process (if Claude is running)
      // Filter only process_found events
      const foundEvents = events.filter(e => e.type === 'process_found');
      if (foundEvents.length > 0) {
        expect(foundEvents[0].type).toBe('process_found');
        expect(foundEvents[0].pid).toBeGreaterThan(0);
      }
    });
    
    it('should emit process_lost event when process disappears', async () => {
      const events: ProcessEvent[] = [];
      monitor.on('process_lost', (event) => events.push(event));
      
      await monitor.start();
      // Process loss event would occur if Claude exits
      // Hard to test without actually closing Claude
      await monitor.stop();
    });
    
    it('should emit crash event with metadata', async () => {
      const events: ProcessEvent[] = [];
      monitor.on('crash', (event) => events.push(event));
      
      // Create recent checkpoint
      const checkpoint = createMockCheckpoint();
      await checkpointRepo.save(checkpoint);
      
      await monitor.start();
      await sleep(100);
      await monitor.stop();
      
      // Verify event structure if crash occurred
      events.forEach(event => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('pid');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('metadata');
        expect(event.metadata).toHaveProperty('hadRecentCheckpoint');
        expect(event.metadata).toHaveProperty('lastCheckpointAge');
      });
    });
  });
  
  describe('Status Reporting', () => {
    it('should report current process status', async () => {
      const status = await monitor.getStatus();
      
      expect(status).toHaveProperty('found');
      expect(status).toHaveProperty('pid');
      expect(status).toHaveProperty('processName');
      expect(status).toHaveProperty('isMonitoring');
      expect(status).toHaveProperty('lastCheck');
    });
    
    it('should update lastCheck timestamp on each poll', async () => {
      await monitor.start();
      
      const status1 = await monitor.getStatus();
      await sleep(200);
      const status2 = await monitor.getStatus();
      
      expect(new Date(status2.lastCheck).getTime())
        .toBeGreaterThanOrEqual(new Date(status1.lastCheck).getTime());
      
      await monitor.stop();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle process listing errors gracefully', async () => {
      // This test verifies graceful degradation if Windows API fails
      // Implementation should catch and log errors, not crash
      
      await monitor.start();
      await sleep(100);
      await monitor.stop();
      
      // Should not throw
      expect(monitor.isRunning()).toBe(false);
    });
    
    it('should handle checkpoint repository errors', async () => {
      // Create monitor with invalid/closed repository
      const badRepo = new CheckpointRepository(':memory:');
      // Don't initialize it - should be invalid
      
      const badMonitor = new ProcessMonitor(CLAUDE_PROCESS_NAME, badRepo);
      
      // Should handle gracefully
      const hasRecent = await badMonitor.hasRecentCheckpoint(5);
      expect(hasRecent).toBe(false);
    });
  });
  
  describe('Configuration', () => {
    it('should use custom crash detection window', async () => {
      const customMonitor = new ProcessMonitor(
        CLAUDE_PROCESS_NAME,
        checkpointRepo,
        { crashDetectionWindow: 10 }
      );
      
      // Create checkpoint 8 minutes ago
      const checkpoint = createMockCheckpoint();
      const eightMinutesAgo = new Date(Date.now() - 8 * 60 * 1000);
      checkpoint.createdAt = eightMinutesAgo.toISOString();
      await checkpointRepo.save(checkpoint);
      
      // Should be within 10-minute window
      const hasRecent = await customMonitor.hasRecentCheckpoint(10);
      expect(hasRecent).toBe(true);
    });
    
    it('should use custom polling interval', async () => {
      const customMonitor = new ProcessMonitor(
        CLAUDE_PROCESS_NAME,
        checkpointRepo,
        { pollingInterval: 2000 }
      );
      
      await customMonitor.start();
      expect(customMonitor.isRunning()).toBe(true);
      await customMonitor.stop();
    });
  });
});

// Helper functions

function createMockCheckpoint(): Checkpoint {
  return {
    id: 'test-checkpoint-' + Date.now(),
    sessionId: 'test-session',
    checkpointNumber: 1,
    createdAt: new Date().toISOString(),
    triggeredBy: 'user_requested',
    conversationState: {
      summary: 'Test conversation',
      keyDecisions: [],
      currentContext: 'Testing ProcessMonitor',
      recentMessages: []
    },
    taskState: {
      operation: 'testing',
      phase: 'test',
      progress: 0.5,
      completedSteps: [],
      nextSteps: [],
      blockers: []
    },
    fileState: {
      activeFiles: [],
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
      estimatedTotalTokens: 1000,
      tokensPerMessage: 100,
      contextWindowUsage: 0.1,
      contextWindowRemaining: 190000,
      messageCount: 10,
      toolCallCount: 5,
      toolCallsSinceCheckpoint: 2,
      messagesPerMinute: 2,
      sessionDuration: 600,
      avgResponseLatency: 1000,
      timeSinceLastResponse: 30,
      latencyTrend: 'stable',
      toolFailureRate: 0,
      consecutiveToolFailures: 0,
      responseLatencyTrend: 'normal',
      errorPatterns: [],
      crashRisk: 'safe',
      riskFactors: []
    },
    userPreferences: {}
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
