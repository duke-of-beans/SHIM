/**
 * PerformanceOptimizer
 *
 * Caching, parallel processing, and performance improvements.
 */
export class PerformanceOptimizer {
    cache;
    cacheHits;
    cacheMisses;
    totalTasks;
    constructor() {
        this.cache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.totalTasks = 0;
    }
    cacheResult(key, value, ttl) {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl,
        });
    }
    getCachedResult(key) {
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
    clearCache() {
        this.cache.clear();
    }
    async analyzeParallel(tasks, maxConcurrency = 4) {
        const results = [];
        // Process in batches based on concurrency
        for (let i = 0; i < tasks.length; i += maxConcurrency) {
            const batch = tasks.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(batch.map((task) => this.processTask(task)));
            results.push(...batchResults);
        }
        this.totalTasks += tasks.length;
        return results;
    }
    batchTasks(tasks, batchSize) {
        const batches = [];
        for (let i = 0; i < tasks.length; i += batchSize) {
            batches.push(tasks.slice(i, i + batchSize));
        }
        return batches;
    }
    getStatistics() {
        const total = this.cacheHits + this.cacheMisses;
        const hitRate = total > 0 ? this.cacheHits / total : 0;
        return {
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            cacheHitRate: hitRate,
            totalTasks: this.totalTasks,
        };
    }
    async processTask(task) {
        const start = Date.now();
        // Simulate analysis work
        await new Promise((resolve) => setTimeout(resolve, 10));
        const result = { analyzed: true, file: task.filePath };
        const duration = Date.now() - start;
        return { taskId: task.id, result, duration };
    }
}
//# sourceMappingURL=PerformanceOptimizer.js.map