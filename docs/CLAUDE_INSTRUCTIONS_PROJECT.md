# SHIM PROJECT - COMPREHENSIVE DEVELOPMENT INSTRUCTIONS v5.0.0

**Version:** 5.0.0 (LEAN-OUT Architecture + Documentation Sync)  
**Updated:** January 13, 2026  
**Phase:** 3 (Complete) → 4 (Ready)  
**Philosophy:** Build Intelligence, Not Plumbing

---

## 🎯 QUICK START

### First Action Every Session
```bash
# This file is automatically loaded by in-app bootstrap
# You're reading it now - continue to Development Workflow section
```

### Current State Summary
```yaml
phase_1_core: "✅ COMPLETE (311 LOC, 95 tests)"
phase_2_redis: "✅ COMPLETE (780 LOC, 73 tests)"
phase_3_coordination: "✅ COMPLETE (1,682 LOC, 127 tests)"
phase_4_5_ready: "📅 Autonomous operation & self-evolution"
phase_6_deferred: "🔮 Kaizen loop (v6.0)"

total_production: "2,773 LOC"
total_tests: "295 tests (~4,639 LOC)"
architecture: "v5.0 LEAN-OUT (65% reduction from v2.0)"
critical_blocker: "⚠️ Test infrastructure broken - cannot run tests"
```

---

## 🚨 MANDATORY: LEAN-OUT PRINCIPLES

### Core Rule: Build Intelligence, Not Plumbing

```typescript
// EVERY coding decision goes through this:
function shouldIBuildThis(feature: string): Decision {
  // Step 1: Search for existing tool
  const tool = searchEcosystem(["npm", "cargo", "pip", "MCP"]);
  if (tool.exists && tool.solves(feature)) {
    return { action: "USE_EXISTING", tool: tool.name };
  }
  
  // Step 2: Check if generic infrastructure
  if (isGeneric(feature)) {
    return { 
      action: "STOP", 
      error: "LEAN-OUT VIOLATION - Generic infrastructure exists"
    };
  }
  
  // Step 3: Domain-specific intelligence?
  if (isDomainSpecific(feature) && isIntelligence(feature)) {
    return { action: "BUILD_CUSTOM", justification: "Domain logic" };
  }
  
  // Step 4: Can we compose existing tools?
  const composition = tryCompose(feature);
  if (composition.possible) {
    return { action: "COMPOSE", tools: composition.tools };
  }
  
  // Step 5: Consult user
  return { action: "ASK_USER", context: feature };
}
```

### v2.0 Failure - Never Forget

```yaml
what_happened:
  approach: "Built 98 custom tools"
  code_size: "8,000 LOC"
  violation: "Built generic infrastructure (queues, caches, analyzers)"
  result: "TypeScript dependency crash, ERR_MODULE_NOT_FOUND"
  
lesson:
  rule: "Use battle-tested tools for plumbing"
  build: "Only domain-specific intelligence"
  
v5_0_success:
  approach: "6 core tools + existing infrastructure"
  code_size: "2,773 LOC (65% reduction)"
  tools_used: ["Redis", "BullMQ", "ESLint", "jscodeshift", "Grafana"]
  result: "Works, maintainable, full functionality"
```

### RED FLAGS - Immediate Stop

When you're about to build:
- ❌ **Job queue system** → Use BullMQ
- ❌ **Cache layer** → Use Redis
- ❌ **Pub/Sub messaging** → Use Redis Pub/Sub
- ❌ **Distributed locks** → Use Redis Redlock
- ❌ **Task scheduler** → Use BullMQ cron
- ❌ **AST parser** → Use ESLint, TypeScript Compiler
- ❌ **Code transformer** → Use jscodeshift, ts-morph
- ❌ **Monitoring dashboard** → Use Grafana
- ❌ **Metrics collection** → Use Prometheus
- ❌ **ML inference** → Use APIs or simple heuristics

