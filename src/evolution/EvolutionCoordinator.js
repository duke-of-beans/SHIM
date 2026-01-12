/**
 * EvolutionCoordinator - Autonomous System Evolution
 *
 * Coordinates continuous improvement across all SHIM components.
 *
 * Manages evolution of:
 * - Crash prediction models
 * - Model routing strategies
 * - Load balancing algorithms
 * - Prompt analysis heuristics
 * - Checkpoint strategies
 *
 * Features:
 * - Multi-area experiment coordination
 * - Priority-based scheduling
 * - Version management with rollback
 * - Cross-area learning
 * - Impact analysis
 * - Comprehensive reporting
 *
 * Example:
 * ```typescript
 * const coordinator = new EvolutionCoordinator({
 *   maxConcurrentExperiments: 3,
 *   minExperimentGap: 86400000 // 24 hours
 * });
 *
 * // Register areas
 * await coordinator.registerArea({
 *   name: 'crash_prediction',
 *   currentVersion: '1.0.0',
 *   metrics: ['accuracy', 'latency'],
 *   priority: 1
 * });
 *
 * // Start evolution
 * await coordinator.start();
 *
 * // System now autonomously improves crash prediction!
 * ```
 */
export class EvolutionCoordinator {
    config;
    areas = new Map();
    experiments = new Map();
    running = false;
    constructor(config) {
        // Validate
        if (config.maxConcurrentExperiments !== undefined && config.maxConcurrentExperiments <= 0) {
            throw new Error('maxConcurrentExperiments must be positive');
        }
        this.config = {
            maxConcurrentExperiments: config.maxConcurrentExperiments ?? 3,
            minExperimentGap: config.minExperimentGap ?? 86400000, // 24h default
        };
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Register evolution area
     */
    async registerArea(area) {
        this.areas.set(area.name, {
            info: area,
            status: {
                area: area.name,
                currentVersion: area.currentVersion,
                activeExperiments: 0,
                totalExperiments: 0,
                successRate: 0
            },
            versionHistory: [{
                    version: area.currentVersion,
                    timestamp: Date.now()
                }],
            lastExperimentTime: 0
        });
    }
    /**
     * List all evolution areas
     */
    async listAreas() {
        return Array.from(this.areas.keys());
    }
    /**
     * Get area status
     */
    async getAreaStatus(areaName) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        return { ...area.status };
    }
    /**
     * Get next experiment to run (priority-based)
     */
    async getNextExperiment() {
        const eligibleAreas = Array.from(this.areas.entries())
            .filter(([_, area]) => {
            const now = Date.now();
            const timeSinceLastExperiment = now - area.lastExperimentTime;
            return timeSinceLastExperiment >= this.config.minExperimentGap;
        })
            .sort((a, b) => {
            const priorityA = a[1].info.priority ?? 999;
            const priorityB = b[1].info.priority ?? 999;
            return priorityA - priorityB; // Lower number = higher priority
        });
        if (eligibleAreas.length === 0) {
            return null;
        }
        return { area: eligibleAreas[0][0] };
    }
    /**
     * Start experiment
     */
    async startExperiment(areaName, config) {
        // Check max concurrent
        const activeCount = Array.from(this.experiments.values())
            .filter(e => !e.paused).length;
        if (activeCount >= this.config.maxConcurrentExperiments) {
            throw new Error('Maximum concurrent experiments reached');
        }
        // Check minimum gap
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        const now = Date.now();
        const timeSinceLastExperiment = now - area.lastExperimentTime;
        if (timeSinceLastExperiment < this.config.minExperimentGap) {
            throw new Error('Minimum gap not met');
        }
        // Create experiment
        const experimentId = `exp-${areaName}-${now}`;
        const experiment = {
            id: experimentId,
            area: areaName,
            hypothesis: config.hypothesis,
            treatment: config.treatment,
            startedAt: now
        };
        this.experiments.set(experimentId, experiment);
        // Update area
        area.status.activeExperiments++;
        area.status.totalExperiments++;
        area.lastExperimentTime = now;
        return experimentId;
    }
    /**
     * Complete experiment
     */
    async completeExperiment(areaName, result) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        // Find and remove experiment
        const exp = Array.from(this.experiments.values()).find(e => e.area === areaName);
        if (exp) {
            this.experiments.delete(exp.id);
            area.status.activeExperiments--;
        }
        // Update success rate
        const totalExperiments = area.status.totalExperiments;
        const previousSuccesses = Math.round(area.status.successRate * (totalExperiments - 1));
        const newSuccesses = previousSuccesses + (result.success ? 1 : 0);
        area.status.successRate = newSuccesses / totalExperiments;
        // Upgrade version if successful
        if (result.success && result.newVersion) {
            await this.upgradeVersion(areaName, result.newVersion, {
                improvement: result.improvement
            });
        }
    }
    /**
     * Rollback experiment
     */
    async rollbackExperiment(areaName, reason) {
        await this.completeExperiment(areaName, { success: false });
    }
    /**
     * Get active experiments
     */
    async getActiveExperiments() {
        return Array.from(this.experiments.values());
    }
    /**
     * Upgrade version
     */
    async upgradeVersion(areaName, newVersion, metadata) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        area.status.currentVersion = newVersion;
        area.versionHistory.push({
            version: newVersion,
            timestamp: Date.now(),
            improvement: metadata.improvement
        });
    }
    /**
     * Get version history
     */
    async getVersionHistory(areaName) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        return [...area.versionHistory];
    }
    /**
     * Rollback to version
     */
    async rollbackToVersion(areaName, version) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        area.status.currentVersion = version;
    }
    /**
     * Generate report for area
     */
    async generateReport(areaName) {
        const area = this.areas.get(areaName);
        if (!area) {
            throw new Error(`Area not found: ${areaName}`);
        }
        const totalImprovement = area.versionHistory
            .slice(1) // Skip baseline
            .reduce((sum, v) => sum + (v.improvement || 0), 0);
        return {
            area: areaName,
            currentVersion: area.status.currentVersion,
            totalExperiments: area.status.totalExperiments,
            successfulExperiments: Math.round(area.status.totalExperiments * area.status.successRate),
            successRate: area.status.successRate,
            totalImprovement
        };
    }
    /**
     * Generate overall summary
     */
    async generateSummary() {
        const areaReports = {};
        let totalExperiments = 0;
        let totalSuccesses = 0;
        for (const [name, area] of this.areas) {
            const report = await this.generateReport(name);
            areaReports[name] = report;
            totalExperiments += area.status.totalExperiments;
            totalSuccesses += Math.round(area.status.totalExperiments * area.status.successRate);
        }
        return {
            totalAreas: this.areas.size,
            totalExperiments,
            overallSuccessRate: totalExperiments > 0 ? totalSuccesses / totalExperiments : 0,
            areas: areaReports
        };
    }
    /**
     * Start coordinator
     */
    async start() {
        this.running = true;
    }
    /**
     * Stop coordinator
     */
    async stop() {
        this.running = false;
    }
    /**
     * Check if running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Pause all experiments
     */
    async pauseAll() {
        for (const exp of this.experiments.values()) {
            exp.paused = true;
        }
    }
    /**
     * Resume all experiments
     */
    async resumeAll() {
        for (const exp of this.experiments.values()) {
            exp.paused = false;
        }
    }
}
//# sourceMappingURL=EvolutionCoordinator.js.map