# MCP Server - Next Session Action Plan

**Goal:** Fix API mismatches and complete MCP server Stage 1

---

## 🎯 SESSION OBJECTIVES

1. **Read Core Implementations** - Understand actual APIs
2. **Fix Handler Calls** - Update to use correct methods
3. **Complete TypeScript Build** - Remove MCP exclusion
4. **Test MCP Server** - Verify tools work via MCP protocol

**Estimated Time:** 2-4 hours

---

## 📚 STEP 1: API DISCOVERY (30 min)

### Read Core Class Implementations
Execute in order:

```bash
# CheckpointManager - Constructor and methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\CheckpointManager.ts"
})

# CheckpointRepository - Query methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\CheckpointRepository.ts"
})

# ResumeDetector - Detection methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\ResumeDetector.ts"
})

# SessionRestorer - Restoration methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\SessionRestorer.ts"
})

# SignalCollector - Collection methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\SignalCollector.ts"
})

# SignalHistoryRepository - Query methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\core\\SignalHistoryRepository.ts"
})

# EvolutionCoordinator - Analysis methods
Desktop Commander:read_file({
  path: "D:\\SHIM\\src\\evolution\\EvolutionCoordinator.ts"
})
```

### Document Findings
Create mapping:
- Handler expectation → Actual API
- Missing methods → Need to add vs rename
- Type mismatches → Transformation needed

---

## 🔧 STEP 2: FIX HANDLERS (60-90 min)

### Fix Order (Dependency-Based)
1. **base-handler.ts** - Foundation
2. **force-checkpoint.ts** - Simplest handler
3. **auto-checkpoint.ts** - Similar to force-checkpoint
4. **signal-monitor.ts** - Signal-related
5. **recovery-check.ts** - Resume detection
6. **session-status.ts** - Combines multiple APIs
7. **code-analysis.ts** - Evolution API

### Fix Pattern for Each Handler
```typescript
// BEFORE (example from auto-checkpoint.ts)
const manager = new CheckpointManager(projectPath);
const checkpoint = await manager.createCheckpoint(context);

// AFTER (actual API)
const manager = new CheckpointManager({
  repository: new CheckpointRepository(dbPath),
  maxCheckpoints: 100
});
const checkpoint = await manager.createCheckpoint({
  sessionId: context.sessionId,
  operation: context.operation,
  context: { ...context }
});
```

### Systematic Approach
For each handler:
1. Identify all API calls
2. Check actual signatures from Step 1
3. Update constructor calls
4. Update method calls
5. Fix type transformations
6. Build and verify

---

## 🧪 STEP 3: INTEGRATION (45 min)

### Remove MCP Exclusion
```typescript
// tsconfig.json
{
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
    // REMOVE: "src/mcp/**/*"
  ]
}
```

### Build and Fix Remaining Errors
```bash
# Build
cd D:\SHIM
npm run build 2>&1 | Select-String "error TS"

# If errors:
# - Read error details
# - Fix one by one
# - Rebuild after each fix
# - Iterate until zero errors
```

### Verify Compilation Success
```bash
# Check dist/mcp exists
Desktop Commander:list_directory({
  path: "D:\\SHIM\\dist\\mcp",
  depth: 2
})

# Should see:
# - server.js, server.d.ts
# - handlers/*.js, handlers/*.d.ts
```

---

## 🧪 STEP 4: BASIC TESTING (30 min)

### Test MCP Server Startup
```bash
# Start server
cd D:\SHIM
node dist/mcp/server.js
```

Expected output:
```
SHIM MCP Server listening on stdio
Tools registered: [list of 6 tools]
Ready for requests
```

### Test Tool Discovery
Use MCP inspector or direct protocol test:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Expected response:
```json
{
  "tools": [
    { "name": "auto_checkpoint", ... },
    { "name": "force_checkpoint", ... },
    { "name": "check_resume", ... },
    { "name": "session_status", ... },
    { "name": "signal_monitor", ... },
    { "name": "analyze_code", ... }
  ]
}
```

---

## 📝 STEP 5: DOCUMENTATION (15 min)

### Update Status Documents
1. Mark MCP_BUILD_STATUS.md as complete
2. Update CURRENT_STATUS.md
3. Create MCP_USAGE.md with examples
4. Add to ROADMAP.md progress

### Git Commit
```bash
cd D:\SHIM
git add -A
git commit -m "feat: complete MCP server Stage 1 - all tools functional

COMPLETED:
- Fixed 20+ API mismatches in MCP handlers
- Updated all constructors to use proper config objects
- Transformed SessionContext to CreateCheckpointInput
- All 6 tools compile successfully
- MCP server starts and registers tools

HANDLERS FIXED:
- auto-checkpoint: Checkpoint creation
- force-checkpoint: Manual checkpoint trigger
- check-resume: Resume detection
- session-status: Multi-source status
- signal-monitor: Signal collection
- analyze-code: Code analysis

API CORRECTIONS:
- CheckpointManager: Pass config object, not string
- ResumeDetector: Pass repository, not path
- SignalCollector: Proper constructor signature
- EvolutionCoordinator: Pass config, use correct methods

TESTING:
✅ TypeScript compilation: ZERO errors
✅ MCP server startup: Success
✅ Tool registration: All 6 tools
✅ Protocol compliance: MCP 1.0 compatible

STAGE STATUS:
✅ Stage 1 Complete - Foundation solid"
```

---

## 🚨 POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Missing Methods on Core Classes
**If:** Core class doesn't have expected method  
**Solution:** 
- Check for similar method with different name
- If truly missing, add method to core class (TDD)
- Update tests for new method

### Issue 2: Incompatible Type Transformations
**If:** Cannot transform SessionContext → CreateCheckpointInput  
**Solution:**
- Create helper function for transformation
- Document mapping logic
- Add unit tests for transformer

### Issue 3: MCP SDK Type Errors
**If:** MCP SDK types don't match usage  
**Solution:**
- Check MCP SDK version (should be ^1.25.2)
- Read MCP SDK documentation
- Update handler signatures to match SDK
- Consider type assertions if needed

### Issue 4: Runtime Errors After Build
**If:** Compiles but crashes at runtime  
**Solution:**
- Check compiled JavaScript in dist/
- Verify imports resolve correctly
- Test each tool individually
- Add error handling

---

## ✅ SUCCESS CRITERIA

### Must Have
- [ ] All handlers compile without errors
- [ ] MCP server starts successfully
- [ ] All 6 tools register
- [ ] No TypeScript errors
- [ ] Git commit created

### Should Have
- [ ] Basic tool invocation works
- [ ] Error handling present
- [ ] Documentation updated
- [ ] Examples provided

### Nice to Have
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Full MCP protocol compliance verified

---

## 📞 IF YOU GET STUCK

### Common Blockers
1. **Can't find method:** Search entire file with grep/search
2. **Type mismatch:** Check both sides of assignment
3. **Import errors:** Verify path and file extension
4. **Runtime crash:** Add console.log for debugging

### Escalation Path
1. Read implementation carefully
2. Check tests for usage examples
3. Search codebase for similar patterns
4. Document blocker and move to next handler
5. Circle back after completing others

---

**Prepared:** January 12, 2026  
**For Session:** MCP API Fixes  
**Estimated Duration:** 2-4 hours  
**Current Commit:** f11a7c5
