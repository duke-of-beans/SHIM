/**
 * StateSynchronizer Test Suite
 * 
 * Tests distributed state synchronization across multiple chat instances.
 * 
 * Features tested:
 * - State read/write operations
 * - Conflict detection and resolution
 * - Version management (optimistic locking)
 * - Atomic updates
 * - State expiration (TTL)
 */

import { StateSynchronizer } from './StateSynchronizer';
import { RedisConnectionManager } from './RedisConnectionManager';

describe('StateSynchronizer', () => {
  let synchronizer: StateSynchronizer;
  let redisManager: RedisConnectionManager;
  const testNamespace = 'test';

  beforeEach(async () => {
    // Use test Redis connection
    redisManager = new RedisConnectionManager({
      host: 'localhost',
      port: 6379,
      db: 1, // Test database
      keyPrefix: 'shim:test:',
      lazyConnect: true,
    });
    
    await redisManager.connect();
    
    // Clear test database
    const client = redisManager.getClient();
    await client.flushdb();
    
    synchronizer = new StateSynchronizer(redisManager);
  });

  afterEach(async () => {
    await synchronizer.cleanup();
    await redisManager.disconnect();
  });

  describe('Basic State Operations', () => {
    it('should set and get state', async () => {
      const key = 'session-001';
      const state = { activeTask: 'task-001', progress: 0.5 };
      
      await synchronizer.setState(testNamespace, key, state);
      const retrieved = await synchronizer.getState(testNamespace, key);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.activeTask).toBe('task-001');
      expect(retrieved?.progress).toBe(0.5);
    });

    it('should return null for non-existent state', async () => {
      const state = await synchronizer.getState(testNamespace, 'non-existent');
      expect(state).toBeNull();
    });

    it('should delete state', async () => {
      const key = 'session-002';
      const state = { data: 'test' };
      
      await synchronizer.setState(testNamespace, key, state);
      await synchronizer.deleteState(testNamespace, key);
      
      const retrieved = await synchronizer.getState(testNamespace, key);
      expect(retrieved).toBeNull();
    });

    it('should handle complex nested state objects', async () => {
      const key = 'complex-state';
      const state = {
        user: { id: 'user-001', name: 'Test User' },
        tasks: [
          { id: 'task-1', status: 'complete' },
          { id: 'task-2', status: 'pending' }
        ],
        metadata: {
          created: Date.now(),
          updated: Date.now()
        }
      };
      
      await synchronizer.setState(testNamespace, key, state);
      const retrieved = await synchronizer.getState(testNamespace, key);
      
      expect(retrieved).toEqual(state);
    });
  });

  describe('Version Management', () => {
    it('should track state version', async () => {
      const key = 'versioned-state';
      const state = { value: 1 };
      
      const version1 = await synchronizer.setState(testNamespace, key, state);
      expect(version1).toBe(1);
      
      const version2 = await synchronizer.setState(testNamespace, key, { value: 2 });
      expect(version2).toBe(2);
    });

    it('should get state with version', async () => {
      const key = 'versioned-state-2';
      const state = { value: 'test' };
      
      await synchronizer.setState(testNamespace, key, state);
      const retrieved = await synchronizer.getStateWithVersion(testNamespace, key);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.state).toEqual(state);
      expect(retrieved?.version).toBe(1);
    });

    it('should support optimistic locking with expected version', async () => {
      const key = 'optimistic-lock';
      const initialState = { counter: 0 };
      
      // Initial set
      const v1 = await synchronizer.setState(testNamespace, key, initialState);
      expect(v1).toBe(1);
      
      // Update with correct version (should succeed)
      const v2 = await synchronizer.setStateIfVersion(
        testNamespace,
        key,
        { counter: 1 },
        1
      );
      expect(v2).toBe(2);
      
      // Update with stale version (should fail)
      const v3 = await synchronizer.setStateIfVersion(
        testNamespace,
        key,
        { counter: 2 },
        1 // Stale version
      );
      expect(v3).toBeNull(); // Conflict detected
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect concurrent modifications', async () => {
      const key = 'concurrent-state';
      const initialState = { value: 0 };
      
      await synchronizer.setState(testNamespace, key, initialState);
      
      // Simulate two concurrent updates
      const update1 = synchronizer.setStateIfVersion(
        testNamespace,
        key,
        { value: 1 },
        1
      );
      
      const update2 = synchronizer.setStateIfVersion(
        testNamespace,
        key,
        { value: 2 },
        1
      );
      
      const [result1, result2] = await Promise.all([update1, update2]);
      
      // One should succeed, one should fail
      const succeeded = [result1, result2].filter(r => r !== null).length;
      const failed = [result1, result2].filter(r => r === null).length;
      
      expect(succeeded).toBe(1);
      expect(failed).toBe(1);
    });

    it('should support last-write-wins strategy', async () => {
      const key = 'lww-state';
      
      await synchronizer.setState(testNamespace, key, { value: 1 });
      await synchronizer.setState(testNamespace, key, { value: 2 });
      await synchronizer.setState(testNamespace, key, { value: 3 });
      
      const final = await synchronizer.getState(testNamespace, key);
      expect(final?.value).toBe(3);
    });
  });

  describe('Atomic Operations', () => {
    it('should support atomic field updates', async () => {
      const key = 'atomic-state';
      const initialState = { counter: 0, name: 'test' };
      
      await synchronizer.setState(testNamespace, key, initialState);
      
      // Update only counter field
      const version = await synchronizer.updateFields(
        testNamespace,
        key,
        { counter: 5 }
      );
      
      expect(version).toBeGreaterThan(0);
      
      const updated = await synchronizer.getState(testNamespace, key);
      expect(updated?.counter).toBe(5);
      expect(updated?.name).toBe('test'); // Other fields preserved
    });

    it('should support atomic increment', async () => {
      const key = 'counter';
      await synchronizer.setState(testNamespace, key, { count: 10 });
      
      await synchronizer.incrementField(testNamespace, key, 'count', 5);
      
      const state = await synchronizer.getState(testNamespace, key);
      expect(state?.count).toBe(15);
    });

    it('should support atomic decrement', async () => {
      const key = 'counter-dec';
      await synchronizer.setState(testNamespace, key, { count: 10 });
      
      await synchronizer.incrementField(testNamespace, key, 'count', -3);
      
      const state = await synchronizer.getState(testNamespace, key);
      expect(state?.count).toBe(7);
    });
  });

  describe('TTL and Expiration', () => {
    it('should support state expiration', async () => {
      const key = 'expiring-state';
      const state = { temporary: true };
      
      // Set with 1 second TTL
      await synchronizer.setState(testNamespace, key, state, { ttl: 1 });
      
      // Should exist immediately
      const immediate = await synchronizer.getState(testNamespace, key);
      expect(immediate).toEqual(state);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      const expired = await synchronizer.getState(testNamespace, key);
      expect(expired).toBeNull();
    });

    it('should renew TTL on updates', async () => {
      const key = 'renewable-state';
      
      // Set with 2 second TTL
      await synchronizer.setState(testNamespace, key, { value: 1 }, { ttl: 2 });
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update (should renew TTL)
      await synchronizer.setState(testNamespace, key, { value: 2 }, { ttl: 2 });
      
      // Wait another 1.5 seconds (total 2.5s from original)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should still exist (renewed TTL)
      const state = await synchronizer.getState(testNamespace, key);
      expect(state).not.toBeNull();
      expect(state?.value).toBe(2);
    });
  });

  describe('Namespace Isolation', () => {
    it('should isolate state across namespaces', async () => {
      const key = 'shared-key';
      const state1 = { namespace: 'ns1' };
      const state2 = { namespace: 'ns2' };
      
      await synchronizer.setState('namespace-1', key, state1);
      await synchronizer.setState('namespace-2', key, state2);
      
      const retrieved1 = await synchronizer.getState('namespace-1', key);
      const retrieved2 = await synchronizer.getState('namespace-2', key);
      
      expect(retrieved1?.namespace).toBe('ns1');
      expect(retrieved2?.namespace).toBe('ns2');
    });

    it('should list keys within namespace', async () => {
      await synchronizer.setState('list-test', 'key-1', { id: 1 });
      await synchronizer.setState('list-test', 'key-2', { id: 2 });
      await synchronizer.setState('list-test', 'key-3', { id: 3 });
      await synchronizer.setState('other-ns', 'key-4', { id: 4 });
      
      const keys = await synchronizer.listKeys('list-test');
      
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key-1');
      expect(keys).toContain('key-2');
      expect(keys).toContain('key-3');
      expect(keys).not.toContain('key-4');
    });
  });

  describe('Performance', () => {
    it('should handle rapid concurrent updates', async () => {
      const key = 'perf-test';
      await synchronizer.setState(testNamespace, key, { counter: 0 });
      
      // Perform 100 concurrent increments
      const operations = Array(100).fill(null).map(() =>
        synchronizer.incrementField(testNamespace, key, 'counter', 1)
      );
      
      await Promise.all(operations);
      
      const final = await synchronizer.getState(testNamespace, key);
      expect(final?.counter).toBe(100);
    });

    it('should complete state operations in <50ms', async () => {
      const key = 'latency-test';
      const state = { data: 'test' };
      
      const start = Date.now();
      await synchronizer.setState(testNamespace, key, state);
      const setLatency = Date.now() - start;
      
      const getStart = Date.now();
      await synchronizer.getState(testNamespace, key);
      const getLatency = Date.now() - getStart;
      
      expect(setLatency).toBeLessThan(50);
      expect(getLatency).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const key = 'invalid-json';
      
      // Manually corrupt the data in Redis
      const client = redisManager.getClient();
      const redisKey = synchronizer.getRedisKey(testNamespace, key);
      await client.set(redisKey, 'invalid-json{]');
      
      const state = await synchronizer.getState(testNamespace, key);
      expect(state).toBeNull();
    });

    it('should handle connection errors', async () => {
      // Disconnect Redis
      await redisManager.disconnect();
      
      await expect(
        synchronizer.setState(testNamespace, 'test', {})
      ).rejects.toThrow();
    });
  });
});
