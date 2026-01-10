# SHIM Phase 2: Multi-Chat Coordination - Technical Specification

**Version:** 1.0.0  
**Phase:** 2 of 4  
**Dependencies:** Phase 1 Complete ✅  
**Estimated Duration:** 4-6 weeks (may accelerate to 1.5 weeks based on velocity pattern)  
**Created:** January 10, 2026

---

## Executive Summary

Phase 2 enables **parallel execution across multiple Claude Desktop chat instances**, allowing SHIM to delegate subtasks to worker chats while maintaining coordination through a supervisor pattern. This unlocks autonomous operation capabilities and 3-5x productivity improvements through parallelization.

**Core Innovation:** Transform single-chat serial execution into multi-chat parallel execution with automatic task distribution and crash recovery.

---

## Problem Statement

### Current Limitations (Single-Chat Architecture)

**Constraint 1: Serial Execution**
- Only one task can execute at a time
- Long operations block everything else
- No parallelization possible
- Productivity limited by single-threaded execution

**Constraint 2: Manual Delegation**
- Human must manually open new chats
- Human must copy/paste context between chats
- No automatic task distribution
- High cognitive overhead for coordination

**Constraint 3: No Progress Visibility**
- Can't see what other chats are doing
- No aggregated progress tracking
- Manual checking required
- Context switches destroy productivity

**Constraint 4: Crash Isolation**
- If one chat crashes, entire workflow stops
- No automatic recovery across chats
- Work in other chats becomes orphaned
- Manual recovery required

### Phase 2 Solution

**Enable:**
- ✅ Parallel execution (3-5 worker chats simultaneously)
- ✅ Automatic task distribution (supervisor delegates to workers)
- ✅ Centralized coordination (Redis-based state management)
- ✅ Cross-chat crash recovery (workers auto-resume after crash)
- ✅ Progress aggregation (real-time visibility across all chats)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERVISOR CHAT                               │
│  (Human interacts here - delegates to workers)                  │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ Task         │      │ Progress     │      │ Worker       │  │
│  │ Decomposer   │─────▶│ Aggregator   │◀─────│ Registry     │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
└───────────────┬────────────────────────────────────┬────────────┘
                │                                    │
                │         REDIS (Coordination)       │
                │    ┌─────────────────────────┐    │
                │    │ • Task Queue (BullMQ)   │    │
                │    │ • Worker Registry       │    │
                │    │ • Progress Events       │    │
                │    │ • Checkpoint Refs       │    │
                │    └─────────────────────────┘    │
                │                                    │
                ▼                                    ▼
┌───────────────────────┐              ┌───────────────────────┐
│   WORKER CHAT 1       │              │   WORKER CHAT 2       │
│                       │              │                       │
│  ┌─────────────────┐  │              │  ┌─────────────────┐  │
│  │ Task Claimer    │  │              │  │ Task Claimer    │  │
│  └─────────────────┘  │              │  └─────────────────┘  │
│  ┌─────────────────┐  │              │  ┌─────────────────┐  │
│  │ Work Executor   │  │              │  │ Work Executor   │  │
│  └─────────────────┘  │              │  └─────────────────┘  │
│  ┌─────────────────┐  │              │  ┌─────────────────┐  │
│  │ Progress Reporter│ │              │  │ Progress Reporter│ │
│  └─────────────────┘  │              │  └─────────────────┘  │
│  ┌─────────────────┐  │              │  ┌─────────────────┐  │
│  │ Crash Recovery  │  │              │  │ Crash Recovery  │  │
│  └─────────────────┘  │              │  └─────────────────┘  │
└───────────────────────┘              └───────────────────────┘
```

### Key Components

**1. Supervisor Components (Main Chat)**
- TaskDecomposer: Breaks work into parallel subtasks
- WorkerRegistry: Tracks available workers and their status
- ProgressAggregator: Combines progress from all workers
- TaskAssigner: Distributes tasks to workers via queue

**2. Worker Components (Delegate Chats)**
- TaskClaimer: Claims tasks from queue
- WorkExecutor: Performs assigned work
- ProgressReporter: Reports status to supervisor
- CrashRecovery: Auto-resume after crash using Phase 1 infrastructure

**3. Coordination Layer (Redis)**
- BullMQ: Task queue with priority, retry, and failure handling
- Redis Pub/Sub: Real-time progress events
- Worker Registry: Active workers, heartbeats, capabilities
- Checkpoint References: Links to Phase 1 checkpoints

---

## LEAN-OUT Infrastructure Decision

### Battle-Tested Tools (NOT Custom Code)

Following the LEAN-OUT principle from GREGORE EPIC 16, Phase 2 uses **production-grade tools** rather than custom infrastructure:

**✅ USE: BullMQ + Redis**
- Industry-standard job queue (used by Fortune 500)
- Built-in retry logic, priority queues, rate limiting
- Production monitoring and metrics
- Redis persistence and replication
- ~50 LOC wrapper vs ~1,200 LOC custom queue

**✅ USE: Redis Pub/Sub**
- Real-time event messaging
- Built-in pattern matching
- Reliable delivery
- ~30 LOC wrapper vs ~400 LOC custom message bus

**✅ USE: ioredis**
- Production Redis client
- Connection pooling, clustering
- Pipeline support
- ~20 LOC wrapper vs ~600 LOC custom client

**❌ DON'T BUILD:**
- Custom job queues (BullMQ exists)
- Custom message buses (Redis Pub/Sub exists)
- Custom workers (BullMQ has worker pattern)
- Custom retry logic (built into tools)
- Custom monitoring (tools provide metrics)

**Estimated Savings:** 2,200 LOC eliminated, 2-3 weeks saved

---

## Data Models

### Task Definition

```typescript
interface Task {
  id: string;                    // Unique task ID (UUID)
  type: 'code' | 'research' | 'test' | 'document' | 'analyze';
  title: string;                 // Human-readable title
  description: string;           // Detailed instructions for worker
  priority: 'critical' | 'high' | 'normal' | 'low';
  
