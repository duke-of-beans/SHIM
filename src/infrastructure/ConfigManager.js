/**
 * ConfigManager
 * Manages SHIM configuration
 */
export class ConfigManager {
    config = {
        checkpointInterval: 300000, // 5 minutes
        crashDetectionThreshold: 3,
        autoRestartEnabled: true,
        logLevel: 'info'
    };
    constructor() { }
    async getAll() {
        return { ...this.config };
    }
    async get(key) {
        return this.config[key];
    }
    async update(updates) {
        Object.assign(this.config, updates);
    }
    async validate(config) {
        // Basic validation
        const errors = [];
        if (config.checkpointInterval && config.checkpointInterval < 60000) {
            errors.push('checkpointInterval must be at least 60000ms (1 minute)');
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    async reset() {
        this.config = {
            checkpointInterval: 300000,
            crashDetectionThreshold: 3,
            autoRestartEnabled: true,
            logLevel: 'info'
        };
    }
}
//# sourceMappingURL=ConfigManager.js.map