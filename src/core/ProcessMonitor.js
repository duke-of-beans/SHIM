"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessMonitor = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ProcessMonitor extends events_1.EventEmitter {
    processName;
    checkpointRepo;
    config;
    running = false;
    intervalHandle = null;
    currentPid = null;
    lastCheckTimestamp = new Date().toISOString();
    wasRunning = false;
    constructor(processName, checkpointRepo, config = {}) {
        super();
        this.processName = processName;
        this.checkpointRepo = checkpointRepo;
        // Default configuration
        this.config = {
            pollingInterval: config.pollingInterval ?? 1000,
            crashDetectionWindow: config.crashDetectionWindow ?? 5
        };
    }
    /**
     * Start monitoring process
     */
    async start() {
        if (this.running) {
            throw new Error('Already running');
        }
        this.running = true;
        // Initial process check
        await this.checkProcess();
        // Start polling loop
        this.intervalHandle = setInterval(() => this.checkProcess(), this.config.pollingInterval);
    }
    /**
     * Stop monitoring process
     */
    async stop() {
        this.running = false;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
    /**
     * Check if monitoring is currently running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Find process by name
     */
    async findProcess() {
        try {
            // Use Windows tasklist command
            const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${this.processName}" /FO CSV /NH`);
            // Parse CSV output
            // Format: "ImageName","PID","SessionName","Session#","MemUsage"
            const lines = stdout.trim().split('\n');
            if (lines.length === 0 || lines[0].includes('INFO: No tasks')) {
                return {
                    found: false,
                    pid: null,
                    processName: this.processName,
                    isMonitoring: this.running,
                    lastCheck: this.lastCheckTimestamp
                };
            }
            // Parse first matching process
            const line = lines[0];
            const match = line.match(/"([^"]+)","(\d+)"/);
            if (match) {
                const pid = parseInt(match[2], 10);
                this.currentPid = pid;
                return {
                    found: true,
                    pid,
                    processName: this.processName,
                    isMonitoring: this.running,
                    lastCheck: this.lastCheckTimestamp
                };
            }
            return {
                found: false,
                pid: null,
                processName: this.processName,
                isMonitoring: this.running,
                lastCheck: this.lastCheckTimestamp
            };
        }
        catch (error) {
            // Log error but don't throw - graceful degradation
            console.error('Error finding process:', error);
            return {
                found: false,
                pid: null,
                processName: this.processName,
                isMonitoring: this.running,
                lastCheck: this.lastCheckTimestamp
            };
        }
    }
    /**
     * Get current process status
     */
    async getStatus() {
        return {
            found: this.currentPid !== null,
            pid: this.currentPid,
            processName: this.processName,
            isMonitoring: this.running,
            lastCheck: this.lastCheckTimestamp
        };
    }
    /**
     * Check if there's a recent checkpoint within the time window
     */
    async hasRecentCheckpoint(windowMinutes) {
        try {
            // Get most recent checkpoint
            const checkpoint = await this.checkpointRepo.getMostRecent('test-session');
            if (!checkpoint) {
                return false;
            }
            // Check if within time window
            const checkpointTime = new Date(checkpoint.createdAt).getTime();
            const now = Date.now();
            const windowMs = windowMinutes * 60 * 1000;
            return (now - checkpointTime) <= windowMs;
        }
        catch (error) {
            console.error('Error checking recent checkpoint:', error);
            return false;
        }
    }
    /**
     * Internal: Check process status and emit events
     */
    async checkProcess() {
        this.lastCheckTimestamp = new Date().toISOString();
        const status = await this.findProcess();
        // Process state transitions
        if (status.found && !this.wasRunning) {
            // Process found - was not running before
            this.emit('process_found', {
                type: 'process_found',
                pid: status.pid,
                timestamp: this.lastCheckTimestamp
            });
            this.wasRunning = true;
        }
        else if (!status.found && this.wasRunning) {
            // Process lost - was running before
            const hadRecentCheckpoint = await this.hasRecentCheckpoint(this.config.crashDetectionWindow);
            // Emit process_lost
            this.emit('process_lost', {
                type: 'process_lost',
                pid: this.currentPid,
                timestamp: this.lastCheckTimestamp,
                metadata: {
                    hadRecentCheckpoint
                }
            });
            // If had recent checkpoint, also emit crash event
            if (hadRecentCheckpoint) {
                const checkpoint = await this.checkpointRepo.getMostRecent('test-session');
                const checkpointAge = checkpoint
                    ? (Date.now() - new Date(checkpoint.createdAt).getTime()) / 60000
                    : 0;
                this.emit('crash', {
                    type: 'crash',
                    pid: this.currentPid,
                    timestamp: this.lastCheckTimestamp,
                    metadata: {
                        hadRecentCheckpoint: true,
                        lastCheckpointAge: checkpointAge
                    }
                });
            }
            this.wasRunning = false;
            this.currentPid = null;
        }
    }
}
exports.ProcessMonitor = ProcessMonitor;
//# sourceMappingURL=ProcessMonitor.js.map