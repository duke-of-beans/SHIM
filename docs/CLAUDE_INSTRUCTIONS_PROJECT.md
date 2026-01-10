# CLAUDE INSTRUCTIONS - SHIM PROJECT

**Version:** 1.0.0  
**Updated:** January 10, 2026  
**Philosophy:** Predictive crash prevention through observable signals + KERNL infrastructure

---

## §1 BOOTSTRAP SEQUENCE [MANDATORY - AUTOMATIC - 60 SECONDS]

### Step 1: KERNL Session Context [FIRST - ALWAYS - AUTOMATIC]

```typescript
// CRITICAL: This runs AUTOMATICALLY at every session start
KERNL:get_session_context({
  project: "shim",
  messageCount: 20
})

// Returns:
// - needsResume: boolean (incomplete work from previous session?)
// - resumePrompt: string (what was being worked on)
// - checkpointRecommended: boolean (session getting long?)
// - patternSuggestions: array (detected learnings to record)
// - projectStatus: object (phase status, week progress)
```

**IF needsResume === true:**
```
📋 INCOMPLETE WORK DETECTED

[Display resumePrompt to user]

You were working on: [task description]
Progress: [X%]
Last checkpoint: [timestamp]
Next steps: [array of actions]

Continue from checkpoint?
```

**User says "yes" or "continue":**
→ Resume from checkpoint context
→ Display current task and next step
→ Begin execution immediately

**User says "no" or "new task":**
→ Mark previous work complete: KERNL:mark_complete()
→ Proceed with new task

---

### Step 2: Batch Load Project State [PARALLEL - FAST]

```typescript
// Load all essential files in ONE operation (2-3 seconds)
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    "SOURCE_OF_TRUTH.md",
    "CURRENT_STATUS.md",
    "CONTINUATION_PROMPT_NEXT_SESSION.md",
    "docs/ARCHITECTURE.md",
    "docs/ROADMAP.md",
    "docs/specs/SPEC_CRASH_PREVENTION.md"
  ]
})
```

**Display To User:**
```
✅ SHIM Session Initialized (60 seconds)

Phase: 1 (Crash Prevention)
Week: [X] of 16
Current Focus: [from CURRENT_STATUS.md]

TypeScript: [0 errors | X errors]
Tests: [passing | X failing]
Coverage: [X%]

Last Session: [from continuation prompt]
Ready to continue: [yes/no based on resume detection]

What should we build today?
```

---

## §2 SHIM IDENTITY & DOMAIN [PERMANENT CONTEXT]

### Core Mission

**SHIM Is:**
- Crash prevention and recovery system for Claude Desktop
- MCP server providing predictive checkpointing
- Observable signal monitoring infrastructure
- Complementary to KERNL's crash recovery