  // Dependencies
  dependencies: string[];        // Task IDs that must complete first
  parentTaskId?: string;         // Parent task (for subtasks)
  
  // Context
  context: {
    files: string[];            // Relevant file paths
    checkpointId?: string;      // Phase 1 checkpoint reference
    sessionId: string;          // Originating session
    projectPath: string;        // D:\SHIM or similar
  };
  
  // Execution
  assignedTo?: string;          // Worker ID
  status: 'pending' | 'claimed' | 'running' | 'complete' | 'failed';
  attempts: number;             // Retry count
  maxAttempts: number;          // Max retries (default: 3)
  
  // Results
  result?: {
    success: boolean;
    output?: any;               // Task-specific output
    filesModified: string[];    // Changed files
    checkpointCreated?: string; // New checkpoint ID
    error?: string;
  };
  
  // Timing
  createdAt: Date;
  claimedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;   // Milliseconds
  actualDuration?: number;
}
```

### Worker Registration

```typescript
interface WorkerRegistration {
  id: string;                   // Unique worker ID (UUID)
  sessionId: string;            // Claude session ID
  status: 'idle' | 'busy' | 'crashed' | 'offline';
  
  // Capabilities
  capabilities: {
    maxConcurrentTasks: number; // Usually 1 for safety
    supportedTaskTypes: TaskType[];
    maxTaskDuration: number;    // Milliseconds before timeout
  };
  
  // Health
  heartbeat: {
    lastSeen: Date;
    interval: number;           // Expected heartbeat interval
    missedBeats: number;        // Consecutive missed heartbeats
  };
  
  // Current Work
  currentTask?: {
    taskId: string;
    startedAt: Date;
    lastProgress: number;       // 0.0 to 1.0
    lastProgressUpdate: Date;
  };
  
  // Performance
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    avgDuration: number;
    totalDuration: number;
  };
  
  // Registration
  registeredAt: Date;
  lastActivityAt: Date;
}
```

### Progress Event

```typescript
interface ProgressEvent {
  id: string;                   // Event ID
  workerId: string;             // Which worker reported
  taskId: string;               // Which task
  
  type: 'started' | 'progress' | 'completed' | 'failed' | 'heartbeat';
  
  // Progress details
  progress?: {
    current: number;            // Current step
    total: number;              // Total steps
    percentage: number;         // 0.0 to 1.0
    message?: string;           // Status message
  };
  
  // Completion details
  completion?: {
    success: boolean;
    output?: any;
    filesModified: string[];
    duration: number;
    error?: string;
  };
  
  timestamp: Date;
}
```

---

## Component Specifications

### Week 1-2: Infrastructure

#### Component 1: RedisConnectionManager

**Purpose:** Manage Redis connection lifecycle with reliability

**Responsibilities:**
- Initialize Redis connection with retry logic
- Handle connection errors gracefully
- Provide connection health checks
- Clean shutdown on process exit

**Interface:**
```typescript
class RedisConnectionManager {
  constructor(config: RedisConfig);
  
  // Lifecycle
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Health
  async ping(): Promise<boolean>;
  getConnectionStats(): ConnectionStats;
  
  // Access
  getClient(): Redis;
}
```

**Configuration:**
```typescript
interface RedisConfig {
  host: string;              // Default: localhost
  port: number;              // Default: 6379
  password?: string;         // Optional auth
  db: number;                // Database number (default: 0)
  
  // Reliability
  retryStrategy: (times: number) => number;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  
  // Performance
  lazyConnect: boolean;
  keepAlive: number;
}
```

**Performance Benchmarks:**
- Connection establishment: <100ms
- Ping latency: <5ms
- Reconnection time: <1s

**Tests Required:**
- Connection success
- Connection failure handling
- Reconnection after disconnect
- Health check validation
- Graceful shutdown

---

#### Component 2: TaskQueueWrapper

**Purpose:** Wrap BullMQ with SHIM-specific task handling

**Responsibilities:**
- Initialize BullMQ queue with proper configuration
- Add tasks with priority and retry logic
- Process tasks with worker pattern
- Handle failures with automatic retry
- Provide queue statistics

**Interface:**
```typescript
class TaskQueueWrapper {
  constructor(
    connection: RedisConnectionManager,
    queueName: string
  );
  
  // Task Management
  async addTask(task: Task, options?: AddOptions): Promise<string>;
  async getTask(taskId: string): Promise<Task | null>;
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
  
  // Worker Pattern
  async registerWorker(
    processor: TaskProcessor,
    concurrency?: number
  ): Promise<void>;
  
  // Queue Control
  async pause(): Promise<void>;
  async resume(): Promise<void>;
  async drain(): Promise<void>;
  async clean(grace: number): Promise<void>;
  
  // Statistics
  getQueueStats(): Promise<QueueStats>;
  getWaitingCount(): Promise<number>;
  getActiveCount(): Promise<number>;
}
```

**Task Processor:**
```typescript
type TaskProcessor = (
  task: Task,
  progress: ProgressCallback
) => Promise<TaskResult>;

