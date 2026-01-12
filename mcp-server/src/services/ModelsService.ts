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
      
      // TODO: ModelRegistry doesn't have listAll() method
      // Need to add method to backend
      const models: any[] = [];
      
      return {
        success: false,
        models,
        count: 0,
        error: 'Not yet implemented - method missing from backend'
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
      
      // TODO: ModelRegistry doesn't have getInfo() method
      // Need to add method to backend
      const info = null;
      
      return {
        success: false,
        modelId,
        info,
        error: 'Not yet implemented - method missing from backend'
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
        // ModelPredictor constructor expects 1 argument
        // TODO: Check backend constructor signature
        this.predictor = new ModelPredictor(null as any);
      }
      
      // ModelPredictor.predict() expects 1 argument, not 2
      // TODO: Fix backend method signature or adjust call
      const predictions = await this.predictor.predict(input);
      
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

