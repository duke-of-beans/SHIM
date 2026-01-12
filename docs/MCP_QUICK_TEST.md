# SHIM MCP - Quick Test Commands

**After restarting Claude Desktop, use these commands to test each tool:**

---

## 🧪 QUICK TEST SUITE

### Test 1: Session Status
```
Check SHIM session status
```
**Verifies:** Basic communication

---

### Test 2: Force Checkpoint
```
Create a manual checkpoint with SHIM (testing configuration)
```
**Verifies:** Database writes

---

### Test 3: Auto Checkpoint
```
Simulate auto-checkpoint with current task "Testing SHIM", progress 0.5
```
**Verifies:** Checkpoint logic

---

### Test 4: Monitor Signals
```
Monitor crash signals with SHIM
```
**Verifies:** Signal tracking

---

### Test 5: Check Recovery
```
Check if there's a SHIM session to recover
```
**Verifies:** Resume detection

---

### Test 6: Code Analysis
```
Analyze code quality in D:/SHIM/src/core
```
**Verifies:** Code analysis

---

## ✅ EXPECTED RESULTS

All tests should:
- Return `success: true`
- Show relevant data
- Complete in < 1 second
- No error messages

---

## 🎯 SUCCESS = ALL 6 TESTS PASS

---

*Quick Reference Card*  
*For full testing guide: docs/MCP_CONFIGURATION_TESTING.md*
