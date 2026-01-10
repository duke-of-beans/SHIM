# CLAUDE DESKTOP CUSTOM INSTRUCTIONS - SHIM PROJECT

**Version:** 0.1.0  
**Updated:** January 10, 2026  
**Phase:** Phase 1 - Crash Prevention (Week 3-4)  
**Philosophy:** TDD + Quality First + Zero Technical Debt

---

## §1 BOOTSTRAP SEQUENCE [MANDATORY - AUTOMATIC - 30 SECONDS]

### Step 1: Load Project State & Instructions

```powershell
# Read in parallel for speed
Desktop Commander:read_multiple_files({
  paths: [
    "D:\\SHIM\\CURRENT_STATUS.md",
    "D:\\SHIM\\docs\\ROADMAP.md",
    "D:\\SHIM\\docs\\CLAUDE_INSTRUCTIONS_GLOBAL.md"
  ]
})
```

### Step 2: Verify Test Suite

```powershell
# Always know current test state before starting work
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test",
  timeout_ms: 60000
})
```

**Expected Output:**
- 95 tests passing (SignalCollector 53 + SignalHistoryRepository 18 + CheckpointRepository 24)
- 98%+ coverage
- All performance benchmarks met

**If tests fail:** STOP. Fix tests before any new work.

### Step 3: Display Status to User

```
✅ Session initialized

SHIM Status:
- Phase: 1 (Crash Prevention)
- Week: 3-4 (Checkpoint System)  
- Tests: 95/95 passing
- Coverage: 98.36%
- Next: CheckpointManager (trigger system)

What should we work on today?
```

**Bootstrap complete when:**
- ✅ Instructions loaded
- ✅ Test suite verified
- ✅ Current state understood
- ✅ Authority protocol active

**Total time:** ~30 seconds

---

## §2 SACRED DEVELOPMENT PRINCIPLES [ALWAYS ENFORCED]

### TDD - Test-Driven Development [MANDATORY]

**NO EXCEPTIONS. EVER.**

**Workflow:**
1. **RED Phase:** Write failing test first
2. **GREEN Phase:** Write minimum code to pass
3. **REFACTOR Phase:** Improve implementation
4. **COMMIT:** After GREEN phase (automated via Desktop Commander)

**NEVER:**
❌ Write implementation before test
❌ Skip tests for "simple" code
❌ Write tests after implementation
❌ Commit with failing tests (automated workflow only runs after GREEN)
❌ Defer test writing

**Test File Structure:**
```typescript
describe('ComponentName', () => {
  describe('MethodName', () => {
    it('should handle normal case', () => { ... });
    it('should handle edge case', () => { ... });
    it('should throw error for invalid input', () => { ... });
    it('should meet performance benchmark', () => { ... });
  });
});
```

### Quality Standards [ZERO TOLERANCE]

**Code Quality:**
- ✅ No TypeScript errors
- ✅ No eslint warnings
- ✅ 95%+ test coverage
- ✅ All tests passing
- ✅ Performance benchmarks met

**Production Standards:**
- ❌ NO mocks (use real implementations)
- ❌ NO stubs (use real data)
- ❌ NO placeholders (complete implementations only)
- ❌ NO TODO comments (finish before committing)
- ❌ NO temporary solutions (do it right first time)

**If quality standards violated:** BLOCKING. Must fix before proceeding.

### Git Discipline [MANDATORY]

**Conventional Commits:**
```
feat: add new feature
fix: bug fix
test: add or update tests
refactor: code refactoring (no behavior change)
docs: documentation changes
chore: maintenance tasks
```

**Commit Message Structure:**
```
type: short description (50 chars max)

- Detailed explanation point 1
- Detailed explanation point 2
- Detailed explanation point 3

Performance: [metrics if applicable]
Test coverage: [percentage]
Breaking changes: [if applicable]
```

**Commit Frequency:**
- After each GREEN phase (tests passing)
- After each component completion
- Before starting new component
- At end of session

**NEVER commit with:**
❌ Failing tests
❌ TypeScript errors
❌ Incomplete features
❌ Debugging code (console.log, commented code)

---

## §3 AUTHORITY PROTOCOL [MANDATORY PUSH-BACK TRIGGERS]

### Trigger 1: Architectural Whack-A-Mole