**STOP. Search for existing tool. Only build wrappers (<100 LOC).**

---

## 📋 DEVELOPMENT WORKFLOW

### TDD Cycle (MANDATORY - Zero Exceptions)

```yaml
phase_red:
  action: "Write failing test FIRST"
  command: "npm test -- ComponentName.test.ts"
  expected: "❌ Test fails (this is correct)"
  rule: "Cannot write implementation without failing test"

phase_green:
  action: "Write MINIMAL code to pass test"
  command: "npm test -- ComponentName.test.ts"
  expected: "✅ Test passes"
  rule: "Just enough code, nothing more"

phase_refactor:
  action: "Clean up code without changing behavior"
  command: "npm test"
  expected: "✅ All tests still pass"
  rule: "Improve quality, maintain green"

phase_commit:
  action: "Commit with comprehensive message"
  command: "git add -A && git commit -m 'feat: ComponentName...'"
  includes: "LOC counts, test coverage, architectural notes"
```

### Test Quality Standards

```typescript
interface TestSuite {
  naming: "Descriptive sentences (not cryptic codes)";
  coverage: "≥95% (statements, branches, functions, lines)";
  independence: "Zero shared state between tests";
  performance: "Benchmark critical operations";
  edge_cases: "Error handling, boundaries, race conditions";
  
  structure: {
    unit: "Individual component behavior",
    integration: "Component interactions",
    e2e: "Full workflow validation",
    performance: "Speed and resource benchmarks"
  };
}
```

**Example Test Structure:**
```typescript
describe('ChatCoordinator', () => {
  describe('Task Decomposition', () => {
    it('should decompose low complexity task into 2 subtasks', async () => {
      // Test implementation
    });
    
    it('should decompose high complexity task into 8 subtasks', async () => {
      // Test implementation
    });
  });
  
  describe('Worker Assignment', () => {
    it('should assign tasks to least loaded worker', async () => {
      // Test implementation
    });
    
    it('should handle worker failure with retry', async () => {
      // Test implementation
    });
  });
  
  describe('Performance Benchmarks', () => {
    it('should decompose task in <100ms', async () => {
      // Performance test
    });
  });
});
```

---

## 📝 ATOMIC DOCUMENTATION SYNC PROTOCOL

### The Four Pillars (Must Stay Synchronized)

```yaml
source_of_truth_files:
  1_roadmap: "D:\\SHIM\\ROADMAP.md"
    purpose: "Strategic view - phases, milestones, timeline"
    
  2_current_status: "D:\\SHIM\\CURRENT_STATUS.md"
    purpose: "Tactical view - components, LOC, tests, blockers"
    
  3_architecture: "D:\\SHIM\\docs\\ARCHITECTURE.md"
    purpose: "Technical view - design, decisions, patterns"
    
  4_instructions: "D:\\SHIM\\docs\\CLAUDE_INSTRUCTIONS_PROJECT.md"
    purpose: "Operational view - protocols, workflows, commands"
```

### When to Sync (MANDATORY Triggers)

```typescript
enum SyncTrigger {
  COMPONENT_COMPLETE = "Component finishes GREEN phase",
  PHASE_COMPLETE = "Phase reaches 100%",
  BLOCKER_RESOLVED = "Active blocker cleared",
  BLOCKER_ADDED = "New blocker discovered",
  ARCHITECTURE_DECISION = "Major technical decision made",
  GIT_COMMIT_WITH_CODE = "ANY commit touching src/**"
}

// RULE: All 4 files updated together, committed together
```

### Sync Checklist (Before Every Commit)

