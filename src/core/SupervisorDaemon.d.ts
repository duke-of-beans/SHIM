/**
 * SupervisorDaemon - Main orchestrator for crash prevention and auto-recovery
 *
 * Responsibilities:
 * - Coordinate ProcessMonitor and AutoRestarter
 * - Manage crash detection and restart workflow
 * - Track supervisor state and statistics
 * - Handle Windows service lifecycle
 * - Persist configuration and chat URLs
 *
 * Architecture:
 *   SupervisorDaemon
 *   ├── ProcessMonitor (watches Claude.exe)
 *   ├── AutoRestarter (relaunches Claude)
 *   └── CheckpointRepository (crash correlation)
 */
import { EventEmitter } from 'events';
export interface SupervisorConfig {
    claudeExePath: string;
    processName?: string;
    checkpointDbPath: string;
    pollingInterval?: number;
    crashDetectionWindow?: number;
    autoRestart?: boolean;
    launchDelay?: number;
    navigationDelay?: number;
    configPath?: string;
}
export interface SupervisorStatus {
    running: boolean;
    startedAt: string | null;
    uptime: number;
    currentChatUrl: string | null;
    processMonitor: {
        monitoring: boolean;
        processFound: boolean;
        pid: number | null;
    };
    autoRestarter: {
        isRestarting: boolean;
        lastRestart: string | null;
    };
    crashCount: number;
    restartCount: number;
    config: Required<SupervisorConfig>;
    cleanedUp?: boolean;
}
interface StartOptions {
    dryRun?: boolean;
    failRestart?: boolean;
}
export declare class SupervisorDaemon extends EventEmitter {
    private config;
    private processMonitor;
    private autoRestarter;
    private checkpointRepo;
    private running;
    private startedAt;
    private currentChatUrl;
    private crashCount;
    private restartCount;
    constructor(config: SupervisorConfig);
    /**
     * Initialize supervisor (load persisted state)
     */
    initialize(): Promise<void>;
    /**
     * Start supervisor daemon
     */
    start(options?: StartOptions): Promise<void>;
    /**
     * Stop supervisor daemon
     */
    stop(): Promise<void>;
    /**
     * Set current chat URL (for restart navigation)
     */
    setCurrentChatUrl(url: string): Promise<void>;
    /**
     * Update supervisor configuration
     */
    updateConfig(updates: Partial<SupervisorConfig>): Promise<void>;
    /**
     * Get supervisor status
     */
    getStatus(): SupervisorStatus;
    /**
     * Handle Windows service shutdown signal
     */
    handleShutdownSignal(): Promise<void>;
    /**
     * Handle crash restart workflow
     */
    private handleCrashRestart;
    /**
     * Persist supervisor state to disk
     */
    private persistState;
    /**
     * Get uptime in milliseconds
     */
    private getUptime;
}
export {};
//# sourceMappingURL=SupervisorDaemon.d.ts.map