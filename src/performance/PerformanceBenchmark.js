/**
 * PerformanceBenchmark
 * Benchmarks component performance
 */
export class PerformanceBenchmark {
    results = [];
    constructor() { }
    async benchmark(componentName, iterations = 1000) {
        const durations = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            // Simulate work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
            const duration = performance.now() - start;
            durations.push(duration);
        }
        const result = {
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
    async getResults() {
        return [...this.results];
    }
    async clear() {
        this.results = [];
    }
}
//# sourceMappingURL=PerformanceBenchmark.js.map