/**
 * PerformanceCache
 *
 * High-performance caching layer with TTL and LRU eviction.
 * Part of Priority 2: Performance Optimization
 */
export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    hits: number;
    size: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    entries: number;
}
export declare class PerformanceCache<T> {
    private cache;
    private maxSize;
    private ttl;
    private hits;
    private misses;
    constructor(maxSize?: number, ttlMs?: number);
    get(key: string): T | null;
    set(key: string, value: T, size?: number): void;
    has(key: string): boolean;
    clear(): void;
    delete(key: string): boolean;
    getStats(): CacheStats;
    private evictLRU;
}
//# sourceMappingURL=PerformanceCache.d.ts.map