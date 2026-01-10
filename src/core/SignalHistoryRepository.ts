import { CrashSignals, CrashRisk } from './SignalCollector';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface SignalSnapshot {
  id: string;
  sessionId: string;
  snapshotNumber: number;
  timestamp: string;
  signals: CrashSignals;
}

interface SignalHistoryRow {
  id: string;
  session_id: string;
  snapshot_number: number;
  timestamp: string;
  crash_risk: string;
  signals_json: string;
}

export class SignalHistoryRepository {
  private db: sqlite3.Database | null = null;

  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createSchema()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async createSchema(): Promise<void> {
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

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) reject(err);
        else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const rows = await this.all<{ name: string }>(sql);
    return rows.map(row => row.name);
  }

  async getIndices(): Promise<string[]> {
    const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const rows = await this.all<{ name: string }>(sql);
    return rows.map(row => row.name);
  }

  async saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string> {
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

        this.db!.get(nextNumberSQL, [sessionId], (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          const snapshotNumber = row?.next_number || 1;
          const id = uuidv4();
          const timestamp = new Date().toISOString();

          // Insert snapshot
          const insertSQL = `
            INSERT INTO signal_history (
              id, session_id, snapshot_number, timestamp, crash_risk, signals_json
            ) VALUES (?, ?, ?, ?, ?, ?)
          `;

          this.db!.run(insertSQL, [
            id,
            sessionId,
            snapshotNumber,
            timestamp,
            signals.crashRisk,
            JSON.stringify(signals)
          ], (err) => {
            if (err) reject(err);
            else resolve(id);
          });
        });
      });
    });
  }

  async saveSnapshotsBatch(snapshots: Array<{ sessionId: string; signals: CrashSignals }>): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const ids: string[] = [];

      this.db.serialize(() => {
        // Start transaction for batch insert
        this.db!.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Process snapshots sequentially to avoid race conditions
          const processNext = (index: number) => {
            if (index >= snapshots.length) {
              // All processed - commit transaction
              this.db!.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve(ids);
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

            this.db!.get(nextNumberSQL, [sessionId], (err, row: any) => {
              if (err) {
                this.db!.run('ROLLBACK');
                reject(err);
                return;
              }

              const snapshotNumber = row?.next_number || 1;
              const id = uuidv4();
              const timestamp = new Date().toISOString();
              ids[index] = id;

              // Insert snapshot
              const insertSQL = `
                INSERT INTO signal_history (
                  id, session_id, snapshot_number, timestamp, crash_risk, signals_json
                ) VALUES (?, ?, ?, ?, ?, ?)
              `;

              this.db!.run(insertSQL, [
                id,
                sessionId,
                snapshotNumber,
                timestamp,
                signals.crashRisk,
                JSON.stringify(signals)
              ], (err) => {
                if (err) {
                  this.db!.run('ROLLBACK');
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

  async getSessionSnapshots(sessionId: string): Promise<SignalSnapshot[]> {
    const sql = `
      SELECT * FROM signal_history
      WHERE session_id = ?
      ORDER BY snapshot_number ASC
    `;

    const rows = await this.all<SignalHistoryRow>(sql, [sessionId]);
    return rows.map(this.rowToSnapshot);
  }

  async getLatestSnapshot(sessionId: string): Promise<SignalSnapshot | null> {
    const sql = `
      SELECT * FROM signal_history
      WHERE session_id = ?
      ORDER BY snapshot_number DESC
      LIMIT 1
    `;

    const row = await this.get<SignalHistoryRow>(sql, [sessionId]);
    return row ? this.rowToSnapshot(row) : null;
  }

  async getSnapshotsByRisk(riskLevel: CrashRisk): Promise<SignalSnapshot[]> {
    const sql = `
      SELECT * FROM signal_history
      WHERE crash_risk = ?
      ORDER BY timestamp DESC
    `;

    const rows = await this.all<SignalHistoryRow>(sql, [riskLevel]);
    return rows.map(this.rowToSnapshot);
  }

  async getSnapshotsInTimeRange(startTime: string, endTime: string): Promise<SignalSnapshot[]> {
    const sql = `
      SELECT * FROM signal_history
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `;

    const rows = await this.all<SignalHistoryRow>(sql, [startTime, endTime]);
    return rows.map(this.rowToSnapshot);
  }

  async cleanupOldSnapshots(retentionDays: number): Promise<number> {
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

  async deleteSessionSnapshots(sessionId: string): Promise<void> {
    const sql = `
      DELETE FROM signal_history
      WHERE session_id = ?
    `;

    await this.run(sql, [sessionId]);
  }

  // Helper methods for database operations

  private run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  private get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | undefined);
      });
    });
  }

  private all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  private rowToSnapshot(row: SignalHistoryRow): SignalSnapshot {
    return {
      id: row.id,
      sessionId: row.session_id,
      snapshotNumber: row.snapshot_number,
      timestamp: row.timestamp,
      signals: JSON.parse(row.signals_json)
    };
  }
}