```
IF (same_fix_repeated >= 3 || treating_symptoms || workarounds_piling) THEN
  🛑 STOP - ARCHITECTURAL ISSUE DETECTED
  
  CURRENT APPROACH: [describe]
  ROOT PROBLEM: [identify]
  RIGHT SOLUTION: [propose proper architecture]
  RECOMMENDATION: DELETE current work, BUILD proper solution
  
  Do you want to: A) Rebuild properly | B) Continue (not recommended)
```

### Trigger 2: Long Operations (>8 minutes)

```
IF (estimated_duration > 8_minutes) THEN
  ⏸️ CHECKPOINT REQUIRED
  
  Claude will crash without breaks.
  
  CHECKPOINT STRATEGY:
  1. [First step (describe clearly)]
  2. USER CONFIRMS "continue"
  3. [Next step (describe clearly)]
  4. USER CONFIRMS "continue"
  [Continue pattern...]
```

### Trigger 3: Documentation Drift

```
IF (critical_decision_made && mid_session) THEN
  📝 DOCUMENTATION UPDATE REQUIRED
  
  Must document NOW, not at session end.
  If we crash, context is lost.
  
  Files to update: [list]
  Shall I update now? (Recommended: Yes)
```

### Trigger 4: Quality Violations

```
IF (mocks || stubs || placeholders || missing_error_handling) THEN
  ⚠️ QUALITY STANDARD VIOLATION
  
  VIOLATION: [describe]
  PROPER APPROACH: [describe]
  Must be fixed before proceeding.
```

### Trigger 5: Test Coverage Gaps

```
IF (test_coverage < 95% || missing_edge_cases || missing_error_cases) THEN
  🧪 TEST COVERAGE INCOMPLETE
  
  MISSING: [list gaps]
  REQUIRED: [describe needed tests]
  
  Add tests before proceeding? (Required: Yes)
```

---

## §4 TOOL SELECTION PATTERNS [DESKTOP COMMANDER ONLY]

**SHIM uses Desktop Commander for ALL file operations.**

### Reading Files

**Single File:**
```typescript
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\SignalCollector.ts",
  offset: 0,      // 0 = start, >0 = line N, <0 = tail
  length: 100     // max lines to read
})
```

**Multiple Files (Parallel, Fast):**
```typescript
Desktop Commander:read_multiple_files({
  paths: [
    "D:\\SHIM\\src\\core\\SignalCollector.ts",
    "D:\\SHIM\\src\\core\\SignalHistoryRepository.ts",
    "D:\\SHIM\\src\\models\\CrashSignals.ts"
  ]
})
```

**File Metadata:**
```typescript
Desktop Commander:get_file_info({
  path: "D:\\SHIM\\src\\core\\SignalCollector.ts"
})
// Returns: size, lineCount, lastLine, created, modified
```

### Editing Files

**Surgical Edit (Preferred):**
```typescript
Desktop Commander:edit_block({
  file_path: "D:\\SHIM\\src\\core\\SignalCollector.ts",
  old_string: "const THRESHOLD = 5;",
  new_string: "const THRESHOLD = 10;",
  expected_replacements: 1
})
```

**Write New File (Chunk for >50 lines):**
```typescript
// First chunk
Desktop Commander:write_file({
  path: "D:\\SHIM\\src\\core\\NewComponent.ts",
  content: "[first 30 lines]",
  mode: "rewrite"
})

// Subsequent chunks
Desktop Commander:write_file({
  path: "D:\\SHIM\\src\\core\\NewComponent.ts",
  content: "[next 30 lines]",
  mode: "append"
})
```

### Testing

**Run All Tests:**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test",
  timeout_ms: 60000
})
```

**Run Specific Test File:**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test -- CheckpointRepository",
  timeout_ms: 60000
})
```

**Coverage Report:**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test -- --coverage",
  timeout_ms: 60000
})
```

### Finding Code

**By Pattern (Streaming):**
```typescript
Desktop Commander:start_search({
  path: "D:\\SHIM\\src",
  pattern: "checkpoint",
  searchType: "content",
  filePattern: "*.ts"
})
```

**By Name:**
```typescript
Desktop Commander:search_files({
  path: "D:\\SHIM",
  pattern: "*.test.ts"
})
```

### Git Operations

**IMPORTANT: Claude CAN and SHOULD commit automatically using Desktop Commander.**

**Automated Workflow (GREEN Phase Complete):**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git add -A; git commit -m \"feat: implement CheckpointManager

Implements CheckpointManager - the decision engine for checkpointing.

Features:
- Multi-trigger detection
- Priority-based triggering
- Auto-checkpoint workflow

Tests: 19/19 passing
Performance: <10ms trigger, <150ms create\"",
  timeout_ms: 10000
})
```

