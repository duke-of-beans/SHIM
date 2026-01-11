/**
 * SupervisorDaemon - Main orchestrator for crash prevention and auto-recovery
 * 
 * Responsibilities:
 * - Coordinate ProcessMonitor and AutoRestarter
 * - Manage crash detection and restart workflow
 * - Track supervisor state and statistics
 * - Handle Windows service lifecycle
 * - Persist configuration and chat URLs
 * 
 * Architecture:
 *   SupervisorDaemon
 *   ├── ProcessMonitor (watches Claude.exe)
 *   ├── AutoRestarter (relaunches Claude)
 *   └── CheckpointRepository (crash correlation)
 */

import { EventEmitter } from 'events';
import { ProcessMonitor, ProcessEvent } from './ProcessMonitor';
import { AutoRestarter, RestartConfig } from './AutoRestarter';
import { CheckpointRepository } from './CheckpointRepository';
import * as fs from 'fs';
import * as path from 'path';

export interface SupervisorConfig {
  claudeExePath: string;                  // Path to Claude.exe
  processName?: string;                   // Process name (default: Claude.exe)
  checkpointDbPath: string;               // Path to checkpoint database
  pollingInterval?: number;               // ProcessMonitor poll interval
  crashDetectionWindow?: number;          // Minutes to look back for checkpoints
  autoRestart?: boolean;                  // Auto-restart on crash (default: true)
  launchDelay?: number;                   // Delay after launch
  navigationDelay?: number;               // Delay after navigation
  configPath?: string;                    // Path to persist config
}

export interface SupervisorStatus {
  running: boolean;
  startedAt: string | null;
  uptime: number;                         // Milliseconds
  currentChatUrl: string | null;
  processMonitor: {
    monitoring: boolean;
    processFound: boolean;
    pid: number | null;
  };
  autoRestarter: {
    isRestarting: boolean;
    lastRestart: string | null;
  };
  crashCount: number;
  restartCount: number;
  config: Required<SupervisorConfig>;
  cleanedUp?: boolean;
}

interface StartOptions {
  dryRun?: boolean;
  failRestart?: boolean;
}

export class SupervisorDaemon extends EventEmitter {
  private config: Required<SupervisorConfig>;
  private processMonitor: ProcessMonitor | null = null;
  private autoRestarter: AutoRestarter | null = null;
  private checkpointRepo: CheckpointRepository | null = null;
  
  private running: boolean = false;
  private startedAt: string | null = null;
  private currentChatUrl: string | null = null;
  
  private crashCount: number = 0;
  private restartCount: number = 0;
  
  constructor(config: SupervisorConfig) {
    super();
    
    // Validate required config
    if (!config.claudeExePath || config.claudeExePath.trim() === '') {
      throw new Error('Claude executable path required');
    }
    
    if (!config.checkpointDbPath || config.checkpointDbPath.trim() === '') {
      throw new Error('Checkpoint database path required');
    }
    
    // Set defaults
    this.config = {
      claudeExePath: config.claudeExePath,
      processName: config.processName ?? 'Claude.exe',
      checkpointDbPath: config.checkpointDbPath,
      pollingInterval: config.pollingInterval ?? 1000,
      crashDetectionWindow: config.crashDetectionWindow ?? 5,
      autoRestart: config.autoRestart ?? true,
      launchDelay: config.launchDelay ?? 2000,
      navigationDelay: config.navigationDelay ?? 3000,
      configPath: config.configPath ?? path.join(path.dirname(config.checkpointDbPath), 'supervisor.json')
    };
  }
  
  /**
   * Initialize supervisor (load persisted state)
   */
  async initialize(): Promise<void> {
    // Load persisted configuration if exists
    if (fs.existsSync(this.config.configPath)) {
      try {
        const persisted = JSON.parse(fs.readFileSync(this.config.configPath, 'utf-8'));
        
        // Restore chat URL
        if (persisted.currentChatUrl) {
          this.currentChatUrl = persisted.currentChatUrl;
        }
        
        // Restore config overrides
        if (persisted.config) {
          Object.assign(this.config, persisted.config);
        }
      } catch (error) {
        console.error('Failed to load persisted config:', error);
      }
    }
    
    // Initialize checkpoint repository
    this.checkpointRepo = new CheckpointRepository(this.config.checkpointDbPath);
    await this.checkpointRepo.initialize();
  }
  
