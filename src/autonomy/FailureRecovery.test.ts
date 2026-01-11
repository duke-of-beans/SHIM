/**
 * FailureRecovery Tests
 *
 * Tests for intelligent failure handling and retry strategies.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Gracefully recover from failures with smart retry logic.
 */

import { FailureRecovery, RetryStrategy, FailureType, RecoveryAttempt } from './FailureRecovery';

describe('FailureRecovery', () => {
  let recovery: FailureRecovery;

  beforeEach(() => {
    recovery = new FailureRecovery({
      initialDelayMs: 10, // Fast delays for testing
      maxDelayMs: 100,
    });
  });

  describe('Construction', () => {
    it('should create FailureRecovery instance', () => {
      expect(recovery).toBeInstanceOf(FailureRecovery);
    });

    it('should accept custom configuration', () => {
      const customRecovery = new FailureRecovery({
        maxRetries: 5,
        initialDelayMs: 2000,
        strategy: 'linear',
      });

      expect(customRecovery).toBeInstanceOf(FailureRecovery);
    });
  });

  describe('Failure Classification', () => {
    it('should classify transient failures', () => {
      const error = new Error('Network timeout');
      const failureType = recovery.classifyFailure(error);

      expect(failureType).toBe('transient');
    });

    it('should classify permanent failures', () => {
      const error = new Error('Invalid credentials');
      const failureType = recovery.classifyFailure(error);

      expect(failureType).toBe('permanent');
    });

    it('should classify unknown failures as transient by default', () => {
      const error = new Error('Unknown error');
      const failureType = recovery.classifyFailure(error);

      expect(failureType).toBe('transient');
    });
  });

  describe('Retry Strategy - Exponential Backoff', () => {
    it('should calculate exponential backoff delays', () => {
      const exponentialRecovery = new FailureRecovery({
        strategy: 'exponential',
        initialDelayMs: 100,
      });

      const delay1 = exponentialRecovery.calculateDelay(1);
      const delay2 = exponentialRecovery.calculateDelay(2);
      const delay3 = exponentialRecovery.calculateDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay2).toBe(delay1 * 2); // Exponential growth
    });

    it('should cap exponential backoff at max delay', () => {
      const exponentialRecovery = new FailureRecovery({
        strategy: 'exponential',
        initialDelayMs: 100,
        maxDelayMs: 1000,
      });

      const delay10 = exponentialRecovery.calculateDelay(10);

      expect(delay10).toBeLessThanOrEqual(1000);
    });
  });

  describe('Retry Strategy - Linear Backoff', () => {
    it('should calculate linear backoff delays', () => {
      const linearRecovery = new FailureRecovery({
        strategy: 'linear',
        initialDelayMs: 100,
      });

      const delay1 = linearRecovery.calculateDelay(1);
      const delay2 = linearRecovery.calculateDelay(2);
      const delay3 = linearRecovery.calculateDelay(3);

      expect(delay2).toBe(delay1 + 100); // Linear growth
      expect(delay3).toBe(delay2 + 100);
    });
  });

  describe('Retry Strategy - Fixed Interval', () => {
    it('should use fixed delay for all retries', () => {
      const fixedRecovery = new FailureRecovery({
        strategy: 'fixed',
        initialDelayMs: 500,
      });

      const delay1 = fixedRecovery.calculateDelay(1);
      const delay2 = fixedRecovery.calculateDelay(2);
      const delay3 = fixedRecovery.calculateDelay(3);

      expect(delay1).toBe(500);
      expect(delay2).toBe(500);
      expect(delay3).toBe(500);
    });
  });

  describe('Retry Execution', () => {
    it('should retry transient failures', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network timeout');
        }
        return 'success';
      };

      const result = await recovery.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry permanent failures', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Invalid credentials');
      };

      await expect(recovery.executeWithRetry(operation)).rejects.toThrow('Invalid credentials');
      expect(attempts).toBe(1); // Only one attempt for permanent failures
    });

    it('should respect max retry limit', async () => {
      const limitedRecovery = new FailureRecovery({ maxRetries: 2 });
      let attempts = 0;

      const operation = async () => {
        attempts++;
        throw new Error('Network timeout');
      };

      await expect(limitedRecovery.executeWithRetry(operation)).rejects.toThrow();
      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should return result on first success', async () => {
      const operation = async () => 'immediate success';

      const result = await recovery.executeWithRetry(operation);

      expect(result).toBe('immediate success');
    });
  });

  describe('Recovery History', () => {
    it('should log recovery attempts', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network timeout');
        }
        return 'success';
      };

      await recovery.executeWithRetry(operation, 'test-operation');

      const history = recovery.getRecoveryHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include timestamps in history', async () => {
      const operation = async () => {
        throw new Error('Network timeout');
      };

      try {
        await recovery.executeWithRetry(operation, 'test-op');
      } catch {
        // Expected to fail
      }

      const history = recovery.getRecoveryHistory();
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should track success vs failure', async () => {
      const successOp = async () => 'success';
      await recovery.executeWithRetry(successOp, 'success-op');

      const failOp = async () => {
        throw new Error('Invalid credentials');
      };
      try {
        await recovery.executeWithRetry(failOp, 'fail-op');
      } catch {
        // Expected
      }

      const history = recovery.getRecoveryHistory();
      const successRecord = history.find((r) => r.operationId === 'success-op');
      const failRecord = history.find((r) => r.operationId === 'fail-op');

      expect(successRecord?.succeeded).toBe(true);
      expect(failRecord?.succeeded).toBe(false);
    });

    it('should record attempt count', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network timeout');
        }
        return 'success';
      };

      await recovery.executeWithRetry(operation, 'multi-attempt-op');

      const history = recovery.getRecoveryHistory();
      const record = history.find((r) => r.operationId === 'multi-attempt-op');

      expect(record?.attemptCount).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should track success rate', async () => {
      const successOp = async () => 'success';
      await recovery.executeWithRetry(successOp);
      await recovery.executeWithRetry(successOp);

      const failOp = async () => {
        throw new Error('Invalid credentials');
      };
      try {
        await recovery.executeWithRetry(failOp);
      } catch {
        // Expected
      }

      const stats = recovery.getStatistics();
      expect(stats.successRate).toBeCloseTo(0.666, 2); // 2/3 = 66.6%
    });

    it('should track total operations', async () => {
      const operation = async () => 'success';
      await recovery.executeWithRetry(operation);
      await recovery.executeWithRetry(operation);
      await recovery.executeWithRetry(operation);

      const stats = recovery.getStatistics();
      expect(stats.totalOperations).toBe(3);
    });

    it('should track retry statistics', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network timeout');
        }
        return 'success';
      };

      await recovery.executeWithRetry(operation);

      const stats = recovery.getStatistics();
      expect(stats.totalRetries).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker', () => {
    it('should detect consecutive failures', async () => {
      const alwaysFail = async () => {
        throw new Error('Service unavailable');
      };

      for (let i = 0; i < 5; i++) {
        try {
          await recovery.executeWithRetry(alwaysFail);
        } catch {
          // Expected
        }
      }

      const isCircuitOpen = recovery.isCircuitOpen();
      expect(isCircuitOpen).toBe(true);
    });

    it('should reset circuit after success', async () => {
      const failThenSucceed = async () => 'success';

      await recovery.executeWithRetry(failThenSucceed);

      const isCircuitOpen = recovery.isCircuitOpen();
      expect(isCircuitOpen).toBe(false);
    });

    it('should throw immediately when circuit is open', async () => {
      const circuitRecovery = new FailureRecovery({ 
        circuitBreakerThreshold: 2,
        initialDelayMs: 10, // Fast delays
        maxDelayMs: 50,
      });

      const alwaysFail = async () => {
        throw new Error('Service unavailable');
      };

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitRecovery.executeWithRetry(alwaysFail);
        } catch {
          // Expected
        }
      }

      // Next call should fail immediately
      const startTime = Date.now();
      try {
        await circuitRecovery.executeWithRetry(alwaysFail);
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100); // Should fail fast
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle synchronous errors', async () => {
      const operation = () => {
        throw new Error('Sync error');
      };

      await expect(recovery.executeWithRetry(operation as any)).rejects.toThrow('Sync error');
    });

    it('should preserve error messages', async () => {
      const operation = async () => {
        throw new Error('Specific error message');
      };

      await expect(recovery.executeWithRetry(operation)).rejects.toThrow('Specific error message');
    });

    it('should handle non-Error throws', async () => {
      const operation = async () => {
        throw 'String error';
      };

      await expect(recovery.executeWithRetry(operation)).rejects.toBe('String error');
    });
  });

  describe('Configuration', () => {
    it('should use custom max retries', async () => {
      const customRecovery = new FailureRecovery({ maxRetries: 1 });
      let attempts = 0;

      const operation = async () => {
        attempts++;
        throw new Error('Network timeout');
      };

      try {
        await customRecovery.executeWithRetry(operation);
      } catch {
        // Expected
      }

      expect(attempts).toBe(2); // Initial + 1 retry
    });

    it('should use custom initial delay', async () => {
      const customRecovery = new FailureRecovery({
        initialDelayMs: 50,
        strategy: 'fixed',
      });

      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network timeout');
        }
        return 'success';
      };

      const startTime = Date.now();
      await customRecovery.executeWithRetry(operation);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Jitter', () => {
    it('should add jitter to delays when enabled', () => {
      const jitterRecovery = new FailureRecovery({
        strategy: 'fixed',
        initialDelayMs: 100,
        jitter: true,
      });

      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(jitterRecovery.calculateDelay(1));
      }

      // With jitter, delays should vary
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should keep delays within reasonable bounds with jitter', () => {
      const jitterRecovery = new FailureRecovery({
        strategy: 'fixed',
        initialDelayMs: 100,
        jitter: true,
      });

      for (let i = 0; i < 20; i++) {
        const delay = jitterRecovery.calculateDelay(1);
        expect(delay).toBeGreaterThanOrEqual(50); // 50% of base
        expect(delay).toBeLessThanOrEqual(150); // 150% of base
      }
    });
  });
});