**Then automatically update documentation:**
```powershell
# 1. Update CURRENT_STATUS.md
Desktop Commander:edit_block({
  file_path: "D:\\SHIM\\CURRENT_STATUS.md",
  old_string: "Tests: 95/95 passing",
  new_string: "Tests: 114/114 passing",
  expected_replacements: 1
})

# 2. Commit documentation
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git add CURRENT_STATUS.md; git commit -m \"docs: update status for component completion\"",
  timeout_ms: 8000
})
```

**Conventional Commit Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `docs:` - Documentation only
- `perf:` - Performance improvement

**Status Check:**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git status",
  timeout_ms: 5000
})
```

**Commit History:**
```powershell
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git log --oneline -5",
  timeout_ms: 5000
})
```

---

## §5 DEVELOPMENT WORKFLOW [STEP-BY-STEP]

### Starting New Component

**Step 1: RED Phase - Write Test First**

```typescript
// Example: Starting CheckpointManager
// File: src/core/CheckpointManager.test.ts

describe('CheckpointManager', () => {
  describe('initialization', () => {
    it('should create with default configuration', () => {
      const manager = new CheckpointManager();
      expect(manager).toBeDefined();
    });
  });
  
  describe('trigger detection', () => {
    it('should trigger on tool call interval', () => {
      const manager = new CheckpointManager({ toolCallInterval: 5 });
      // ... test implementation
    });
  });
});
```

**Run test - expect FAIL:**
```powershell
npm test -- CheckpointManager
# Expected: Error (CheckpointManager not found)
```

**Step 2: GREEN Phase - Implement Minimum Code**

```typescript
// File: src/core/CheckpointManager.ts

export class CheckpointManager {
  constructor(config?: CheckpointConfig) {
    // Minimum implementation to pass test
  }
}
```

**Run test - expect PASS:**
```powershell
npm test -- CheckpointManager
# Expected: All tests passing
```

**Step 3: REFACTOR Phase - Improve Quality**

- Extract methods
- Improve naming
- Add types
- Optimize performance
- Add comments for complex logic

**Run test - expect PASS:**
```powershell
npm test -- CheckpointManager
# Expected: Still passing after refactor
```

**Step 4: COMMIT**

```powershell
git add -A
git commit -m "feat: implement CheckpointManager initialization

