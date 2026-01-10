# SHIM PROJECT - BOOTSTRAP INSTRUCTIONS (IN-APP VERSION)

**Version:** 0.1.0  
**Type:** IN-APP (Minimal Pointer)  
**Full Instructions:** `D:\SHIM\docs\CLAUDE_INSTRUCTIONS_PROJECT.md`  
**Phase:** Phase 1 - Crash Prevention (Week 3-4)

---

## 🚨 CRITICAL: AUTOMATIC BOOTSTRAP SEQUENCE

**This runs FIRST, EVERY session, AUTOMATICALLY:**

### Step 1: Load Full Instructions [MANDATORY - FIRST CALL]

```powershell
# Use Desktop Commander to read instruction files
Desktop Commander:read_multiple_files({
  paths: [
    "D:\\SHIM\\docs\\CLAUDE_INSTRUCTIONS_PROJECT.md",
    "D:\\SHIM\\docs\\ROADMAP.md",
    "D:\\SHIM\\CURRENT_STATUS.md"
  ]
})
```

**This loads:**
- ✅ Complete development protocols
- ✅ TDD workflow (RED → GREEN → REFACTOR)
- ✅ Test-first enforcement
- ✅ Current phase objectives
- ✅ Quality standards

---

### Step 2: Verify Test Suite [MANDATORY - SECOND CALL]

```powershell
# Always check current state before starting work
Desktop Commander:start_process({
  command: "cd D:\\SHIM; npm test",
  timeout_ms: 60000
})
```

**Expected Status:**
- ✅ 95/95 tests passing (SignalCollector 53 + SignalHistoryRepository 18 + CheckpointRepository 24)
- ✅ 98%+ coverage
- ✅ All performance benchmarks met

**If tests failing:** STOP. Fix tests before new work.

---

### Step 3: Bootstrap Complete

**Display to user:**
```
✅ Session initialized

SHIM Status:
- Phase: 1 (Crash Prevention)
- Week: 3-4 (Checkpoint System)
- Tests: [X]/95 passing
- Coverage: [X]%
- Next: [Current task from ROADMAP]

What should we work on today?
```

**Total Bootstrap Time:** ~30 seconds

---

## 📋 KEY REMINDERS (Read Full Instructions for Details)

### Development Workflow
- **TDD ONLY:** RED → GREEN → REFACTOR (zero exceptions)
- Test file FIRST, implementation SECOND
- Never write code without failing test
- Commit after GREEN phase (tests passing)

### Test Standards
- Descriptive test names (complete sentences)
- Comprehensive coverage (edge cases, errors, performance)
- Independent tests (no shared state between tests)
- Performance benchmarks for critical operations

### File Operations
- `Desktop Commander:read_file` - Single file (with pagination)
- `Desktop Commander:read_multiple_files` - Multiple files (parallel)
- `Desktop Commander:write_file` - New file (chunk for large files)
- `Desktop Commander:edit_block` - Surgical edits (verified, safe)

### Git Operations
- Conventional commits (`feat:`, `fix:`, `test:`, `refactor:`)
- Detailed commit messages with context
- Commit after each GREEN phase
- Never commit with failing tests

### Authority Protocol
- Architectural issues (3+ fixes same problem) → STOP, redesign
- Long operations (>8 min) → Checkpoint with user confirmation
- Quality violations → BLOCKING (zero tolerance)
- Documentation drift → Update NOW (don't defer)

---

## 🎯 TOOL SELECTION HIERARCHY

**Reading Files:**
1. Multiple files → `Desktop Commander:read_multiple_files`
2. Single file → `Desktop Commander:read_file`
3. File info → `Desktop Commander:get_file_info`

**Editing Files:**
1. Targeted change → `Desktop Commander:edit_block` (surgical)
2. New file → `Desktop Commander:write_file` (chunk if >50 lines)
3. Multiple edits → Multiple `edit_block` calls

**Testing:**
1. Run tests → `Desktop Commander:start_process` with `npm test`
2. Watch mode → `Desktop Commander:start_process` with `npm test -- --watch`
3. Coverage → `Desktop Commander:start_process` with `npm test -- --coverage`

**Finding Code:**
1. By pattern → `Desktop Commander:start_search` (streaming)
2. By name → `Desktop Commander:search_files` (glob patterns)

**Git Operations:**
1. All git → `Desktop Commander:start_process` with git commands
2. Status → `git status`
3. Commit → `git add -A && git commit -m "..."`

---

## 📚 IF UNCERTAIN: RE-READ PROTOCOL

```powershell
# Re-read full instructions
Desktop Commander:read_file({
  path: "D:\\SHIM\\docs\\CLAUDE_INSTRUCTIONS_PROJECT.md"
})

# Or search for specific topic
Desktop Commander:start_search({
  path: "D:\\SHIM\\docs",
  pattern: "[topic]",
  searchType: "content"
})
```

---

## ⚡ QUICK REFERENCE

**Bootstrap:** 30 seconds (automatic)  
**Full Instructions:** On disk (loaded automatically)  
**Phase:** 1 (Crash Prevention)  
**Week:** 3-4 (Checkpoint System)  
**Tests:** 95/95 passing  
**Coverage:** 98%+  
**Philosophy:** TDD + Quality First + Zero Technical Debt

---

**This is a POINTER file. Full instructions automatically loaded at bootstrap.**  
**DO NOT duplicate full instructions here - disk is source of truth.**

---

*Last Updated: January 10, 2026*  
*Version: 0.1.0 (Initial Release)*  
*Project: SHIM*
