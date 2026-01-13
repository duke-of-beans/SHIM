# SHIM PROJECT - CLAUDE DEVELOPMENT INSTRUCTIONS v5.0

**Version:** 5.0 (LEAN-OUT Architecture)  
**Updated:** January 12, 2026  
**Phase:** 2 (Redis Infrastructure) - 40% Complete

---

## 🚨 CRITICAL: v5.0 LEAN-OUT ARCHITECTURE

### MANDATORY FIRST READ

**This project follows LEAN-OUT principles:**

```yaml
rule: "Build Intelligence, Not Plumbing"

build_custom:
  - domain_logic: "✅ SHIM-specific crash prevention"
  - thin_wrappers: "✅ <200 LOC around existing tools"
  - intelligence: "✅ Unique value-add code"

use_existing:
  - infrastructure: "✅ Redis, BullMQ, SQLite"
  - analysis: "✅ ESLint, TSC, complexity-report"
  - transformation: "✅ jscodeshift, ts-morph"
  - monitoring: "✅ Grafana, Prometheus"

never_build:
  - generic_queues: "❌ Use BullMQ"
  - generic_caches: "❌ Use Redis"
  - ast_analyzers: "❌ Use ESLint, TSC"
  - dashboards: "❌ Use Grafana"
  - ml_inference: "❌ Use APIs or heuristics"
```

### v2.0 FAILURE - LEARN FROM THIS ⚠️

```yaml
mistake: "Built 98 custom tools (8000 LOC)"
violated: "LEAN-OUT - built generic infrastructure"
result: "TypeScript dependency crash, unmaintainable"
lesson: "Use existing tools for plumbing"
```

### v5.0 SUCCESS ✅

```yaml
approach: "6 core tools + existing tools"
followed: "LEAN-OUT - build intelligence only"
custom_code: "811-1011 LOC (87-96% reduction)"
result: "Works, maintainable, full functionality"
```

---

## 📋 PROJECT PHASES

| Phase | Status | Custom Code | Existing Tools |
|-------|--------|-------------|----------------|
| 1: Core | ✅ 100% | 311 LOC | SQLite |
| 2: Redis | 🚧 40% | +200 LOC | Redis, BullMQ |
| 3: Multi-Chat | 📅 Planned | +200 LOC | Redis Pub/Sub, Redlock |
| 4: Tools | 📅 Planned | +0-200 LOC | ESLint, jscodeshift, Grafana |
| 5: Production | 📅 Planned | +100 LOC | Prometheus, Alertmanager |
| 6: Kaizen | 🔮 v6.0 | +300 LOC | BullMQ cron |

---

## 🛡️ LEAN-OUT ENFORCEMENT (MANDATORY)

### BEFORE Writing Any Code

```typescript
// REQUIRED CHECKLIST - Run through EVERY time
function beforeCoding(feature: string) {
  // 1. Does existing tool solve this?
  const existingTool = searchNPM(feature);
  if (existingTool) return useExisting(existingTool);
  
  // 2. Is this generic infrastructure?
  if (isGenericInfrastructure(feature)) {
    throw new Error("❌ LEAN-OUT VIOLATION - use existing tool");
  }
  
  // 3. Is this domain-specific intelligence?
  if (isDomainIntelligence(feature)) {
    return buildCustom(feature);  // ✅ Allowed
  }
  
  // 4. Can we compose existing tools?
  const composed = composeExisting(feature);
  if (composed) return composed;
  
  // 5. Last resort: Ask user
  return askUser("Should we build this or find existing tool?");
}
```

### RED FLAGS - STOP IMMEDIATELY 🛑

If you're about to write code for:
- ❌ Job queues → Use BullMQ
- ❌ Caching → Use Redis
- ❌ Pub/Sub → Use Redis Pub/Sub
- ❌ AST parsing → Use ESLint, TSC
- ❌ Code transformation → Use jscodeshift
- ❌ Dashboards → Use Grafana
- ❌ Metrics → Use Prometheus
- ❌ ML models → Use APIs or heuristics

**STOP and use existing tool instead.**

---

## 🎯 DEVELOPMENT WORKFLOW

### 1. TDD (Test-Driven Development)

**MANDATORY: Always follow RED → GREEN → REFACTOR**

