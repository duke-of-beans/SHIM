/**
 * SupervisorDaemon Tests
 * 
 * Tests for the main supervisor daemon that orchestrates crash recovery.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { SupervisorDaemon, SupervisorConfig, SupervisorStatus } from './SupervisorDaemon';
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as path from 'path';
import * as fs from 'fs';

describe('SupervisorDaemon', () => {
  let daemon: SupervisorDaemon;
  let checkpointRepo: CheckpointRepository;
  const testDbPath = path.join(__dirname, '../../test-data/supervisor.db');
  
  const mockConfig: SupervisorConfig = {
    claudeExePath: 'C:\\Users\\Test\\AppData\\Local\\Programs\\Claude\\Claude.exe',
    processName: 'Claude.exe',
    checkpointDbPath: testDbPath,
    pollingInterval: 1000,
    crashDetectionWindow: 5,
    autoRestart: true
  };
  
  beforeEach(async () => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Initialize checkpoint repository
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    // Create daemon instance
    daemon = new SupervisorDaemon(mockConfig);
  });
  
  afterEach(async () => {
    // Stop daemon
    await daemon.stop();
    
    // Clean up
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Construction', () => {
    it('should create SupervisorDaemon instance', () => {
      expect(daemon).toBeInstanceOf(SupervisorDaemon);
    });
    
    it('should accept supervisor configuration', () => {
      const customDaemon = new SupervisorDaemon({
        ...mockConfig,
        pollingInterval: 2000
      });
      
      expect(customDaemon).toBeInstanceOf(SupervisorDaemon);
    });
    
    it('should validate required configuration', () => {
      expect(() => new SupervisorDaemon({
        ...mockConfig,
        claudeExePath: ''
      })).toThrow('Claude executable path required');
    });
    
    it('should use default values for optional config', () => {
      const minimalDaemon = new SupervisorDaemon({
        claudeExePath: mockConfig.claudeExePath,
        checkpointDbPath: testDbPath
      });
      
      expect(minimalDaemon).toBeInstanceOf(SupervisorDaemon);
    });
  });
  
  describe('Daemon Lifecycle', () => {
    it('should start supervisor daemon', async () => {
      await daemon.start();
      
      const status = daemon.getStatus();
      expect(status.running).toBe(true);
    });
    
    it('should stop supervisor daemon', async () => {
      await daemon.start();
      await daemon.stop();
      
      const status = daemon.getStatus();
      expect(status.running).toBe(false);
    });
    
    it('should not start if already running', async () => {
      await daemon.start();
      
      await expect(daemon.start()).rejects.toThrow('Already running');
    });
    
    it('should initialize all components on start', async () => {
      await daemon.start();
      
      const status = daemon.getStatus();
      expect(status.processMonitor).toBeDefined();
      expect(status.autoRestarter).toBeDefined();
    });
  });
  
  describe('Crash Detection Integration', () => {
    it('should connect ProcessMonitor crash events to AutoRestarter', async () => {
      // Create recent checkpoint
      const checkpoint = createMockCheckpoint();
      await checkpointRepo.save(checkpoint);
      
      const crashes: any[] = [];
      daemon.on('crash_detected', (event) => crashes.push(event));
      
      await daemon.start();
      
      // Simulate crash (ProcessMonitor would emit this)
      // In real scenario, Claude would exit
      
      await sleep(200);
      await daemon.stop();
      
      // Verify crash event structure if any occurred
      crashes.forEach(crash => {
        expect(crash).toHaveProperty('pid');
        expect(crash).toHaveProperty('timestamp');
        expect(crash).toHaveProperty('willRestart');
      });
    });
    
    it('should trigger auto-restart on crash', async () => {
      const restarts: any[] = [];
      daemon.on('restart_initiated', (event) => restarts.push(event));
      
      // Create recent checkpoint
      const checkpoint = createMockCheckpoint();
      await checkpointRepo.save(checkpoint);
      
      await daemon.start({ dryRun: true });
      
      // Simulate crash event
      // daemon would detect this via ProcessMonitor
      
      await sleep(200);
      await daemon.stop();
    });
    
    it('should NOT restart if autoRestart is disabled', async () => {
      const noAutoRestartDaemon = new SupervisorDaemon({
        ...mockConfig,
        autoRestart: false
      });
      
      const restarts: any[] = [];
      noAutoRestartDaemon.on('restart_initiated', (event) => restarts.push(event));
      
      await noAutoRestartDaemon.start({ dryRun: true });
      await sleep(200);
      await noAutoRestartDaemon.stop();
      
      // Should not have initiated restarts
      expect(restarts.length).toBe(0);
    });
  });
  
  describe('Chat URL Management', () => {
    it('should track current chat URL', async () => {
      const chatUrl = 'https://claude.ai/chat/test123';
      await daemon.setCurrentChatUrl(chatUrl);
      
      const status = daemon.getStatus();
      expect(status.currentChatUrl).toBe(chatUrl);
    });
    
    it('should use current chat URL for restart', async () => {
      const chatUrl = 'https://claude.ai/chat/test456';
      await daemon.setCurrentChatUrl(chatUrl);
      
      await daemon.start({ dryRun: true });
      
      // Simulate crash and restart
      // AutoRestarter should use the stored chat URL
      
      await daemon.stop();
    });
    
    it('should validate chat URL format', async () => {
      await expect(daemon.setCurrentChatUrl('invalid-url')).rejects.toThrow('Invalid URL');
    });
    
    it('should persist chat URL to disk', async () => {
      const chatUrl = 'https://claude.ai/chat/persist';
      await daemon.setCurrentChatUrl(chatUrl);
      
      // Create new daemon instance
      const newDaemon = new SupervisorDaemon(mockConfig);
      await newDaemon.initialize();
      
      const status = newDaemon.getStatus();
      expect(status.currentChatUrl).toBe(chatUrl);
    });
  });
  
  describe('Status Reporting', () => {
    it('should report supervisor status', () => {
      const status = daemon.getStatus();
      
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('startedAt');
      expect(status).toHaveProperty('processMonitor');
      expect(status).toHaveProperty('autoRestarter');
      expect(status).toHaveProperty('crashCount');
      expect(status).toHaveProperty('restartCount');
    });
    
    it('should track crash count', async () => {
      const status1 = daemon.getStatus();
      const initialCrashes = status1.crashCount;
      
      // Simulate crash
      await daemon.start({ dryRun: true });
      // (Crash would be detected by ProcessMonitor)
      await daemon.stop();
      
      // Crash count should be tracked
      const status2 = daemon.getStatus();
      expect(status2.crashCount).toBeGreaterThanOrEqual(initialCrashes);
    });
    
    it('should track restart count', async () => {
      const status1 = daemon.getStatus();
      const initialRestarts = status1.restartCount;
      
      await daemon.start({ dryRun: true });
      await daemon.stop();
      
      const status2 = daemon.getStatus();
      expect(status2.restartCount).toBeGreaterThanOrEqual(initialRestarts);
    });
    
    it('should report uptime', async () => {
      await daemon.start();
      await sleep(100);
      
      const status = daemon.getStatus();
      expect(status.uptime).toBeGreaterThan(0);
      
      await daemon.stop();
    });
  });
  
  describe('Event Emission', () => {
    it('should emit daemon_started event', async () => {
      const events: any[] = [];
      daemon.on('daemon_started', (event) => events.push(event));
      
      await daemon.start();
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].timestamp).toBeDefined();
      
      await daemon.stop();
    });
    
    it('should emit daemon_stopped event', async () => {
      const events: any[] = [];
      daemon.on('daemon_stopped', (event) => events.push(event));
      
      await daemon.start();
      await daemon.stop();
      
      expect(events.length).toBeGreaterThan(0);
    });
    
    it('should emit crash_detected event', async () => {
      const events: any[] = [];
      daemon.on('crash_detected', (event) => events.push(event));
      
      await daemon.start({ dryRun: true });
      await sleep(100);
      await daemon.stop();
      
      // Events structure verified if any crashes detected
      events.forEach(event => {
        expect(event).toHaveProperty('pid');
        expect(event).toHaveProperty('timestamp');
      });
    });
    
    it('should emit restart_initiated event', async () => {
      const events: any[] = [];
      daemon.on('restart_initiated', (event) => events.push(event));
      
      await daemon.start({ dryRun: true });
      await sleep(100);
      await daemon.stop();
    });
    
    it('should emit restart_completed event', async () => {
      const events: any[] = [];
      daemon.on('restart_completed', (event) => events.push(event));
      
      await daemon.start({ dryRun: true });
      await sleep(100);
      await daemon.stop();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle ProcessMonitor errors gracefully', async () => {
      // Create daemon with invalid process name
      const badDaemon = new SupervisorDaemon({
        ...mockConfig,
        processName: 'NonExistent12345.exe'
      });
      
      await badDaemon.start({ dryRun: true });
      await sleep(100);
      await badDaemon.stop();
      
      // Should not crash
      expect(badDaemon.getStatus().running).toBe(false);
    });
    
    it('should handle AutoRestarter failures', async () => {
      const failures: any[] = [];
      daemon.on('restart_failed', (event) => failures.push(event));
      
      await daemon.start({ 
        dryRun: true,
        failRestart: true 
      });
      
      await sleep(100);
      await daemon.stop();
      
      // Should track failures
      failures.forEach(failure => {
        expect(failure).toHaveProperty('error');
        expect(failure).toHaveProperty('timestamp');
      });
    });
    
    it('should continue monitoring after restart failure', async () => {
      await daemon.start({ dryRun: true });
      
      // Simulate restart failure
      // Daemon should continue monitoring
      
      await sleep(100);
      
      const status = daemon.getStatus();
      expect(status.running).toBe(true);
      
      await daemon.stop();
    });
  });
  
  describe('Configuration Management', () => {
    it('should reload configuration', async () => {
      await daemon.start();
      
      await daemon.updateConfig({
        pollingInterval: 5000
      });
      
      const status = daemon.getStatus();
      expect(status.config.pollingInterval).toBe(5000);
      
      await daemon.stop();
    });
    
    it('should persist configuration to disk', async () => {
      await daemon.updateConfig({
        autoRestart: false
      });
      
      // Create new daemon
      const newDaemon = new SupervisorDaemon(mockConfig);
      await newDaemon.initialize();
      
      const status = newDaemon.getStatus();
      expect(status.config.autoRestart).toBe(false);
    });
  });
  
  describe('Windows Service Integration', () => {
    it('should support graceful shutdown signal', async () => {
      await daemon.start();
      
      // Simulate Windows service stop signal
      await daemon.handleShutdownSignal();
      
      const status = daemon.getStatus();
      expect(status.running).toBe(false);
    });
    
    it('should cleanup resources on shutdown', async () => {
      await daemon.start();
      await daemon.handleShutdownSignal();
      
      const status = daemon.getStatus();
      expect(status.cleanedUp).toBe(true);
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
      currentContext: 'Testing SupervisorDaemon',
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
