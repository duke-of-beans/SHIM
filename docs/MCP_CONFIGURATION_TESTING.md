# SHIM MCP Configuration Guide

**Updated:** January 12, 2026, 10:05 AM  
**Status:** Configured ✅  
**Next:** Restart Claude Desktop to load SHIM

---

## ✅ CONFIGURATION COMPLETE

### What Was Configured

**File Updated:**
```
C:\Users\DKdKe\AppData\Roaming\Claude\claude_desktop_config.json
```

**SHIM MCP Server Added:**
```json
{
  "mcpServers": {
    "SHIM": {
      "command": "node",
      "args": ["D:/SHIM/dist/mcp/server.js"],
      "env": {}
    }
  }
}
```

### Current MCP Servers
1. **KERNL** - Project Mind system (already configured)
2. **SHIM** - Session Handling & Intelligent Management (newly added)

---

## 🚀 NEXT STEPS

### Step 1: Restart Claude Desktop (REQUIRED)
1. **Close this conversation** completely
2. **Quit Claude Desktop** (File → Quit or Alt+F4)
3. **Restart Claude Desktop** from Start Menu
4. **Open new conversation** (or continue in new session)

**Important:** Configuration only loads on startup. Restart required for SHIM tools to appear.

---

## 🧪 TESTING THE SHIM TOOLS

Once restarted, you'll have access to 6 new SHIM tools. Here's how to test each one:

### Test 1: shim_session_status (Basic Communication)
**What it does:** Shows current SHIM status and session info

**Test command:**
```
Can you check the SHIM session status?
```

**Expected output:**
- Session ID (UUID)
- Session duration (minutes)
- Checkpoint count (0 initially)
- Recovery available (false initially)
- Signal snapshot count
- Elapsed time

**What this verifies:**
- ✅ MCP server communication working
- ✅ Database connection successful
- ✅ Handler initialized properly
- ✅ Basic query operations functional

---

### Test 2: shim_force_checkpoint (Database Write)
**What it does:** Manually creates a checkpoint

**Test command:**
```
Create a manual checkpoint with SHIM (testing Phase 3 configuration)
```

**Expected output:**
- Checkpoint created: true
- Checkpoint number: 1
- Checkpoint ID: (UUID)
- Created timestamp
- Session ID

**What this verifies:**
- ✅ Database write operations
- ✅ CheckpointManager integration
- ✅ CheckpointRepository working
- ✅ Data persistence

**Follow-up check:**
```
Check SHIM session status again
```
Expected: checkpoint_count should now be 1

---

### Test 3: shim_auto_checkpoint (Logic + Database)
**What it does:** Evaluates if checkpoint needed, creates if criteria met

**Test command:**
```
Simulate auto-checkpoint: 
- Current task: Testing MCP integration
- Progress: 0.5
- Decisions: ["Configured Claude Desktop", "Added SHIM MCP server"]
- Next steps: ["Test remaining tools", "Verify integration"]
```

