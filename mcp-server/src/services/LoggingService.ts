/**
 * LoggingService
 * 
 * Handles SHIM logging operations:
 * - Get logs
 * - Set log level
 * - Export logs
 */

import { Logger } from '../../../src/infrastructure/Logger.js';

export class LoggingService {
  private logger?: Logger;

  constructor() {}

  async getLogs(filters?: { level?: string; limit?: number; since?: Date }): Promise<any> {
    try {
      if (!this.logger) {
        this.logger = new Logger();
      }
      
      const logs = await this.logger.query(filters);
      
      return {
        success: true,
        logs,
        count: logs.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get logs'
      };
    }
  }

  async setLogLevel(level: string): Promise<any> {
    try {
      if (!this.logger) {
        this.logger = new Logger();
      }
      
      await this.logger.setLevel(level);
      
      return {
        success: true,
        level,
        message: `Log level set to ${level}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set log level'
      };
    }
  }

  async exportLogs(path: string, filters?: any): Promise<any> {
    try {
      if (!this.logger) {
        this.logger = new Logger();
      }
      
      await this.logger.export(path, filters);
      
      return {
        success: true,
        path,
        message: 'Logs exported successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export logs'
      };
    }
  }
}
