/**
 * Logger
 * SHIM logging infrastructure
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
}

export class Logger {
  private logs: LogEntry[] = [];
  private currentLevel: LogLevel = 'info';
  private maxLogs: number = 10000;

  constructor() {}

  async log(level: LogLevel, message: string, context?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };
    
    this.logs.push(entry);
    
    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Also log to console
    console.log(`[${level.toUpperCase()}] ${message}`, context || '');
  }

  async query(filters?: { level?: string; limit?: number; since?: Date }): Promise<LogEntry[]> {
    let results = [...this.logs];
    
    if (filters?.level) {
      results = results.filter(log => log.level === filters.level);
    }
    
    if (filters?.since) {
      const sinceDate = filters.since;
      results = results.filter(log => log.timestamp >= sinceDate);
    }
    
    if (filters?.limit) {
      results = results.slice(-filters.limit);
    }
    
    return results;
  }

  async setLevel(level: LogLevel): Promise<void> {
    this.currentLevel = level;
  }

  async export(path: string, filters?: any): Promise<void> {
    const logs = await this.query(filters);
    // In a real implementation, this would write to file
    console.log(`Logs exported to ${path} (${logs.length} entries)`);
  }
}
