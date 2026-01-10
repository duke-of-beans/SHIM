/**
 * SHIM Checkpoint Data Models
 * 
 * Complete TypeScript interfaces for crash prevention checkpoints.
 */

export type CheckpointTrigger = 
  | 'tool_call_interval'
  | 'time_interval'
  | 'danger_zone'
  | 'warning_zone'
  | 'risky_operation'
  | 'milestone'
  | 'user_requested'
  | 'session_start'
  | 'session_end';

export type CrashRisk = 'safe' | 'warning' | 'danger';

export type InterruptionReason = 
  | 'crash'
  | 'timeout'
  | 'manual_exit'
  | 'unknown';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationState {
  summary: string;
  keyDecisions: string[];
  currentContext: string;
  recentMessages: ConversationMessage[];
}

export interface TaskState {
  operation: string;
  phase: string;
  progress: number;
  completedSteps: string[];
  nextSteps: string[];
  blockers: string[];
}

export interface FileState {
  activeFiles: string[];
  modifiedFiles: string[];
  stagedFiles: string[];
  uncommittedDiff: string;
}

export interface ToolSession {
  type: 'terminal' | 'chrome' | 'search' | 'other';
  id: string;
  purpose: string;
  startedAt: string;
  state: Record<string, any>;
}

export interface PendingOp {
  type: 'file_write' | 'process' | 'search' | 'other';
  id: string;
  description: string;
  startedAt: string;
  resumeWith: string;
}

export interface ToolCallRecord {
  tool: string;
  args: string;
  result: string;
  success: boolean;
  latency: number;
  timestamp: string;
}

export interface ToolState {
  activeSessions: ToolSession[];
  pendingOperations: PendingOp[];
  recentToolCalls: ToolCallRecord[];
}

export interface CrashSignals {
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
  crashRisk: CrashRisk;
  riskFactors: string[];
}

export interface UserPreferences {
  customInstructions?: string;
  recentPreferences?: string;
}

export interface Checkpoint {
  // Metadata
  id: string;
  sessionId: string;
  checkpointNumber: number;
  createdAt: string;
  triggeredBy: CheckpointTrigger;
  
  // State
  conversationState: ConversationState;
  taskState: TaskState;
  fileState: FileState;
  toolState: ToolState;
  signals: CrashSignals;
  userPreferences: UserPreferences;
}

export interface ResumeDetection {
  shouldResume: boolean;
  lastCheckpoint: Checkpoint | null;
  interruptionReason: InterruptionReason;
  timeSinceInterruption: number;
  confidence: number;
}

export interface ResumePrompt {
  sections: {
    situation: string;
    progress: string;
    context: string;
    next: string;
    files: string;
    tools: string;
    blockers: string;
  };
  checkpointId: string;
  metadata: {
    interruptionReason: InterruptionReason;
    timeSince: string;
    progress: number;
  };
}
