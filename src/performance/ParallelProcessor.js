"use strict";
/**
 * ParallelProcessor
 *
 * Process files in parallel with worker pool and batching.
 * Part of Priority 2: Performance Optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessor = void 0;
class ParallelProcessor {
    maxWorkers;
    activeWorkers;
    queue;
    processor;
    constructor(processor, maxWorkers = 4) {
        this.processor = processor;
        this.maxWorkers = maxWorkers;
        this.activeWorkers = 0;
        this.queue = [];
    }
    async process(tasks) {
        this.queue = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        const results = [];
        const promises = [];
        while (this.queue.length > 0 || this.activeWorkers > 0) {
            while (this.activeWorkers < this.maxWorkers && this.queue.length > 0) {
                const task = this.queue.shift();
                this.activeWorkers++;
                const promise = this.processTask(task).then((result) => {
                    results.push(result);
                    this.activeWorkers--;
                });
                promises.push(promise);
            }
            if (promises.length > 0) {
                await Promise.race(promises);
            }
        }
        await Promise.all(promises);
        return results;
    }
    async processBatch(tasks, batchSize) {
        const results = [];
        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            const batchResults = await this.process(batch);
            results.push(...batchResults);
        }
        return results;
    }
    async processTask(task) {
        const start = Date.now();
        try {
            const result = await this.processor(task.input);
            return {
                taskId: task.id,
                result,
                duration: Date.now() - start,
            };
        }
        catch (error) {
            return {
                taskId: task.id,
                result: {},
                duration: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    getActiveWorkers() {
        return this.activeWorkers;
    }
    getQueueLength() {
        return this.queue.length;
    }
}
exports.ParallelProcessor = ParallelProcessor;
//# sourceMappingURL=ParallelProcessor.js.map