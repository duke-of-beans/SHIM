"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalHistoryRepository = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const uuid_1 = require("uuid");
class SignalHistoryRepository {
    dbPath;
    db = null;
    constructor(dbPath) {
        this.dbPath = dbPath;
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3_1.default.Database(this.dbPath, (err) => {
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
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS signal_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        snapshot_number INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        crash_risk TEXT NOT NULL,
        signals_json TEXT NOT NULL,
        UNIQUE(session_id, snapshot_number)
      )
    `;
        const createSessionTimeIndex = `
      CREATE INDEX IF NOT EXISTS idx_signal_history_session_time 
      ON signal_history(session_id, timestamp DESC)
    `;
        const createCrashRiskIndex = `
      CREATE INDEX IF NOT EXISTS idx_signal_history_crash_risk 
      ON signal_history(crash_risk, timestamp DESC)
    `;
        await this.run(createTableSQL);
        await this.run(createSessionTimeIndex);
        await this.run(createCrashRiskIndex);
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
    async saveSnapshot(sessionId, signals) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.serialize(() => {
                // Get next snapshot number for this session
                const nextNumberSQL = `
          SELECT COALESCE(MAX(snapshot_number), 0) + 1 AS next_number
          FROM signal_history
          WHERE session_id = ?
        `;
                this.db.get(nextNumberSQL, [sessionId], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const snapshotNumber = row?.next_number || 1;
                    const id = (0, uuid_1.v4)();
                    const timestamp = new Date().toISOString();
                    // Insert snapshot
                    const insertSQL = `
            INSERT INTO signal_history (
              id, session_id, snapshot_number, timestamp, crash_risk, signals_json
            ) VALUES (?, ?, ?, ?, ?, ?)
          `;
                    this.db.run(insertSQL, [
                        id,
                        sessionId,
                        snapshotNumber,
                        timestamp,
                        signals.crashRisk,
                        JSON.stringify(signals)
                    ], (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve(id);
                    });
                });
            });
        });
    }
    async saveSnapshotsBatch(snapshots) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            const ids = [];
            this.db.serialize(() => {
                // Start transaction for batch insert
                this.db.run('BEGIN TRANSACTION', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Process snapshots sequentially to avoid race conditions
                    const processNext = (index) => {
                        if (index >= snapshots.length) {
                            // All processed - commit transaction
                            this.db.run('COMMIT', (err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(ids);
                            });
                            return;
                        }
                        const { sessionId, signals } = snapshots[index];
                        // Get next snapshot number for this session
                        const nextNumberSQL = `
              SELECT COALESCE(MAX(snapshot_number), 0) + 1 AS next_number
              FROM signal_history
              WHERE session_id = ?
            `;
                        this.db.get(nextNumberSQL, [sessionId], (err, row) => {
                            if (err) {
                                this.db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            const snapshotNumber = row?.next_number || 1;
                            const id = (0, uuid_1.v4)();
                            const timestamp = new Date().toISOString();
                            ids[index] = id;
                            // Insert snapshot
                            const insertSQL = `
                INSERT INTO signal_history (
                  id, session_id, snapshot_number, timestamp, crash_risk, signals_json
                ) VALUES (?, ?, ?, ?, ?, ?)
              `;
                            this.db.run(insertSQL, [
                                id,
                                sessionId,
                                snapshotNumber,
                                timestamp,
                                signals.crashRisk,
                                JSON.stringify(signals)
                            ], (err) => {
                                if (err) {
                                    this.db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }
                                // Process next snapshot
                                processNext(index + 1);
                            });
                        });
                    };
                    // Start processing from index 0
                    processNext(0);
                });
            });
        });
    }
    async getSessionSnapshots(sessionId) {
        const sql = `
      SELECT * FROM signal_history
      WHERE session_id = ?
      ORDER BY snapshot_number ASC
    `;
        const rows = await this.all(sql, [sessionId]);
        return rows.map(this.rowToSnapshot);
    }
    async getLatestSnapshot(sessionId) {
        const sql = `
      SELECT * FROM signal_history
      WHERE session_id = ?
      ORDER BY snapshot_number DESC
      LIMIT 1
    `;
        const row = await this.get(sql, [sessionId]);
        return row ? this.rowToSnapshot(row) : null;
    }
    async getSnapshotsByRisk(riskLevel) {
        const sql = `
      SELECT * FROM signal_history
      WHERE crash_risk = ?
      ORDER BY timestamp DESC
    `;
        const rows = await this.all(sql, [riskLevel]);
        return rows.map(this.rowToSnapshot);
    }
    async getSnapshotsInTimeRange(startTime, endTime) {
        const sql = `
      SELECT * FROM signal_history
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `;
        const rows = await this.all(sql, [startTime, endTime]);
        return rows.map(this.rowToSnapshot);
    }
    async cleanupOldSnapshots(retentionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffISO = cutoffDate.toISOString();
        const sql = `
      DELETE FROM signal_history
      WHERE timestamp < ?
    `;
        const result = await this.run(sql, [cutoffISO]);
        return result.changes || 0;
    }
    async deleteSessionSnapshots(sessionId) {
        const sql = `
      DELETE FROM signal_history
      WHERE session_id = ?
    `;
        await this.run(sql, [sessionId]);
    }
    // Helper methods for database operations
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
                    resolve({ changes: this.changes });
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
                    resolve(row);
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
    rowToSnapshot(row) {
        return {
            id: row.id,
            sessionId: row.session_id,
            snapshotNumber: row.snapshot_number,
            timestamp: row.timestamp,
            signals: JSON.parse(row.signals_json)
        };
    }
}
exports.SignalHistoryRepository = SignalHistoryRepository;
//# sourceMappingURL=SignalHistoryRepository.js.map