  /**
   * Start supervisor daemon
   */
  async start(options: StartOptions = {}): Promise<void> {
    if (this.running) {
      throw new Error('Already running');
    }
    
    // Initialize if not already done
    if (!this.checkpointRepo) {
      await this.initialize();
    }
    
    this.running = true;
    this.startedAt = new Date().toISOString();
    
    // Initialize components
    this.processMonitor = new ProcessMonitor(
      this.config.processName,
      this.checkpointRepo!,
      {
        pollingInterval: this.config.pollingInterval,
        crashDetectionWindow: this.config.crashDetectionWindow
      }
    );
    
    this.autoRestarter = new AutoRestarter({
      claudeExePath: this.config.claudeExePath,
      chatUrl: this.currentChatUrl || 'https://claude.ai',
      launchDelay: this.config.launchDelay,
      navigationDelay: this.config.navigationDelay,
      validateExePath: !options.dryRun  // Skip validation in dry run mode
    });
    
    // Wire up crash detection -> auto restart
    this.processMonitor.on('crash', async (event: ProcessEvent) => {
      this.crashCount++;
      
      this.emit('crash_detected', {
        pid: event.pid,
        timestamp: event.timestamp,
        metadata: event.metadata,
        willRestart: this.config.autoRestart
      });
      
      // Auto-restart if enabled
      if (this.config.autoRestart && !options.failRestart) {
        await this.handleCrashRestart(event, options);
      }
    });
    
    // Start process monitoring
    await this.processMonitor.start();
    
    // Emit started event
    this.emit('daemon_started', {
      timestamp: this.startedAt,
      config: this.config
    });
  }
  
  /**
   * Stop supervisor daemon
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    
    this.running = false;
    
    // Stop process monitoring
    if (this.processMonitor) {
      await this.processMonitor.stop();
    }
    
    // Emit stopped event
    this.emit('daemon_stopped', {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime()
    });
    
    this.startedAt = null;
  }
  
  /**
   * Set current chat URL (for restart navigation)
   */
  async setCurrentChatUrl(url: string): Promise<void> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL');
    }
    
    this.currentChatUrl = url;
    
    // Persist to disk
    await this.persistState();
    
    // Update AutoRestarter if exists
    if (this.autoRestarter) {
      this.autoRestarter = new AutoRestarter({
        claudeExePath: this.config.claudeExePath,
        chatUrl: url,
        launchDelay: this.config.launchDelay,
        navigationDelay: this.config.navigationDelay
      });
    }
  }
  
  /**
   * Update supervisor configuration
   */
  async updateConfig(updates: Partial<SupervisorConfig>): Promise<void> {
    Object.assign(this.config, updates);
    await this.persistState();
  }
  
  /**
   * Get supervisor status
   */
  getStatus(): SupervisorStatus {
    return {
      running: this.running,
      startedAt: this.startedAt,
      uptime: this.getUptime(),
      currentChatUrl: this.currentChatUrl,
      processMonitor: {
        monitoring: this.processMonitor?.isRunning() ?? false,
        processFound: false,  // Would need to query ProcessMonitor
        pid: null
      },
      autoRestarter: {
        isRestarting: this.autoRestarter?.getStatus().isRestarting ?? false,
        lastRestart: this.autoRestarter?.getStatus().lastRestart ?? null
      },
      crashCount: this.crashCount,
      restartCount: this.restartCount,
      config: this.config
    };
  }
  
  /**
   * Handle Windows service shutdown signal
   */
  async handleShutdownSignal(): Promise<void> {
    await this.stop();
    
    // Mark as cleaned up
    const status = this.getStatus();
    (status as any).cleanedUp = true;
  }
  
  /**
   * Handle crash restart workflow
   */
  private async handleCrashRestart(crashEvent: ProcessEvent, options: StartOptions): Promise<void> {
    try {
      this.emit('restart_initiated', {
        crashPid: crashEvent.pid,
        timestamp: new Date().toISOString()
      });
      
      if (!this.autoRestarter) {
        throw new Error('AutoRestarter not initialized');
      }
      
      // Execute restart
      const result = await this.autoRestarter.restart({
        dryRun: options.dryRun,
        crashEvent: {
          type: 'crash',
          pid: crashEvent.pid,
          timestamp: crashEvent.timestamp,
          metadata: crashEvent.metadata
        }
      });
      
      if (result.success) {
        this.restartCount++;
        
        this.emit('restart_completed', {
          timestamp: new Date().toISOString(),
          duration: result.totalDuration,
          phases: result.phases
        });
      } else {
        this.emit('restart_failed', {
          timestamp: new Date().toISOString(),
          error: result.error
        });
      }
      
    } catch (error) {
      this.emit('restart_failed', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Persist supervisor state to disk
   */
  private async persistState(): Promise<void> {
    const state = {
      currentChatUrl: this.currentChatUrl,
      config: {
        autoRestart: this.config.autoRestart,
        pollingInterval: this.config.pollingInterval,
        crashDetectionWindow: this.config.crashDetectionWindow
      },
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(this.config.configPath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }
  
  /**
   * Get uptime in milliseconds
   */
  private getUptime(): number {
    if (!this.startedAt) {
      return 0;
    }
    
    return Date.now() - new Date(this.startedAt).getTime();
  }
}