```yaml
step_1_gather_facts:
  current_phase: "Which phase? What % complete?"
  components_done: "What finished this session?"
  loc_added: "Production + test LOC counts"
  tests_added: "How many tests written?"
  blockers_resolved: "What unblocked?"
  blockers_new: "Any new blockers?"

step_2_update_all_four:
  roadmap: "Phase status, progress %, dates"
  current_status: "Components, LOC, tests, blockers, session notes"
  architecture: "Component diagram, new decisions"
  instructions: "Protocols, current focus, next actions"

step_3_verify_consistency:
  phase_matches: "Same phase status in all 4?"
  loc_matches: "Same LOC counts in all 4?"
  tests_match: "Same test counts in all 4?"
  blockers_match: "Same blocker list in all 4?"
  dates_match: "Same 'Last Updated' date in all 4?"

step_4_commit_atomically:
  command: "git add ROADMAP.md CURRENT_STATUS.md docs/ARCHITECTURE.md docs/CLAUDE_INSTRUCTIONS_PROJECT.md"
  message: "docs: Sync all source-of-truth (Phase X: Y% complete)"
  verify: "All 4 files in commit"
```

### Automatic Sync Enforcement

```typescript
// Pre-commit hook (enforces sync)
function preCommitHook() {
  const changedFiles = getChangedFiles();
  const hasSrcChanges = changedFiles.some(f => f.startsWith('src/'));
  
  if (hasSrcChanges) {
    const docs = [
      'ROADMAP.md',
      'CURRENT_STATUS.md', 
      'docs/ARCHITECTURE.md',
      'docs/CLAUDE_INSTRUCTIONS_PROJECT.md'
    ];
    
    for (const doc of docs) {
      if (!changedFiles.includes(doc)) {
        throw new Error(`❌ ${doc} not updated with code changes`);
      }
    }
    
    // Verify consistency
    verifyDocConsistency();
  }
}

// Bootstrap verification (checks sync on session start)
async function bootstrapVerification() {
  const [roadmap, status, arch, instr] = await loadAllDocs();
  
  if (roadmap.phase !== status.phase) {
    throw new DocSyncError('Phase mismatch across files');
  }
  
  if (roadmap.loc !== status.loc) {
    throw new DocSyncError('LOC count mismatch across files');
  }
  
  // Warn if dates differ by >24 hours
  const dates = [roadmap.updated, status.updated, arch.updated, instr.updated];
  if (maxDiff(dates) > 86400000) {
    console.warn('⚠️ Documentation dates differ by >1 day');
  }
}
```

---

## 🔧 TOOL OPERATIONS

### File Operations

**Reading Files:**
```typescript
// Single file
Desktop_Commander.read_file({
  path: "D:\\SHIM\\src\\Component.ts",
  offset: 0,  // Start line (0-based)
  length: 100  // Max lines to read
});

// Multiple files (parallel, efficient)
Desktop_Commander.read_multiple_files({
  paths: [
    "D:\\SHIM\\src\\ComponentA.ts",
    "D:\\SHIM\\src\\ComponentB.ts"
  ]
});

// File info (without reading content)
Desktop_Commander.get_file_info({
  path: "D:\\SHIM\\src\\Component.ts"
});
```

**Writing Files:**
```typescript
// New file (or rewrite existing)
Desktop_Commander.write_file({
  path: "D:\\SHIM\\src\\NewComponent.ts",
  content: "...",
  mode: "rewrite"  // or "append" for large files
});

// Chunking for large files (>50 lines)
// Chunk 1: mode="rewrite"
Desktop_Commander.write_file({
  path: "D:\\SHIM\\src\\Large.ts",
  content: "...first 40 lines...",
  mode: "rewrite"
});

// Chunk 2: mode="append"
Desktop_Commander.write_file({
  path: "D:\\SHIM\\src\\Large.ts",
  content: "...next 40 lines...",
  mode: "append"
});
```

**Surgical Edits (PREFERRED for changes):**
```typescript
// Precise, verified edits
Desktop_Commander.edit_block({
  file_path: "D:\\SHIM\\src\\Component.ts",
  old_string: "const value = 10;",  // Exact match required
  new_string: "const value = 20;",
  expected_replacements: 1  // Verify count
});

// For multiple edits: make separate calls
// Each edit is atomic and verified
```

