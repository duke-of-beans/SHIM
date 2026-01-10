import { CrashSignals, CrashRisk } from './SignalCollector';

export interface SignalSnapshot {
  id: string;
  sessionId: string;
  snapshotNumber: number;
  timestamp: string;
  signals: CrashSignals;
}

export class SignalHistoryRepository {
  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    throw new Error('Not implemented');
  }

  async close(): Promise<void> {
    throw new Error('Not implemented');
  }

  async getTables(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  async getIndices(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  async saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string> {
    throw new Error('Not implemented');
  }

  async getSessionSnapshots(sessionId: string): Promise<SignalSnapshot[]> {
    throw new Error('Not implemented');
  }

  async getLatestSnapshot(sessionId: string): Promise<SignalSnapshot | null> {
    throw new Error('Not implemented');
  }

  async getSnapshotsByRisk(riskLevel: CrashRisk): Promise<SignalSnapshot[]> {
    throw new Error('Not implemented');
  }

  async getSnapshotsInTimeRange(startTime: string, endTime: string): Promise<SignalSnapshot[]> {
    throw new Error('Not implemented');
  }

  async cleanupOldSnapshots(retentionDays: number): Promise<number> {
    throw new Error('Not implemented');
  }

  async deleteSessionSnapshots(sessionId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
