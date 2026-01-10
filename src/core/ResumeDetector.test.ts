/**
 * Resume Detection System - Tests
 * 
 * Tests crash detection, resume decision logic, and resume prompt generation.
 */

import { ResumeDetector } from './ResumeDetector';
import { CheckpointRepository } from './CheckpointRepository';
import { Checkpoint } from '../models/Checkpoint';
import * as fs from 'fs';
import * as path from 'path';

describe('ResumeDetector', () => {
  let testDbPath: string;
  let checkpointRepo: CheckpointRepository;
  let resumeDetector: ResumeDetector;
  const sessionId = 'test-session-resume';

  beforeEach(async () => {
    // Create unique test database
    testDbPath = path.join(process.cwd(), 'test-data', `resume-${Date.now()}.db`);
    
    checkpointRepo = new CheckpointRepository(testDbPath);
    await checkpointRepo.initialize();
    
    resumeDetector = new ResumeDetector(checkpointRepo);
  });

  afterEach(async () => {
    await checkpointRepo.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Resume detection', () => {
    it('should detect no resume needed when no checkpoints exist', async () => {
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.shouldResume).toBe(false);
      expect(detection.lastCheckpoint).toBeNull();
      expect(detection.confidence).toBe(0);
    });

    it('should detect resume needed when unrestored checkpoint exists', async () => {
      // Create checkpoint without restoration - use warning level for higher confidence
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test operation',
        progress: 0.5,
        crashRisk: 'warning' // Warning risk = higher confidence
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.shouldResume).toBe(true);
      expect(detection.lastCheckpoint).toBeDefined();
      expect(detection.lastCheckpoint!.id).toBe(checkpoint.id);
      expect(detection.confidence).toBeGreaterThan(0.8);
    });

    it('should not detect resume when checkpoint already restored', async () => {
      // Create checkpoint and mark as restored
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test operation',
        progress: 0.5,
        restored: true
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.shouldResume).toBe(false);
      expect(detection.confidence).toBe(0);
    });

    it('should calculate time since interruption correctly', async () => {
      const testTime = new Date('2026-01-10T10:00:00Z');
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        timestamp: testTime
      });
      
      // Fast-forward time by mocking Date.now
      const nowTime = new Date('2026-01-10T10:05:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(nowTime.getTime());
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.timeSinceInterruption).toBe(5 * 60 * 1000); // 5 minutes in ms
      
      jest.restoreAllMocks();
    });
  });

  describe('Interruption reason classification', () => {
    it('should classify as crash when risk was danger', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'danger'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.interruptionReason).toBe('crash');
      expect(detection.confidence).toBeGreaterThan(0.9);
    });

    it('should classify as crash when risk was warning', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'warning'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.interruptionReason).toBe('crash');
      expect(detection.confidence).toBeGreaterThan(0.7);
    });

    it('should classify as timeout when session was very long', async () => {
      const longAgo = new Date();
      longAgo.setHours(longAgo.getHours() - 2); // 2 hours ago
      
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'safe',
        timestamp: longAgo,
        sessionDuration: 95 * 60 * 1000 // 95 minutes > 90 minute threshold
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.interruptionReason).toBe('timeout');
    });

    it('should classify as manual_exit when progress was complete', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 1.0, // 100% complete
        crashRisk: 'safe'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.interruptionReason).toBe('manual_exit');
    });

    it('should classify as unknown for ambiguous cases', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'safe'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      
      expect(detection.interruptionReason).toBe('unknown');
      expect(detection.confidence).toBeLessThan(0.5);
    });
  });

  describe('Resume prompt generation', () => {
    it('should generate complete resume prompt from checkpoint', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'implementing feature X',
        progress: 0.75,
        crashRisk: 'danger',
        conversationSummary: 'Discussed architecture for feature X',
        nextSteps: ['Write tests', 'Implement core logic'],
        activeFiles: ['src/core/FeatureX.ts'],
        recentToolCalls: ['read_file', 'write_file']
      });
      
      const prompt = await resumeDetector.generateResumePrompt(checkpoint);
      
      expect(prompt).toBeDefined();
      expect(prompt.sections.situation).toContain('crash');
      expect(prompt.sections.progress).toContain('implementing feature X');
      expect(prompt.sections.progress).toContain('75%');
      expect(prompt.sections.context).toContain('Discussed architecture for feature X');
      expect(prompt.sections.next).toContain('Write tests');
      expect(prompt.sections.next).toContain('Implement core logic');
      expect(prompt.sections.files).toContain('src/core/FeatureX.ts');
      expect(prompt.sections.tools).toContain('read_file');
    });

    it('should format situation based on interruption reason', async () => {
      const checkpointDanger = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'danger'
      });
      
      const promptCrash = await resumeDetector.generateResumePrompt(checkpointDanger);
      expect(promptCrash.sections.situation).toContain('crash');
      
      const checkpointComplete = await createTestCheckpoint(checkpointRepo, `${sessionId}-2`, {
        operation: 'test',
        progress: 1.0,
        crashRisk: 'safe'
      });
      
      const promptExit = await resumeDetector.generateResumePrompt(checkpointComplete);
      expect(promptExit.sections.situation).toContain('manual');
    });

    it('should handle missing optional checkpoint fields gracefully', async () => {
      const minimal = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5
      });
      
      const prompt = await resumeDetector.generateResumePrompt(minimal);
      
      expect(prompt).toBeDefined();
      expect(prompt.sections.situation).toBeDefined();
      expect(prompt.sections.progress).toBeDefined();
      // Optional fields should have default empty values
      expect(prompt.sections.next).toBeDefined();
      expect(prompt.sections.files).toBeDefined();
    });
  });

  describe('Confidence calculation', () => {
    it('should have high confidence for danger-level crashes', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'danger'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      expect(detection.confidence).toBeGreaterThan(0.9);
    });

    it('should have medium confidence for warning-level crashes', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'warning'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      expect(detection.confidence).toBeGreaterThan(0.7);
      expect(detection.confidence).toBeLessThanOrEqual(0.9);
    });

    it('should have low confidence for ambiguous cases', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'safe'
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      expect(detection.confidence).toBeLessThan(0.5);
    });

    it('should factor in time since interruption', async () => {
      const recentTime = new Date();
      recentTime.setMinutes(recentTime.getMinutes() - 2); // 2 minutes ago
      
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        crashRisk: 'danger',
        timestamp: recentTime
      });
      
      const detection = await resumeDetector.checkResume(sessionId);
      expect(detection.confidence).toBeGreaterThan(0.95); // Very recent + danger
    });
  });

  describe('Performance', () => {
    it('should detect resume in under 100ms', async () => {
      await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5
      });
      
      const start = Date.now();
      await resumeDetector.checkResume(sessionId);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should generate prompt in under 50ms', async () => {
      const checkpoint = await createTestCheckpoint(checkpointRepo, sessionId, {
        operation: 'test',
        progress: 0.5,
        conversationSummary: 'Long conversation summary...',
        nextSteps: ['Step 1', 'Step 2', 'Step 3']
      });
      
      const start = Date.now();
      await resumeDetector.generateResumePrompt(checkpoint);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });
});