```bash
# Phase 1: RED - Write failing test FIRST
npm test -- WorkerRegistry.test.ts
# ❌ Test fails (expected)

# Phase 2: GREEN - Write minimal code to pass
# Write implementation

npm test -- WorkerRegistry.test.ts
# ✅ Test passes

# Phase 3: REFACTOR - Clean up code
# Improve without changing behavior

npm test
# ✅ All tests still pass

# Phase 4: COMMIT
git add -A
git commit -m "feat: Add WorkerRegistry with Redis"
```

### 2. File Operations

**Reading Files:**
```bash
# Single file
Desktop Commander:read_file({ path: "D:\\SHIM\\src\\file.ts" })

# Multiple files (parallel)
Desktop Commander:read_multiple_files({ 
  paths: ["D:\\SHIM\\src\\a.ts", "D:\\SHIM\\src\\b.ts"]
})

# File info (without reading)
Desktop Commander:get_file_info({ path: "D:\\SHIM\\src\\file.ts" })
```

**Writing Files:**
```bash
# New file
Desktop Commander:write_file({
  path: "D:\\SHIM\\src\\new.ts",
  content: "...",
  mode: "rewrite"
})

# Append (for large files)
Desktop Commander:write_file({
  path: "D:\\SHIM\\src\\large.ts",
  content: "...chunk...",
  mode: "append"
})

# Surgical edit (preferred for changes)
Desktop Commander:edit_block({
  file_path: "D:\\SHIM\\src\\existing.ts",
  old_string: "exact text to replace",
  new_string: "new text",
  expected_replacements: 1
})
```

### 3. Running Tests

```bash
# All tests
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test",
  timeout_ms: 60000
})

# Watch mode
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test -- --watch",
  timeout_ms: 600000
})

# Coverage
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test -- --coverage",
  timeout_ms: 60000
})

# Specific file
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test -- WorkerRegistry.test.ts",
  timeout_ms: 60000
})
```

### 4. Git Operations

```bash
# Check status
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git status",
  timeout_ms: 5000
})

# Commit (after GREEN phase)
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git add -A && git commit -m 'feat: Add feature'",
  timeout_ms: 10000
})

# View history
Desktop Commander:start_process({
  command: "cd D:\\SHIM; git log --oneline -10",
  timeout_ms: 5000
})
```

---

## 📏 QUALITY STANDARDS

### Test Coverage
```yaml
requirement: "95%+ coverage"
types: "Unit, Integration, E2E"
naming: "Descriptive sentences"
independence: "No shared state between tests"
performance: "Benchmark critical operations"
```

### Code Quality
```yaml
eslint: "Strict mode, zero warnings"
typescript: "Strict mode, no any"
complexity: "<10 cyclomatic per function"
file_size: "<300 LOC per file"
```

### Performance Budgets
```yaml
checkpoint_save: "<100ms"
recovery_detect: "<500ms"
tool_invocation: "<2s"
mcp_bundle_size: "<50kb"
```

---

## 🔧 CURRENT PHASE: PHASE 2 (REDIS)

### What We're Building

```yaml
completed:
  - RedisConnectionManager: "✅ Connection pooling, health monitoring"
  - MessageBusWrapper: "✅ Redis Pub/Sub for messaging"

in_progress:
  - WorkerRegistry: "🚧 Blocked by missing types"
    blocker: "Missing WorkerInfo, WorkerStatus, WorkerHealth interfaces"
    location: "src/infrastructure/redis/Redis.ts"
    action: "Define interfaces first"

planned:
  - StateSynchronizer: "⬜ State sync across instances"
  - LockManager: "⬜ Redis Redlock wrapper"
  - BullMQ Integration: "⬜ Job queues, scheduling"
```

### What We're NOT Building

```yaml
not_building:
  - custom_queue: "❌ Use BullMQ"
  - custom_cache: "❌ Use Redis"
  - custom_pubsub: "❌ Use Redis Pub/Sub"
  - custom_locks: "❌ Use Redis Redlock"

reason: "LEAN-OUT - use existing tools"
custom_code: "Just thin wrappers (~200 LOC)"
```

---

## 🚧 ACTIVE BLOCKERS

