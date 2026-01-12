/**
 * ProcessMonitor - Monitor Claude Desktop process and detect crashes
 *
 * Responsibilities:
 * - Find and track Claude Desktop process by name
 * - Detect when process unexpectedly exits
 * - Correlate crashes with recent checkpoints
 * - Emit events for crash detection
 *
 * Uses Node.js child_process to query Windows process list via tasklist.
 */
import { EventEmitter } from 'events';
import { CheckpointRepository } from './CheckpointRepository';
export interface ProcessMonitorConfig {
    pollingInterval?: number;
    crashDetectionWindow?: number;
}
export interface ProcessStatus {
    found: boolean;
    pid: number | null;
    processName: string;
    isMonitoring: boolean;
    lastCheck: string;
}
export interface ProcessEvent {
    type: 'process_found' | 'process_lost' | 'crash';
    pid: number;
    timestamp: string;
    metadata?: {
        hadRecentCheckpoint?: boolean;
        lastCheckpointAge?: number;
        [key: string]: unknown;
    };
}
export declare class ProcessMonitor extends EventEmitter {
    private processName;
    private checkpointRepo;
    private config;
    private running;
    private intervalHandle;
    private currentPid;
    private lastCheckTimestamp;
    private wasRunning;
    constructor(processName: string, checkpointRepo: CheckpointRepository, config?: ProcessMonitorConfig);
    /**
     * Start monitoring process
     */
    start(): Promise<void>;
    /**
     * Stop monitoring process
     */
    stop(): Promise<void>;
    /**
     * Check if monitoring is currently running
     */
    isRunning(): boolean;
    /**
     * Find process by name
     */
    findProcess(): Promise<ProcessStatus>;
    /**
     * Get current process status
     */
    getStatus(): Promise<ProcessStatus>;
    /**
     * Check if there's a recent checkpoint within the time window
     */
    hasRecentCheckpoint(windowMinutes: number): Promise<boolean>;
    /**
     * Internal: Check process status and emit events
     */
    private checkProcess;
}
//# sourceMappingURL=ProcessMonitor.d.ts.map