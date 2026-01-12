/**
 * AutoRestarter - Automatically restart Claude Desktop and navigate to crashed chat
 *
 * Responsibilities:
 * - Launch Claude Desktop executable
 * - Navigate browser to specific chat URL
 * - Trigger SHIM MCP resume command
 * - Handle full restart workflow
 *
 * Works on Windows using:
 * - spawn() for process launching
 * - start command for URL opening
 * - MCP protocol for resume triggering
 */
export interface RestartConfig {
    claudeExePath: string;
    chatUrl: string;
    launchDelay?: number;
    navigationDelay?: number;
    validateExePath?: boolean;
}
export interface RestartOptions {
    dryRun?: boolean;
    skipIfRunning?: boolean;
    timeout?: number;
    failAt?: string;
    crashEvent?: {
        type: 'crash';
        pid: number;
        timestamp: string;
        metadata?: Record<string, unknown>;
    };
    project?: string;
    mcpTimeout?: number;
}
export interface RestartResult {
    success: boolean;
    phases: string[];
    totalDuration: number;
    phase?: string;
    pid?: number;
    chatUrl?: string;
    mcpCommand?: string;
    method?: string;
    error?: string;
    cleaned?: boolean;
    alreadyRunning?: boolean;
    crashContext?: {
        pid: number;
        timestamp: string;
        hadRecentCheckpoint?: boolean;
        lastCheckpointAge?: number;
    };
}
interface RestartStatus {
    isRestarting: boolean;
    currentPhase: string | null;
    lastRestart: string | null;
    restartCount: number;
}
export declare class AutoRestarter {
    private config;
    private status;
    constructor(config: RestartConfig);
    /**
     * Find Claude.exe in default installation locations
     */
    static findClaudeExecutable(): string | null;
    /**
     * Get list of default Claude installation paths
     */
    static getDefaultClaudePaths(): string[];
    /**
     * Launch Claude Desktop process
     */
    launchClaude(options?: RestartOptions): Promise<RestartResult>;
    /**
     * Navigate to chat URL using system default browser
     */
    navigateToChat(options?: RestartOptions): Promise<RestartResult>;
    /**
     * Trigger SHIM MCP resume command
     */
    triggerResume(options?: RestartOptions): Promise<RestartResult>;
    /**
     * Execute complete restart sequence
     */
    restart(options?: RestartOptions): Promise<RestartResult>;
    /**
     * Get current restart status
     */
    getStatus(): RestartStatus;
    /**
     * Check if Claude Desktop is currently running
     */
    private isClaudeRunning;
    /**
     * Sleep utility
     */
    private sleep;
}
export {};
//# sourceMappingURL=AutoRestarter.d.ts.map