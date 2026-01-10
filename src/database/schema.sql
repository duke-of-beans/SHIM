-- ============================================
-- SHIM Phase 1 Database Schema
-- Version: 1.0.0
-- ============================================

-- === CHECKPOINTS TABLE ===
CREATE TABLE IF NOT EXISTS checkpoints (
  -- Primary keys
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  
  -- Serialized checkpoint data (gzipped JSON stored as base64)
  conversation_state TEXT NOT NULL,
  task_state TEXT NOT NULL,
  file_state TEXT NOT NULL,
  tool_state TEXT NOT NULL,
  signals TEXT NOT NULL,
  user_preferences TEXT,
  
  -- Metadata for efficient queries (denormalized)
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
  
  -- Constraints
  UNIQUE(session_id, checkpoint_number)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_checkpoints_session 
  ON checkpoints(session_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_checkpoints_risk 
  ON checkpoints(crash_risk, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_checkpoints_unrestored 
  ON checkpoints(session_id, created_at DESC) 
  WHERE restored_at IS NULL;

-- === RESUME EVENTS TABLE ===
CREATE TABLE IF NOT EXISTS resume_events (
  -- Primary key
  id TEXT PRIMARY KEY,
  
  -- References
  checkpoint_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Event details
  restored_at TEXT NOT NULL,
  interruption_reason TEXT NOT NULL,
  time_since_checkpoint INTEGER NOT NULL,
  resume_confidence REAL NOT NULL,
  user_confirmed BOOLEAN,
  
  -- Recovery outcome
  success BOOLEAN,
  fidelity_score REAL,
  notes TEXT,
  
  FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
);

CREATE INDEX IF NOT EXISTS idx_resume_events_checkpoint
  ON resume_events(checkpoint_id);
  
CREATE INDEX IF NOT EXISTS idx_resume_events_session
  ON resume_events(session_id, restored_at DESC);

-- === SIGNAL HISTORY TABLE ===
CREATE TABLE IF NOT EXISTS signal_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  signals TEXT NOT NULL,
  crash_risk TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_history_session
  ON signal_history(session_id, recorded_at DESC);

-- === SCHEMA VERSION TABLE ===
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) 
VALUES (1, datetime('now'));
