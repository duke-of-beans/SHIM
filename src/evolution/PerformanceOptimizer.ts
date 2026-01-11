/**
 * PerformanceOptimizer
 *
 * Caching, parallel processing, and performance improvements.
 */

export interface CacheEntry {
  value: any;
  timestamp: number;
  ttl?: number;
}

export interface AnalysisTask {
  id: string;
  filePath: string;
  type: string;
}

export interface TaskResult {
  taskId: string;
  result: any;
  duration: number;
}

export interface PerformanceStatistics {
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  totalTasks: number;
}

export class PerformanceOptimizer {
  private cache: Map<string, CacheEntry>;
  private cacheHits: number;
  private cacheMisses: number;
  private totalTasks: number;

  constructor() {
    this.cache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalTasks = 0;
  }

  cacheResult(key: string, value: any, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  getCachedResult(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      this.cacheMisses++;
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }

    this.cacheHits++;
    return entry.value;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async analyzeParallel(tasks: AnalysisTask[], maxConcurrency = 4): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    // Process in batches based on concurrency
    for (let i = 0; i < tasks.length; i += maxConcurrency) {
      const batch = tasks.slice(i, i + maxConcurrency);

      const batchResults = await Promise.all(
        batch.map((task) => this.processTask(task))
      );

      results.push(...batchResults);
    }

    this.totalTasks += tasks.length;
    return results;
  }

  batchTasks(tasks: AnalysisTask[], batchSize: number): AnalysisTask[][] {
    const batches: AnalysisTask[][] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      batches.push(tasks.slice(i, i + batchSize));
    }

    return batches;
  }

  getStatistics(): PerformanceStatistics {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: hitRate,
      totalTasks: this.totalTasks,
    };
  }

  private async processTask(task: AnalysisTask): Promise<TaskResult> {
    const start = Date.now();

    // Simulate analysis work
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = { analyzed: true, file: task.filePath };
    const duration = Date.now() - start;

    return { taskId: task.id, result, duration };
  }
}