/**
 * Helper function to create test checkpoints with default values
 */
async function createTestCheckpoint(
  repo: CheckpointRepository,
  sessionId: string,
  options: {
    operation: string;
    progress: number;
    crashRisk?: 'safe' | 'warning' | 'danger';
    timestamp?: Date;
    restored?: boolean;
    conversationSummary?: string;
    nextSteps?: string[];
    activeFiles?: string[];
    recentToolCalls?: string[];
    sessionDuration?: number;
  }
): Promise<Checkpoint> {
  const checkpoint: Checkpoint = {
    id: `ckpt-${Date.now()}-${Math.random()}`,
    sessionId,
    checkpointNumber: 1,
    createdAt: (options.timestamp || new Date()).toISOString(),
    triggeredBy: 'danger_zone',
    conversationState: {
      summary: options.conversationSummary || 'Test conversation',
      keyDecisions: [],
      currentContext: 'Test context',
      recentMessages: []
    },
    taskState: {
      operation: options.operation,
      phase: 'implementation',
      progress: options.progress,
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
      sessionDuration: options.sessionDuration || 600000,
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
  
  if (options.restored) {
    await repo.markRestored(checkpointId, true, 0.95);
  }
  
  // Retrieve full checkpoint to return
  const saved = await repo.getById(checkpointId);
  if (!saved) {
    throw new Error(`Failed to retrieve saved checkpoint ${checkpointId}`);
  }
  
  return saved;
}
