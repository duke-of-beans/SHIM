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

### Trigger 1: Architectural Whack-A-Mole [CRITICAL - ALWAYS STOP]

**THE GOLDEN RULE:**
> "We develop WAY faster than we debug. Always."

**Detection Criteria:**
```
IF (same_fix_repeated >= 3 || 
    treating_symptoms || 
    workarounds_piling || 
    manual_edits_accumulating ||
    time_to_fix > 10_minutes) THEN
  🛑 STOP IMMEDIATELY - ARCHITECTURAL ISSUE DETECTED
```

**Mandatory Analysis:**
```
CURRENT APPROACH: [describe what we're doing]
ROOT PROBLEM: [what's the actual issue?]
TIME COST: Debugging = [X] min vs Rebuilding = [Y] min
PREVENTION: Does current approach prevent future occurrences?

RIGHT SOLUTION: [architectural fix that prevents problem]
RECOMMENDATION: DELETE current work, BUILD proper solution
```

**Decision Framework:**
```
Debugging Time > 10 minutes? → STOP, rebuild
Same fix repeated 3+ times? → STOP, rebuild
Manual edits accumulating? → STOP, automate
Workarounds piling up? → STOP, fix architecture
No prevention mechanism? → STOP, add enforcement

RULE: If rebuilding is faster than debugging, ALWAYS rebuild.
```

**Examples:**
- ❌ BAD: Fixing 27 ESLint errors manually (45 min, no prevention)
- ✅ GOOD: Enable strict tsconfig.json (5 min setup + 30 min fixes = permanent prevention)

- ❌ BAD: Debugging type inference issues one-by-one
- ✅ GOOD: Add `"strict": true` to tsconfig, let compiler show ALL issues

- ❌ BAD: Manually fixing import paths across files
- ✅ GOOD: Add path alias to tsconfig, fix imports programmatically

**User Confirmation Required:**
```
Do you want to:
A) STOP and rebuild properly (recommended - faster long-term)
B) Continue debugging (not recommended - slower, no prevention)
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

## §12 LEARNED LESSONS ENFORCEMENT [AUTOMATIC]

**CRITICAL:** Lessons are not just documented - they are **enforced automatically**.

### Automated Enforcement Mechanisms

**1. ESLint Rules (.eslintrc.json)**
- **Lesson: Race conditions in async code**
  - Rule: Blocks `forEach()` with async callbacks
  - Error message: "Use for...of loops for sequential operations"
  - Reference: ROADMAP.md line 78

**2. Pre-Commit Hooks (.git/hooks/pre-commit)**
- TypeScript compilation (no errors)
- ESLint validation (lessons enforced)
- Test suite (100% passing required)
- Technical debt check (no mocks/stubs/TODOs)
- Large file warnings (>1000 lines)

**3. Project Instructions (this file)**
- TDD workflow (RED → GREEN → REFACTOR)
- Test-first enforcement
- Quality standards
- Performance benchmarks

### How Lessons Become Rules

**When we learn something:**
1. ✅ Document in ROADMAP.md "Key Lessons Learned"
2. ✅ Create ESLint rule if code pattern
3. ✅ Add pre-commit check if process pattern
4. ✅ Update project instructions if workflow pattern
5. ✅ Commit enforcement mechanism

**Example: Race Condition Lesson**
```
Learned: forEach() with async = concurrent execution
Documented: ROADMAP.md line 78
Enforced: .eslintrc.json line 18-29
Result: ESLint error if pattern detected
```

### Current Enforced Lessons

**Technical Patterns:**
- ❌ `forEach()` with async callbacks → ESLint error
- ❌ Floating promises → TypeScript/ESLint error
- ❌ `any` types → ESLint error
- ❌ Missing await → ESLint error

**Quality Standards:**
- ❌ Mocks/stubs in tests → Pre-commit warning
- ❌ TODO comments → Pre-commit warning
- ❌ Failing tests → Pre-commit block
- ❌ TypeScript errors → Pre-commit block

**Process Patterns:**
- ❌ Commit without tests → Pre-commit block
- ❌ Skip TDD workflow → Authority Protocol triggers
- ⚠️ Large files (>1000 lines) → Pre-commit warning

### Adding New Lesson Enforcement

**When discovering new pattern:**
```powershell
# 1. Document lesson
echo "New lesson: [description]" >> docs/ROADMAP.md

# 2. Implement enforcement
# For code patterns:
#   Edit .eslintrc.json → add rule
# For process patterns:
#   Edit .git/hooks/pre-commit → add check
# For workflow patterns:
#   Edit this file → add protocol

# 3. Test enforcement
npm run lint           # Should catch violation
git commit             # Should block if violated

