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

export class ParallelProcessor<T, R> {
  private maxWorkers: number;
  private activeWorkers: number;
  private queue: ProcessingTask<T, R>[];
  private processor: (input: T) => Promise<R>;

  constructor(processor: (input: T) => Promise<R>, maxWorkers: number = 4) {
    this.processor = processor;
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
  }

  async process(tasks: ProcessingTask<T, R>[]): Promise<ProcessingResult<R>[]> {
    this.queue = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const results: ProcessingResult<R>[] = [];
    const promises: Promise<void>[] = [];

    while (this.queue.length > 0 || this.activeWorkers > 0) {
      while (this.activeWorkers < this.maxWorkers && this.queue.length > 0) {
        const task = this.queue.shift()!;
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

  async processBatch(
    tasks: ProcessingTask<T, R>[],
    batchSize: number
  ): Promise<ProcessingResult<R>[]> {
    const results: ProcessingResult<R>[] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await this.process(batch);
      results.push(...batchResults);
    }

    return results;
  }

  private async processTask(task: ProcessingTask<T, R>): Promise<ProcessingResult<R>> {
    const start = Date.now();

    try {
      const result = await this.processor(task.input);
      return {
        taskId: task.id,
        result,
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        taskId: task.id,
        result: {} as R,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getActiveWorkers(): number {
    return this.activeWorkers;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
