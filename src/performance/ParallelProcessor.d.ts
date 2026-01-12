/**
 * ParallelProcessor
 *
 * Process files in parallel with worker pool and batching.
 * Part of Priority 2: Performance Optimization
 */
export interface ProcessingTask<T, R> {
    id: string;
    input: T;
    priority?: number;
}
export interface ProcessingResult<R> {
    taskId: string;
    result: R;
    duration: number;
    error?: string;
}
export declare class ParallelProcessor<T, R> {
    private maxWorkers;
    private activeWorkers;
    private queue;
    private processor;
    constructor(processor: (input: T) => Promise<R>, maxWorkers?: number);
    process(tasks: ProcessingTask<T, R>[]): Promise<ProcessingResult<R>[]>;
    processBatch(tasks: ProcessingTask<T, R>[], batchSize: number): Promise<ProcessingResult<R>[]>;
    private processTask;
    getActiveWorkers(): number;
    getQueueLength(): number;
}
//# sourceMappingURL=ParallelProcessor.d.ts.map