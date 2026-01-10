/**
 * SignalCollector Test Suite
 * 
 * TDD Approach: Tests written BEFORE implementation
 * Spec: docs/specs/SPEC_CRASH_PREVENTION.md
 * 
 * Test Coverage:
 * 1. Signal Collection (Token, Message, Time, Behavior)
 * 2. Risk Assessment Algorithm
 * 3. Performance Targets (<5ms overhead)
 * 4. Edge Cases
 * 5. Threshold Validation
 */

import { SignalCollector } from './SignalCollector';
import type { CrashSignals, CrashRisk } from '../models/Checkpoint';

describe('SignalCollector', () => {
  let collector: SignalCollector;

  beforeEach(() => {
    collector = new SignalCollector();
  });

  // ============================================================================
  // 1. INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      expect(collector).toBeDefined();
    });

    it('should accept custom thresholds', () => {
      const customThresholds = {
        warningZone: {
          contextWindowUsage: 0.50,
          messageCount: 30,
          sessionDuration: 45 * 60 * 1000,
          toolCallsSinceCheckpoint: 8,
          toolFailureRate: 0.10,
        },
        dangerZone: {
          contextWindowUsage: 0.65,
          messageCount: 40,
          sessionDuration: 75 * 60 * 1000,
          toolCallsSinceCheckpoint: 12,
          toolFailureRate: 0.15,
        },
      };

      const customCollector = new SignalCollector(customThresholds);
      expect(customCollector).toBeDefined();
    });

    it('should start with zero counters', () => {
      const signals = collector.getSignals();
      
      expect(signals.messageCount).toBe(0);
      expect(signals.toolCallCount).toBe(0);
      expect(signals.toolCallsSinceCheckpoint).toBe(0);
      expect(signals.consecutiveToolFailures).toBe(0);
      expect(signals.estimatedTotalTokens).toBe(0);
    });

    it('should initialize crash risk as safe', () => {
      expect(collector.getCrashRisk()).toBe('safe');
    });
  });

  // ============================================================================
  // 2. TOKEN SIGNAL TESTS
  // ============================================================================

  describe('Token Signals', () => {
    it('should track token count for messages', () => {
      collector.onMessage('Hello world', 'user');
      const signals = collector.getSignals();
      
      expect(signals.estimatedTotalTokens).toBeGreaterThan(0);
    });

    it('should accumulate tokens across multiple messages', () => {
      collector.onMessage('First message', 'user');
      const tokensAfterFirst = collector.getSignals().estimatedTotalTokens;
      
      collector.onMessage('Second message', 'assistant');
      const tokensAfterSecond = collector.getSignals().estimatedTotalTokens;
      
      expect(tokensAfterSecond).toBeGreaterThan(tokensAfterFirst);
    });

    it('should calculate tokens per message average', () => {
      const message = 'This is a test message with some content';
      
      collector.onMessage(message, 'user');
      collector.onMessage(message, 'assistant');
      collector.onMessage(message, 'user');
      
      const signals = collector.getSignals();
      expect(signals.tokensPerMessage).toBeGreaterThan(0);
    });

    it('should calculate context window usage correctly', () => {
      // Simulate large conversation approaching context limit
      const largeMessage = 'word '.repeat(1000); // ~1000 tokens
      
      for (let i = 0; i < 50; i++) {
        collector.onMessage(largeMessage, i % 2 === 0 ? 'user' : 'assistant');
      }
      
      const signals = collector.getSignals();
      
      // Should be ~50,000 tokens out of 200,000 = 0.25
      expect(signals.contextWindowUsage).toBeGreaterThan(0.20);
      expect(signals.contextWindowUsage).toBeLessThan(0.30);
    });

    it('should calculate context window remaining', () => {
      collector.onMessage('Hello', 'user');
      const signals = collector.getSignals();
      
      const expectedRemaining = 200000 - signals.estimatedTotalTokens;
      expect(signals.contextWindowRemaining).toBe(expectedRemaining);
    });

    it('should use rolling window for tokens per message (last 20)', () => {
      // Add 25 messages (only last 20 should count)
      for (let i = 0; i < 25; i++) {
        const size = i < 5 ? 'small' : 'large message with many words';
        collector.onMessage(size, 'user');
      }
      
      const signals = collector.getSignals();
      
      // Average should reflect mostly "large" messages (last 20)
      // "large message with many words" = 5 tokens
      expect(signals.tokensPerMessage).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================================================
  // 3. MESSAGE SIGNAL TESTS
  // ============================================================================

  describe('Message Signals', () => {
    it('should increment message count', () => {
      collector.onMessage('Message 1', 'user');
      expect(collector.getSignals().messageCount).toBe(1);
      
      collector.onMessage('Message 2', 'assistant');
      expect(collector.getSignals().messageCount).toBe(2);
    });

    it('should track both user and assistant messages', () => {
      collector.onMessage('User message', 'user');
      collector.onMessage('Assistant response', 'assistant');
      
      expect(collector.getSignals().messageCount).toBe(2);
    });

    it('should increment tool call count', () => {
      collector.onToolCall('test_tool', {}, { success: true }, 100);
      expect(collector.getSignals().toolCallCount).toBe(1);
      
      collector.onToolCall('another_tool', {}, { success: true }, 150);
      expect(collector.getSignals().toolCallCount).toBe(2);
    });

    it('should track tool calls since checkpoint', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      collector.onToolCall('tool2', {}, { success: true }, 100);
      
      expect(collector.getSignals().toolCallsSinceCheckpoint).toBe(2);
    });

    it('should reset tool calls counter on checkpoint', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      collector.onToolCall('tool2', {}, { success: true }, 100);
      
      expect(collector.getSignals().toolCallsSinceCheckpoint).toBe(2);
      
      collector.resetCheckpointCounter();
      
      expect(collector.getSignals().toolCallsSinceCheckpoint).toBe(0);
      expect(collector.getSignals().toolCallCount).toBe(2); // Total unchanged
    });

    it('should calculate messages per minute', () => {
      // Simulate rapid message exchange
      const start = Date.now();
      
      for (let i = 0; i < 10; i++) {
        collector.onMessage(`Message ${i}`, 'user');
      }
      
      const signals = collector.getSignals();
      
      // Should show high activity rate
      expect(signals.messagesPerMinute).toBeGreaterThan(0);
    });

    it('should return 0 messages per minute with too few messages', () => {
      collector.onMessage('Only one', 'user');
      
      const signals = collector.getSignals();
      expect(signals.messagesPerMinute).toBe(0);
    });
  });

  // ============================================================================
  // 4. TIME SIGNAL TESTS
  // ============================================================================

  describe('Time Signals', () => {
    it('should track session duration', () => {
      const signals = collector.getSignals();
      
      expect(signals.sessionDuration).toBeGreaterThanOrEqual(0);
      expect(signals.sessionDuration).toBeLessThan(1000); // < 1 second for new session
    });

    it('should track time since last response', () => {
      collector.onMessage('Test', 'user');
      
      const signals = collector.getSignals();
      expect(signals.timeSinceLastResponse).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average response latency from tool calls', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      collector.onToolCall('tool2', {}, { success: true }, 200);
      collector.onToolCall('tool3', {}, { success: true }, 150);
      
      const signals = collector.getSignals();
      
      // Average = (100 + 200 + 150) / 3 = 150
      expect(signals.avgResponseLatency).toBe(150);
    });

    it('should detect increasing latency trend', () => {
      // Simulate degrading performance
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 100 + i * 50);
      }
      
      const signals = collector.getSignals();
      expect(signals.latencyTrend).toBe('increasing');
    });

    it('should detect decreasing latency trend', () => {
      // Simulate improving performance
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 500 - i * 40);
      }
      
      const signals = collector.getSignals();
      expect(signals.latencyTrend).toBe('decreasing');
    });

    it('should detect stable latency trend', () => {
      // Simulate consistent performance
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 100);
      }
      
      const signals = collector.getSignals();
      expect(signals.latencyTrend).toBe('stable');
    });

    it('should classify response latency as normal', () => {
      collector.onToolCall('tool1', {}, { success: true }, 1000);
      
      const signals = collector.getSignals();
      expect(signals.responseLatencyTrend).toBe('normal');
    });

    it('should classify response latency as degrading', () => {
      collector.onToolCall('tool1', {}, { success: true }, 3000);
      
      const signals = collector.getSignals();
      expect(signals.responseLatencyTrend).toBe('degrading');
    });

    it('should classify response latency as critical', () => {
      collector.onToolCall('tool1', {}, { success: true }, 6000);
      
      const signals = collector.getSignals();
      expect(signals.responseLatencyTrend).toBe('critical');
    });
  });

  // ============================================================================
  // 5. BEHAVIOR SIGNAL TESTS
  // ============================================================================

  describe('Behavior Signals', () => {
    it('should calculate tool failure rate', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      collector.onToolCall('tool2', {}, { error: 'Failed' }, 100);
      collector.onToolCall('tool3', {}, { success: true }, 100);
      collector.onToolCall('tool4', {}, { is_error: true }, 100);
      
      const signals = collector.getSignals();
      
      // 2 failures out of 4 = 0.50
      expect(signals.toolFailureRate).toBe(0.50);
    });

    it('should track consecutive tool failures', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      expect(collector.getSignals().consecutiveToolFailures).toBe(0);
      
      collector.onToolCall('tool2', {}, { error: 'Failed' }, 100);
      expect(collector.getSignals().consecutiveToolFailures).toBe(1);
      
      collector.onToolCall('tool3', {}, { error: 'Failed again' }, 100);
      expect(collector.getSignals().consecutiveToolFailures).toBe(2);
      
      collector.onToolCall('tool4', {}, { error: 'Still failing' }, 100);
      expect(collector.getSignals().consecutiveToolFailures).toBe(3);
      
      // Success should reset counter
      collector.onToolCall('tool5', {}, { success: true }, 100);
      expect(collector.getSignals().consecutiveToolFailures).toBe(0);
    });

    it('should use rolling window for failure rate (last 50)', () => {
      // Add 60 tool calls (only last 50 should count)
      for (let i = 0; i < 60; i++) {
        const result = i < 10 ? { error: 'Fail' } : { success: true };
        collector.onToolCall(`tool${i}`, {}, result, 100);
      }
      
      const signals = collector.getSignals();
      
      // Last 50 calls: 0 failures (first 10 discarded)
      expect(signals.toolFailureRate).toBe(0);
    });

    it('should track error patterns', () => {
      const signals = collector.getSignals();
      
      expect(Array.isArray(signals.errorPatterns)).toBe(true);
    });
  });

  // ============================================================================
  // 6. RISK ASSESSMENT TESTS
  // ============================================================================

  describe('Risk Assessment', () => {
    it('should assess safe risk with no signals', () => {
      expect(collector.getCrashRisk()).toBe('safe');
    });

    it('should assess warning risk with context usage at 60%', () => {
      // Simulate 60% context usage (120,000 tokens)
      const largeMessage = 'word '.repeat(6000); // ~6000 tokens
      
      for (let i = 0; i < 20; i++) {
        collector.onMessage(largeMessage, 'user');
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('warning');
    });

    it('should assess danger risk with context usage at 75%', () => {
      // Simulate 75% context usage (150,000 tokens)
      const largeMessage = 'word '.repeat(7500); // ~7500 tokens
      
      for (let i = 0; i < 20; i++) {
        collector.onMessage(largeMessage, 'user');
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('danger');
    });

    it('should assess warning risk with message count at 35', () => {
      for (let i = 0; i < 35; i++) {
        collector.onMessage(`Message ${i}`, 'user');
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('warning');
    });

    it('should assess danger risk with 2+ danger zone signals', () => {
      // Trigger multiple danger signals
      
      // 1. High message count (50+)
      for (let i = 0; i < 50; i++) {
        collector.onMessage(`Msg ${i}`, 'user');
      }
      
      // 2. High tool calls since checkpoint (15+)
      for (let i = 0; i < 15; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 100);
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('danger');
    });

    it('should assess warning risk with 1 danger signal', () => {
      // Only message count in danger zone
      for (let i = 0; i < 50; i++) {
        collector.onMessage(`Message ${i}`, 'user');
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('warning'); // 1 danger signal = warning
    });

    it('should assess warning risk with 3+ warning signals', () => {
      // Multiple warning signals but no danger
      
      // 1. Message count at warning (35)
      for (let i = 0; i < 35; i++) {
        collector.onMessage('msg', 'user');
      }
      
      // 2. Tool calls since checkpoint at warning (10)
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 100);
      }
      
      // 3. High tool failure rate (15%)
      for (let i = 0; i < 20; i++) {
        const result = i < 3 ? { error: 'fail' } : { success: true };
        collector.onToolCall(`fail_tool${i}`, {}, result, 100);
      }
      
      const risk = collector.getCrashRisk();
      expect(risk).toBe('warning');
    });

    it('should identify risk factors', () => {
      // Create high context usage
      const largeMessage = 'word '.repeat(8000);
      for (let i = 0; i < 20; i++) {
        collector.onMessage(largeMessage, 'user');
      }
      
      const signals = collector.getSignals();
      
      expect(Array.isArray(signals.riskFactors)).toBe(true);
      expect(signals.riskFactors.length).toBeGreaterThan(0);
      expect(signals.riskFactors.some(f => f.includes('Context window'))).toBe(true);
    });

    it('should include crashRisk in signals', () => {
      const signals = collector.getSignals();
      
      expect(signals.crashRisk).toBeDefined();
      expect(['safe', 'warning', 'danger']).toContain(signals.crashRisk);
    });
  });

  // ============================================================================
  // 7. PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should complete signal collection in <5ms', () => {
      const start = performance.now();
      
      collector.onToolCall('test', {}, { success: true }, 100);
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5);
    });

    it('should complete getSignals() in <5ms', () => {
      // Add some data first
      for (let i = 0; i < 20; i++) {
        collector.onMessage('test', 'user');
        collector.onToolCall('tool', {}, { success: true }, 100);
      }
      
      const start = performance.now();
      
      collector.getSignals();
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5);
    });

    it('should complete getCrashRisk() in <5ms', () => {
      // Add some data first
      for (let i = 0; i < 20; i++) {
        collector.onMessage('test', 'user');
      }
      
      const start = performance.now();
      
      collector.getCrashRisk();
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5);
    });

    it('should handle 100 messages without performance degradation', () => {
      const timings: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        collector.onMessage(`Message ${i}`, 'user');
        timings.push(performance.now() - start);
      }
      
      // Last 10 should be similar to first 10 (no degradation)
      const first10Avg = timings.slice(0, 10).reduce((a, b) => a + b) / 10;
      const last10Avg = timings.slice(-10).reduce((a, b) => a + b) / 10;
      
      // Allow 2x degradation but not more
      expect(last10Avg).toBeLessThan(first10Avg * 2);
    });
  });

  // ============================================================================
  // 8. EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      collector.onMessage('', 'user');
      
      const signals = collector.getSignals();
      expect(signals.messageCount).toBe(1);
      expect(signals.estimatedTotalTokens).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long messages', () => {
      const veryLongMessage = 'word '.repeat(100000);
      
      collector.onMessage(veryLongMessage, 'user');
      
      const signals = collector.getSignals();
      expect(signals.estimatedTotalTokens).toBeGreaterThan(50000);
    });

    it('should handle tool call with zero latency', () => {
      collector.onToolCall('instant', {}, { success: true }, 0);
      
      const signals = collector.getSignals();
      expect(signals.avgResponseLatency).toBe(0);
    });

    it('should handle tool call with very high latency', () => {
      collector.onToolCall('slow', {}, { success: true }, 30000);
      
      const signals = collector.getSignals();
      expect(signals.responseLatencyTrend).toBe('critical');
    });

    it('should handle 100% tool failure rate', () => {
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { error: 'fail' }, 100);
      }
      
      const signals = collector.getSignals();
      expect(signals.toolFailureRate).toBe(1.0);
    });

    it('should handle rapid checkpoint resets', () => {
      for (let i = 0; i < 100; i++) {
        collector.onToolCall('tool', {}, { success: true }, 100);
        collector.resetCheckpointCounter();
      }
      
      const signals = collector.getSignals();
      expect(signals.toolCallsSinceCheckpoint).toBe(0);
      expect(signals.toolCallCount).toBe(100);
    });

    it('should handle mixed success and error result formats', () => {
      collector.onToolCall('tool1', {}, { success: true }, 100);
      collector.onToolCall('tool2', {}, { error: 'fail' }, 100);
      collector.onToolCall('tool3', {}, { is_error: true }, 100);
      collector.onToolCall('tool4', {}, {}, 100); // No success/error field
      
      const signals = collector.getSignals();
      
      // Should handle gracefully without crashing
      expect(signals.toolFailureRate).toBeGreaterThan(0);
      expect(signals.toolFailureRate).toBeLessThanOrEqual(1.0);
    });
  });

  // ============================================================================
  // 9. INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should handle realistic conversation flow', () => {
      // Simulate real conversation
      collector.onMessage('Hello, I need help with a task', 'user');
      collector.onMessage('Sure! What do you need help with?', 'assistant');
      
      collector.onToolCall('search_files', { pattern: 'test' }, { success: true }, 150);
      
      collector.onMessage('Can you read this file?', 'user');
      collector.onToolCall('read_file', { path: 'test.ts' }, { success: true }, 200);
      
      collector.onMessage('Here is the content...', 'assistant');
      
      const signals = collector.getSignals();
      
      expect(signals.messageCount).toBe(4);
      expect(signals.toolCallCount).toBe(2);
      expect(signals.crashRisk).toBe('safe');
    });

    it('should detect approaching context limit', () => {
      // Simulate long-running conversation
      const message = 'word '.repeat(5000); // ~5000 tokens
      
      for (let i = 0; i < 30; i++) {
        collector.onMessage(message, i % 2 === 0 ? 'user' : 'assistant');
      }
      
      const signals = collector.getSignals();
      
      // ~150,000 tokens = 75% of context
      expect(signals.crashRisk).toBe('danger');
      expect(signals.riskFactors).toContain('Context window usage critical');
    });

    it('should detect tool failure spike', () => {
      // Normal operation
      for (let i = 0; i < 10; i++) {
        collector.onToolCall(`tool${i}`, {}, { success: true }, 100);
      }
      
      // Sudden failures
      for (let i = 0; i < 5; i++) {
        collector.onToolCall(`fail${i}`, {}, { error: 'crash' }, 100);
      }
      
      const signals = collector.getSignals();
      
      // 5/15 = 33% failure rate (above 20% danger threshold)
      expect(signals.toolFailureRate).toBeGreaterThan(0.20);
      expect(signals.crashRisk).toBe('danger');
    });
  });
});
