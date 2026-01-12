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
export declare class PerformanceBenchmark {
    private results;
    constructor();
    benchmark(componentName: string, iterations?: number): Promise<BenchmarkResult>;
    getResults(): Promise<BenchmarkResult[]>;
    clear(): Promise<void>;
}
//# sourceMappingURL=PerformanceBenchmark.d.ts.map