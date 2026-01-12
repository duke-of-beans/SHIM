# MCP Handler API Reference

**Purpose:** Quick reference for actual core class APIs vs handler expectations

---

## CheckpointManager

**Constructor:**
```typescript
constructor(config: CheckpointManagerConfig)

interface CheckpointManagerConfig {
  signalCollector: SignalCollector;
  checkpointRepo: CheckpointRepository;
  toolCallInterval?: number;      // Default: 5
  timeIntervalMs?: number;         // Default: 10 minutes
}
```

**Methods:**
- `shouldTriggerCheckpoint(): TriggerCheckResult`
- `createCheckpoint(input: CreateCheckpointInput): Promise<Checkpoint>`
- `autoCheckpoint(input: Omit<CreateCheckpointInput, 'trigger'>): Promise<AutoCheckpointResult>`
- `getCheckpointStats(sessionId: string): Promise<CheckpointStats>`

**CreateCheckpointInput:**
```typescript
interface CreateCheckpointInput {
  sessionId: string;
  trigger: CheckpointTrigger;
  operation: string;
  progress: number;
  userPreferences?: string;
}
```

---

## CheckpointRepository

**Constructor:**
```typescript
constructor(dbPath: string)
```

**Methods:**
- `initialize(): Promise<void>`
- `save(checkpoint: Checkpoint): Promise<string>`
- `getById(id: string): Promise<Checkpoint | null>`
- `getMostRecent(sessionId: string): Promise<Checkpoint | null>`
- `listBySession(sessionId: string): Promise<Checkpoint[]>`
- `getUnrestoredCheckpoint(sessionId: string): Promise<Checkpoint | null>`
- `markRestored(id: string, success: boolean, fidelity: number): Promise<void>`

---

## ResumeDetector

**Constructor:**
```typescript
constructor(repository: CheckpointRepository)
```

**Methods:**
- `checkResume(sessionId: string): Promise<ResumeDetection>`
- `generateResumePrompt(checkpoint: Checkpoint): ResumePrompt`

**NOT:**
- ❌ `detectIncompleteSession()` - Use `checkResume()` instead

---

## SessionRestorer

**Constructor:**
```typescript
constructor(repository: CheckpointRepository)
```

**Methods:**
- `loadCheckpoint(checkpointId: string): Promise<Checkpoint | null>`
- `loadMostRecent(sessionId: string): Promise<Checkpoint | null>`
- `restoreState(checkpointId: string): Promise<RestoredState>`
- `restoreAndMark(checkpointId: string, success: boolean, fidelity: number): Promise<void>`

**NOT:**
- ❌ `generateResumePrompt()` - This is on `ResumeDetector`, not `SessionRestorer`

---

## SignalCollector

**Constructor:**
```typescript
constructor(thresholds: RiskThresholds = DEFAULT_THRESHOLDS)

interface RiskThresholds {
  warningZone: {...};
  dangerZone: {...};
}
```

**Methods:**
- `onMessage(content: string, role: 'user' | 'assistant'): void`
- `onToolCall(tool: string, args: Record<string, unknown>, result: Record<string, unknown>, latency: number): void`
- `getCrashRisk(): CrashRisk`
- `getSignals(): CrashSignals`
- `resetCheckpointCounter(): void`

**NOT:**
- ❌ `collectSignals()` - Use `getSignals()` instead

---

## SignalHistoryRepository

**Constructor:**
```typescript
constructor(dbPath: string)
```

**Methods:**
- `initialize(): Promise<void>`
- `saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string>`
- `getSessionSnapshots(sessionId: string): Promise<SignalSnapshot[]>`
- `getLatestSnapshot(sessionId: string): Promise<SignalSnapshot | null>`
- `getSnapshotsByRisk(riskLevel: CrashRisk): Promise<SignalSnapshot[]>`

**NOT:**
- ❌ `getRecentSignals()` - Use `getSessionSnapshots()` or `getLatestSnapshot()` instead

---

## EvolutionCoordinator

**Constructor:**
```typescript
constructor(config: CoordinatorConfig)

interface CoordinatorConfig {
  maxConcurrentExperiments?: number;
  minExperimentGap?: number;
}
```

**Methods:**
- `registerArea(area: EvolutionArea): Promise<void>`
- `start(): Promise<void>`
- (more methods for evolution management)

**NOT:**
- ❌ `analyzeCodebase()` - This class is for evolution experiments, NOT code analysis
- **FIX:** Handlers need different approach for code analysis

---

## Handler Fixes Required

### 1. auto-checkpoint.ts & force-checkpoint.ts
```typescript
// WRONG:
const manager = new CheckpointManager(projectPath);

// RIGHT:
const repo = new CheckpointRepository(dbPath);
await repo.initialize();

const collector = new SignalCollector();
const manager = new CheckpointManager({
  signalCollector: collector,
  checkpointRepo: repo
});
```

### 2. SessionContext → CreateCheckpointInput
```typescript
// Transform:
interface SessionContext {
  project: string;
  operation: string;
  progress: number;
  currentStep: string;
  decisions: string[];
  nextSteps: string[];
  activeFiles: string[];
}

// To:
interface CreateCheckpointInput {
  sessionId: string;
  trigger: CheckpointTrigger;
  operation: string;
  progress: number;
  userPreferences?: string;
}
```

### 3. recovery-check.ts
```typescript
// WRONG:
const detector = new ResumeDetector(repoPath);
const resumeNeeded = await detector.detectIncompleteSession(sessionId);

// RIGHT:
const repo = new CheckpointRepository(dbPath);
await repo.initialize();
const detector = new ResumeDetector(repo);
const resumeNeeded = await detector.checkResume(sessionId);
```

### 4. session-status.ts
```typescript
// WRONG:
const manager = new CheckpointManager(projectPath);
const checkpoints = await manager.listCheckpoints(sessionId);

// RIGHT:
const repo = new CheckpointRepository(dbPath);
await repo.initialize();
const checkpoints = await repo.listBySession(sessionId);
```

### 5. signal-monitor.ts
```typescript
// WRONG:
const collector = new SignalCollector(repository, thresholds);
const signals = await collector.collectSignals();

// RIGHT:
const collector = new SignalCollector(thresholds);
const signals = collector.getSignals();
```

### 6. code-analysis.ts
```typescript
// WRONG:
const coordinator = new EvolutionCoordinator(targetPath);
const analysis = await coordinator.analyzeCodebase();

// RIGHT:
// Need to determine correct approach for code analysis
// EvolutionCoordinator is NOT for code analysis
// Options:
// 1. Create separate CodeAnalyzer class
// 2. Use existing CodeAnalyzer from evolution/
// 3. Remove this handler (evolution coordination != code analysis)
```

---

**Last Updated:** January 12, 2026  
**For:** MCP Handler API fixes