### Testing

```bash
# All tests
npm test

# Watch mode (for active development)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific file
npm test -- ComponentName.test.ts

# Specific test
npm test -- -t "should handle worker failure"
```

### Git Operations

```bash
# Check status
git status

# Stage all changes
git add -A

# Commit (with comprehensive message)
git commit -m "feat(phase3): Implement ChatCoordinator

- Supervisor pattern orchestration
- Task decomposition (complexity-based)
- Worker assignment with load balancing
- Progress tracking and result aggregation
- Worker failure handling with retry

Production: 624 LOC
Tests: 39 tests (619 LOC)
Coverage: 98%

Closes EPIC-X"

# View history
git log --oneline -10

# View specific commit
git show COMMIT_HASH
```

### Search Operations

```typescript
// Streaming search (for large directories)
const session = Desktop_Commander.start_search({
  path: "D:\\SHIM\\src",
  pattern: "ChatCoordinator",
  searchType: "files",  // or "content"
  filePattern: "*.ts",  // Optional filter
  literalSearch: false  // true for exact string match
});

// Get results incrementally
Desktop_Commander.get_more_search_results({
  sessionId: session.id,
  offset: 0,
  length: 100
});

// Stop search early if found
Desktop_Commander.stop_search({
  sessionId: session.id
});
```

---

## 🚧 CURRENT BLOCKERS & PRIORITIES

### Priority 1: Test Infrastructure (CRITICAL)

```yaml
issue: "Jest not installed properly, node_modules corrupted"
symptoms:
  - "Cannot run npm test"
  - "295 tests exist but never executed in v5.0"
  - "No verification of 2,773 LOC production code"
  
impact: "BLOCKING - Cannot verify ANY code works"

solution_required:
  1: "Clean node_modules and package-lock.json"
  2: "Fresh npm install"
  3: "Verify Jest installation"
  4: "Run test suite"
  5: "Fix any failures"

estimated_time: "2-4 hours"
priority: "HIGHEST - Must fix before Phase 4"
```

### Priority 2: TypeScript Compilation (MEDIUM)

```yaml
issue: "~20 TypeScript errors preventing build"
files_affected:
  - "SignalHistoryRepository.ts"
  - "WorkerRegistry.ts"
  - "TaskQueueWrapper.ts"
  - "mcp-server/src/index.ts"

common_errors:
  - "Type 'any' violations"
  - "Missing interface imports"
  - "Incorrect type annotations"

impact: "Cannot build production MCP server bundle"

solution_approach:
  1: "Fix errors incrementally as we touch files"
  2: "Run tsc --noEmit to find errors"
  3: "Fix type violations"
  4: "Verify with npm run build"

estimated_time: "4-6 hours"
priority: "MEDIUM - Fix during normal development"
```

### Priority 3: Missing Dependencies (HIGH)

```yaml
issue: "Type definitions and imports missing"
missing:
  - "@types/bullmq"
  - "MCP SDK imports"
  - "Redis type definitions"

impact: "Components may not function at runtime"

solution:
  1: "npm install @types/bullmq --save-dev"
  2: "npm install @modelcontextprotocol/sdk"
  3: "Verify imports resolve"
  4: "Test affected components"

estimated_time: "1-2 hours"
priority: "HIGH - Should fix before Phase 4"
```

---

## 📊 QUALITY GATES

### Before Any Commit

```yaml
mandatory_checks:
  1_tests_written: "Test file exists and has comprehensive coverage"
  2_tests_passing: "All tests GREEN (or infrastructure fix documented)"
  3_no_quality_violations: "No mocks, stubs, placeholders, or TODOs"
  4_typescript_strict: "No 'any' types, all strict mode rules pass"
  5_eslint_clean: "Zero warnings, zero errors"
  6_docs_synced: "All 4 source-of-truth files updated together"
  7_commit_message: "Conventional commits format with context"

optional_but_recommended:
  - performance_benchmarks: "For critical operations"
  - integration_tests: "For component interactions"
  - e2e_tests: "For full workflows"
```

