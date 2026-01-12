# MCP Next Session Plan - Stage 3

**Updated:** January 12, 2026, 9:45 AM  
**Current Status:** Stage 2 Complete ✅  
**Next Phase:** Stage 3 - Testing & Integration

---

## ✅ STAGE 2 RECAP - COMPLETED

**Duration:** ~45 minutes  
**Result:** Clean build, all API mismatches fixed

**What was completed:**
- ✅ Discovered actual core class APIs
- ✅ Fixed all 20+ handler API mismatches
- ✅ Re-integrated MCP handlers into build
- ✅ Zero TypeScript errors
- ✅ MCP server starts successfully
- ✅ Created comprehensive API documentation

**Files modified:** 9 (6 handlers + server + tsconfig + API docs)  
**Commit:** 3449a5f

---

## 🎯 STAGE 3 PLAN - TESTING & INTEGRATION

**Goal:** Validate MCP server works end-to-end  
**Estimated Time:** 90 minutes  
**Priority:** Database setup → Configuration → Tool testing

---

### STEP 1: Database Setup (15 min)

**Objective:** Create SQLite database and verify connections

**Tasks:**
1. Create directory structure
   ```bash
   mkdir D:\SHIM\data
   ```

2. Initialize database (will happen automatically on first handler use)
   - CheckpointRepository.initialize() creates tables
   - SignalHistoryRepository.initialize() creates tables
   - Verify schema creation

3. Test database connections
   ```typescript
   // Quick verification script
   const repo = new CheckpointRepository('D:/SHIM/data/shim.db');
   await repo.initialize();
   console.log('✅ Database initialized');
   ```

**Expected outcome:**
- `D:\SHIM\data\shim.db` created
- Tables: checkpoints, signal_history, resume_events
- All indexes created
- No connection errors

---

### STEP 2: MCP Configuration (15 min)

**Objective:** Configure Claude Desktop to load SHIM MCP server

**Tasks:**
1. Update Claude Desktop config
   ```json
   // Location: %APPDATA%\Claude\claude_desktop_config.json
   {
     "mcpServers": {
       "shim": {
         "command": "node",
         "args": ["D:/SHIM/dist/mcp/server.js"],
         "env": {}
       }
     }
   }
   ```

2. Restart Claude Desktop

3. Verify MCP server shows in Tools menu

**Expected outcome:**
- SHIM MCP appears in Claude Desktop
- 6 tools visible: shim_auto_checkpoint, shim_check_recovery, etc.
- No startup errors in logs

---

### STEP 3: Tool Testing (45 min)

**Objective:** Test each tool via Claude interface

#### Test 1: shim_session_status (5 min)
**Purpose:** Verify basic server communication

**Test:**
```
User: "Use SHIM to check session status"
Expected:
- Returns session info
- Shows checkpoint count (0 initially)
- Shows session duration
- No errors
```

#### Test 2: shim_force_checkpoint (10 min)
**Purpose:** Verify checkpoint creation

**Test:**
```
User: "Create a manual checkpoint with SHIM"
Expected:
- Creates checkpoint in database
- Returns checkpoint ID
- Checkpoint number = 1
- Verify with session_status (count = 1)
```

#### Test 3: shim_auto_checkpoint (10 min)
**Purpose:** Verify automatic checkpointing

**Test:**
```
User: "Simulate auto-checkpoint: working on Phase 3 testing, 50% complete"
Expected:
- Evaluates if checkpoint needed
- Creates checkpoint if criteria met
- Returns checkpoint_created boolean
- Minimal output (silent operation)
```

#### Test 4: shim_monitor_signals (10 min)
**Purpose:** Verify signal tracking

**Test:**
```
User: "Monitor crash signals"
Expected:
- Returns current crash risk (safe/warning/danger)
- Shows risk factors if any
- Provides signal metrics
- Saves snapshot to history
```

#### Test 5: shim_check_recovery (5 min)
**Purpose:** Verify resume detection

**Test:**
```
User: "Check if there's a session to recover"
Expected:
- Returns recovery_available = false (no crashes yet)
- Shows session ID being checked
- No errors
```

#### Test 6: shim_analyze_code (5 min)
**Purpose:** Verify code analysis

