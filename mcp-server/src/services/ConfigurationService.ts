/**
 * ConfigurationService
 * 
 * Handles SHIM configuration management:
 * - Get configuration
 * - Update configuration
 * - Validate configuration
 * - Reset configuration
 */

import { ConfigManager } from '../../../src/infrastructure/ConfigManager.js';

export class ConfigurationService {
  private configManager?: ConfigManager;

  constructor() {}

  async getConfig(): Promise<any> {
    try {
      if (!this.configManager) {
        this.configManager = new ConfigManager();
      }
      
      const config = await this.configManager.getAll();
      
      return {
        success: true,
        config
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      };
    }
  }

  async updateConfig(updates: any): Promise<any> {
    try {
      if (!this.configManager) {
        this.configManager = new ConfigManager();
      }
      
      await this.configManager.update(updates);
      
      return {
        success: true,
        message: 'Configuration updated successfully',
        updates
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      };
    }
  }

  async validateConfig(config: any): Promise<any> {
    try {
      if (!this.configManager) {
        this.configManager = new ConfigManager();
      }
      
      const validation = await this.configManager.validate(config);
      
      return {
        success: true,
        valid: validation.valid,
        errors: validation.errors || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate configuration'
      };
    }
  }

  async resetConfig(): Promise<any> {
    try {
      if (!this.configManager) {
        this.configManager = new ConfigManager();
      }
      
      await this.configManager.reset();
      
      return {
        success: true,
        message: 'Configuration reset to defaults'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset configuration'
      };
    }
  }
}
