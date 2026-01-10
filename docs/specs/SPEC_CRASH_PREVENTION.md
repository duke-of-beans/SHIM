# SHIM Phase 1: Crash Prevention System - Technical Specification

**Version:** 1.0.0  
**Date:** January 9, 2026  
**Status:** Implementation Ready

---

## Executive Summary

The Crash Prevention System is SHIM's foundation - a predictive crash detection and recovery system that eliminates context loss through continuous state checkpointing and intelligent resume protocols.

**Key Objectives:**
- Predict crashes before they occur using observable signals
- Checkpoint conversation state automatically with <100ms overhead
- Enable instant context restoration with >90% fidelity
- Compress checkpoints to <100KB storage per snapshot
- Achieve >95% recovery success rate

---

## 1. Observable Signals System

### 1.1 Signal Categories

The system monitors four categories of signals to predict crash likelihood:

#### Token-Based Signals
```typescript
interface TokenSignals {
  estimatedTotalTokens: number;        // Total tokens in conversation (tiktoken)
  tokensPerMessage: number;             // Average tokens per message
  contextWindowUsage: number;           // 0.0 - 1.0 (percentage of 200K context)
  contextWindowRemaining: number;       // Tokens remaining before limit
}
```

**Implementation Notes:**
- Use tiktoken library with gpt-4 encoding as approximation
- Context window assumed to be 200K tokens for Claude Sonnet
- Calculate on every message and tool result
- Track rolling average for tokensPerMessage (window: last 20 messages)

#### Message-Based Signals
```typescript
interface MessageSignals {
  messageCount: number;                 // Total messages in conversation
  toolCallCount: number;                // Total tool invocations
  toolCallsSinceCheckpoint: number;     // Tool calls since last checkpoint
  messagesPerMinute: number;            // Activity rate indicator
}
```

#### Time-Based Signals
```typescript
interface TimeSignals {
  sessionDuration: number;              // Total session time (milliseconds)
  avgResponseLatency: number;           // Average Claude response time
  timeSinceLastResponse: number;        // Idle time detector
  latencyTrend: 'stable' | 'increasing' | 'decreasing';
}
```

#### Behavior-Based Signals
```typescript
interface BehaviorSignals {
  toolFailureRate: number;              // Failed tools / total tools (0.0 - 1.0)
  consecutiveToolFailures: number;      // Sequential failures without success
  responseLatencyTrend: 'normal' | 'degrading' | 'critical';
  errorPatterns: string[];              // Recent error types
}
```

### 1.2 Crash Risk Assessment

```typescript
type CrashRisk = 'safe' | 'warning' | 'danger';

interface RiskThresholds {
  warningZone: {
    contextWindowUsage: 0.60;           // 60% of context used
    messageCount: 35;
    sessionDuration: 60 * 60 * 1000;    // 60 minutes
    toolCallsSinceCheckpoint: 10;
    toolFailureRate: 0.15;
  };
  dangerZone: {
    contextWindowUsage: 0.75;           // 75% of context used
    messageCount: 50;
    sessionDuration: 90 * 60 * 1000;    // 90 minutes
    toolCallsSinceCheckpoint: 15;
    toolFailureRate: 0.20;
  };
}
```

**Risk Calculation Algorithm:**
```typescript
function assessCrashRisk(signals: AllSignals, thresholds: RiskThresholds): CrashRisk {
  const dangerCount = countSignalsExceeding(signals, thresholds.dangerZone);
  const warningCount = countSignalsExceeding(signals, thresholds.warningZone);
  
  // Any 2+ danger signals = danger
  if (dangerCount >= 2) return 'danger';
  
  // Any 1 danger signal OR 3+ warning signals = warning  
  if (dangerCount >= 1 || warningCount >= 3) return 'warning';
  
  return 'safe';
}
```

---

## 2. Checkpoint System Architecture

### 2.1 Checkpoint Data Model

Complete snapshot of conversation state:

