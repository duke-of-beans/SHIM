/**
 * MonitoringService
 * 
 * Handles system health monitoring operations:
 * - Start/stop monitoring
 * - Get monitoring status
 */

import { HealthMonitor } from '../../../src/monitoring/HealthMonitor.js';

export class MonitoringService {
  private monitor?: HealthMonitor;

  constructor() {}

  async startMonitoring(config?: any): Promise<any> {
    try {
      if (!this.monitor) {
        this.monitor = new HealthMonitor(config);
      }
      
      await this.monitor.start();
      
      return {
        success: true,
        message: 'Monitoring started successfully',
        config
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start monitoring'
      };
    }
  }

  async getMonitorStatus(): Promise<any> {
    try {
      if (!this.monitor) {
        return {
          success: true,
          status: 'not_initialized',
          message: 'Monitoring not started'
        };
      }
      
      const status = await this.monitor.getStatus();
      
      return {
        success: true,
        status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get monitor status'
      };
    }
  }
}