type ProgressCallback = (percentage: number, message?: string) => void;
```

**BullMQ Configuration:**
```typescript
const queueConfig = {
  defaultJobOptions: {
    attempts: 3,              // Retry up to 3 times
    backoff: {
      type: 'exponential',    // 1s, 2s, 4s
      delay: 1000
    },
    removeOnComplete: false,  // Keep completed for analysis
    removeOnFail: false       // Keep failed for debugging
  },
  settings: {
    stalledInterval: 30000,   // Check for stalled jobs every 30s
    maxStalledCount: 2        // Max stalls before permanent failure
  }
};
```

**Performance Benchmarks:**
- Task addition: <10ms
- Task retrieval: <5ms
- Queue statistics: <20ms

**Tests Required:**
- Task addition with various priorities
- Task processing with success
- Task processing with failure + retry
- Stalled job detection
- Queue statistics accuracy

---

#### Component 3: MessageBusWrapper

**Purpose:** Wrap Redis Pub/Sub for real-time events

**Responsibilities:**
- Publish progress events to channels
- Subscribe to event channels with pattern matching
- Handle subscriber reconnection
- Provide event statistics

**Interface:**
```typescript
class MessageBusWrapper {
  constructor(connection: RedisConnectionManager);
  
  // Publishing
  async publish(channel: string, event: ProgressEvent): Promise<number>;
  async publishToPattern(pattern: string, event: ProgressEvent): Promise<void>;
  
  // Subscribing
  async subscribe(
    channel: string,
    handler: EventHandler
  ): Promise<void>;
  
  async psubscribe(
    pattern: string,
    handler: EventHandler
  ): Promise<void>;
  
  async unsubscribe(channel: string): Promise<void>;
  async punsubscribe(pattern: string): Promise<void>;
  
  // Statistics
  getSubscriberCount(channel: string): Promise<number>;
  getEventStats(): EventStats;
}
```

**Event Handler:**
```typescript
type EventHandler = (
  event: ProgressEvent,
  channel: string
) => void | Promise<void>;
```

**Channel Patterns:**
```typescript
const CHANNELS = {
  // Task events
  TASK_EVENTS: 'task:*',              // All task events
  TASK_STARTED: 'task:started',       // Task started
  TASK_PROGRESS: 'task:progress',     // Progress update
  TASK_COMPLETED: 'task:completed',   // Task finished
  TASK_FAILED: 'task:failed',         // Task failed
  
  // Worker events
  WORKER_EVENTS: 'worker:*',          // All worker events
  WORKER_REGISTERED: 'worker:registered',
  WORKER_HEARTBEAT: 'worker:heartbeat',
  WORKER_CRASHED: 'worker:crashed',
  
  // Supervisor events
  SUPERVISOR_EVENTS: 'supervisor:*',  // All supervisor events
  SUPERVISOR_COMMAND: 'supervisor:command'
};
```

**Performance Benchmarks:**
- Publish latency: <5ms
- Event delivery latency: <10ms
- Subscription latency: <20ms

**Tests Required:**
- Publish to single channel
- Publish with pattern matching
- Subscribe to channel
- Pattern subscription
- Multiple subscribers per channel
- Unsubscribe handling
- Reconnection after disconnect

---

#### Component 4: WorkerRegistry

**Purpose:** Track active workers and their health

**Responsibilities:**
- Register new workers
- Update worker status and heartbeats
- Detect crashed workers (missed heartbeats)
- Provide worker query capabilities
- Clean up stale worker registrations

**Interface:**
```typescript
class WorkerRegistry {
  constructor(
    connection: RedisConnectionManager,
    heartbeatTimeout: number = 30000  // 30 seconds
  );
  
  // Registration
  async registerWorker(registration: WorkerRegistration): Promise<void>;
  async unregisterWorker(workerId: string): Promise<void>;
  
  // Status Updates
  async updateWorkerStatus(
    workerId: string,
    status: WorkerStatus
  ): Promise<void>;
  
  async recordHeartbeat(workerId: string): Promise<void>;
  
  async assignTask(
    workerId: string,
    taskId: string
  ): Promise<void>;
  
  async completeTask(
    workerId: string,
    stats: TaskStats
  ): Promise<void>;
  
  // Queries
  async getWorker(workerId: string): Promise<WorkerRegistration | null>;
  async getActiveWorkers(): Promise<WorkerRegistration[]>;
  async getIdleWorkers(): Promise<WorkerRegistration[]>;
  
  // Health Monitoring
  async detectCrashedWorkers(): Promise<string[]>;  // Returns crashed worker IDs
  async cleanupStaleWorkers(maxAge: number): Promise<number>;
  
  // Statistics
  getRegistryStats(): Promise<RegistryStats>;
}
```

**Storage Strategy:**
```typescript
// Redis keys
const keys = {
  worker: (id: string) => `worker:${id}`,
  workerIndex: 'workers:all',
  workersByStatus: (status: string) => `workers:status:${status}`
};

// Data stored in Redis Hash for each worker
// Key: worker:{id}
// Fields: JSON-serialized WorkerRegistration
```

**Crash Detection Logic:**
```typescript
async detectCrashedWorkers(): Promise<string[]> {
  const allWorkers = await this.getActiveWorkers();
  const now = Date.now();
  const crashed: string[] = [];
  
  for (const worker of allWorkers) {
    const timeSinceHeartbeat = now - worker.heartbeat.lastSeen.getTime();
    const expectedInterval = worker.heartbeat.interval;
    
    if (timeSinceHeartbeat > expectedInterval * 3) {  // 3 missed beats
      crashed.push(worker.id);
      await this.updateWorkerStatus(worker.id, 'crashed');
    }
  }
  
  return crashed;
}
```

**Performance Benchmarks:**
- Worker registration: <10ms
- Heartbeat update: <5ms
- Crash detection (100 workers): <100ms
- Worker query: <10ms

**Tests Required:**
- Worker registration
- Status updates
- Heartbeat tracking
- Crash detection after missed heartbeats
- Query by status
- Stale worker cleanup
- Concurrent heartbeats from multiple workers

---

### Week 3-4: Supervisor Pattern

#### Component 5: TaskDecomposer

**Purpose:** Break complex work into parallel subtasks

**Responsibilities:**
- Analyze user request
- Decompose into independent subtasks
- Identify dependencies between tasks
- Estimate task durations
- Generate task execution plan

**Interface:**
```typescript
class TaskDecomposer {
  // Decomposition
  async decomposeTask(
    description: string,
    context: TaskContext
  ): Promise<DecompositionPlan>;
  
