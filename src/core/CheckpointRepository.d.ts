/**
 * CheckpointRepository - SQLite storage for conversation checkpoints
 *
 * Provides persistent storage for crash prevention checkpoints with:
 * - Gzip compression (target: <100KB per checkpoint)
 * - Fast retrieval (<50ms)
 * - Auto-increment checkpoint numbers
 * - Resume event tracking
 *
 * Spec: docs/specs/SPEC_CRASH_PREVENTION.md
 */
import { Checkpoint, ResumeEvent, CrashRisk } from '../models/Checkpoint';
export interface CheckpointSize {
    uncompressed: number;
    compressed: number;
    compressionRatio: number;
}
export declare class CheckpointRepository {
    private dbPath;
    private db;
    constructor(dbPath: string);
    initialize(): Promise<void>;
    private createSchema;
    close(): Promise<void>;
    getTables(): Promise<string[]>;
    getIndices(): Promise<string[]>;
    getJournalMode(): Promise<string>;
    save(checkpoint: Checkpoint): Promise<string>;
    private saveWithNumber;
    getById(id: string): Promise<Checkpoint | null>;
    getMostRecent(sessionId: string): Promise<Checkpoint | null>;
    listBySession(sessionId: string): Promise<Checkpoint[]>;
    getUnrestoredCheckpoint(sessionId: string): Promise<Checkpoint | null>;
    listByRisk(riskLevel: CrashRisk): Promise<Checkpoint[]>;
    markRestored(id: string, success: boolean, fidelity: number): Promise<void>;
    recordResumeEvent(event: ResumeEvent): Promise<void>;
    getResumeEvents(sessionId: string): Promise<ResumeEvent[]>;
    cleanup(retentionDays: number): Promise<number>;
    getCheckpointSize(id: string): Promise<CheckpointSize>;
    private rowToCheckpoint;
    private run;
    private get;
    private all;
}
//# sourceMappingURL=CheckpointRepository.d.ts.map