"use strict";
/**
 * PerformanceCache
 *
 * High-performance caching layer with TTL and LRU eviction.
 * Part of Priority 2: Performance Optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceCache = void 0;
class PerformanceCache {
    cache;
    maxSize;
    ttl;
    hits;
    misses;
    constructor(maxSize = 1000, ttlMs = 60000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlMs;
        this.hits = 0;
        this.misses = 0;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }
        entry.hits++;
        this.hits++;
        return entry.value;
    }
    set(key, value, size = 1) {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0,
            size,
        });
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    getStats() {
        const total = this.hits + this.misses;
        let totalSize = 0;
        this.cache.forEach((entry) => {
            totalSize += entry.size;
        });
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
            size: totalSize,
            entries: this.cache.size,
        };
    }
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        });
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
exports.PerformanceCache = PerformanceCache;
//# sourceMappingURL=PerformanceCache.js.map