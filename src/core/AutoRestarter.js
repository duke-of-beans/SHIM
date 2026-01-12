"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoRestarter = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class AutoRestarter {
    config;
    status = {
        isRestarting: false,
        currentPhase: null,
        lastRestart: null,
        restartCount: 0
    };
    constructor(config) {
        // Validate configuration
        if (!config.claudeExePath || config.claudeExePath.trim() === '') {
            throw new Error('Claude executable path is required');
        }
        if (!config.chatUrl || config.chatUrl.trim() === '') {
            throw new Error('Chat URL is required');
        }
        // Validate URL format
        try {
            new URL(config.chatUrl);
        }
        catch {
            throw new Error('Invalid chat URL');
        }
        // Validate exe path exists (unless explicitly disabled)
        if (config.validateExePath !== false) {
            if (!fs.existsSync(config.claudeExePath)) {
                throw new Error('Claude executable not found');
            }
        }
        // Set defaults
        this.config = {
            claudeExePath: config.claudeExePath,
            chatUrl: config.chatUrl,
            launchDelay: config.launchDelay ?? 2000,
            navigationDelay: config.navigationDelay ?? 3000
        };
    }
    /**
     * Find Claude.exe in default installation locations
     */
    static findClaudeExecutable() {
        const paths = AutoRestarter.getDefaultClaudePaths();
        for (const p of paths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }
    /**
     * Get list of default Claude installation paths
     */
    static getDefaultClaudePaths() {
        const username = os.userInfo().username;
        const localAppData = process.env.LOCALAPPDATA ||
            path.join('C:', 'Users', username, 'AppData', 'Local');
        return [
            path.join(localAppData, 'Programs', 'Claude', 'Claude.exe'),
            path.join('C:', 'Program Files', 'Claude', 'Claude.exe'),
            path.join('C:', 'Program Files (x86)', 'Claude', 'Claude.exe')
        ];
    }
    /**
     * Launch Claude Desktop process
     */
    async launchClaude(options = {}) {
        const startTime = Date.now();
        try {
            // Dry run mode
            if (options.dryRun) {
                await this.sleep(this.config.launchDelay);
                return {
                    success: true,
                    phases: ['launched'],
                    phase: 'launched',
                    pid: Math.floor(Math.random() * 10000) + 1000,
                    totalDuration: Date.now() - startTime
                };
            }
            // Check if already running (if requested)
            if (options.skipIfRunning) {
                const isRunning = await this.isClaudeRunning();
                if (isRunning) {
                    return {
                        success: true,
                        phases: ['launched'],
                        phase: 'launched',
                        pid: -1,
                        alreadyRunning: true,
                        totalDuration: Date.now() - startTime
                    };
                }
            }
            // Check exe exists
            if (!fs.existsSync(this.config.claudeExePath)) {
                return {
                    success: false,
                    phases: [],
                    error: 'Executable not found',
                    totalDuration: Date.now() - startTime
                };
            }
            // Spawn Claude process
            const child = (0, child_process_1.spawn)(this.config.claudeExePath, [], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            // Wait for launch delay
            await this.sleep(this.config.launchDelay);
            return {
                success: true,
                phases: ['launched'],
                phase: 'launched',
                pid: child.pid || -1,
                totalDuration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                phases: [],
                error: error instanceof Error ? error.message : String(error),
                totalDuration: Date.now() - startTime
            };
        }
    }
    /**
     * Navigate to chat URL using system default browser
     */
    async navigateToChat(options = {}) {
        const startTime = Date.now();
        try {
            // Dry run mode
            if (options.dryRun) {
                await this.sleep(this.config.navigationDelay);
                return {
                    success: true,
                    phases: ['navigated'],
                    phase: 'navigated',
                    chatUrl: this.config.chatUrl,
                    method: 'start',
                    totalDuration: Date.now() - startTime
                };
            }
            // Use Windows 'start' command to open URL in default browser
            await execAsync(`start "" "${this.config.chatUrl}"`);
            // Wait for navigation delay
            await this.sleep(this.config.navigationDelay);
            return {
                success: true,
                phases: ['navigated'],
                phase: 'navigated',
                chatUrl: this.config.chatUrl,
                method: 'start',
                totalDuration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                phases: [],
                error: error instanceof Error ? error.message : String(error),
                totalDuration: Date.now() - startTime
            };
        }
    }
    /**
     * Trigger SHIM MCP resume command
     */
    async triggerResume(options = {}) {
        const startTime = Date.now();
        try {
            // Dry run mode
            if (options.dryRun) {
                const mcpCommand = options.project
                    ? `check_resume_needed(project: "${options.project}")`
                    : 'check_resume_needed()';
                return {
                    success: true,
                    phases: ['resume_triggered'],
                    phase: 'resume_triggered',
                    mcpCommand,
                    totalDuration: Date.now() - startTime
                };
            }
            // In real implementation, this would use MCP protocol
            // For now, simulate the command structure
            const mcpCommand = options.project
                ? `check_resume_needed(project: "${options.project}")`
                : 'check_resume_needed()';
            // TODO: Actual MCP communication
            // This would connect to Claude Desktop's MCP server
            // and invoke the check_resume_needed tool
            return {
                success: true,
                phases: ['resume_triggered'],
                phase: 'resume_triggered',
                mcpCommand,
                totalDuration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                phases: [],
                error: error instanceof Error ? error.message : String(error),
                totalDuration: Date.now() - startTime
            };
        }
    }
    /**
     * Execute complete restart sequence
     */
    async restart(options = {}) {
        const startTime = Date.now();
        const completedPhases = [];
        let pid;
        this.status.isRestarting = true;
        try {
            // Phase 1: Launch Claude
            this.status.currentPhase = 'launching';
            if (options.failAt === 'launch') {
                throw new Error('Simulated launch failure');
            }
            const launchResult = await this.launchClaude(options);
            if (!launchResult.success) {
                throw new Error(launchResult.error || 'Launch failed');
            }
            completedPhases.push('launched');
            pid = launchResult.pid;
            // Phase 2: Navigate to chat
            this.status.currentPhase = 'navigating';
            if (options.failAt === 'navigate') {
                throw new Error('Simulated navigation failure');
            }
            const navResult = await this.navigateToChat(options);
            if (!navResult.success) {
                throw new Error(navResult.error || 'Navigation failed');
            }
            completedPhases.push('navigated');
            // Phase 3: Trigger resume
            this.status.currentPhase = 'triggering_resume';
            if (options.failAt === 'resume') {
                throw new Error('Simulated resume trigger failure');
            }
            const resumeResult = await this.triggerResume(options);
            if (!resumeResult.success) {
                throw new Error(resumeResult.error || 'Resume trigger failed');
            }
            completedPhases.push('resume_triggered');
            // Success
            this.status.currentPhase = null;
            this.status.isRestarting = false;
            this.status.lastRestart = new Date().toISOString();
            this.status.restartCount++;
            const result = {
                success: true,
                phases: completedPhases,
                totalDuration: Date.now() - startTime,
                pid
            };
            // Include crash context if provided
            if (options.crashEvent) {
                result.crashContext = {
                    pid: options.crashEvent.pid,
                    timestamp: options.crashEvent.timestamp,
                    hadRecentCheckpoint: options.crashEvent.metadata?.hadRecentCheckpoint,
                    lastCheckpointAge: options.crashEvent.metadata?.lastCheckpointAge
                };
            }
            return result;
        }
        catch (error) {
            // Cleanup on error
            this.status.currentPhase = 'cleanup';
            const result = {
                success: false,
                phases: completedPhases,
                totalDuration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
                cleaned: true,
                pid
            };
            this.status.currentPhase = null;
            this.status.isRestarting = false;
            return result;
        }
    }
    /**
     * Get current restart status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Check if Claude Desktop is currently running
     */
    async isClaudeRunning() {
        try {
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Claude.exe" /FO CSV /NH');
            return !stdout.includes('INFO: No tasks');
        }
        catch {
            return false;
        }
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AutoRestarter = AutoRestarter;
//# sourceMappingURL=AutoRestarter.js.map