```typescript
interface Checkpoint {
  // Metadata
  id: string;                           // UUID v4
  sessionId: string;
  checkpointNumber: number;
  createdAt: string;
  triggeredBy: CheckpointTrigger;
  
  // Conversation State
  conversationState: {
    summary: string;                    // High-level summary (max 1000 chars)
    keyDecisions: string[];             // Important decisions (max 50)
    currentContext: string;             // What we're working on (max 500 chars)
    recentMessages: Array<{
      role: 'user' | 'assistant';
      content: string;                  // Truncated if > 1000 chars
      timestamp: string;
    }>;
  };
  
  // Task State
  taskState: {
    operation: string;
    phase: string;
    progress: number;                   // 0.0 - 1.0
    completedSteps: string[];           // Max 100
    nextSteps: string[];                // Max 20
    blockers: string[];                 // Max 10
  };
  
  // File State
  fileState: {
    activeFiles: string[];
    modifiedFiles: string[];
    stagedFiles: string[];
    uncommittedDiff: string;            // Truncated to 10KB
  };
  
  // Tool State
  toolState: {
    activeSessions: ToolSession[];
    pendingOperations: PendingOp[];
    recentToolCalls: ToolCallRecord[];  // Last 20
  };
  
  // Crash Signals
  signals: CrashSignals;
  
  // User Preferences
  userPreferences: {
    customInstructions?: string;        // Truncated to 2000 chars
    recentPreferences?: string;
  };
}
```

### 2.2 Checkpoint Triggers

```typescript
type CheckpointTrigger = 
  | 'tool_call_interval'    // Every N tool calls (default: 5)
  | 'time_interval'         // Every N minutes (default: 10)
  | 'danger_zone'           // Crash risk = danger
  | 'warning_zone'          // Crash risk = warning
  | 'risky_operation'       // Before dangerous operations
  | 'milestone'             // At major task milestones
  | 'user_requested'        // Manual checkpoint
  | 'session_start'         // First checkpoint
  | 'session_end';          // Clean termination
```

### 2.3 Checkpoint Storage

**SQLite Schema:**
```sql
CREATE TABLE checkpoints (
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
  
  -- Query metadata
  crash_risk TEXT NOT NULL,
  progress REAL NOT NULL,
  operation TEXT,
  
  -- Recovery tracking
  restored_at TEXT,
  restore_success BOOLEAN,
  
  UNIQUE(session_id, checkpoint_number)
);
```

---

## 3. Resume Protocol

### 3.1 Resume Detection

```typescript
interface ResumeDetection {
  shouldResume: boolean;
  lastCheckpoint: Checkpoint | null;
  interruptionReason: InterruptionReason;
  timeSinceInterruption: number;
  confidence: number;                   // 0.0 - 1.0
}

type InterruptionReason = 
  | 'crash'              // Context window / platform crash
  | 'timeout'            // Session timeout
  | 'manual_exit'        // User closed chat
  | 'unknown';
```

### 3.2 Resume Prompt Generation

```typescript
function generateResumePrompt(checkpoint: Checkpoint): ResumePrompt {
  return {
    sections: {
      situation: `Session interrupted: ${detection.interruptionReason}`,
      progress: `Operation: ${taskState.operation} (${progress * 100}% complete)`,
      context: conversationState.summary,
      next: taskState.nextSteps,
      files: formatFileState(fileState),
      tools: formatToolState(toolState),
      blockers: taskState.blockers
    }
  };
}
```

---

## 4. MCP Tool Interface

### 4.1 shim_get_crash_risk

Get current crash risk:

```typescript
interface GetCrashRiskInput {
  includeSignals?: boolean;
}

interface GetCrashRiskOutput {
  riskLevel: CrashRisk;
  recommendation: string;
  signals?: CrashSignals;
  nextCheckpointIn?: {
    toolCalls: number;
    minutes: number;
  };
}
```

### 4.2 shim_checkpoint

Create checkpoint manually:

```typescript
interface CheckpointInput {
  reason?: string;
  metadata?: Record<string, any>;
}

interface CheckpointOutput {
  checkpointId: string;
  success: boolean;
  size: {
    uncompressed: number;
    compressed: number;
    compressionRatio: number;
  };
  timing: {
    duration: number;
  };
}
```

### 4.3 shim_check_resume

Check if resume needed:

```typescript
interface CheckResumeInput {
  autoResume?: boolean;
}

interface CheckResumeOutput {
  shouldResume: boolean;
  detection?: ResumeDetection;
  prompt?: ResumePrompt;
  applied?: boolean;
}
```

---

## 5. Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Checkpoint creation | <100ms | 200ms |
| Signal overhead | <5ms/call | 10ms/call |
| Resume detection | <50ms | 100ms |
| Compressed size | 10-20KB | 100KB |
| Database query | <10ms | 50ms |

---

## 6. Success Metrics

- ✅ Checkpoint creation automated
- ✅ Crash detection accuracy >90%
- ✅ Resume detection reliability >95%
- ✅ Context restoration fidelity >90%
- ✅ Recovery time <2 minutes
- ✅ Zero data loss
- ✅ Performance overhead <5%

---

*End of Specification*