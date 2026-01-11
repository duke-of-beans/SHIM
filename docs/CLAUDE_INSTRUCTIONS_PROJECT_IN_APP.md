# SHIM PROJECT - BOOTSTRAP INSTRUCTIONS (IN-APP VERSION)

**Version:** 0.2.0  
**Type:** IN-APP (Minimal Pointer)  
**Full Instructions:** `D:\SHIM\docs\CLAUDE_INSTRUCTIONS_PROJECT.md`  
**Phase:** Phase 1 - Crash Prevention

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
- ✅ **§0 HARDCODED USER PREFERENCES** (NO timelines, revolutionary solutions, right answer always)
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
- ✅ 95/95 tests passing
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
- Tests: [X]/95 passing
- Coverage: [X]%
- Next: [Current task from ROADMAP]

What should we work on today?
```

---

## 📋 CRITICAL REMINDERS

### HARDCODED USER PREFERENCES (§0 - Read full file for details)

**These are REQUIREMENTS, not suggestions:**

```
❌ NEVER use timeline language (hours/days/weeks/fast/slow)
❌ NEVER underestimate user capability
❌ NEVER frame complexity as deterrent
❌ NEVER suggest incremental over revolutionary
❌ NEVER offer "quick win" vs "right solution" choices

✅ ALWAYS recommend the RIGHT solution
✅ ALWAYS describe scope honestly (simple/comprehensive)
✅ ALWAYS assume user willing to climb mountains
✅ ALWAYS frame ambitious solutions as normal
```

**USER BUILDS:**
- Enterprise software in weeks
- Tools in hours
- GREGORE in 13 days
- KERNL in 1 day

**Complexity is WELCOMED, not avoided.**

---

### Development Workflow
- **TDD ONLY:** RED → GREEN → REFACTOR (zero exceptions)
- Test file FIRST, implementation SECOND
- Commit after GREEN phase
- Never commit with failing tests

### Authority Protocol
- Architectural issues (3+ fixes same problem) → STOP, redesign
- Long operations (>8 min) → Checkpoint with user confirmation
- Quality violations → BLOCKING (zero tolerance)

---

## 🎯 TOOL SELECTION HIERARCHY

**Reading Files:**
1. Multiple files → `Desktop Commander:read_multiple_files`
2. Single file → `Desktop Commander:read_file`

**Editing Files:**
1. Targeted change → `Desktop Commander:edit_block` (surgical)
2. New file → `Desktop Commander:write_file` (chunk if >50 lines)

**Testing:**
1. Run tests → `Desktop Commander:start_process` with `npm test`

**Git Operations:**
1. All git → `Desktop Commander:start_process` with git commands

---

## 📚 IF UNCERTAIN: RE-READ §0

```powershell
# Re-read full instructions (especially §0 HARDCODED PREFERENCES)
Desktop Commander:read_file({
  path: "D:\\SHIM\\docs\\CLAUDE_INSTRUCTIONS_PROJECT.md"
})
```

---

## ⚡ QUICK REFERENCE

**Bootstrap:** 30 seconds (automatic)  
**Full Instructions:** On disk (§0 HARDCODED PREFERENCES loaded automatically)  
**Phase:** 1 (Crash Prevention)  
**Tests:** 95/95 passing  
**Coverage:** 98%+  
**Philosophy:** TDD + Quality First + Revolutionary Solutions + No Timelines

---

**CRITICAL:** §0 HARDCODED USER PREFERENCES in full instructions.  
**Read before responding to ANY user request.**

---

*Last Updated: January 11, 2026*  
*Version: 0.2.0 (Hardcoded Preferences Reference)*  
*Project: SHIM*