- Default configuration support
- Tool call interval tracking
- Test coverage: 100% (5/5 tests passing)
"
```

### Continuing Component Development

**Add tests incrementally:**
1. Add 1-3 related tests (RED)
2. Implement to pass (GREEN)
3. Refactor if needed (REFACTOR)
4. Commit
5. Repeat

**NEVER:**
- Add 20 tests at once
- Implement without tests
- Skip commits

---

## §6 CURRENT PHASE OBJECTIVES [PHASE 1 WEEK 3-4]

### Checkpoint System Implementation

**Completed (Day 8):**
- ✅ Checkpoint data model (Checkpoint.ts)
- ✅ CheckpointRepository (SQLite + gzip)
- ✅ 24/24 tests passing
- ✅ Performance benchmarks met

**In Progress:**
- 🚧 CheckpointManager (trigger system)
- 🚧 Auto-checkpoint logic

**Next Steps:**
1. Design CheckpointManager interface
2. Write CheckpointManager tests (RED)
3. Implement CheckpointManager (GREEN)
4. Integrate with SignalCollector
5. E2E checkpoint testing

**Success Criteria:**
- Automatic checkpointing on triggers
- <100ms checkpoint save time
- <50ms checkpoint retrieval
- Zero data loss on crash

---

## §7 FILE STRUCTURE KNOWLEDGE

**Components Completed:**

```
src/
├── models/
│   ├── CrashSignals.ts          (type definitions)
│   └── Checkpoint.ts            (checkpoint data model)
├── core/
│   ├── SignalCollector.ts       (238 LOC, 53 tests)
│   ├── SignalCollector.test.ts
│   ├── SignalHistoryRepository.ts (314 LOC, 18 tests)
│   ├── SignalHistoryRepository.test.ts
│   ├── CheckpointRepository.ts  (600+ LOC, 24 tests)
│   └── CheckpointRepository.test.ts
```

**Test Database:**
```
test-data/
└── .gitkeep                     (ensures directory exists)
```

**Documentation:**
```
docs/
├── ROADMAP.md                   (phase plan, updated)
├── specs/
│   ├── SPEC_CRASH_PREVENTION.md (complete specification)
│   └── DATA_MODELS.md           (type & schema definitions)
├── CLAUDE_INSTRUCTIONS_PROJECT.md        (this file)
└── CLAUDE_INSTRUCTIONS_PROJECT_IN_APP.md (pointer file)
```

---

## §8 TESTING PATTERNS

### Test Structure

**Complete Example:**
```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let dependency: MockDependency;

  beforeEach(() => {
    // Setup for each test
    dependency = createMockDependency();
    component = new ComponentName(dependency);
  });

  afterEach(() => {
    // Cleanup for each test
    component.cleanup();
  });

  describe('MethodName', () => {
    it('should handle normal case', () => {
      const result = component.method('normal input');
      expect(result).toBe('expected output');
    });

    it('should handle edge case', () => {
      const result = component.method('');
      expect(result).toBe('empty string handling');
    });

    it('should throw error for invalid input', () => {
      expect(() => component.method(null)).toThrow('Invalid input');
    });

    it('should meet performance benchmark', () => {
      const start = Date.now();
      component.method('input');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
```

### Coverage Requirements

**95%+ coverage required:**
- ✅ All public methods
- ✅ All branches (if/else)
- ✅ All error cases
- ✅ All edge cases
- ✅ Performance benchmarks

**Coverage report:**
```powershell
npm test -- --coverage
```

---

## §9 PERFORMANCE BENCHMARKS

**Current Benchmarks:**

**SignalCollector:**
- Crash risk calculation: <1ms
- Signal aggregation: <10ms

**SignalHistoryRepository:**
- Single save: <50ms
- Batch save (1000 records): <1000ms
- Query (last N): <50ms
- Cleanup: <100ms

**CheckpointRepository:**
- Save checkpoint: <100ms
- Retrieve checkpoint: <50ms
- Compress checkpoint: <100KB

**All benchmarks enforced in tests.**

---

## §10 ERROR HANDLING PATTERNS

**Standard Pattern:**

```typescript
class ComponentName {
  method(input: string): string {
    // Validate input
    if (!input) {
      throw new Error('Input required');
    }

    try {
      // Main logic
      return this.processInput(input);
    } catch (error) {
      // Wrap and rethrow with context
      throw new Error(`Failed to process input: ${error.message}`);
    }
  }
}
```

**Test Error Cases:**
```typescript
it('should throw error for invalid input', () => {
  expect(() => component.method('')).toThrow('Input required');
});
```

---

## §11 COMMIT CHECKLIST

**Before EVERY commit:**

```
✅ All tests passing (npm test)
✅ No TypeScript errors (npm run build)
✅ No eslint warnings
✅ Coverage ≥95%
✅ Performance benchmarks met
✅ No TODO comments
✅ No debugging code
✅ Documentation updated
✅ Conventional commit format
✅ Detailed commit message
```

**If ANY item fails:** Fix before committing.

---

## §12 SESSION END PROTOCOL

**At end of every session:**

1. Run full test suite
2. Update CURRENT_STATUS.md
3. Update ROADMAP.md if phase progress
4. Commit all changes
5. Create continuation notes if needed

**NO session ends without:**
- ✅ Clean test suite
- ✅ Documentation updated
- ✅ Git committed

---

## §13 REFERENCE DOCUMENTS

**Core Documentation:**
- `docs/ROADMAP.md` - Phase plan and progress
- `docs/specs/SPEC_CRASH_PREVENTION.md` - Complete specification
- `docs/specs/DATA_MODELS.md` - Type and schema definitions

**Global Instructions:**
- `docs/CLAUDE_INSTRUCTIONS_GLOBAL.md` - User-wide patterns
- User preferences loaded automatically

**Current State:**
- `CURRENT_STATUS.md` - Live project status
- `README.md` - Project overview

---

*Last Updated: January 10, 2026*  
*Version: 0.1.0 (Initial Release)*  
*Project: SHIM*
*Phase: 1 (Crash Prevention) Week 3-4*
