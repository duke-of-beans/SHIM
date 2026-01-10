# SHIM Data Models & Schemas

**Version:** 1.0.0  
**Date:** January 9, 2026

---

## 1. TypeScript Interfaces

### 1.1 Core Checkpoint Model

```typescript
interface Checkpoint {
  id: string;
  sessionId: string;
  checkpointNumber: number;
  createdAt: string;
  triggeredBy: CheckpointTrigger;
  conversationState: ConversationState;
  taskState: TaskState;
  fileState: FileState;
  toolState: ToolState;
  signals: CrashSignals;
  userPreferences: UserPreferences;
}
```

### 1.2 Conversation State

```typescript
interface ConversationState {
  summary: string;                      // Max 1000 chars
  keyDecisions: string[];               // Max 50 items
  currentContext: string;               // Max 500 chars
  recentMessages: ConversationMessage[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### 1.3 Task State

```typescript
interface TaskState {
  operation: string;
  phase: string;
  progress: number;                     // 0.0 - 1.0
  completedSteps: string[];             // Max 100
  nextSteps: string[];                  // Max 20
  blockers: string[];                   // Max 10
}
```

### 1.4 File State

```typescript
interface FileState {
  activeFiles: string[];
  modifiedFiles: string[];
  stagedFiles: string[];
  uncommittedDiff: string;              // Max 10KB
}
```

### 1.5 Tool State

```typescript
interface ToolState {
  activeSessions: ToolSession[];
  pendingOperations: PendingOp[];
  recentToolCalls: ToolCallRecord[];    // Last 20
}

interface ToolSession {
  type: 'terminal' | 'chrome' | 'search' | 'other';
  id: string;
  purpose: string;
  startedAt: string;
  state: Record<string, any>;
}

interface PendingOp {
  type: 'file_write' | 'process' | 'search' | 'other';
  id: string;
  description: string;
  startedAt: string;
  resumeWith: string;
}

interface ToolCallRecord {
  tool: string;
  args: string;                         // Truncated to 500 chars
  result: string;                       // Truncated to 500 chars
  success: boolean;
  latency: number;
  timestamp: string;
}
```

### 1.6 Crash Signals

```typescript
interface CrashSignals {
  // Token signals
  estimatedTotalTokens: number;
  tokensPerMessage: number;
  contextWindowUsage: number;
  contextWindowRemaining: number;
  
  // Message signals
  messageCount: number;
  toolCallCount: number;
  toolCallsSinceCheckpoint: number;
  messagesPerMinute: number;
  
  // Time signals
  sessionDuration: number;
  avgResponseLatency: number;
  timeSinceLastResponse: number;
  latencyTrend: 'stable' | 'increasing' | 'decreasing';
  
  // Behavior signals
  toolFailureRate: number;
  consecutiveToolFailures: number;
  responseLatencyTrend: 'normal' | 'degrading' | 'critical';
  errorPatterns: string[];
  
  // Derived
  crashRisk: 'safe' | 'warning' | 'danger';
  riskFactors: string[];
}
```

---

## 2. Database Schemas

### 2.1 SQLite Schema

```sql
-- Checkpoints table
CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  
  -- Serialized data (gzipped JSON)
  conversation_state TEXT NOT NULL,
  task_state TEXT NOT NULL,
  file_state TEXT NOT NULL,
  tool_state TEXT NOT NULL,
  signals TEXT NOT NULL,
  user_preferences TEXT,
  
  -- Metadata for queries
  crash_risk TEXT NOT NULL,
  progress REAL NOT NULL,
  operation TEXT,
  context_window_usage REAL,
  message_count INTEGER,
  tool_call_count INTEGER,
  
  -- Storage metrics
  uncompressed_size INTEGER,
  compressed_size INTEGER,
  compression_ratio REAL,
  
  -- Recovery tracking
  restored_at TEXT,
  restore_success BOOLEAN,
  restore_fidelity REAL,
  
  UNIQUE(session_id, checkpoint_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkpoints_session 
  ON checkpoints(session_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_checkpoints_risk 
  ON checkpoints(crash_risk, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_checkpoints_unrestored 
  ON checkpoints(session_id, created_at DESC) 
  WHERE restored_at IS NULL;

-- Resume events table
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
);

-- Signal history table
CREATE TABLE IF NOT EXISTS signal_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  signals TEXT NOT NULL,              -- JSON: CrashSignals
  crash_risk TEXT NOT NULL
);

-- Schema version table
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT INTO schema_version (version, applied_at) 
VALUES (1, datetime('now'));
```

---

## 3. Serialization Functions

```typescript
import * as zlib from 'zlib';

function compressCheckpoint(checkpoint: Checkpoint): Buffer {
  const json = JSON.stringify(checkpoint);
  return zlib.gzipSync(json, { level: 9 });
}

function decompressCheckpoint(compressed: Buffer): Checkpoint {
  const json = zlib.gunzipSync(compressed).toString('utf-8');
  return JSON.parse(json);
}
```

---

## 4. Validation Functions

```typescript
function validateCheckpoint(checkpoint: Checkpoint): ValidationResult {
  const errors: string[] = [];
  
  // Size constraints
  if (checkpoint.conversationState.summary.length > 1000) {
    errors.push('Summary exceeds 1000 chars');
  }
  
  if (checkpoint.conversationState.keyDecisions.length > 50) {
    errors.push('Too many key decisions (max 50)');
  }
  
  if (checkpoint.taskState.completedSteps.length > 100) {
    errors.push('Too many completed steps (max 100)');
  }
  
  if (checkpoint.fileState.uncommittedDiff.length > 10 * 1024) {
    errors.push('Uncommitted diff exceeds 10KB');
  }
  
  // Progress validation
  if (checkpoint.taskState.progress < 0 || checkpoint.taskState.progress > 1) {
    errors.push('Progress must be between 0.0 and 1.0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 5. Repository Pattern

```typescript
interface CheckpointRepository {
  save(checkpoint: Checkpoint): Promise<void>;
  getById(id: string): Promise<Checkpoint | null>;
  getMostRecent(sessionId: string): Promise<Checkpoint | null>;
  listBySession(sessionId: string): Promise<Checkpoint[]>;
  markRestored(id: string, success: boolean, fidelity: number): Promise<void>;
  cleanup(retentionDays: number): Promise<number>;
}

class SQLiteCheckpointRepository implements CheckpointRepository {
  constructor(private db: Database) {}
  
  async save(checkpoint: Checkpoint): Promise<void> {
    const compressed = compressCheckpoint(checkpoint);
    await this.db.run(`
      INSERT INTO checkpoints (
        id, session_id, checkpoint_number, created_at, triggered_by,
        conversation_state, task_state, file_state, tool_state, signals, user_preferences,
        crash_risk, progress, operation,
        uncompressed_size, compressed_size, compression_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkpoint.id,
      checkpoint.sessionId,
      checkpoint.checkpointNumber,
      checkpoint.createdAt,
      checkpoint.triggeredBy,
      compressed.toString('base64'),
      // ... other fields
    ]);
  }
  
  async getMostRecent(sessionId: string): Promise<Checkpoint | null> {
    const row = await this.db.get(`
      SELECT * FROM checkpoints 
      WHERE session_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [sessionId]);
    
    if (!row) return null;
    
    const compressed = Buffer.from(row.conversation_state, 'base64');
    return decompressCheckpoint(compressed);
  }
}
```

---

*End of Data Models*