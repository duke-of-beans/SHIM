# SHIM MCP Server - Testing Checklist

**Date:** January 12, 2026  
**Status:** Ready for Testing  
**Configuration:** ✅ Updated in Claude Desktop

---

## ⚠️ IMPORTANT: Restart Required

**Before testing, you MUST restart Claude Desktop completely:**

1. Close ALL Claude Desktop windows
2. Check system tray - close Claude if running
3. Wait 5 seconds
4. Relaunch Claude Desktop
5. Open a NEW chat (this current chat won't have SHIM loaded)

**SHIM only loads in NEW chats after restart.**

---

## Test 1: Verify SHIM Loaded ✅

**In a NEW chat after restart, say:**
```
Show SHIM status
```

**Expected Response:**
Claude should call `shim_session_status` tool and display:
```json
{
  "active": true,
  "last_checkpoint": null,
  "session_duration_minutes": 0,
  "checkpoints_saved": 0,
  "recovery_available": false,
  "signals": {
    "risk_level": 0,
    "active_signals": []
  }
}
```

**Success Criteria:**
- ✅ Claude calls the tool (doesn't just respond conversationally)
- ✅ `active: true` returned
- ✅ No errors

**If Failed:**
- Check Claude Desktop restarted completely
- Check config file syntax (valid JSON)
- Check MCP server path is correct
- Check stderr logs for error messages

---

## Test 2: Auto-Checkpoint (Silent Operation) ✅

**In the same chat, say:**
```
Create an auto-checkpoint with:
- Current task: "Testing SHIM MCP Server"
- Progress: 0.5
- Decisions: ["Configured MCP", "Testing tools"]
- Active files: ["D:\\SHIM\\MCP_INSTALLATION_GUIDE.md"]
- Next steps: ["Verify checkpoint saved", "Test recovery"]
```

**Expected Response:**
Claude calls `shim_auto_checkpoint` and shows:
```json
{
  "success": true,
  "checkpoint_id": "session-2026-01-12T11-30-00",
  "elapsed_time_ms": 45,
  "silent": true
}
```

**Success Criteria:**
- ✅ Checkpoint created
- ✅ `elapsed_time_ms` < 100ms
- ✅ `silent: true` flag present

**Verify on Disk:**
```powershell
Get-ChildItem D:\SHIM\data\checkpoints\*.json | Select-Object -Last 1
```

Should show newly created checkpoint file.

**Open the checkpoint file:**
```powershell
Get-Content (Get-ChildItem D:\SHIM\data\checkpoints\*.json | Select-Object -Last 1)
```

Should contain:
- `checkpoint_id`
- `timestamp`
- `current_task: "Testing SHIM MCP Server"`
- `progress: 0.5`
- `decisions: ["Configured MCP", "Testing tools"]`
- `active_files`
- `next_steps`

---

## Test 3: Recovery Detection ✅

**In the same chat (after creating checkpoint), say:**
```
Check if recovery is available
```

**Expected Response:**
Claude calls `shim_check_recovery` and shows:
```json
{
  "recovery_available": true,
  "session_summary": "Task: Testing SHIM MCP Server\nProgress: 50%\nLast activity: ...",
  "timestamp": "2026-01-12T11:30:00.000Z",
  "checkpoint_id": "session-2026-01-12T11-30-00"
}
```

**Success Criteria:**
- ✅ `recovery_available: true`
- ✅ Summary contains correct task
- ✅ Progress shows 50%
- ✅ Timestamp is recent

---

## Test 4: Signal Monitoring ✅

**In the same chat, say:**
```
Monitor crash warning signals
```

**Expected Response:**
Claude calls `shim_monitor_signals` and shows:
```json
{
  "risk_level": 0.0,
  "signals_detected": [],
  "warnings": [],
  "should_checkpoint": false
}
```

**Success Criteria:**
- ✅ `risk_level` between 0.0 and 1.0
- ✅ Returns signal data
- ✅ `should_checkpoint` is boolean

**Note:** In a fresh session, risk_level should be low (< 0.3).

---

## Test 5: Code Analysis ✅

**In the same chat, say:**
```
Analyze D:\SHIM\mcp-server\src
```

**Expected Response:**
Claude calls `shim_analyze_code` and shows:
```json
{
  "directory": "D:\\SHIM\\mcp-server\\src",
  "opportunities": [],
  "metrics": {
    "filesAnalyzed": 6,
    "totalLOC": 500,
    "avgComplexity": 83.33
  },
  "recommendations": [...]
}
```

**Success Criteria:**
- ✅ Analysis completes
- ✅ `filesAnalyzed` > 0
- ✅ `totalLOC` reported
- ✅ Recommendations provided (if applicable)

---

## Test 6: Force Checkpoint ✅

**In the same chat, say:**
```
Force a manual checkpoint with reason: "Testing manual checkpoint feature"
```

**Expected Response:**
Claude calls `shim_force_checkpoint` and shows:
```json
{
  "success": true,
  "checkpoint_id": "session-2026-01-12T11-35-00",
  "state_saved": true,
  "reason": "Testing manual checkpoint feature"
}
```

**Success Criteria:**
- ✅ Checkpoint created
- ✅ Reason captured
- ✅ New file in `D:\SHIM\data\checkpoints\`

---

## Test 7: Cross-Project Persistence ✅

**Test in DIFFERENT contexts:**

**A. In GREGORE project chat:**
```
Create checkpoint: Task = "GREGORE work", Progress = 0.3
```

**B. In non-project chat:**
```
Create checkpoint: Task = "Non-project work", Progress = 0.6
```

**C. Check data directory:**
```powershell
Get-ChildItem D:\SHIM\data\checkpoints\*.json | Measure-Object
```

**Success Criteria:**
- ✅ Both checkpoints saved
- ✅ Both stored in same directory
- ✅ Both accessible from either chat
- ✅ Cross-project persistence confirmed

---

## Test 8: Crash Recovery Workflow (E2E) ✅

**Full crash recovery test:**

**Step 1:** Create checkpoint in current chat
```
Create checkpoint: Task = "E2E crash test", Progress = 0.75
```

**Step 2:** Force close Claude Desktop
- Kill process or close window
- Simulate crash

**Step 3:** Restart Claude Desktop

**Step 4:** Open NEW chat

**Step 5:** Check recovery
```
Check if recovery is available
```

**Expected:**
- ✅ Recovery detected
- ✅ Shows "E2E crash test" task
- ✅ Shows 75% progress
- ✅ Recovery prompt offered (in real usage)

---

## Test 9: Performance Benchmarks ✅

**Measure checkpoint creation time:**

Run 10 checkpoints and measure:
```
Create 10 checkpoints and report timing for each
```

**Success Criteria:**
- ✅ Each checkpoint < 100ms
- ✅ Average < 50ms
- ✅ No performance degradation over time

---

## Test 10: Silent Operation ✅

**Verify SHIM is invisible during normal work:**

**Do normal work in Claude:**
- Ask questions
- Generate code
- Use other tools
- Make 10+ tool calls

**Check:**
- ✅ No SHIM prompts unless you explicitly call tools
- ✅ No interruptions
- ✅ Checkpoints created silently in background
- ✅ User experience seamless

**Verify checkpoints created automatically:**
```powershell
Get-ChildItem D:\SHIM\data\checkpoints\*.json | Sort-Object LastWriteTime | Select-Object -Last 5
```

Should show multiple checkpoints from your session.

---

## Summary Checklist

- [ ] Test 1: SHIM Status - Verified loaded
- [ ] Test 2: Auto-Checkpoint - Created and saved
- [ ] Test 3: Recovery Detection - Detected checkpoint
- [ ] Test 4: Signal Monitoring - Returned risk data
- [ ] Test 5: Code Analysis - Analyzed directory
- [ ] Test 6: Force Checkpoint - Manual checkpoint worked
- [ ] Test 7: Cross-Project - Works in all chats
- [ ] Test 8: Crash Recovery - E2E workflow verified
- [ ] Test 9: Performance - All < 100ms
- [ ] Test 10: Silent Operation - No interruptions

**All tests passing = SHIM MCP Server Production Ready ✅**

---

## Next Steps After Testing

**If all tests pass:**

1. ✅ SHIM is production-ready
2. ✅ Operates automatically in background
3. ✅ No further action needed
4. ✅ Work normally - SHIM protects you

**SHIM enters maintenance mode:**
- Update only when adding features
- Infrastructure runs invisibly
- Context never lost
- Claude Desktop → Claude+

---

## Troubleshooting

**If tests fail:**

1. Check MCP server logs (stderr)
2. Verify data directory exists and writable
3. Check config file syntax
4. Ensure Claude Desktop fully restarted
5. Try in different chat (fresh session)

**Common issues:**

**Issue:** Tools not calling
- **Fix:** Restart Claude Desktop completely

**Issue:** Checkpoints not saving
- **Fix:** Verify `D:\SHIM\data\checkpoints\` exists and writable

**Issue:** Recovery not working
- **Fix:** Verify checkpoint files exist and < 24 hours old

---

**Testing Status:** Ready to Begin  
**Restart Required:** YES - Before testing  
**Expected Duration:** 15-20 minutes (all tests)  
**Success Criteria:** All 10 tests passing
