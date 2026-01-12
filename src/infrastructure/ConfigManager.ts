/**
 * ConfigManager
 * Manages SHIM configuration
 */

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export class ConfigManager {
  private config: Record<string, any> = {
    checkpointInterval: 300000, // 5 minutes
    crashDetectionThreshold: 3,
    autoRestartEnabled: true,
    logLevel: 'info'
  };

  constructor() {}

  async getAll(): Promise<Record<string, any>> {
    return { ...this.config };
  }

  async get(key: string): Promise<any> {
    return this.config[key];
  }

  async update(updates: Record<string, any>): Promise<void> {
    Object.assign(this.config, updates);
  }

  async validate(config: Record<string, any>): Promise<ValidationResult> {
    // Basic validation
    const errors: string[] = [];
    
    if (config.checkpointInterval && config.checkpointInterval < 60000) {
      errors.push('checkpointInterval must be at least 60000ms (1 minute)');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async reset(): Promise<void> {
    this.config = {
      checkpointInterval: 300000,
      crashDetectionThreshold: 3,
      autoRestartEnabled: true,
      logLevel: 'info'
    };
  }
}
