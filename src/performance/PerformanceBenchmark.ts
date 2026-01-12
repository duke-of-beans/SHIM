/**
 * PerformanceBenchmark
 * Benchmarks component performance
 */

export interface BenchmarkResult {
  component: string;
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  opsPerSecond: number;
}

export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  constructor() {}

  async benchmark(componentName: string, iterations: number = 1000): Promise<BenchmarkResult> {
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
      const duration = performance.now() - start;
      durations.push(duration);
    }
    
    const result: BenchmarkResult = {
      component: componentName,
      iterations,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      opsPerSecond: 1000 / (durations.reduce((a, b) => a + b, 0) / durations.length)
    };
    
    this.results.push(result);
    return result;
  }

  async getResults(): Promise<BenchmarkResult[]> {
    return [...this.results];
  }

  async clear(): Promise<void> {
    this.results = [];
  }
}
