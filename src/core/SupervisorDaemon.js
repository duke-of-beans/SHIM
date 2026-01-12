"use strict";
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
exports.SupervisorDaemon = void 0;
const events_1 = require("events");
const ProcessMonitor_1 = require("./ProcessMonitor");
const AutoRestarter_1 = require("./AutoRestarter");
const CheckpointRepository_1 = require("./CheckpointRepository");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SupervisorDaemon extends events_1.EventEmitter {
    config;
    processMonitor = null;
    autoRestarter = null;
    checkpointRepo = null;
    running = false;
    startedAt = null;
    currentChatUrl = null;
    crashCount = 0;
    restartCount = 0;
    constructor(config) {
        super();
        // Validate required config
        if (!config.claudeExePath || config.claudeExePath.trim() === '') {
            throw new Error('Claude executable path required');
        }
        if (!config.checkpointDbPath || config.checkpointDbPath.trim() === '') {
            throw new Error('Checkpoint database path required');
        }
        // Set defaults
        this.config = {
            claudeExePath: config.claudeExePath,
            processName: config.processName ?? 'Claude.exe',
            checkpointDbPath: config.checkpointDbPath,
            pollingInterval: config.pollingInterval ?? 1000,
            crashDetectionWindow: config.crashDetectionWindow ?? 5,
            autoRestart: config.autoRestart ?? true,
            launchDelay: config.launchDelay ?? 2000,
            navigationDelay: config.navigationDelay ?? 3000,
            configPath: config.configPath ?? path.join(path.dirname(config.checkpointDbPath), 'supervisor.json')
        };
    }
    /**
     * Initialize supervisor (load persisted state)
     */
    async initialize() {
        // Load persisted configuration if exists
        if (fs.existsSync(this.config.configPath)) {
            try {
                const persisted = JSON.parse(fs.readFileSync(this.config.configPath, 'utf-8'));
                // Restore chat URL
                if (persisted.currentChatUrl) {
                    this.currentChatUrl = persisted.currentChatUrl;
                }
                // Restore config overrides
                if (persisted.config) {
                    Object.assign(this.config, persisted.config);
                }
            }
            catch (error) {
                console.error('Failed to load persisted config:', error);
            }
        }
        // Initialize checkpoint repository
        this.checkpointRepo = new CheckpointRepository_1.CheckpointRepository(this.config.checkpointDbPath);
        await this.checkpointRepo.initialize();
    }
    /**
     * Start supervisor daemon
     */
    async start(options = {}) {
        if (this.running) {
            throw new Error('Already running');
        }
        // Initialize if not already done
        if (!this.checkpointRepo) {
            await this.initialize();
        }
        this.running = true;
        this.startedAt = new Date().toISOString();
        // Initialize components
        this.processMonitor = new ProcessMonitor_1.ProcessMonitor(this.config.processName, this.checkpointRepo, {
            pollingInterval: this.config.pollingInterval,
            crashDetectionWindow: this.config.crashDetectionWindow
        });
        this.autoRestarter = new AutoRestarter_1.AutoRestarter({
            claudeExePath: this.config.claudeExePath,
            chatUrl: this.currentChatUrl || 'https://claude.ai',
            launchDelay: this.config.launchDelay,
            navigationDelay: this.config.navigationDelay,
            validateExePath: !options.dryRun // Skip validation in dry run mode
        });
        // Wire up crash detection -> auto restart
        this.processMonitor.on('crash', async (event) => {
            this.crashCount++;
            this.emit('crash_detected', {
                pid: event.pid,
                timestamp: event.timestamp,
                metadata: event.metadata,
                willRestart: this.config.autoRestart
            });
            // Auto-restart if enabled
            if (this.config.autoRestart && !options.failRestart) {
                await this.handleCrashRestart(event, options);
            }
        });
        // Start process monitoring
        await this.processMonitor.start();
        // Emit started event
        this.emit('daemon_started', {
            timestamp: this.startedAt,
            config: this.config
        });
    }
    /**
     * Stop supervisor daemon
     */
    async stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        // Stop process monitoring
        if (this.processMonitor) {
            await this.processMonitor.stop();
        }
        // Emit stopped event
        this.emit('daemon_stopped', {
            timestamp: new Date().toISOString(),
            uptime: this.getUptime()
        });
        this.startedAt = null;
    }
    /**
     * Set current chat URL (for restart navigation)
     */
    async setCurrentChatUrl(url) {
        // Validate URL
        try {
            new URL(url);
        }
        catch {
            throw new Error('Invalid URL');
        }
        this.currentChatUrl = url;
        // Persist to disk
        await this.persistState();
        // Update AutoRestarter if exists
        if (this.autoRestarter) {
            this.autoRestarter = new AutoRestarter_1.AutoRestarter({
                claudeExePath: this.config.claudeExePath,
                chatUrl: url,
                launchDelay: this.config.launchDelay,
                navigationDelay: this.config.navigationDelay
            });
        }
    }
    /**
     * Update supervisor configuration
     */
    async updateConfig(updates) {
        Object.assign(this.config, updates);
        await this.persistState();
    }
    /**
     * Get supervisor status
     */
    getStatus() {
        return {
            running: this.running,
            startedAt: this.startedAt,
            uptime: this.getUptime(),
            currentChatUrl: this.currentChatUrl,
            processMonitor: {
                monitoring: this.processMonitor?.isRunning() ?? false,
                processFound: false, // Would need to query ProcessMonitor
                pid: null
            },
            autoRestarter: {
                isRestarting: this.autoRestarter?.getStatus().isRestarting ?? false,
                lastRestart: this.autoRestarter?.getStatus().lastRestart ?? null
            },
            crashCount: this.crashCount,
            restartCount: this.restartCount,
            config: this.config
        };
    }
    /**
     * Handle Windows service shutdown signal
     */
    async handleShutdownSignal() {
        await this.stop();
        // Mark as cleaned up
        const status = this.getStatus();
        status.cleanedUp = true;
    }
    /**
     * Handle crash restart workflow
     */
    async handleCrashRestart(crashEvent, options) {
        try {
            this.emit('restart_initiated', {
                crashPid: crashEvent.pid,
                timestamp: new Date().toISOString()
            });
            if (!this.autoRestarter) {
                throw new Error('AutoRestarter not initialized');
            }
            // Execute restart
            const result = await this.autoRestarter.restart({
                dryRun: options.dryRun,
                crashEvent: {
                    type: 'crash',
                    pid: crashEvent.pid,
                    timestamp: crashEvent.timestamp,
                    metadata: crashEvent.metadata
                }
            });
            if (result.success) {
                this.restartCount++;
                this.emit('restart_completed', {
                    timestamp: new Date().toISOString(),
                    duration: result.totalDuration,
                    phases: result.phases
                });
            }
            else {
                this.emit('restart_failed', {
                    timestamp: new Date().toISOString(),
                    error: result.error
                });
            }
        }
        catch (error) {
            this.emit('restart_failed', {
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Persist supervisor state to disk
     */
    async persistState() {
        const state = {
            currentChatUrl: this.currentChatUrl,
            config: {
                autoRestart: this.config.autoRestart,
                pollingInterval: this.config.pollingInterval,
                crashDetectionWindow: this.config.crashDetectionWindow
            },
            lastUpdated: new Date().toISOString()
        };
        try {
            fs.writeFileSync(this.config.configPath, JSON.stringify(state, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Failed to persist state:', error);
        }
    }
    /**
     * Get uptime in milliseconds
     */
    getUptime() {
        if (!this.startedAt) {
            return 0;
        }
        return Date.now() - new Date(this.startedAt).getTime();
    }
}
exports.SupervisorDaemon = SupervisorDaemon;
//# sourceMappingURL=SupervisorDaemon.js.map