### WorkerRegistry Type Definitions
**Status:** 🚧 Blocking commit  
**Location:** `src/infrastructure/redis/Redis.ts`  
**Need:**
```typescript
export interface WorkerInfo {
  id: string;
  status: WorkerStatus;
  health: WorkerHealth;
  metadata: Record<string, unknown>;
}

export interface WorkerStatus {
  status: 'active' | 'idle' | 'offline';
  lastSeen: Date;
  taskCount: number;
}

export interface WorkerHealth {
  cpu: number;
  memory: number;
  uptime: number;
}
```

**Action:** Define these interfaces, then unblock WorkerRegistry

---

## 📋 IMMEDIATE NEXT ACTIONS

### Today (January 12, 2026)
1. ✅ Update all source of truth docs to v5.0
2. ⬜ Define WorkerRegistry types in Redis.ts
3. ⬜ Complete WorkerRegistry implementation
4. ⬜ Write WorkerRegistry tests
5. ⬜ Test Redis infrastructure end-to-end

### This Week
1. Complete StateSynchronizer
2. Complete LockManager (Redis Redlock wrapper)
3. Integrate BullMQ (minimal wrapper)
4. Write Phase 2 integration tests
5. Update MCP server with Phase 2 tools

---

## 🎓 KEY LESSONS

### From v2.0 Failure
1. **Don't build generic infrastructure** - Use existing tools
2. **Test in target environment early** - Don't wait until build complete
3. **Watch for dependency creep** - Runtime vs devDependencies
4. **Respect platform constraints** - MCP is stdio coordinator, not compute engine

### v5.0 Principles
1. **Build intelligence only** - Domain-specific logic
2. **Use existing tools** - Battle-tested infrastructure
3. **Thin wrappers** - <200 LOC per wrapper
4. **Question everything** - "Does tool exist for this?"

---

## 🔍 DECISION FRAMEWORK

### When Implementing New Feature

```typescript
// Step 1: Check for existing tool
const exists = await searchNPM(feature);
if (exists) {
  // Use existing tool
  return useExisting(exists);
}

// Step 2: Check if generic infrastructure
if (isGeneric(feature)) {
  // STOP - find existing tool
  throw LeanOutViolation();
}

// Step 3: Check if domain-specific
if (isDomainSpecific(feature)) {
  // OK to build custom
  return buildCustom(feature);
}

// Step 4: Ask user
return askUser("Build or find existing?");
```

### Examples

**❌ BAD - Building Plumbing:**
```typescript
// DON'T build custom job queue
class CustomJobQueue {
  async add(job: Job) { /* 500 LOC */ }
  async process() { /* 300 LOC */ }
}
```

**✅ GOOD - Use Existing:**
```typescript
// DO use BullMQ
import { Queue } from 'bullmq';
const queue = new Queue('tasks', { connection: redis });
await queue.add('task', data);
```

**✅ GOOD - Build Intelligence:**
```typescript
// DO build domain-specific logic
class SignalCollector {
  collectCrashSignals(): Risk {
    // SHIM-specific heuristics
    return calculateRisk(tokens, time, memory);
  }
}
```

---

## 📚 RELATED DOCUMENTS

- `ROADMAP.md` - Project roadmap and phases
- `CURRENT_STATUS.md` - Real-time status
- `docs/ARCHITECTURE.md` - v5.0 architecture
- `docs/MCP_LEAN_OUT_REDESIGN.md` - v2→v5 evolution
- `docs/SHIM_V2_TOOL_AUDIT.md` - Tool analysis

---

## ⚡ QUICK REFERENCE

### Bootstrap Sequence
1. Load this file
2. Read ROADMAP.md
3. Read CURRENT_STATUS.md
4. Check active blockers
5. Run tests to verify state

### Common Commands
```bash
# Tests
npm test
npm test -- --watch
npm test -- --coverage

# Linting
npm run lint
npm run lint:fix

# Build MCP server
cd mcp-server && npm run build

# Git
git status
git add -A && git commit -m "..."
git log --oneline -10
```

---

**Version:** 5.0 (LEAN-OUT Architecture)  
**Philosophy:** Build Intelligence, Not Plumbing  
**Current Phase:** Phase 2 (Redis) - 40%  
**Updated:** January 12, 2026

---

*Remember: Before building anything, ask "Does a tool exist for this?" If yes, use it. If no and it's generic infrastructure, find one. Only build if domain-specific intelligence.*
