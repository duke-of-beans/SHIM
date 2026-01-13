/**
 * LockManager Test Suite
 * 
 * Tests distributed locking for coordinating operations across multiple chat instances.
 * 
 * Features tested:
 * - Exclusive lock acquisition and release
 * - Lock expiration (auto-release on timeout)
 * - Deadlock prevention
 * - Lock extension (keep-alive)
 * - Lock stealing prevention
 * - Concurrent lock attempts
 */

import { LockManager } from './LockManager';
import { RedisConnectionManager } from './RedisConnectionManager';

describe('LockManager', () => {
  let lockManager: LockManager;
  let redisManager: RedisConnectionManager;
  const testResource = 'test-resource';

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
    
    lockManager = new LockManager(redisManager);
  });

  afterEach(async () => {
    await lockManager.cleanup();
    await redisManager.disconnect();
  });

  describe('Basic Lock Operations', () => {
    it('should acquire and release lock', async () => {
      const lockId = await lockManager.acquire(testResource);
      
      expect(lockId).toBeDefined();
      expect(typeof lockId).toBe('string');
      
      const released = await lockManager.release(testResource, lockId);
      expect(released).toBe(true);
    });

    it('should return unique lock IDs', async () => {
      const lock1 = await lockManager.acquire('resource-1');
      const lock2 = await lockManager.acquire('resource-2');
      
      expect(lock1).not.toBe(lock2);
      
      await lockManager.release('resource-1', lock1);
      await lockManager.release('resource-2', lock2);
    });

    it('should prevent acquiring already-locked resource', async () => {
      const lock1 = await lockManager.acquire(testResource);
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      
      expect(lock1).toBeDefined();
      expect(lock2).toBeNull(); // Failed to acquire
      
      await lockManager.release(testResource, lock1);
    });

    it('should allow reacquiring after release', async () => {
      const lock1 = await lockManager.acquire(testResource);
      await lockManager.release(testResource, lock1);
      
      const lock2 = await lockManager.acquire(testResource);
      expect(lock2).toBeDefined();
      expect(lock2).not.toBe(lock1);
      
      await lockManager.release(testResource, lock2);
    });
  });

  describe('Lock Expiration', () => {
    it('should auto-release lock after TTL', async () => {
      // Acquire with 1 second TTL
      const lock1 = await lockManager.acquire(testResource, { ttl: 1 });
      expect(lock1).toBeDefined();
      
      // Try to acquire immediately (should fail)
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      expect(lock2).toBeNull();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should now be able to acquire
      const lock3 = await lockManager.acquire(testResource);
      expect(lock3).toBeDefined();
      
      await lockManager.release(testResource, lock3);
    });

    it('should use default TTL if not specified', async () => {
      const lock = await lockManager.acquire(testResource);
      expect(lock).toBeDefined();
      
      // Default TTL is 30 seconds, so lock should still be held
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      expect(lock2).toBeNull(); // Still locked
      
      await lockManager.release(testResource, lock);
    });
  });

  describe('Lock Extension', () => {
    it('should extend lock TTL', async () => {
      const lock = await lockManager.acquire(testResource, { ttl: 2 });
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extend by 2 more seconds
      const extended = await lockManager.extend(testResource, lock, 2);
      expect(extended).toBe(true);
      
      // Wait another 1.5 seconds (total 2.5s from original)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should still be locked (extended)
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      expect(lock2).toBeNull();
      
      await lockManager.release(testResource, lock);
    });

    it('should fail to extend with wrong lock ID', async () => {
      const lock = await lockManager.acquire(testResource);
      
      const extended = await lockManager.extend(testResource, 'wrong-id', 10);
      expect(extended).toBe(false);
      
      await lockManager.release(testResource, lock);
    });

    it('should fail to extend expired lock', async () => {
      const lock = await lockManager.acquire(testResource, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const extended = await lockManager.extend(testResource, lock, 10);
      expect(extended).toBe(false);
    });
  });

  describe('Lock Stealing Prevention', () => {
    it('should not release with wrong lock ID', async () => {
      const lock = await lockManager.acquire(testResource);
      
      const released = await lockManager.release(testResource, 'wrong-id');
      expect(released).toBe(false);
      
      // Lock should still be held
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      expect(lock2).toBeNull();
      
      // Release with correct ID
      await lockManager.release(testResource, lock);
    });

    it('should prevent concurrent lock acquisition', async () => {
      const lock1Promise = lockManager.acquire(testResource);
      const lock2Promise = lockManager.acquire(testResource, { timeout: 100 });
      
      const [lock1, lock2] = await Promise.all([lock1Promise, lock2Promise]);
      
      expect(lock1).toBeDefined();
      expect(lock2).toBeNull();
      
      await lockManager.release(testResource, lock1);
    });
  });

  describe('Timeout and Retry', () => {
    it('should retry lock acquisition with timeout', async () => {
      // Acquire lock
      const lock1 = await lockManager.acquire(testResource, { ttl: 1 });
      
      // Try to acquire with 2 second timeout (should succeed after expiration)
      const lock2 = await lockManager.acquire(testResource, { 
        timeout: 2000,
        retryDelay: 100 
      });
      
      expect(lock2).toBeDefined();
      
      await lockManager.release(testResource, lock2);
    });

    it('should fail after timeout expires', async () => {
      const lock1 = await lockManager.acquire(testResource, { ttl: 5 });
      
      const start = Date.now();
      const lock2 = await lockManager.acquire(testResource, { 
        timeout: 500,
        retryDelay: 100 
      });
      const elapsed = Date.now() - start;
      
      expect(lock2).toBeNull();
      expect(elapsed).toBeGreaterThanOrEqual(500);
      expect(elapsed).toBeLessThan(700); // Some tolerance
      
      await lockManager.release(testResource, lock1);
    });
  });

  describe('Batch Operations', () => {
    it('should check if lock is held', async () => {
      const isHeld1 = await lockManager.isHeld(testResource);
      expect(isHeld1).toBe(false);
      
      const lock = await lockManager.acquire(testResource);
      
      const isHeld2 = await lockManager.isHeld(testResource);
      expect(isHeld2).toBe(true);
      
      await lockManager.release(testResource, lock);
      
      const isHeld3 = await lockManager.isHeld(testResource);
      expect(isHeld3).toBe(false);
    });

    it('should get lock owner', async () => {
      const owner1 = await lockManager.getOwner(testResource);
      expect(owner1).toBeNull();
      
      const lock = await lockManager.acquire(testResource);
      
      const owner2 = await lockManager.getOwner(testResource);
      expect(owner2).toBe(lock);
      
      await lockManager.release(testResource, lock);
    });

    it('should release all locks for cleanup', async () => {
      const lock1 = await lockManager.acquire('resource-1');
      const lock2 = await lockManager.acquire('resource-2');
      const lock3 = await lockManager.acquire('resource-3');
      
      const count = await lockManager.releaseAll();
      expect(count).toBe(3);
      
      // Verify all released
      const isHeld1 = await lockManager.isHeld('resource-1');
      const isHeld2 = await lockManager.isHeld('resource-2');
      const isHeld3 = await lockManager.isHeld('resource-3');
      
      expect(isHeld1).toBe(false);
      expect(isHeld2).toBe(false);
      expect(isHeld3).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should acquire lock quickly (<10ms)', async () => {
      const start = Date.now();
      const lock = await lockManager.acquire(testResource);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(10);
      
      await lockManager.release(testResource, lock);
    });

    it('should handle high concurrency', async () => {
      const resource = 'concurrent-resource';
      
      // Attempt 50 concurrent lock acquisitions
      const operations = Array(50).fill(null).map(() =>
        lockManager.acquire(resource, { timeout: 100 })
      );
      
      const results = await Promise.all(operations);
      
      // Exactly one should succeed
      const acquired = results.filter(r => r !== null);
      expect(acquired).toHaveLength(1);
      
      // Release the successful lock
      await lockManager.release(resource, acquired[0]);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Disconnect Redis
      await redisManager.disconnect();
      
      await expect(
        lockManager.acquire(testResource)
      ).rejects.toThrow();
    });

    it('should handle invalid resource names', async () => {
      await expect(
        lockManager.acquire('')
      ).rejects.toThrow(/resource name/i);
      
      await expect(
        lockManager.acquire('   ')
      ).rejects.toThrow(/resource name/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid acquire-release cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const lock = await lockManager.acquire(testResource);
        expect(lock).toBeDefined();
        
        const released = await lockManager.release(testResource, lock);
        expect(released).toBe(true);
      }
    });

    it('should handle lock after failed acquisition', async () => {
      const lock1 = await lockManager.acquire(testResource);
      const lock2 = await lockManager.acquire(testResource, { timeout: 100 });
      
      expect(lock1).toBeDefined();
      expect(lock2).toBeNull();
      
      // Release first lock
      await lockManager.release(testResource, lock1);
      
      // Now should succeed
      const lock3 = await lockManager.acquire(testResource);
      expect(lock3).toBeDefined();
      
      await lockManager.release(testResource, lock3);
    });
  });
});