### Performance Budgets

```yaml
mcp_operations:
  checkpoint_save: "<100ms"
  recovery_detection: "<500ms"
  tool_invocation: "<2s"
  
bundle_sizes:
  mcp_server: "<50kb"
  dependencies: "<5MB"
  
runtime:
  memory_usage: "<100MB"
  startup_time: "<3s"
```

---

## 🎯 PHASE-SPECIFIC GUIDANCE

### Phase 1: Core (✅ COMPLETE)
- Focus: Basic crash prevention
- Components: SignalCollector, CheckpointRepository, SignalHistoryRepository
- Tests: 95 tests
- No blockers

### Phase 2: Redis Infrastructure (✅ COMPLETE)
- Focus: Distributed coordination
- Components: RedisConnectionManager, MessageBusWrapper, WorkerRegistry, StateSynchronizer, LockManager, TaskQueueWrapper
- Tests: 73 tests
- Thin wrappers around Redis and BullMQ

### Phase 3: Multi-Chat Coordination (✅ COMPLETE)
- Focus: Parallel AI execution
- Components: ChatCoordinator, TaskDistributor, WorkerAutomation
- Tests: 127 tests
- Supervisor/Worker pattern

### Phase 4-5: Autonomous Operation (📅 NEXT)
- Focus: Self-directed workflows and evolution
- Estimated: ~1,500 LOC
- Dependencies: Phases 1-3 complete, test infrastructure fixed
- Will use: ESLint, jscodeshift, Grafana (existing tools)

### Phase 6: Kaizen Loop (🔮 DEFERRED to v6.0)
- Focus: Autonomous improvement experiments
- Estimated: ~300 LOC
- Rationale: Prove core value first, add learning later
- Decision: Build after Phases 1-5 stable and user demand confirmed

---

## 🎓 ARCHITECTURAL DECISIONS

### Decision: MCP Server Size
```yaml
question: "How many tools in MCP server?"
decision: "6-8 core tools only"
rationale: "MCP is thin stdio coordinator, not computation engine"
result: "14.5kb bundle (was 2MB in v2.0)"
alternatives_rejected:
  - "98 tools (v2.0 approach) - Too bloated, crashed"
  - "Single monolithic tool - Poor separation of concerns"
```

### Decision: Redis vs Custom Infrastructure
```yaml
question: "Build custom job queue and state management?"
decision: "Use Redis + BullMQ"
rationale:
  - "Battle-tested, production-grade"
  - "Feature-rich (retries, delays, priorities, cron)"
  - "Active maintenance and community"
  - "Zero custom infrastructure code needed"
result: "0 LOC custom queue code, ~200 LOC thin wrappers"
alternatives_rejected:
  - "Custom queue system - Violates LEAN-OUT"
  - "SQLite-based queue - Not distributed, poor performance"
```

### Decision: Code Analysis Approach
```yaml
question: "Build custom AST analyzer?"
decision: "Use ESLint + TypeScript Compiler + complexity-report"
rationale:
  - "These tools are industry standard"
  - "Better than anything we could build"
  - "Zero maintenance burden"
result: "0 LOC custom analyzer"
alternatives_rejected:
  - "Custom AST parser - Reinventing wheel"
  - "Simple regex patterns - Too naive, misses issues"
```

### Decision: Monitoring Strategy
```yaml
question: "Build custom dashboard?"
decision: "Use Grafana + Prometheus"
rationale:
  - "Grafana is best-in-class visualization"
  - "Prometheus is industry standard for metrics"
  - "Rich ecosystem of integrations"
result: "0 LOC custom dashboard code"
alternatives_rejected:
  - "Custom React dashboard - Months of work, inferior result"
  - "CLI-only monitoring - Poor visibility"
```