**Expected output:**
- Checkpoint created: (true or false, depends on criteria)
- Reason: (why checkpoint was/wasn't created)
- If created: checkpoint number, ID, timestamp

**What this verifies:**
- ✅ AutoCheckpoint logic working
- ✅ Threshold evaluation
- ✅ Conditional checkpoint creation
- ✅ Silent operation (no unnecessary output)

---

### Test 4: shim_monitor_signals (Signal Tracking)
**What it does:** Monitors crash risk signals

**Test command:**
```
Monitor crash signals with SHIM
```

**Expected output:**
- Crash risk: (safe/warning/danger)
- Risk factors: (array of detected risks)
- Needs checkpoint: (boolean)
- Signal metrics:
  - Context window usage
  - Message count
  - Tool call count
  - Session duration
  - Tool failure rate

**What this verifies:**
- ✅ SignalCollector integration
- ✅ Signal calculation logic
- ✅ Risk assessment working
- ✅ Signal history saved

---

### Test 5: shim_check_recovery (Resume Detection)
**What it does:** Checks for incomplete previous session

**Test command:**
```
Check if there's a SHIM session to recover
```

**Expected output:**
- Recovery available: false (no crashes yet)
- Session ID being checked
- Confidence score
- Interruption reason: (if applicable)

**What this verifies:**
- ✅ ResumeDetector integration
- ✅ Checkpoint query logic
- ✅ Resume prompt generation (if needed)
- ✅ Recovery detection working

---

### Test 6: shim_analyze_code (Code Analysis)
**What it does:** Analyzes code quality in specified directory

**Test command:**
```
Analyze code quality in D:/SHIM/src/core
```

**Expected output:**
- Files analyzed: (count)
- Total LOC: (line count)
- Average complexity: (number)
- Issues found: (array of code smells)
- Recommendations: (improvement suggestions)
- Elapsed time

**What this verifies:**
- ✅ CodeAnalyzer integration
- ✅ AST parsing working
- ✅ Complexity calculation
- ✅ Issue detection logic

---

## ✅ TESTING CHECKLIST

After restart, test each tool and check off:

- [ ] shim_session_status → Basic communication ✅
- [ ] shim_force_checkpoint → Database write ✅
- [ ] shim_auto_checkpoint → Logic + DB ✅
- [ ] shim_monitor_signals → Signal tracking ✅
- [ ] shim_check_recovery → Resume detection ✅
- [ ] shim_analyze_code → Code analysis ✅

**All tests passing = SHIM MCP fully operational** 🎉

---

## 🔍 VERIFICATION STEPS

### After Testing, Verify:

1. **Database File Created**
   - Path: `D:\SHIM\data\shim.db`
   - Check: File exists and has size > 0

2. **Checkpoint Count Increases**
   - Run: shim_session_status
   - Create: shim_force_checkpoint
   - Verify: checkpoint_count incremented

3. **Signal Snapshots Saved**
   - Run: shim_monitor_signals
   - Check: signal_snapshot_count > 0 in session_status

4. **No Errors in Tool Responses**
   - All tools return success: true
   - No error messages
   - No runtime exceptions

---

## 🐛 TROUBLESHOOTING

### Issue: SHIM tools not appearing
**Solution:**
1. Verify config file saved correctly
2. Restart Claude Desktop completely (quit and reopen)
3. Check for JSON syntax errors in config

### Issue: "SQLITE_BUSY" or "SQLITE_CANTOPEN" errors
**Solution:**
1. Check `D:\SHIM\data\` directory exists
2. Verify `shim.db` file permissions
3. Ensure no other process has database locked
4. Restart Claude Desktop

### Issue: Tool returns error
**Solution:**
1. Check console output (stderr) for details
2. Verify database file exists and is writable
3. Run `npm run build` to ensure latest code compiled
4. Check handler-specific logs in console

### Issue: Checkpoint not created
**Solution:**
1. Check auto-checkpoint criteria (needs sufficient progress)
2. Verify database write permissions
3. Use force_checkpoint to test database write directly
4. Check session_status to see if checkpoint was actually saved

---

## 📊 EXPECTED BEHAVIOR

### First Use (Clean Database)
- session_status: checkpoint_count = 0
- check_recovery: recovery_available = false
- monitor_signals: crash_risk = safe (new session)

### After Creating Checkpoint
- session_status: checkpoint_count = 1
- check_recovery: still false (no interruption)
- Last checkpoint timestamp shown

### After Multiple Checkpoints
- checkpoint_count increments
- Time since last checkpoint shown
- Signal snapshots accumulate

### After Simulated Crash
(For future testing - requires manual database manipulation)
- check_recovery: recovery_available = true
- Resume prompt generated
- Last checkpoint details shown

---

## 🎓 TOOL USAGE TIPS

### shim_session_status
**Use when:**
- Want overview of SHIM state
- Checking if checkpoints are being created
- Verifying session is active
- Debugging issues

**Frequency:** On-demand

### shim_force_checkpoint
**Use when:**
- Before risky operations
- User explicitly asks to save state
- Testing checkpoint creation
- Manual backup needed

**Frequency:** Rare (manual only)

### shim_auto_checkpoint
**Use when:**
- Background operation (called automatically)
- Silent checkpointing desired
- Progress updates available
- Regular save points needed

**Frequency:** Every 3-5 tool calls (automatic)

### shim_monitor_signals
**Use when:**
- Want to check crash risk
- Debugging performance issues
- Analyzing session health
- Preemptive checkpoint trigger

**Frequency:** On-demand or periodic

### shim_check_recovery
**Use when:**
- Session startup
- After crash/interruption
- User asks "can we continue"
- Recovery needed

**Frequency:** Once per session startup

### shim_analyze_code
**Use when:**
- Code quality review needed
- Finding improvement opportunities
- Technical debt assessment
- Refactoring planning

**Frequency:** On-demand

---

## 📝 INTEGRATION WORKFLOWS

### Workflow 1: Safe Work Session
```
1. Start session
2. check_recovery → If recovery available, show prompt
3. Work on tasks...
4. auto_checkpoint every 3-5 tools
5. monitor_signals periodically
6. End session
```

### Workflow 2: Before Risky Operation
```
1. force_checkpoint ("Before major refactor")
2. Perform risky operation
3. If successful: Continue
4. If failed: check_recovery → Restore from checkpoint
```

### Workflow 3: Code Quality Check
```
1. analyze_code (directory)
2. Review issues
3. Fix high-priority items
4. force_checkpoint ("Code quality improvements")
5. Re-analyze to verify
```

### Workflow 4: Recovery After Crash
```
1. Restart Claude Desktop
2. check_recovery → Shows recovery available
3. Display resume prompt to user
4. User confirms restoration
5. Continue from last checkpoint
```

---

## 🎯 SUCCESS CRITERIA

### MCP Integration Successful When:
✅ All 6 tools appear in Claude Desktop  
✅ All tools execute without errors  
✅ Database operations succeed  
✅ Checkpoints persist correctly  
✅ Signal monitoring tracks metrics  
✅ Recovery detection works  
✅ Code analysis produces results  

### Production Ready When:
✅ Tools tested end-to-end  
✅ No blocking issues  
✅ Documentation complete  
✅ User can use tools independently  

---

**Configuration Status:** Complete ✅  
**Next Action:** Restart Claude Desktop  
**Testing Time:** 15-20 minutes  
**Confidence:** Very High

---

*Last Updated: January 12, 2026, 10:05 AM*  
*Status: Configured - Pending Restart*  
*Stage: 3 (Testing Ready)*
