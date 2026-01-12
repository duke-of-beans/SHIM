import { CrashSignals, CrashRisk } from './SignalCollector';
export interface SignalSnapshot {
    id: string;
    sessionId: string;
    snapshotNumber: number;
    timestamp: string;
    signals: CrashSignals;
}
export declare class SignalHistoryRepository {
    private dbPath;
    private db;
    constructor(dbPath: string);
    initialize(): Promise<void>;
    private createSchema;
    close(): Promise<void>;
    getTables(): Promise<string[]>;
    getIndices(): Promise<string[]>;
    saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string>;
    saveSnapshotsBatch(snapshots: Array<{
        sessionId: string;
        signals: CrashSignals;
    }>): Promise<string[]>;
    getSessionSnapshots(sessionId: string): Promise<SignalSnapshot[]>;
    getLatestSnapshot(sessionId: string): Promise<SignalSnapshot | null>;
    getSnapshotsByRisk(riskLevel: CrashRisk): Promise<SignalSnapshot[]>;
    getSnapshotsInTimeRange(startTime: string, endTime: string): Promise<SignalSnapshot[]>;
    cleanupOldSnapshots(retentionDays: number): Promise<number>;
    deleteSessionSnapshots(sessionId: string): Promise<void>;
    private run;
    private get;
    private all;
    private rowToSnapshot;
}
//# sourceMappingURL=SignalHistoryRepository.d.ts.map