/**
 * Database
 * SQLite database wrapper for SHIM
 */
export declare class Database {
    private dbPath;
    private data;
    constructor(dbPath?: string);
    query(sql: string, params?: any[]): Promise<any[]>;
    backup(backupPath: string): Promise<void>;
    optimize(): Promise<void>;
    close(): void;
}
//# sourceMappingURL=Database.d.ts.map