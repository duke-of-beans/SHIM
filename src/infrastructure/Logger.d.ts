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
export declare class Logger {
    private logs;
    private currentLevel;
    private maxLogs;
    constructor();
    log(level: LogLevel, message: string, context?: any): Promise<void>;
    query(filters?: {
        level?: string;
        limit?: number;
        since?: Date;
    }): Promise<LogEntry[]>;
    setLevel(level: LogLevel): Promise<void>;
    export(path: string, filters?: any): Promise<void>;
}
export {};
//# sourceMappingURL=Logger.d.ts.map