**SHIM Is NOT:**
- Cognitive operating system (that's GREGORE)
- Multi-model orchestrator
- Frontend application
- General-purpose conversation system

### Domain-Specific Knowledge

**Observable Signals (4 Categories):**
1. **Token-based:** Context window usage, tokens per message
2. **Message-based:** Message count, tool call frequency
3. **Time-based:** Session duration, response latency trends
4. **Behavior-based:** Tool failure rate, error patterns

**Crash Risk Zones:**
- Safe: <60% context, <35 messages, <60min session
- Warning: 60-75% context, 35-50 messages, 60-90min session
- Danger: >75% context, >50 messages, >90min session

**Checkpoint Architecture:**
- Target: <100KB compressed per checkpoint
- Maximum: 200KB absolute limit
- Compression: gzip level 9
- Storage: SQLite with write-ahead logging
- Triggers: Tool call intervals, time intervals, danger zone, milestones

**Resume Protocol:**
- Detection: Check for incomplete work on session start
- Prompt generation: Structured resume with context, progress, next steps
- Fidelity target: >90% context restoration
- Recovery time: <2 minutes end-to-end

---

### SHIM vs GREGORE (Key Differences)

**GREGORE:**
- Cognitive operating system
- Multi-model orchestration
- Active Orchestration Theory (9 engines)
- Frontend + backend (Next.js, Tauri)
- Complex backlog (68 EPICs)

**SHIM:**
- Crash prevention infrastructure
- Single-purpose MCP server
- Observable signals + checkpointing
- Backend only (TypeScript, SQLite)
- Simple roadmap (4 phases)

**Shared Infrastructure:**
- Both use KERNL for session management
- Both use Desktop Commander for git operations
- Both enforce zero TypeScript errors
- Both use LEAN-OUT principle (tools over custom code)

---

## §3 AUTHORITY PROTOCOL [SHIM-SPECIFIC TRIGGERS]

### Trigger 1: Signal Threshold Violations

```
IF (implementing crash detection && weak thresholds proposed) THEN
  🛑 STOP - THRESHOLD VIOLATION
  
  STANDARD THRESHOLDS (Non-Negotiable):
  Warning Zone:
  - Context window: 60% usage
  - Message count: 35
  - Session duration: 60 minutes
  - Tool calls since checkpoint: 10
  - Tool failure rate: 15%
  
  Danger Zone:
  - Context window: 75% usage
  - Message count: 50
  - Session duration: 90 minutes
  - Tool calls since checkpoint: 15
  - Tool failure rate: 20%
  
  RATIONALE: Based on empirical crash data from GREGORE friction analysis
  
  REFUSE to implement weaker thresholds without data justification.
```

---

### Trigger 2: Checkpoint Size Violations

```
IF (checkpoint exceeds size limits) THEN
  🛑 STOP - SIZE VIOLATION
  
  TARGET: <100KB compressed
  MAXIMUM: 200KB compressed
  
  VIOLATION DETECTED: Checkpoint is [X]KB
  
  INVESTIGATION REQUIRED:
  1. Which field(s) bloating checkpoint?
  2. Is truncation too lenient?
  3. Is compression working properly?
  4. Does schema need redesign?
  
  SOLUTIONS (in order):
  1. Tighten truncation limits
  2. Improve compression algorithm
  3. Exclude non-essential data
  4. Redesign checkpoint schema
  
  DO NOT ship checkpoints that violate size limits.
```

---

### Trigger 3: Performance Violations

```
IF (checkpoint creation > 100ms consistently) THEN
  🛑 STOP - PERFORMANCE ISSUE
  
  TARGET: <100ms per checkpoint
  MAXIMUM: 200ms acceptable temporarily
  
  MEASURED: [X]ms average over [N] checkpoints
  
  INVESTIGATION REQUIRED:
  1. Profile checkpoint creation (which operations slow?)
  2. Is compression the bottleneck?
  3. Is serialization inefficient?
  4. Is database write slow?
  
  SOLUTIONS (in order):
  1. Optimize serialization (minimize JSON.stringify work)
  2. Optimize compression (level 6 vs 9 tradeoff?)
  3. Batch database writes
  4. Use faster compression (zstd? snappy?)
  
  DO NOT ship code that consistently exceeds target.
```

---

### Trigger 4: Test Coverage Violations

```
IF (test coverage < 80% && attempting commit) THEN
  🛑 STOP - COVERAGE VIOLATION
  
  MINIMUM: 80% coverage (jest.config.js)
  CURRENT: [X]% coverage
  
  UNCOVERED FILES:
  [list from jest --coverage]
  
  REQUIREMENT: Write tests before commit
  
  EXCEPTIONS: None (coverage is enforced by pre-commit hook)
```

---

### Trigger 5: Data Integrity Violations

```
IF (checkpoint corruption || data loss || silent failure) THEN
  🛑 STOP - DATA INTEGRITY VIOLATION (P0)
  
  ZERO TOLERANCE for:
  - Corrupted checkpoints
  - Silent failures
  - Partial writes
  - Data loss
  
  INVESTIGATION:
  1. What caused corruption?
  2. Can we detect it proactively?
  3. How do we prevent it?
  4. Do we need checksums?
  
  SOLUTIONS:
  1. Add validation (schema validation, checksums)
  2. Atomic writes (temp file + rename)
  3. Write-ahead logging (SQLite WAL mode)
  4. Recovery mechanisms
  
  This is SHIM's core value proposition - checkpoints MUST work.
```

---

### Trigger 6: Accuracy Violations

```
IF (crash prediction accuracy < 90%) THEN
  🛑 STOP - ACCURACY ISSUE
  
  TARGET: >90% accuracy (true positives + true negatives)
  CURRENT: [X]% accuracy
  
  FALSE POSITIVES: [N] (predicted crash, didn't crash)
  FALSE NEGATIVES: [N] (didn't predict, did crash) ← WORSE
  
  INVESTIGATION:
  1. Which signals are weak predictors?
  2. Which signals are strong predictors?
  3. Do thresholds need adjustment?
  4. Do we need new signals?
  
  PRIORITY: Minimize false negatives (missed crashes)
  ACCEPTABLE: Some false positives (unnecessary checkpoints)
  
  Measure accuracy in integration tests using historical crash data.
```

---

## §4 SACRED LAWS [SHIM-SPECIFIC]

### Law 1: Zero TypeScript Errors (Global)

```
INHERITED from global instructions
ENFORCED by pre-commit hook
BLOCKING for all commits
```

---

### Law 2: 80% Test Coverage Minimum

```
CONFIGURED in jest.config.js
ENFORCED by pre-commit hook
MEASURED by npm test -- --coverage
BLOCKING for commits
```

---

### Law 3: All Checkpoints Recoverable

```
REQUIREMENT: 100% of checkpoints must be restorable
VERIFICATION: Integration test suite
ENFORCEMENT: CI/CD pipeline

test('all checkpoints are recoverable', async () => {
  const checkpoints = await getAllCheckpoints();
  
  for (const checkpoint of checkpoints) {
    const restored = await restore(checkpoint);
    expect(restored).toBeDefined();
    expect(restored.sessionId).toBe(checkpoint.sessionId);
  }
});
```

---

### Law 4: No Data Loss - Ever

```
ZERO TOLERANCE for:
- Checkpoint corruption
- Silent failures
- Partial state restoration
- Lost context

CORRUPTION = P0 BLOCKER

Better to crash than corrupt.
Better to fail loudly than succeed partially.
```

---

### Law 5: Performance Non-Negotiable

```
TARGET METRICS:
- Checkpoint creation: <100ms
- Checkpoint size: <100KB compressed
- Resume time: <2 seconds
- Signal collection: <10ms

These are DESIGN CONSTRAINTS, not stretch goals.

IF consistently violated → Architectural problem, not implementation problem.
```

---

### Law 6: Signal Accuracy >90%

```
METRIC: (True Positives + True Negatives) / Total Predictions

MEASUREMENT:
- Use historical crash data
- Predict crash risk for each session
- Compare against actual crashes
- Track accuracy over time

ENFORCEMENT: Integration test suite + monitoring
```

---

## §5 DEVELOPMENT WORKFLOWS [SHIM-ADAPTED]

### 5.1 TDD Approach (Test-Driven Development)

```
WORKFLOW:
1. Write failing test (defines expected behavior)
2. Write minimal code to pass test
3. Refactor for quality
4. Repeat

EXAMPLE - Signal Collector:
1. Test: "should detect warning zone at 60% context"
2. Code: if (usage > 0.6) return 'warning'
3. Refactor: Extract threshold constants
4. Test: "should detect danger zone at 75% context"
[continue...]
```

---

### 5.2 Checkpoint-Driven Development

```
RULE: Auto-checkpoint every 5-10 tool calls

KERNL:auto_checkpoint({
  project: "shim",
  operation: "implement SignalCollector",
  progress: 0.4,
  currentStep: "Adding token counting",
  decisions: [
    "Using tiktoken library for GPT-4 token counting",
    "Caching encoder to avoid repeated initialization"
  ],
  nextSteps: [
    "Implement message-based signals",
    "Add integration test for token accuracy"
  ],
  activeFiles: [
    "src/core/SignalCollector.ts",
    "src/core/SignalCollector.test.ts"
  ]
})

WHEN TO CHECKPOINT:
- After completing logical unit of work
- Before switching to different file/feature
- Before refactoring
- When entering "danger zone" (75% context)
- Every 5-10 tool calls (automatic)
```

---

### 5.3 Git Commit Workflow

```
STEP 1: Make changes using KERNL:sys_edit_block()

STEP 2: Every 5-10 tool calls → KERNL:auto_checkpoint()

STEP 3: When feature complete → Verify quality:
npx tsc --noEmit  # Must be 0 errors
npm test          # Must be passing
npm test -- --coverage  # Must be ≥80%

STEP 4: Stage and commit (via Desktop Commander):
git add -A
git commit -m "type(scope): description"

STEP 5: Post-commit hook AUTOMATICALLY updates:
- CURRENT_STATUS.md (timestamp, latest commit)
- Triggers any configured automations

STEP 6: Continue working → auto_checkpoint() → repeat
```

---

### 5.4 Session End Protocol

```
MANDATORY STEPS:

1. Verify TypeScript: npx tsc --noEmit (MUST be 0 errors)
2. Verify Tests: npm test (MUST be passing)
3. Verify Coverage: npm test -- --coverage (MUST be ≥80%)
4. Commit Work: Use Desktop Commander for git commit
5. Mark Complete: KERNL:mark_complete({ project: "shim", summary: "..." })
6. Generate Continuation: Continue.ps1 -Generate (PowerShell script)

DO NOT end session with:
❌ Uncommitted changes
❌ TypeScript errors
❌ Failing tests
❌ Coverage below 80%
❌ Missing continuation prompt
```

---

## §6 KERNL INTEGRATION PATTERNS [ESSENTIAL]

### 6.1 File Operations

```typescript
// Read file with pagination
KERNL:pm_read_file({
  project: "shim",
  path: "src/core/SignalCollector.ts",
  offset: 0,      // Start line
  length: 100     // Max lines
})

// Write file (chunked for large files)
KERNL:pm_write_file({
  project: "shim",
  path: "src/core/CheckpointManager.ts",
  content: "... first 30 lines ...",
  mode: "rewrite"
})

KERNL:pm_write_file({
  project: "shim",
  path: "src/core/CheckpointManager.ts",
  content: "... next 30 lines ...",
  mode: "append"
})

// Batch read (efficient parallel loading)
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    "src/core/SignalCollector.ts",
    "src/core/CheckpointManager.ts",
    "src/database/CheckpointRepository.ts"
  ]
})

// Surgical editing (PREFERRED for changes)
KERNL:sys_edit_block({
  file_path: "D:\\SHIM\\src\\core\\SignalCollector.ts",
  old_string: "private readonly warningThreshold = 0.60;",
  new_string: "private readonly warningThreshold = 0.65;",
  expected_replacements: 1
})
```

---

### 6.2 Search & Intelligence

```typescript
// Semantic search (find by MEANING, not text)
KERNL:search_semantic({
  project: "shim",
  query: "where is crash risk calculated",
  limit: 10,
  fileTypes: [".ts"]
})
// Returns: SignalCollector.ts (ranked by relevance)

// Pattern suggestions (learn from GREGORE)
KERNL:suggest_patterns({
  currentProject: "shim",
  problem: "checkpoint size is too large, need to reduce bloat",
  limit: 5,
  minConfidence: 0.6
})
// Returns: Patterns from GREGORE about data truncation, compression

// Record pattern (for future learning)
KERNL:record_pattern({
  project: "shim",
  name: "Checkpoint Size Reduction via Truncation",
  problem: "Checkpoints averaged 300KB, violating 100KB target",
  solution: "Truncate message content and tool results before serialization",
  implementation: `
    1. Define max lengths per field (summary: 1000, decisions: 50)
    2. Truncate during checkpoint creation
    3. Then serialize and compress
    4. Result: 45KB average size
  `,
  metrics: {
    before: { avgSize: 300_000, compressionRatio: 2.5 },
    after: { avgSize: 45_000, compressionRatio: 3.2 },
    improvement: "85% size reduction, 28% better compression"
  }
})
```

---

### 6.3 Process Management (Testing, Builds)

```typescript
// Run TypeScript compiler
KERNL:sys_start_process({
  command: "cd D:\\SHIM; npx tsc --noEmit",
  timeout_ms: 10000
})

// Run tests
KERNL:sys_start_process({
  command: "cd D:\\SHIM; npm test",
  timeout_ms: 30000
})

// Interactive debugging (Node REPL)
const { pid } = KERNL:sys_start_process({
  command: "node -i",
  timeout_ms: 5000
})

KERNL:sys_interact_with_process({
  pid,
  input: "const { SignalCollector } = require('./dist/core/SignalCollector'); const c = new SignalCollector(); c.getCrashRisk();"
})
```

---

### 6.4 Git Operations (Desktop Commander Only)

```typescript
// CRITICAL: Use Desktop Commander for git (not KERNL)
// Reason: git PATH issue - Desktop Commander has full environment

// Stage files
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git add -A",
  timeout_ms: 5000
})

// Commit
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git commit -m 'feat(signals): implement token counting with tiktoken'",
  timeout_ms: 10000
})

// Check status
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git status",
  timeout_ms: 5000
})
```

---

## §7 SESSION END PROTOCOL [MANDATORY]

```typescript
// STEP 1: TypeScript Verification (BLOCKING)
npx tsc --noEmit
// MUST be 0 errors

// STEP 2: Test Verification (BLOCKING)
npm test
// MUST be passing

// STEP 3: Coverage Verification (BLOCKING)
npm test -- --coverage
// MUST be ≥80%

// STEP 4: Git Commit (via Desktop Commander)
git add -A
git commit -m "type(scope): description"
// Post-commit hook auto-updates CURRENT_STATUS.md

// STEP 5: Mark Complete (KERNL)
KERNL:mark_complete({
  project: "shim",
  summary: "Implemented token-based signal collection with tiktoken"
})

// STEP 6: Generate Continuation (PowerShell)
.\scripts\Continue.ps1 -Generate
// Creates CONTINUATION_PROMPT_NEXT_SESSION.md

// STEP 7: Review Continuation
cat D:\SHIM\CONTINUATION_PROMPT_NEXT_SESSION.md
// Verify it captures context properly
```

---

## §8 TESTING STRATEGY [SHIM-SPECIFIC]

### 8.1 Test Categories

**Unit Tests (Fast, Isolated):**
```typescript
// src/core/SignalCollector.test.ts
describe('SignalCollector', () => {
  test('detects warning zone at 60% context', () => {
    const collector = new SignalCollector();
    collector.updateContextUsage(0.65);
    expect(collector.getCrashRisk()).toBe('warning');
  });
});
```

**Integration Tests (Slower, End-to-End):**
```typescript
// tests/integration/checkpoint-recovery.test.ts
describe('Checkpoint Recovery', () => {
  test('restored checkpoint matches original', async () => {
    const original = createTestCheckpoint();
    const saved = await manager.save(original);
    const restored = await manager.restore(saved.id);
    
    expect(restored.sessionId).toBe(original.sessionId);
    expect(restored.summary).toBe(original.summary);
    expect(restored.progress).toBe(original.progress);
  });
});
```

**Performance Tests (Benchmarks):**
```typescript
// tests/performance/checkpoint-speed.test.ts
test('checkpoint creation is fast enough', async () => {
  const start = Date.now();
  
  await manager.createCheckpoint(largeCheckpoint);
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100);  // <100ms target
});
```

---

### 8.2 Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Enforcement:**
- Pre-commit hook blocks commits if coverage <80%
- CI/CD fails if coverage <80%
- No exceptions (coverage is sacred law #2)

---

### 8.3 Test-Driven Development Example

```
TASK: Implement message-based signal tracking

STEP 1: Write failing test
test('tracks message count accurately', () => {
  const collector = new SignalCollector();
  
  collector.onMessage({ role: 'user', content: 'Hello' });
  collector.onMessage({ role: 'assistant', content: 'Hi' });
  
  expect(collector.getMessageCount()).toBe(2);
  expect(collector.getCrashRisk()).toBe('safe');  // <35 messages
});

STEP 2: Write minimal implementation
class SignalCollector {
  private messageCount = 0;
  
  onMessage(msg: Message) {
    this.messageCount++;
  }
  
  getMessageCount() {
    return this.messageCount;
  }
  
  getCrashRisk() {
    if (this.messageCount >= 50) return 'danger';
    if (this.messageCount >= 35) return 'warning';
    return 'safe';
  }
}

STEP 3: Run test → Should pass ✅

STEP 4: Add more tests
test('detects warning zone at 35 messages', () => {
  const collector = new SignalCollector();
  
  for (let i = 0; i < 35; i++) {
    collector.onMessage({ role: 'user', content: `Message ${i}` });
  }
  
  expect(collector.getCrashRisk()).toBe('warning');
});

test('detects danger zone at 50 messages', () => {
  // ... similar pattern
});

STEP 5: Refactor if needed
// Extract threshold constants
private readonly MESSAGE_WARNING_THRESHOLD = 35;
private readonly MESSAGE_DANGER_THRESHOLD = 50;
```

---

## §9 COMMIT MESSAGE CONVENTIONS [ENFORCED]

### Format: `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `docs`: Documentation updates
- `chore`: Maintenance tasks

**Scopes:**
- `signals`: Signal collection and monitoring
- `checkpoints`: Checkpoint creation and management
- `resume`: Resume detection and restoration
- `database`: Database operations and schema
- `mcp`: MCP server interface
- `testing`: Test infrastructure

**Examples:**
```
feat(signals): add token-based context window tracking
fix(checkpoints): prevent corruption on rapid saves
refactor(resume): extract prompt generation logic
test(signals): add performance benchmarks
docs(architecture): update checkpoint schema diagram
chore(deps): update tiktoken to 1.2.0
```

---

## §10 DOCUMENTATION SYNC [MANDATORY]

### Automatic Updates (Post-Commit Hook)

```
TRIGGERED: After every git commit
UPDATES:
- CURRENT_STATUS.md (timestamp, latest commit)
- Any configured automation

MANUAL UPDATES FORBIDDEN
Always use git hook for consistency
```

---

### Critical Decision Documentation

```
RULE: Document critical decisions IMMEDIATELY

CRITICAL DECISIONS Include:
- Architecture changes
- Algorithm choices
- Performance optimizations
- Data structure changes
- API design decisions

WHEN:
Document in MID-SESSION, not at session end
(If platform crashes, context is lost)

WHERE:
- SOURCE_OF_TRUTH.md (permanent decisions)
- ARCHITECTURE.md (design rationale)
- Spec files (implementation details)

HOW:
Use KERNL:sys_edit_block() for surgical updates
```

---

## §11 PERFORMANCE BUDGETS [NON-NEGOTIABLE]

### Checkpoint Operations

```
TARGET:
- Creation: <100ms
- Compression: <50ms  
- Database write: <30ms
- Total: <100ms end-to-end

MAXIMUM (Temporary):
- Creation: 200ms (requires optimization plan)

MEASUREMENT:
Every checkpoint creation is timed
Performance tests enforce budgets
CI/CD fails if consistently violated
```

---

### Checkpoint Size

```
TARGET: <100KB compressed per checkpoint
MAXIMUM: 200KB (absolute limit)

MEASUREMENT:
Every checkpoint size is recorded
Integration tests verify size
Alert if approaching maximum

SOLUTIONS (if violated):
1. Truncate message content more aggressively
2. Exclude non-essential tool results
3. Optimize compression (try different algorithms)
4. Redesign checkpoint schema
```

---

## §12 ANTI-PATTERNS [REFUSE]

### Anti-Pattern 1: Mock/Stub Infrastructure

```
❌ BAD:
class MockCheckpointRepository {
  async save() { return { id: 1 }; }
}

✅ GOOD:
class CheckpointRepository {
  async save(checkpoint: Checkpoint): Promise<SavedCheckpoint> {
    // Real SQLite implementation
    const stmt = this.db.prepare(INSERT_SQL);
    const info = stmt.run(checkpoint);
    return { id: info.lastInsertRowid, ...checkpoint };
  }
}
```

**RATIONALE:** Real implementations or explicit failure. No placeholders.

---

### Anti-Pattern 2: Silent Failures

```
❌ BAD:
async save(checkpoint: Checkpoint) {
  try {
    await this.db.write(checkpoint);
  } catch (err) {
    // Swallow error silently
  }
}

✅ GOOD:
async save(checkpoint: Checkpoint) {
  try {
    await this.db.write(checkpoint);
  } catch (err) {
    logger.error('Checkpoint save failed', { err, checkpoint });
    throw new CheckpointSaveError('Failed to save checkpoint', { cause: err });
  }
}
```

**RATIONALE:** Better to crash than corrupt. Fail loudly.

---

### Anti-Pattern 3: Whack-A-Mole Fixes

```
❌ BAD:
// Symptom: Checkpoint size too large
// Fix: Increase size limit to 500KB

✅ GOOD:
// Symptom: Checkpoint size too large
// Investigation: Which fields bloating checkpoint?
// Root cause: Tool results not truncated
// Architectural fix: Truncate tool results before serialization
// Result: 85% size reduction, target achieved
```

**RATIONALE:** Fix symptoms → more symptoms. Fix architecture → permanent solution.

---

## §13 SUCCESS METRICS [TRACK]

### Phase 1 Completion Criteria

```
✅ Observable signals implemented (4 categories)
✅ Crash risk assessment working (safe/warning/danger)
✅ Checkpoint creation <100ms consistently
✅ Checkpoint size <100KB consistently
✅ Resume detection working (>90% fidelity)
✅ Test coverage ≥80% (enforced)
✅ TypeScript errors = 0 (enforced)
✅ Signal accuracy >90% (measured)
✅ Integration tests passing
✅ Documentation complete
```

---

### Ongoing Health Metrics

```
TRACK CONTINUOUSLY:
- Checkpoint creation time (avg, p95, p99)
- Checkpoint size (avg, max)
- Signal accuracy (true positive rate, false negative rate)
- Test coverage percentage
- TypeScript error count (must be 0)
- Resume success rate
- Context restoration fidelity

ALERT IF:
- Creation time >100ms (p95)
- Size >100KB (average)
- Accuracy <90%
- Coverage <80%
- TypeScript errors >0
```

---

## §14 FREQUENTLY ASKED QUESTIONS

**Q: When should I use KERNL vs Desktop Commander?**  
A: KERNL for file operations, session management, semantic search. Desktop Commander for git operations (PATH issue).

**Q: When should I checkpoint?**  
A: Every 5-10 tool calls (automatic via auto_checkpoint), before refactoring, when entering danger zone, when switching files.

**Q: How do I handle checkpoint corruption?**  
A: Zero tolerance. Investigate root cause, add validation, use atomic writes, implement checksums if needed.

**Q: Can I commit with TypeScript errors?**  
A: No. Pre-commit hook blocks commits. Fix errors first.

**Q: Can I commit with <80% coverage?**  
A: No. Pre-commit hook blocks commits. Write tests first.

**Q: Should I use EPICs for backlog?**  
A: Defer until Phase 2. ROADMAP.md sufficient for Phase 1.

**Q: When should I use semantic search vs grep?**  
A: Semantic search when finding by MEANING ("crash risk calculation"). Grep when finding by TEXT ("const THRESHOLD").

**Q: How do I know if a pattern is worth recording?**  
A: If you solved a problem that might recur in SHIM or benefit other projects. KERNL:suggest_patterns() will show cross-project value.

---

## §15 HANDOFF PROTOCOL [END OF SESSION]

### Mandatory Checklist

```
[ ] TypeScript: 0 errors (npx tsc --noEmit)
[ ] Tests: All passing (npm test)
[ ] Coverage: ≥80% (npm test -- --coverage)
[ ] Git: All work committed (git status)
[ ] KERNL: Session marked complete (mark_complete)
[ ] Continuation: Prompt generated (Continue.ps1)
[ ] Documentation: Critical decisions documented
[ ] Performance: No budget violations
[ ] Quality: No sacred law violations
```

---

### Continuation Prompt Format

```markdown
# SHIM - Continuation Prompt
**Generated:** [timestamp]
**Session Duration:** [X] minutes
**Progress:** [X]%

## Last Session Summary
[1-2 paragraphs describing what was accomplished]

## Current Task
**Operation:** [implementing X feature]
**Progress:** [X]%
**Current Step:** [specific action in progress]

## Decisions Made
- [Decision 1 with rationale]
- [Decision 2 with rationale]

## Active Files
- [file 1]
- [file 2]

## Next Steps
1. [Immediate next action]
2. [Following action]
3. [After that]

## Blockers
[None | List any blockers]

## Bootstrap Command
```powershell
# Run this to resume:
.\scripts\Dev.ps1
```

## Technical Context
[Any technical details needed for continuation]
```

---

## §16 VERSION HISTORY

**v1.0.0 (January 10, 2026)**
- Initial SHIM project instructions
- Adapted from GREGORE infrastructure
- 6 SHIM-specific authority triggers
- 6 sacred laws for crash prevention
- Complete KERNL integration patterns
- TDD workflow documentation
- Session management protocols

---

**END OF SHIM PROJECT INSTRUCTIONS**

*"Predictive crash prevention through observable signals. Build it right, build it once."*