  // Analysis
  analyzeComplexity(description: string): TaskComplexity;
  identifyDependencies(tasks: Task[]): DependencyGraph;
  estimateDuration(task: Task): number;
  
  // Validation
  validatePlan(plan: DecompositionPlan): ValidationResult;
}
```

**Decomposition Strategy:**
```typescript
interface DecompositionPlan {
  originalRequest: string;
  tasks: Task[];
  dependencies: DependencyGraph;
  estimatedTotalDuration: number;
  parallelizationFactor: number;  // How much faster than serial (1.0 to 5.0)
  
  executionPlan: {
    wave1: string[];  // Tasks with no dependencies (start immediately)
    wave2: string[];  // Tasks dependent on wave 1
    wave3: string[];  // Tasks dependent on wave 2
    // ...
  };
}
```

**Example Decomposition:**
```
User Request: "Implement user authentication system"

Decomposed Tasks:
1. Design database schema (no dependencies)
2. Implement User model (depends on #1)
3. Create authentication service (depends on #2)
4. Build login API endpoint (depends on #3)
5. Build registration API endpoint (depends on #3)
6. Write tests for User model (depends on #2)
7. Write tests for auth service (depends on #3)
8. Write tests for API endpoints (depends on #4, #5)

Execution Waves:
- Wave 1: [Task 1]  (1 task, serial)
- Wave 2: [Task 2]  (1 task, serial)
- Wave 3: [Task 3]  (1 task, serial)
- Wave 4: [Task 4, Task 5, Task 6, Task 7]  (4 tasks, PARALLEL)
- Wave 5: [Task 8]  (1 task, serial)

Parallelization: 4x faster for Wave 4 (if 4 workers available)
```

**Performance Benchmarks:**
- Decomposition analysis: <500ms
- Dependency graph generation: <100ms
- Execution plan creation: <50ms

**Tests Required:**
- Simple task (no decomposition needed)
- Complex task with parallel opportunities
- Task with linear dependencies
- Task with mixed dependencies
- Circular dependency detection
- Duration estimation accuracy

---

#### Component 6: TaskAssigner

**Purpose:** Distribute tasks to available workers

**Responsibilities:**
- Match tasks to worker capabilities
- Respect task priorities
- Handle worker failures
- Balance load across workers
- Track task assignments

**Interface:**
```typescript
class TaskAssigner {
  constructor(
    queue: TaskQueueWrapper,
    registry: WorkerRegistry
  );
  
  // Assignment
  async assignTask(task: Task): Promise<AssignmentResult>;
  async assignBatch(tasks: Task[]): Promise<AssignmentResult[]>;
  
  // Reassignment (for failures)
  async reassignTask(
    taskId: string,
    reason: string
  ): Promise<AssignmentResult>;
  
  // Queries
  async getTaskAssignments(workerId: string): Promise<Task[]>;
  async getUnassignedTasks(): Promise<Task[]>;
  
  // Load Balancing
  async getWorkerLoad(workerId: string): Promise<number>;
  async rebalanceTasks(): Promise<number>;  // Returns number of tasks moved
}
```

**Assignment Strategy:**
```typescript
async assignTask(task: Task): Promise<AssignmentResult> {
  // 1. Find idle workers with matching capabilities
  const candidates = await this.findEligibleWorkers(task);
  
  if (candidates.length === 0) {
    // No workers available - queue task
    await this.queue.addTask(task, {
      priority: this.getPriority(task.priority)
    });
    return { status: 'queued', taskId: task.id };
  }
  
  // 2. Select worker with lowest load
  const worker = this.selectWorker(candidates);
  
  // 3. Add to queue targeting specific worker
  await this.queue.addTask(task, {
    priority: this.getPriority(task.priority),
    workerId: worker.id  // BullMQ worker will filter by this
  });
  
  // 4. Update registry
  await this.registry.assignTask(worker.id, task.id);
  
  return {
    status: 'assigned',
    taskId: task.id,
    workerId: worker.id
  };
}
```

**Priority Mapping:**
```typescript
const PRIORITY_MAP = {
  'critical': 1,   // Highest priority
  'high': 2,
  'normal': 3,
  'low': 4         // Lowest priority
};
```

**Performance Benchmarks:**
- Task assignment: <20ms
- Batch assignment (10 tasks): <100ms
- Worker selection: <10ms
- Load rebalancing: <500ms

**Tests Required:**
- Assign to idle worker
- Queue when no workers available
- Respect task priorities
- Reassign after worker failure
- Load balancing
- Batch assignment

---

#### Component 7: ProgressAggregator

**Purpose:** Combine progress from all workers into unified view

**Responsibilities:**
- Subscribe to worker progress events
- Maintain real-time progress state
- Calculate overall completion percentage
- Detect stalled or failed tasks
- Provide progress query API

**Interface:**
```typescript
class ProgressAggregator {
  constructor(
    messageBus: MessageBusWrapper,
    registry: WorkerRegistry
  );
  
  // Lifecycle
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  // Progress Queries
  getOverallProgress(): OverallProgress;
  getTaskProgress(taskId: string): TaskProgress | null;
  getWorkerProgress(workerId: string): WorkerProgress | null;
  
  // Event Streams
  onProgressUpdate(callback: ProgressCallback): void;
  onTaskComplete(callback: CompletionCallback): void;
  onTaskFailed(callback: FailureCallback): void;
  
  // Analysis
  detectStalledTasks(threshold: number): string[];  // Returns stalled task IDs
  getCompletionEstimate(): Date;
}
```

**Progress Calculation:**
```typescript
interface OverallProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  queuedTasks: number;
  
  percentComplete: number;      // 0.0 to 1.0
  estimatedTimeRemaining: number;  // Milliseconds
  
  taskBreakdown: {
    [taskId: string]: {
      status: TaskStatus;
      progress: number;         // 0.0 to 1.0
      workerId?: string;
      lastUpdate: Date;
    };
  };
  
  workerBreakdown: {
    [workerId: string]: {
      currentTask?: string;
      tasksCompleted: number;
      tasksFailed: number;
      avgTaskDuration: number;
    };
  };
}
```

**Event Handling:**
```typescript
async start(): Promise<void> {
  // Subscribe to all task events
  await this.messageBus.psubscribe('task:*', (event, channel) => {
    this.handleProgressEvent(event);
  });
  
  // Subscribe to worker heartbeats for crash detection
  await this.messageBus.subscribe('worker:heartbeat', (event) => {
    this.updateWorkerActivity(event.workerId);
  });
  
  // Start periodic stall detection
  this.stallDetector = setInterval(() => {
    this.detectAndReportStalledTasks();
  }, 30000);  // Check every 30 seconds
}
```

**Performance Benchmarks:**
- Progress calculation: <10ms
- Event handling: <5ms per event
- Stalled task detection: <50ms

**Tests Required:**
- Calculate overall progress
- Handle progress events
- Detect completed tasks
- Detect failed tasks
- Calculate time remaining
- Stalled task detection

---

### Week 5-6: Worker Automation

#### Component 8: TaskClaimer

**Purpose:** Worker-side task claiming from queue

**Responsibilities:**
- Poll queue for available tasks
- Claim tasks matching worker capabilities
- Handle claiming failures
- Support multiple concurrent claims (if configured)

**Interface:**
```typescript
class TaskClaimer {
  constructor(
    queue: TaskQueueWrapper,
    workerId: string,
    capabilities: WorkerCapabilities
  );
  
  // Claiming
  async claimNext(): Promise<Task | null>;
  async claimBatch(count: number): Promise<Task[]>;
  
  // Lifecycle
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  // Status
  isActive(): boolean;
  getClaimCount(): number;
}
```

**Claim Strategy:**
```typescript
async claimNext(): Promise<Task | null> {
  // BullMQ worker pattern handles claiming automatically
  // This is a thin wrapper around BullMQ's job processing
  
  return new Promise((resolve) => {
    this.worker.on('job', (job) => {
      resolve(job.data as Task);
    });
  });
}
```

**Performance Benchmarks:**
- Claim latency: <20ms
- Claim throughput: >100 tasks/second

**Tests Required:**
- Claim single task
- Claim when queue empty
- Claim with capability filtering
- Concurrent claims

---

#### Component 9: WorkExecutor

**Purpose:** Execute claimed tasks and report results

**Responsibilities:**
- Execute task logic
- Report progress periodically
- Handle execution errors
- Create checkpoints for long tasks
- Return results

**Interface:**
```typescript
class WorkExecutor {
  constructor(
    messageBus: MessageBusWrapper,
    checkpointManager: CheckpointManager,  // From Phase 1
    workerId: string
  );
  
  // Execution
  async executeTask(
    task: Task,
    progressCallback: ProgressCallback
  ): Promise<TaskResult>;
  
  // Helpers
  async createTaskCheckpoint(
    task: Task,
    progress: number
  ): Promise<string>;
  
  async reportProgress(
    task: Task,
    progress: number,
    message?: string
  ): Promise<void>;
}
```

**Execution Pattern:**
```typescript
async executeTask(
  task: Task,
  progressCallback: ProgressCallback
): Promise<TaskResult> {
  const startTime = Date.now();
  
  try {
    // Report start
    await this.reportProgress(task, 0, 'Task started');
    
    // Execute based on task type
    let result: any;
    switch (task.type) {
      case 'code':
        result = await this.executeCodeTask(task, progressCallback);
        break;
      case 'test':
        result = await this.executeTestTask(task, progressCallback);
        break;
      case 'research':
        result = await this.executeResearchTask(task, progressCallback);
        break;
      // ... other types
    }
    
    // Report completion
    await this.reportProgress(task, 1.0, 'Task completed');
    
    return {
      success: true,
      output: result,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    // Report failure
    await this.reportProgress(task, -1, `Task failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}
```

**Progress Reporting:**
```typescript
async reportProgress(
  task: Task,
  progress: number,
  message?: string
): Promise<void> {
  const event: ProgressEvent = {
    id: uuidv4(),
    workerId: this.workerId,
    taskId: task.id,
    type: progress >= 1.0 ? 'completed' : 
          progress < 0 ? 'failed' : 
          progress === 0 ? 'started' : 'progress',
    progress: {
      current: Math.floor(progress * 100),
      total: 100,
      percentage: progress,
      message
    },
    timestamp: new Date()
  };
  
  await this.messageBus.publish('task:progress', event);
}
```

**Checkpoint Integration:**
```typescript
async createTaskCheckpoint(
  task: Task,
  progress: number
): Promise<string> {
  // Use Phase 1 CheckpointManager
  const checkpoint = await this.checkpointManager.createCheckpoint({
    sessionId: task.context.sessionId,
    taskState: {
      currentTaskId: task.id,
      progress,
      nextSteps: ['Continue task execution'],
      completedSteps: [`${Math.floor(progress * 100)}% complete`]
    },
    // ... other state from Phase 1
  });
  
  return checkpoint.id;
}
```

**Performance Benchmarks:**
- Progress reporting: <10ms
- Checkpoint creation: <150ms (Phase 1 benchmark)
- Execution overhead: <5% of task duration

**Tests Required:**
- Execute code task
- Execute test task
- Execute research task
- Progress reporting
- Error handling
- Checkpoint creation during long task

---

#### Component 10: ProgressReporter

**Purpose:** Manage worker heartbeats and status updates

**Responsibilities:**
- Send periodic heartbeats to registry
- Report worker status changes
- Update worker statistics
- Handle disconnection gracefully

**Interface:**
```typescript
class ProgressReporter {
  constructor(
    registry: WorkerRegistry,
    messageBus: MessageBusWrapper,
    workerId: string,
    heartbeatInterval: number = 10000  // 10 seconds
  );
  
  // Lifecycle
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  // Status Updates
  async reportStatus(status: WorkerStatus): Promise<void>;
  async reportTaskStart(taskId: string): Promise<void>;
  async reportTaskComplete(
    taskId: string,
    stats: TaskStats
  ): Promise<void>;
  
  // Manual Heartbeat
  async sendHeartbeat(): Promise<void>;
}
```

**Heartbeat Loop:**
```typescript
async start(): Promise<void> {
  this.heartbeatTimer = setInterval(async () => {
    try {
      await this.sendHeartbeat();
      
      // Also publish to message bus for real-time monitoring
      await this.messageBus.publish('worker:heartbeat', {
        id: uuidv4(),
        workerId: this.workerId,
        type: 'heartbeat',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Heartbeat failed: ${error.message}`);
      // Continue trying - connection might recover
    }
  }, this.heartbeatInterval);
}
```

**Performance Benchmarks:**
- Heartbeat latency: <5ms
- Heartbeat interval accuracy: ±100ms

**Tests Required:**
- Start/stop heartbeat loop
- Heartbeat sent on interval
- Status updates
- Task completion reporting
- Disconnection handling

---

#### Component 11: WorkerCrashRecovery

**Purpose:** Auto-resume worker tasks after crash using Phase 1 infrastructure

**Responsibilities:**
- Detect worker crashes (via missed heartbeats)
- Identify orphaned tasks
- Reassign tasks to healthy workers
- Restore task state from checkpoints
- Resume execution from last checkpoint

**Interface:**
```typescript
class WorkerCrashRecovery {
  constructor(
    registry: WorkerRegistry,
    assigner: TaskAssigner,
    checkpointRepo: CheckpointRepository,  // From Phase 1
    resumeDetector: ResumeDetector         // From Phase 1
  );
  
  // Recovery
  async detectAndRecover(): Promise<RecoveryReport>;
  async recoverWorker(workerId: string): Promise<RecoveryResult>;
  
  // Lifecycle
  async startMonitoring(interval: number): Promise<void>;
  async stopMonitoring(): Promise<void>;
}
```

**Recovery Process:**
```typescript
async recoverWorker(workerId: string): Promise<RecoveryResult> {
  // 1. Get worker's current task
  const worker = await this.registry.getWorker(workerId);
  if (!worker?.currentTask) {
    return { recovered: false, reason: 'No active task' };
  }
  
  const { taskId } = worker.currentTask;
  
  // 2. Check if task had checkpoints
  const checkpoints = await this.checkpointRepo.getCheckpointsForSession(
    worker.sessionId
  );
  
  const latestCheckpoint = checkpoints
    .filter(cp => cp.task_state?.currentTaskId === taskId)
    .sort((a, b) => b.checkpoint_number - a.checkpoint_number)[0];
  
  if (!latestCheckpoint) {
    // No checkpoint - reassign task from beginning
    await this.assigner.reassignTask(taskId, 'Worker crashed, no checkpoint');
    return {
      recovered: true,
      resumedFromCheckpoint: false,
      reassignedTaskId: taskId
    };
  }
  
  // 3. Reassign task with checkpoint context
  await this.assigner.reassignTask(taskId, 'Worker crashed, resuming from checkpoint');
  
  return {
    recovered: true,
    resumedFromCheckpoint: true,
    checkpointId: latestCheckpoint.id,
    reassignedTaskId: taskId
  };
}
```

**Monitoring Loop:**
```typescript
async startMonitoring(interval: number = 60000): Promise<void> {
  this.monitoringTimer = setInterval(async () => {
    const report = await this.detectAndRecover();
    
    if (report.crashedWorkers.length > 0) {
      console.warn(`Recovered ${report.recoveredTasks.length} tasks from ${report.crashedWorkers.length} crashed workers`);
    }
  }, interval);
}
```

**Performance Benchmarks:**
- Crash detection: <100ms
- Task recovery: <200ms
- Checkpoint restoration: <50ms (Phase 1 benchmark)

**Tests Required:**
- Detect crashed worker
- Recover task without checkpoint
- Recover task with checkpoint
- Multiple simultaneous crashes
- Monitoring loop execution

---

## Integration & Testing

### E2E Test Scenarios

**Scenario 1: Simple Parallel Execution**
```typescript
describe('Simple Parallel Execution', () => {
  it('should execute 3 independent tasks in parallel', async () => {
    // Setup: 3 workers, 3 independent tasks
    const supervisor = new Supervisor();
    await supervisor.start();
    
    const tasks = [
      { type: 'code', description: 'Implement function A' },
      { type: 'code', description: 'Implement function B' },
      { type: 'code', description: 'Implement function C' }
    ];
    
    const startTime = Date.now();
    const results = await supervisor.executeTasks(tasks);
    const duration = Date.now() - startTime;
    
    // Verify
    expect(results.length).toBe(3);
    expect(results.every(r => r.success)).toBe(true);
    
    // Should be ~3x faster than serial (assuming tasks take ~10s each)
    expect(duration).toBeLessThan(15000);  // Allow 50% overhead
  });
});
```

**Scenario 2: Dependent Task Execution**
```typescript
describe('Dependent Task Execution', () => {
  it('should respect task dependencies', async () => {
    const tasks = [
      { id: '1', type: 'code', description: 'Create model', dependencies: [] },
      { id: '2', type: 'code', description: 'Create service', dependencies: ['1'] },
      { id: '3', type: 'test', description: 'Test model', dependencies: ['1'] },
      { id: '4', type: 'test', description: 'Test service', dependencies: ['2'] }
    ];
    
    const results = await supervisor.executeTasks(tasks);
    
    // Verify execution order
    expect(results[0].taskId).toBe('1');  // Model first
    expect(['2', '3']).toContain(results[1].taskId);  // Service OR test (parallel)
    expect(['2', '3']).toContain(results[2].taskId);  // The other one
    expect(results[3].taskId).toBe('4');  // Service test last
  });
});
```

**Scenario 3: Worker Crash Recovery**
```typescript
describe('Worker Crash Recovery', () => {
  it('should recover and reassign tasks after worker crash', async () => {
    // Start task on worker
    const task = { id: '1', type: 'code', description: 'Long task' };
    const assignment = await supervisor.assignTask(task);
    
    // Simulate crash (stop sending heartbeats)
    await worker.simulateCrash();
    
    // Wait for crash detection
    await sleep(35000);  // 3 missed heartbeats @ 10s interval
    
    // Verify task was reassigned
    const recovery = await supervisor.getRecoveryReport();
    expect(recovery.reassignedTasks).toContain('1');
  });
});
```

**Scenario 4: Progress Aggregation**
```typescript
describe('Progress Aggregation', () => {
  it('should aggregate progress from multiple workers', async () => {
    const tasks = [
      { id: '1', type: 'code', description: 'Task A' },
      { id: '2', type: 'code', description: 'Task B' },
      { id: '3', type: 'code', description: 'Task C' }
    ];
    
    supervisor.executeTasks(tasks);
    
    // Check progress after 1 second
    await sleep(1000);
    const progress1 = supervisor.getOverallProgress();
    expect(progress1.runningTasks).toBe(3);
    expect(progress1.percentComplete).toBeGreaterThan(0);
    
    // Check progress after 5 seconds
    await sleep(4000);
    const progress2 = supervisor.getOverallProgress();
    expect(progress2.percentComplete).toBeGreaterThan(progress1.percentComplete);
  });
});
```

### Performance Benchmarks (Full System)

**Benchmark 1: Task Throughput**
- Setup: 100 independent tasks, 5 workers
- Expected: >20 tasks/minute completion rate
- Expected: ~5x faster than single-chat execution

**Benchmark 2: Coordination Overhead**
- Setup: Measure Redis operations during task execution
- Expected: <5% overhead compared to raw task execution time

**Benchmark 3: Crash Recovery Time**
- Setup: Crash worker mid-task, measure time to reassignment
- Expected: <60 seconds from crash to task reassignment

**Benchmark 4: Scalability**
- Setup: 1, 3, 5, 10 workers with 100 tasks
- Expected: Linear speedup up to 5 workers, then diminishing returns

---

## Implementation Plan

### Week 1: Infrastructure Setup (Days 1-5)

**Day 1: Redis Setup**
- Install Redis locally (Windows)
- Configure Redis for development
- Implement RedisConnectionManager
- Tests: Connection, reconnection, health checks

**Day 2: Task Queue**
- Install BullMQ and dependencies
- Implement TaskQueueWrapper
- Tests: Add task, process task, retry logic

**Day 3: Message Bus**
- Implement MessageBusWrapper
- Tests: Publish, subscribe, patterns

**Day 4: Worker Registry**
- Implement WorkerRegistry
- Tests: Registration, heartbeats, crash detection

**Day 5: Integration Testing**
- E2E test: Infrastructure components working together
- Performance benchmarks for infrastructure layer

### Week 2: Supervisor Pattern (Days 6-10)

**Day 6: Task Decomposition**
- Implement TaskDecomposer
- Tests: Simple task, complex task, dependencies

**Day 7: Task Assignment**
- Implement TaskAssigner
- Tests: Assignment, reassignment, load balancing

**Day 8: Progress Aggregation**
- Implement ProgressAggregator
- Tests: Progress calculation, event handling, stall detection

**Day 9: Supervisor API**
- Implement high-level Supervisor class (combines all supervisor components)
- Tests: Full supervisor workflow

**Day 10: Integration Testing**
- E2E test: Supervisor pattern with mock workers
- Performance benchmarks for supervisor layer

### Week 3: Worker Automation (Days 11-15)

**Day 11: Task Claiming**
- Implement TaskClaimer
- Tests: Claim task, capability filtering

**Day 12: Work Execution**
- Implement WorkExecutor
- Tests: Execute code task, test task, progress reporting

**Day 13: Progress Reporting**
- Implement ProgressReporter
- Tests: Heartbeats, status updates

**Day 14: Crash Recovery**
- Implement WorkerCrashRecovery
- Tests: Detect crash, recover task, checkpoint integration

**Day 15: Integration Testing**
- E2E test: Full worker lifecycle
- Performance benchmarks for worker layer

### Week 4: System Integration (Days 16-20)

**Day 16-17: End-to-End Testing**
- Scenario 1: Simple parallel execution
- Scenario 2: Dependent task execution
- Scenario 3: Worker crash recovery
- Scenario 4: Progress aggregation

**Day 18: Performance Optimization**
- Run full system benchmarks
- Identify and fix bottlenecks
- Optimize Redis operations

**Day 19: Documentation**
- Update ROADMAP
- Create user guide for multi-chat coordination
- Document deployment process

**Day 20: Final Validation**
- All tests passing
- All benchmarks met
- Documentation complete
- Ready for Phase 3

---

## Success Criteria

### Functional Requirements

✅ **Multi-Chat Execution:**
- Supervisor can delegate tasks to 3-5 worker chats
- Workers execute independently and report progress
- Supervisor aggregates results

✅ **Task Management:**
- Complex work decomposed into subtasks
- Dependencies enforced correctly
- Priority respected

✅ **Crash Recovery:**
- Worker crashes detected within 30 seconds
- Tasks automatically reassigned
- Checkpoint integration working

✅ **Real-Time Monitoring:**
- Progress visible across all workers
- Stalled tasks detected
- Completion estimates accurate

### Performance Requirements

✅ **Throughput:**
- >20 tasks/minute with 5 workers
- 3-5x faster than single-chat execution

✅ **Latency:**
- Task assignment: <20ms
- Progress updates: <10ms delivery latency
- Crash detection: <60 seconds

✅ **Reliability:**
- 0% task loss on worker crash
- <5% coordination overhead
- >99% uptime for Redis infrastructure

### Quality Requirements

✅ **Test Coverage:**
- 95%+ code coverage
- All E2E scenarios passing
- All performance benchmarks met

✅ **Documentation:**
- Complete API documentation
- User guide for multi-chat workflows
- Deployment runbook

✅ **Technical Debt:**
- Zero mocks/stubs in production code
- All ESLint rules enforced
- No TODO comments

---

## Risks & Mitigations

### Risk 1: Redis Complexity

**Risk:** Redis setup and configuration could be complex on Windows  
**Probability:** Medium  
**Impact:** Medium (delays Week 1)

**Mitigation:**
- Use Docker for Redis (simpler than native Windows install)
- Fallback: Use Redis Cloud (free tier) if local setup fails
- Week 1 Day 1 dedicated entirely to Redis setup

### Risk 2: BullMQ Learning Curve

**Risk:** BullMQ might have unexpected behavior or documentation gaps  
**Probability:** Low (BullMQ is well-documented)  
**Impact:** Medium (delays Week 1-2)

**Mitigation:**
- Study BullMQ examples before implementation
- Use official BullMQ patterns and best practices
- Allocate extra time for learning (Week 1)

### Risk 3: Network Latency

**Risk:** Redis network operations could add latency  
**Probability:** Low (local Redis is fast)  
**Impact:** Low (5-10ms overhead acceptable)

**Mitigation:**
- Run Redis locally (not cloud) for low latency
- Use Redis pipelining for batch operations
- Monitor latency in performance tests

### Risk 4: Claude Desktop Multi-Chat UX

**Risk:** Opening/managing multiple Claude Desktop windows might be cumbersome  
**Probability:** High (no built-in multi-chat support)  
**Impact:** Medium (usability issue, not technical)

**Mitigation:**
- Phase 2 focuses on backend infrastructure (not UX)
- Phase 3/4 can add UX improvements (auto-open chats, dashboard)
- For now, human manually opens worker chats (acceptable for testing)

### Risk 5: Task Decomposition Accuracy

**Risk:** AI-generated task decomposition might miss dependencies or create poor plans  
**Probability:** Medium (decomposition is hard)  
**Impact:** Medium (inefficient execution, not broken)

**Mitigation:**
- Start with simple, well-defined decomposition rules
- Human can review and approve decomposition plan before execution
- Iterate on decomposition algorithm based on real usage

---

## Phase 2 Deliverables

### Code Deliverables

1. **Infrastructure Layer (Week 1)**
   - RedisConnectionManager (100 LOC, 10 tests)
   - TaskQueueWrapper (150 LOC, 15 tests)
   - MessageBusWrapper (120 LOC, 12 tests)
   - WorkerRegistry (200 LOC, 20 tests)

2. **Supervisor Layer (Week 2)**
   - TaskDecomposer (250 LOC, 20 tests)
   - TaskAssigner (180 LOC, 18 tests)
   - ProgressAggregator (220 LOC, 15 tests)
   - Supervisor (200 LOC, 15 tests)

3. **Worker Layer (Week 3)**
   - TaskClaimer (100 LOC, 8 tests)
   - WorkExecutor (300 LOC, 20 tests)
   - ProgressReporter (120 LOC, 10 tests)
   - WorkerCrashRecovery (150 LOC, 12 tests)

**Total:** ~1,990 LOC, ~165 tests  
**Comparison:** Would be ~4,200 LOC without LEAN-OUT approach

### Documentation Deliverables

1. **Specifications**
   - This document (SPEC_PHASE_2_MULTI_CHAT.md)
   - API documentation for all components

2. **Guides**
   - Multi-chat setup guide
   - Task decomposition guide
   - Troubleshooting guide

3. **Updates**
   - ROADMAP.md (Phase 2 complete)
   - CURRENT_STATUS.md (Phase 2 metrics)

---

## Next Steps After Phase 2

**Phase 3: Self-Evolution Engine**
- Pattern detection across sessions
- Automated improvement proposals
- Cross-project learning

**Phase 4: Autonomous Operation**
- Background monitoring
- Self-healing workflows
- Zero-intervention development

---

**END OF SPECIFICATION**

*This document will be updated as Phase 2 implementation progresses.*
