/**
 * ModelRegistry
 * Registry for AI models used by SHIM
 */
export class ModelRegistry {
    models = new Map();
    constructor() {
        // Register default models
        this.models.set('crash-predictor', {
            id: 'crash-predictor',
            name: 'Crash Predictor',
            version: '1.0.0',
            type: 'classifier',
            loaded: false
        });
        this.models.set('pattern-detector', {
            id: 'pattern-detector',
            name: 'Pattern Detector',
            version: '1.0.0',
            type: 'detector',
            loaded: false
        });
    }
    async list() {
        return Array.from(this.models.values());
    }
    async get(modelId) {
        return this.models.get(modelId);
    }
    async load(modelId) {
        const model = this.models.get(modelId);
        if (model) {
            model.loaded = true;
        }
    }
    async unload(modelId) {
        const model = this.models.get(modelId);
        if (model) {
            model.loaded = false;
        }
    }
}
//# sourceMappingURL=ModelRegistry.js.map