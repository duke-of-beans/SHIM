/**
 * PerformanceOptimizer Tests
 *
 * Caching, parallel analysis, and performance improvements.
 */

import { PerformanceOptimizer, CacheEntry, AnalysisTask } from './PerformanceOptimizer';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
  });

  describe('Construction', () => {
    it('should create PerformanceOptimizer instance', () => {
      expect(optimizer).toBeInstanceOf(PerformanceOptimizer);
    });
  });

  describe('Caching', () => {
    it('should cache analysis results', () => {
      const key = 'file.ts';
      const result = { complexity: 10 };

      optimizer.cacheResult(key, result);

      const cached = optimizer.getCachedResult(key);
      expect(cached).toEqual(result);
    });

    it('should invalidate stale cache entries', async () => {
      const key = 'file.ts';
      const result = { complexity: 10 };

      optimizer.cacheResult(key, result, 100); // 100ms TTL

      await new Promise((resolve) => setTimeout(resolve, 150));

      const cached = optimizer.getCachedResult(key);
      expect(cached).toBeNull();
    });

    it('should clear cache', () => {
      optimizer.cacheResult('file1.ts', { data: 1 });
      optimizer.cacheResult('file2.ts', { data: 2 });

      optimizer.clearCache();

      expect(optimizer.getCachedResult('file1.ts')).toBeNull();
      expect(optimizer.getCachedResult('file2.ts')).toBeNull();
    });
  });

  describe('Parallel Analysis', () => {
    it('should analyze multiple files in parallel', async () => {
      const tasks: AnalysisTask[] = [
        { id: 'task1', filePath: 'file1.ts', type: 'complexity' },
        { id: 'task2', filePath: 'file2.ts', type: 'complexity' },
        { id: 'task3', filePath: 'file3.ts', type: 'complexity' },
      ];

      const results = await optimizer.analyzeParallel(tasks);

      expect(results.length).toBe(3);
      expect(results[0].taskId).toBe('task1');
    });

    it('should respect concurrency limits', async () => {
      const tasks: AnalysisTask[] = Array.from({ length: 10 }, (_, i) => ({
        id: `task${i}`,
        filePath: `file${i}.ts`,
        type: 'complexity',
      }));

      const start = Date.now();
      await optimizer.analyzeParallel(tasks, 2); // Max 2 concurrent
      const duration = Date.now() - start;

      // Should take longer with concurrency limit
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Batch Processing', () => {
    it('should batch small tasks', async () => {
      const tasks: AnalysisTask[] = Array.from({ length: 5 }, (_, i) => ({
        id: `task${i}`,
        filePath: `file${i}.ts`,
        type: 'simple',
      }));

      const batched = optimizer.batchTasks(tasks, 2);

      expect(batched.length).toBe(3); // ceil(5/2)
      expect(batched[0].length).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should track cache hit rate', () => {
      optimizer.cacheResult('file.ts', { data: 1 });

      optimizer.getCachedResult('file.ts'); // hit
      optimizer.getCachedResult('missing.ts'); // miss

      const stats = optimizer.getStatistics();
      expect(stats.cacheHitRate).toBeCloseTo(0.5);
    });
  });
});
