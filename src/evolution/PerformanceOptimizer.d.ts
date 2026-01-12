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
export declare class PerformanceOptimizer {
    private cache;
    private cacheHits;
    private cacheMisses;
    private totalTasks;
    constructor();
    cacheResult(key: string, value: any, ttl?: number): void;
    getCachedResult(key: string): any;
    clearCache(): void;
    analyzeParallel(tasks: AnalysisTask[], maxConcurrency?: number): Promise<TaskResult[]>;
    batchTasks(tasks: AnalysisTask[], batchSize: number): AnalysisTask[][];
    getStatistics(): PerformanceStatistics;
    private processTask;
}
//# sourceMappingURL=PerformanceOptimizer.d.ts.map