**Test:**
```
User: "Analyze code quality in D:/SHIM/src/core"
Expected:
- Scans TypeScript files
- Returns file count, LOC, complexity
- Lists code smells/issues
- Provides recommendations
```

**Testing Matrix:**
```
Tool                    | Status | Notes
------------------------|--------|------------------
shim_session_status     | [ ]    | Basic communication
shim_force_checkpoint   | [ ]    | DB write
shim_auto_checkpoint    | [ ]    | Logic + DB
shim_monitor_signals    | [ ]    | Signal tracking
shim_check_recovery     | [ ]    | Resume detection
shim_analyze_code       | [ ]    | Code analysis
```

---

### STEP 4: Integration Verification (30 min)

**Objective:** Verify handler interactions with core classes

**Tests:**
1. **Checkpoint Flow**
   - Create checkpoint → Verify in DB → Check status → Verify count

2. **Signal Tracking**
   - Monitor signals → Save snapshot → Verify in history

3. **Resume Detection**
   - Create checkpoint → Simulate crash → Check recovery

4. **Code Analysis**
   - Analyze directory → Verify metrics → Check recommendations

**Validation Checklist:**
- [ ] All tools respond without errors
- [ ] Database writes succeed
- [ ] Data retrieval works
- [ ] Cross-handler data consistency
- [ ] No TypeScript errors in logs
- [ ] No runtime exceptions

---

### STEP 5: Documentation (15 min)

**Objective:** Document MCP setup and usage

**Create:**
1. `docs/MCP_CONFIGURATION.md`
   - Claude Desktop setup
   - Tool descriptions
   - Usage examples
   - Troubleshooting

2. Update `README.md`
   - Add MCP integration section
   - Link to configuration guide
   - Show example usage

3. `docs/MCP_TROUBLESHOOTING.md`
   - Common issues
   - Error messages
   - Solutions
   - Debug tips

---

## 🚨 POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Database Path
**Symptom:** "SQLITE_CANTOPEN: unable to open database file"  
**Cause:** data/ directory doesn't exist  
**Solution:** Create directory manually or update handler constructors

### Issue 2: Async Initialization
**Symptom:** Handlers use repo before initialize() completes  
**Cause:** Constructor calls initialize() but doesn't await  
**Solution:** Make handlers wait for initialization or use lazy init

### Issue 3: Session ID Persistence
**Symptom:** Different session IDs across tool calls  
**Cause:** Each handler creates its own session ID  
**Solution:** Share session ID across handlers (singleton or shared state)

### Issue 4: MCP Protocol Errors
**Symptom:** Tools not appearing in Claude Desktop  
**Cause:** Incorrect tool definitions or server startup failure  
**Solution:** Check logs, verify JSON schema, test server standalone

---

## 📦 DELIVERABLES - STAGE 3

When complete, we should have:
- ✅ Working database with schema
- ✅ MCP server configured in Claude Desktop
- ✅ All 6 tools tested and functional
- ✅ Integration verified end-to-end
- ✅ Comprehensive documentation
- ✅ Known issues documented
- ✅ Production-ready MCP server

---

## 🎯 SUCCESS CRITERIA

**STAGE 3 COMPLETE when:**
1. All 6 tools execute without errors
2. Database operations succeed
3. Data persists correctly
4. Resume detection works
5. Signal monitoring tracks metrics
6. Code analysis produces results
7. Documentation is comprehensive
8. No blocking issues remain

**Time Budget:** 90 minutes  
**Quality Standard:** Production-ready  
**Documentation:** Complete

---

## 🔄 IF ISSUES FOUND

**Minor Issues (< 30 min fix):**
- Fix immediately
- Document in troubleshooting guide
- Continue testing

**Major Issues (> 30 min fix):**
- Document clearly
- Create GitHub issue
- Schedule for Stage 4
- Continue testing other tools

**Blocking Issues:**
- Document root cause
- Investigate systematically
- Fix before proceeding
- Update timeline

---

**Current Status:** Ready for Stage 3  
**Next Step:** Create data/ directory and start testing  
**Estimated Completion:** Today (2-3 hours remaining)
