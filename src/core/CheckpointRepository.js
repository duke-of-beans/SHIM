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
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as zlib from 'zlib';
export class CheckpointRepository {
    dbPath;
    db = null;
    constructor(dbPath) {
        this.dbPath = dbPath;
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.createSchema()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }
    async createSchema() {
        // Enable WAL mode for better concurrency
        await this.run('PRAGMA journal_mode=WAL');
        const checkpointsTable = `
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        checkpoint_number INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        triggered_by TEXT NOT NULL,
        
        conversation_state TEXT NOT NULL,
        task_state TEXT NOT NULL,
        file_state TEXT NOT NULL,
        tool_state TEXT NOT NULL,
        signals TEXT NOT NULL,
        user_preferences TEXT,
        
        crash_risk TEXT NOT NULL,
        progress REAL NOT NULL,
        operation TEXT,
        context_window_usage REAL,
        message_count INTEGER,
        tool_call_count INTEGER,
        
        uncompressed_size INTEGER,
        compressed_size INTEGER,
        compression_ratio REAL,
        
        restored_at TEXT,
        restore_success BOOLEAN,
        restore_fidelity REAL,
        
        UNIQUE(session_id, checkpoint_number)
      )
    `;
        const resumeEventsTable = `
      CREATE TABLE IF NOT EXISTS resume_events (
        id TEXT PRIMARY KEY,
        checkpoint_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        restored_at TEXT NOT NULL,
        interruption_reason TEXT NOT NULL,
        time_since_checkpoint INTEGER NOT NULL,
        resume_confidence REAL NOT NULL,
        user_confirmed BOOLEAN,
        success BOOLEAN,
        fidelity_score REAL,
        notes TEXT,
        
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
      )
    `;
        const sessionIndex = `
      CREATE INDEX IF NOT EXISTS idx_checkpoints_session 
      ON checkpoints(session_id, created_at DESC)
    `;
        const riskIndex = `
      CREATE INDEX IF NOT EXISTS idx_checkpoints_risk 
      ON checkpoints(crash_risk, created_at DESC)
    `;
        const unrestoredIndex = `
      CREATE INDEX IF NOT EXISTS idx_checkpoints_unrestored 
      ON checkpoints(session_id, created_at DESC) 
      WHERE restored_at IS NULL
    `;
        await this.run(checkpointsTable);
        await this.run(resumeEventsTable);
        await this.run(sessionIndex);
        await this.run(riskIndex);
        await this.run(unrestoredIndex);
    }
    async close() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }
            this.db.close((err) => {
                if (err)
                    reject(err);
                else {
                    this.db = null;
                    resolve();
                }
            });
        });
    }
    async getTables() {
        const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
        const rows = await this.all(sql);
        return rows.map(row => row.name);
    }
    async getIndices() {
        const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
        const rows = await this.all(sql);
        return rows.map(row => row.name);
    }
    async getJournalMode() {
        const row = await this.get('PRAGMA journal_mode');
        return row.journal_mode;
    }
    async save(checkpoint) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.serialize(() => {
                // Auto-increment checkpoint number if not set
                if (checkpoint.checkpointNumber === 0 || checkpoint.checkpointNumber === undefined) {
                    const nextNumberSQL = `
            SELECT COALESCE(MAX(checkpoint_number), 0) + 1 AS next_number
            FROM checkpoints
            WHERE session_id = ?
          `;
                    this.db.get(nextNumberSQL, [checkpoint.sessionId], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        checkpoint.checkpointNumber = row?.next_number || 1;
                        this.saveWithNumber(checkpoint, resolve, reject);
                    });
                }
                else {
                    this.saveWithNumber(checkpoint, resolve, reject);
                }
            });
        });
    }
    saveWithNumber(checkpoint, resolve, reject) {
        // Serialize and compress each state section
        const conversationStateJSON = JSON.stringify(checkpoint.conversationState);
        const taskStateJSON = JSON.stringify(checkpoint.taskState);
        const fileStateJSON = JSON.stringify(checkpoint.fileState);
        const toolStateJSON = JSON.stringify(checkpoint.toolState);
        const signalsJSON = JSON.stringify(checkpoint.signals);
        const userPreferencesJSON = checkpoint.userPreferences
            ? JSON.stringify(checkpoint.userPreferences)
            : null;
        const conversationStateCompressed = zlib.gzipSync(conversationStateJSON);
        const taskStateCompressed = zlib.gzipSync(taskStateJSON);
        const fileStateCompressed = zlib.gzipSync(fileStateJSON);
        const toolStateCompressed = zlib.gzipSync(toolStateJSON);
        const signalsCompressed = zlib.gzipSync(signalsJSON);
        const userPreferencesCompressed = userPreferencesJSON
            ? zlib.gzipSync(userPreferencesJSON)
            : null;
        // Calculate sizes
        const uncompressedSize = conversationStateJSON.length +
            taskStateJSON.length +
            fileStateJSON.length +
            toolStateJSON.length +
            signalsJSON.length +
            (userPreferencesJSON?.length || 0);
        const compressedSize = conversationStateCompressed.length +
            taskStateCompressed.length +
            fileStateCompressed.length +
            toolStateCompressed.length +
            signalsCompressed.length +
            (userPreferencesCompressed?.length || 0);
        const compressionRatio = uncompressedSize / compressedSize;
        const sql = `
      INSERT INTO checkpoints (
        id, session_id, checkpoint_number, created_at, triggered_by,
        conversation_state, task_state, file_state, tool_state, signals, user_preferences,
        crash_risk, progress, operation,
        context_window_usage, message_count, tool_call_count,
        uncompressed_size, compressed_size, compression_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        this.db.run(sql, [
            checkpoint.id,
            checkpoint.sessionId,
            checkpoint.checkpointNumber,
            checkpoint.createdAt,
            checkpoint.triggeredBy,
            conversationStateCompressed.toString('base64'),
            taskStateCompressed.toString('base64'),
            fileStateCompressed.toString('base64'),
            toolStateCompressed.toString('base64'),
            signalsCompressed.toString('base64'),
            userPreferencesCompressed?.toString('base64') || null,
            checkpoint.signals.crashRisk,
            checkpoint.taskState.progress,
            checkpoint.taskState.operation,
            checkpoint.signals.contextWindowUsage,
            checkpoint.signals.messageCount,
            checkpoint.signals.toolCallCount,
            uncompressedSize,
            compressedSize,
            compressionRatio
        ], (err) => {
            if (err)
                reject(err);
            else
                resolve(checkpoint.id);
        });
    }
    async getById(id) {
        const sql = `
      SELECT * FROM checkpoints WHERE id = ?
    `;
        const row = await this.get(sql, [id]);
        return row ? this.rowToCheckpoint(row) : null;
    }
    async getMostRecent(sessionId) {
        const sql = `
      SELECT * FROM checkpoints 
      WHERE session_id = ? 
      ORDER BY created_at DESC, checkpoint_number DESC 
      LIMIT 1
    `;
        const row = await this.get(sql, [sessionId]);
        return row ? this.rowToCheckpoint(row) : null;
    }
    async listBySession(sessionId) {
        const sql = `
      SELECT * FROM checkpoints 
      WHERE session_id = ? 
      ORDER BY checkpoint_number ASC
    `;
        const rows = await this.all(sql, [sessionId]);
        return rows.map(row => this.rowToCheckpoint(row));
    }
    async getUnrestoredCheckpoint(sessionId) {
        const sql = `
      SELECT * FROM checkpoints 
      WHERE session_id = ? AND restored_at IS NULL 
      ORDER BY created_at DESC, checkpoint_number DESC 
      LIMIT 1
    `;
        const row = await this.get(sql, [sessionId]);
        return row ? this.rowToCheckpoint(row) : null;
    }
    async listByRisk(riskLevel) {
        const sql = `
      SELECT * FROM checkpoints 
      WHERE crash_risk = ? 
      ORDER BY created_at DESC
    `;
        const rows = await this.all(sql, [riskLevel]);
        return rows.map(row => this.rowToCheckpoint(row));
    }
    async markRestored(id, success, fidelity) {
        const sql = `
      UPDATE checkpoints 
      SET restored_at = ?, restore_success = ?, restore_fidelity = ? 
      WHERE id = ?
    `;
        await this.run(sql, [new Date().toISOString(), success ? 1 : 0, fidelity, id]);
    }
    async recordResumeEvent(event) {
        const id = event.id || uuidv4();
        const restoredAt = event.restoredAt || new Date().toISOString();
        const sql = `
      INSERT INTO resume_events (
        id, checkpoint_id, session_id, restored_at, interruption_reason,
        time_since_checkpoint, resume_confidence, user_confirmed,
        success, fidelity_score, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.run(sql, [
            id,
            event.checkpointId,
            event.sessionId,
            restoredAt,
            event.interruptionReason,
            event.timeSinceCheckpoint,
            event.resumeConfidence,
            event.userConfirmed !== undefined ? (event.userConfirmed ? 1 : 0) : null,
            event.success ? 1 : 0,
            event.fidelityScore,
            event.notes || null
        ]);
    }
    async getResumeEvents(sessionId) {
        const sql = `
      SELECT * FROM resume_events 
      WHERE session_id = ? 
      ORDER BY restored_at DESC
    `;
        const rows = await this.all(sql, [sessionId]);
        return rows.map(row => ({
            id: row.id,
            checkpointId: row.checkpoint_id,
            sessionId: row.session_id,
            restoredAt: row.restored_at,
            interruptionReason: row.interruption_reason,
            timeSinceCheckpoint: row.time_since_checkpoint,
            resumeConfidence: row.resume_confidence,
            userConfirmed: row.user_confirmed !== null ? row.user_confirmed === 1 : undefined,
            success: row.success === 1,
            fidelityScore: row.fidelity_score,
            notes: row.notes || undefined
        }));
    }
    async cleanup(retentionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffISO = cutoffDate.toISOString();
        const sql = `
      DELETE FROM checkpoints 
      WHERE created_at < ?
    `;
        const result = await this.run(sql, [cutoffISO]);
        return result.changes || 0;
    }
    async getCheckpointSize(id) {
        const sql = `
      SELECT uncompressed_size, compressed_size, compression_ratio 
      FROM checkpoints 
      WHERE id = ?
    `;
        const row = await this.get(sql, [id]);
        if (!row) {
            throw new Error('Checkpoint not found');
        }
        return {
            uncompressed: row.uncompressed_size,
            compressed: row.compressed_size,
            compressionRatio: row.compression_ratio
        };
    }
    rowToCheckpoint(row) {
        // Decompress each state section
        const conversationState = JSON.parse(zlib.gunzipSync(Buffer.from(row.conversation_state, 'base64')).toString('utf-8'));
        const taskState = JSON.parse(zlib.gunzipSync(Buffer.from(row.task_state, 'base64')).toString('utf-8'));
        const fileState = JSON.parse(zlib.gunzipSync(Buffer.from(row.file_state, 'base64')).toString('utf-8'));
        const toolState = JSON.parse(zlib.gunzipSync(Buffer.from(row.tool_state, 'base64')).toString('utf-8'));
        const signals = JSON.parse(zlib.gunzipSync(Buffer.from(row.signals, 'base64')).toString('utf-8'));
        const userPreferences = row.user_preferences
            ? JSON.parse(zlib.gunzipSync(Buffer.from(row.user_preferences, 'base64')).toString('utf-8'))
            : {};
        return {
            id: row.id,
            sessionId: row.session_id,
            checkpointNumber: row.checkpoint_number,
            createdAt: row.created_at,
            triggeredBy: row.triggered_by,
            conversationState,
            taskState,
            fileState,
            toolState,
            signals,
            userPreferences,
            restored_at: row.restored_at || undefined,
            restore_success: row.restore_success !== null ? row.restore_success === 1 : undefined,
            restore_fidelity: row.restore_fidelity || undefined
        };
    }
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.run(sql, params, function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.get(sql, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
}
//# sourceMappingURL=CheckpointRepository.js.map