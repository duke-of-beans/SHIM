/**
 * ModelsService
 * 
 * Handles model registry and prediction operations:
 * - List available models
 * - Load/unload models
 * - Get model predictions
 */

import { ModelRegistry } from '../../../src/models/ModelRegistry.js';
import { ModelPredictor } from '../../../src/models/ModelPredictor.js';

export class ModelsService {
  private registry?: ModelRegistry;
  private predictor?: ModelPredictor;

  constructor() {}

  async listModels(): Promise<any> {
    try {
      if (!this.registry) {
        this.registry = new ModelRegistry();
      }
      
      const models = await this.registry.listAll();
      
      return {
        success: true,
        models,
        count: models.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list models'
      };
    }
  }

  async getModelInfo(modelId: string): Promise<any> {
    try {
      if (!this.registry) {
        this.registry = new ModelRegistry();
      }
      
      const info = await this.registry.getInfo(modelId);
      
      return {
        success: true,
        modelId,
        info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get model info'
      };
    }
  }

  async loadModel(modelId: string): Promise<any> {
    try {
      if (!this.registry) {
        this.registry = new ModelRegistry();
      }
      
      await this.registry.load(modelId);
      
      return {
        success: true,
        modelId,
        message: 'Model loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load model'
      };
    }
  }

  async unloadModel(modelId: string): Promise<any> {
    try {
      if (!this.registry) {
        this.registry = new ModelRegistry();
      }
      
      await this.registry.unload(modelId);
      
      return {
        success: true,
        modelId,
        message: 'Model unloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unload model'
      };
    }
  }

  async getModelPredictions(modelId: string, input: any): Promise<any> {
    try {
      if (!this.predictor) {
        this.predictor = new ModelPredictor();
      }
      
      const predictions = await this.predictor.predict(modelId, input);
      
      return {
        success: true,
        modelId,
        predictions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get predictions'
      };
    }
  }
}
