/**
 * ModelRegistry
 * Registry for AI models used by SHIM
 */

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: string;
  loaded: boolean;
}

export class ModelRegistry {
  private models: Map<string, ModelInfo> = new Map();

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

  async list(): Promise<ModelInfo[]> {
    return Array.from(this.models.values());
  }

  async get(modelId: string): Promise<ModelInfo | undefined> {
    return this.models.get(modelId);
  }

  async load(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.loaded = true;
    }
  }

  async unload(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.loaded = false;
    }
  }
}