# 4. Commit enforcement mechanism
git add .eslintrc.json .git/hooks/pre-commit docs/
git commit -m "enforce: [lesson name]"
```

### Lesson Amplification Loop

```
Discover Pattern → Document Lesson → Create Enforcement → Commit
         ↑                                                    ↓
         └──────────── Future violations blocked ────────────┘
```

**This means:**
- Lessons learned in Week 1 prevent mistakes in Week 50
- Every session makes the system smarter
- Enforcement compounds over time
- Knowledge doesn't decay between sessions

---

## §12 TRIANGULATION PROTOCOL [RESEARCH & DEBUGGING]

**THE PRINCIPLE:**
> "When having a hard time researching things we did or looking for things - triangulate between git, chat history, and locally stored sessions/logs/summaries."

**Why Triangulation Matters:**
- Single source = incomplete picture
- Different sources reveal different aspects
- Cross-validation prevents false assumptions
- **Saves massive time** (2 min triangulation vs 45 min debugging)

### The Three Sources

**1. Git History (WHAT was done, WHEN)**

```powershell
# Find commits by topic
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git log --oneline --all --grep=\"eslint\" -20",
  timeout_ms: 10000
})

# See file at specific commit
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git show 1f15791:.eslintrc.json",
  timeout_ms: 10000
})

# Find when file changed
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git log --oneline --all -- src/core/SignalCollector.ts",
  timeout_ms: 10000
})
```

**Best for:**
- Timeline of changes
- Historical file contents
- Who/when/what questions

---

**2. Chat History (WHY decisions were made, CONTEXT)**

```typescript
conversation_search({
  query: "ESLint strict rules enforcement",
  max_results: 5
})

conversation_search({
  query: "lesson enforcement no-explicit-any",
  max_results: 5
})
```

**Best for:**
- Decision rationale
- Discussions and debates
- Alternative approaches considered

---

**3. Local Documentation (HOW things work, CURRENT STATE)**

```typescript
Desktop Commander:read_file({
  path: "D:\\SHIM\\docs\\LEARNED_LESSONS_ENFORCEMENT.md"
})

Desktop Commander:read_file({
  path: "D:\\SHIM\\CURRENT_STATUS.md"
})

Desktop Commander:start_search({
  path: "D:\\SHIM\\docs",
  pattern: "triangulation|research method",
  searchType: "content"
})
```

**Best for:**
- Current implementation
- Documented patterns
- Project conventions

---

### Triangulation Workflow

**When Stuck or Confused:**

```
1. STATE THE QUESTION
   "When did we add strict ESLint rules?"

2. TRIANGULATE (in parallel):
   - Git: Find commits mentioning "eslint"
   - Chat: Search for "ESLint strict rules"
   - Docs: Read LEARNED_LESSONS_ENFORCEMENT.md

3. SYNTHESIZE:
   Git shows: Commit 1f15791 added rules 2 days ago
   Chat shows: [no relevant discussions found]
   Docs show: Part of lesson enforcement system

4. INSIGHT:
   Rules added AFTER code was written
   → This is a one-time migration, not ongoing debugging
   → Right solution: Enable strict tsconfig.json

Total time: 2 minutes (vs 45 min blind debugging)
```

---

### Example: "Why do we have 27 ESLint violations?"

**Without Triangulation:**
- Assume code is "wrong"
- Fix violations manually one-by-one
- 45 minutes of edits
- High risk of breaking tests
- No prevention for future violations

**With Triangulation:**
- Git: Rules added in commit 1f15791 (2 days ago)
- Code predates enforcement rules
- This is **migration**, not debugging
- Right solution: Enable `strict: true` in tsconfig
- One-time 30min investment + permanent prevention

**Savings:** 15 minutes + permanent solution vs temporary fix

---

### When to Triangulate

**ALWAYS triangulate when:**
- "Why is this happening?" (root cause needed)
- "When did we decide X?" (historical context)
- "How does this work?" (current implementation)
- Stuck on something for >5 minutes
- About to start manual debugging

**NEVER assume:**
- You remember why something was done
- The current state matches your mental model
- One source tells the whole story

---

### Triangulation Anti-Patterns

**❌ DON'T:**
- Rely solely on chat history (incomplete, selective memory)
- Only check git (missing rationale and context)
- Just read docs (may be outdated)
- Start debugging before triangulating

**✅ DO:**
- Check all three sources in parallel
- Cross-validate findings
- Update docs if drift detected
- Document insights for future

---

## §13 LESSON ENFORCEMENT SYSTEM [AUTOMATED]

**At end of every session:**

1. Run full test suite
2. Update CURRENT_STATUS.md
3. Update ROADMAP.md if phase progress
4. **Check for new lessons to enforce**
5. Commit all changes
6. Create continuation notes if needed

**NO session ends without:**
- ✅ Clean test suite
- ✅ Documentation updated
- ✅ Git committed
- ✅ New lessons enforced (if discovered)

---

## §14 REFERENCE DOCUMENTS

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