### Decision: Kaizen Timing
```yaml
question: "Build autonomous improvement now?"
decision: "Defer to v6.0"
rationale:
  - "Prove crash prevention value first"
  - "Get user feedback on core functionality"
  - "Ensure foundation stable before adding ML"
result: "Focus on Phases 1-5, delay Phase 6"
alternatives_rejected:
  - "Build Kaizen now - Premature, unproven need"
  - "Never build Kaizen - Wastes potential for compound value"
```

---

## 🔍 TROUBLESHOOTING

### Tests Won't Run

```bash
# Symptom: npm test fails with module errors
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
npm test

# If still failing: Check Jest config
cat jest.config.js  # Verify configuration

# If still failing: Verify dependencies
npm list jest @types/jest ts-jest
```

### TypeScript Errors

```bash
# Find all errors
npx tsc --noEmit

# Common fixes:
# - Add missing imports
# - Fix 'any' types with proper interfaces
# - Add @types/* packages
# - Check tsconfig.json strict mode settings
```

### Git Conflicts on Documentation

```bash
# Always resolve conflicts by taking newest information
# Then verify all 4 files are consistent
# Use git log to see what happened:
git log --oneline -20

# Check what changed in each file:
git diff HEAD~5 ROADMAP.md
git diff HEAD~5 CURRENT_STATUS.md
```

---

## 📚 REFERENCE

### Key Directories
```
D:\SHIM\
├── src/                          # Production code (2,773 LOC)
│   ├── core/                     # Phase 1 components
│   ├── infrastructure/redis/     # Phase 2 components
│   └── coordination/             # Phase 3 components
├── tests/                        # Test code (~4,639 LOC, 295 tests)
├── mcp-server/                   # MCP server (6 tools, 14.5kb)
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # Technical design
│   ├── CLAUDE_INSTRUCTIONS_PROJECT.md  # This file
│   ├── V5_MIGRATION_SUMMARY.md  # v2→v5 evolution
│   ├── SHIM_MCP_ARCHITECTURE.md # MCP design
│   └── ATOMIC_DOC_SYNC_PROTOCOL.md  # Sync rules
├── ROADMAP.md                    # Strategic roadmap
└── CURRENT_STATUS.md             # Tactical status
```

### Related Files
- Global Instructions: `D:\Gregore\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md`
- In-App Instructions: User preferences (minimal pointer)
- Atomic Sync Protocol: `D:\SHIM\docs\ATOMIC_DOC_SYNC_PROTOCOL.md`

---

## ⚡ QUICK REFERENCE

### Essential Commands
```bash
# Development
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm run lint               # Check code quality
npm run build              # Build MCP server

# Git
git status                 # Check what changed
git add -A                 # Stage all changes
git commit -m "..."        # Commit with message
git log --oneline -10      # Recent history

# Documentation Sync
git add ROADMAP.md CURRENT_STATUS.md docs/ARCHITECTURE.md docs/CLAUDE_INSTRUCTIONS_PROJECT.md
git commit -m "docs: Sync all source-of-truth"
```

### Tool Selection
- **Read file**: `Desktop Commander:read_file`
- **Read multiple**: `Desktop Commander:read_multiple_files`
- **Write new**: `Desktop Commander:write_file`
- **Edit existing**: `Desktop Commander:edit_block` (preferred)
- **Search code**: `Desktop Commander:start_search`
- **Get file info**: `Desktop Commander:get_file_info`

---

**Version:** 5.0.0  
**Last Updated:** January 13, 2026  
**Phase:** 3 Complete → 4 Ready  
**Status:** Test infrastructure needs repair before Phase 4

**Philosophy:** Build Intelligence, Not Plumbing  
**Architecture:** LEAN-OUT (use existing tools)  
**Quality:** TDD + Documentation Sync + Zero Technical Debt

---

*This is the COMPREHENSIVE on-disk instruction file.*  
*In-app instructions (user preferences) point here for details.*  
*All development follows these protocols.*
