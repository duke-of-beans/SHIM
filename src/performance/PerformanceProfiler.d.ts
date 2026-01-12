/**
 * PerformanceProfiler
 * Profiles component execution for performance analysis
 */
export interface ProfilingOptions {
    sampleInterval?: number;
    duration?: number;
}
export interface ProfileResult {
    target: string;
    duration: number;
    samples: number;
    hotspots: Array<{
        function: string;
        time: number;
        percentage: number;
    }>;
}
export declare class PerformanceProfiler {
    private profiling;
    private currentProfile?;
    constructor();
    start(target: string, options?: ProfilingOptions): Promise<void>;
    getResults(): Promise<ProfileResult | undefined>;
    stop(): Promise<void>;
}
//# sourceMappingURL=PerformanceProfiler.d.ts.map