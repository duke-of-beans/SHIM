# CRASH PREVENTION INTEGRATION PLAN

## 🎯 Problem Statement

**Current State**:
- SHIM has crash prevention (checkpointing, signal collection)
- It only works IN the SHIM project
- GREGORE chats can still crash with context loss

**Goal**: Make crash prevention work in GREGORE (and any project)

---

## 📦 What Needs Integration

### Core SHIM Crash Prevention Components

From SHIM project that need to be in GREGORE:

```
D:\SHIM\src\
├─ core\
│  ├─ CheckpointRepository.ts      # Saves session state
│  ├─ SignalCollector.ts           # Detects crash signals
│  └─ SignalHistoryRepository.ts   # Tracks patterns
├─ prevention\
│  └─ CheckpointManager.ts         # Orchestrates checkpoints
└─ types\
   └─ index.ts                     # TypeScript types
```

**Total**: ~2,000 LOC of crash prevention code

---

## 🚀 Integration Options

### Option A: **NPM Package** (Recommended)

**Publish SHIM as npm package**:
```bash
# In SHIM
npm publish

# In GREGORE
npm install shim
```

**Use in GREGORE**:
```typescript
import { CheckpointManager, SignalCollector } from 'shim';

const checkpoint = new CheckpointManager();
checkpoint.save({ currentTask, progress, decisions });
```

**Pros**:
- ✅ Clean dependency
- ✅ Easy updates (npm update)
- ✅ Works in any project
- ✅ Versioned releases

**Cons**:
- ⚠️ Requires npm setup
- ⚠️ Public or private registry needed

---

### Option B: **Git Submodule**

**Add SHIM as submodule**:
```bash
cd D:\GREGORE
git submodule add D:\SHIM lib/shim
```

**Use in GREGORE**:
```typescript
import { CheckpointManager } from '../lib/shim/src/core';
```

**Pros**:
- ✅ No npm needed
- ✅ Git tracks version

**Cons**:
- ⚠️ Submodule management complexity
- ⚠️ Path dependencies

---

### Option C: **Shared Library** (Simplest)

**Create shared crash prevention library**:
```
D:\SharedLibs\
└─ crash-prevention\
   ├─ CheckpointManager.ts
   ├─ SignalCollector.ts
   └─ index.ts
```

**Use in both SHIM and GREGORE**:
```typescript
import { CheckpointManager } from 'D:/SharedLibs/crash-prevention';
```

**Pros**:
- ✅ Simple
- ✅ No npm/git complexity
- ✅ Direct file access

**Cons**:
- ⚠️ Absolute paths
- ⚠️ No versioning

---

### Option D: **MCP Server** (Most Powerful)

**Create SHIM MCP Server**:
```
Desktop Commander MCP → Crash prevention
SHIM MCP             → Crash prevention + Code analysis
```

**Use from ANY project**:
```typescript
// Claude calls MCP tool automatically
shim_checkpoint({ currentTask, progress });
shim_recover_session({ projectId });
```

**Pros**:
- ✅ Universal (all projects)
- ✅ No code integration needed
- ✅ Works via Claude tools
- ✅ Cross-language (any project type)

**Cons**:
- ⚠️ Requires MCP server development
- ⚠️ More complex setup

---

## 🎯 RECOMMENDED APPROACH

**Phase 1**: Option D (MCP Server) ⭐ **BEST LONG-TERM**

**Why**:
- Works in ALL projects (GREGORE, FINEPRINT, any future project)
- No code changes needed per project
- Claude can use it via tools
- Language-agnostic (works with Python, Rust, anything)

**Implementation**:
1. Create SHIM MCP server (2-3 hours)
2. Expose tools:
   - `shim_checkpoint` - Save session state
   - `shim_recover` - Restore session state
   - `shim_analyze` - Code analysis (already works)
   - `shim_status` - Check what's active
3. Install in Claude Desktop
4. Works everywhere automatically

---

## 📋 Verification Mechanism

After integration, you'll have:

### Visual Status Check

**User says**: "What's active?" or "Status check"

**Claude responds**:
```
┌─────────────────────────────────────┐
│ 🚀 SESSION STATUS                   │
├─────────────────────────────────────┤
│ Project: GREGORE                    │
│ Crash Prevention: ✅ Active         │
│ Last Checkpoint: 2 minutes ago      │
│ Signal Monitoring: ✅ Running       │
│ Code Analysis: ✅ Available         │
└─────────────────────────────────────┘
```

### Automatic Checkpointing

**Every 3-5 tool calls**:
```
[Auto-checkpoint saved - 3min elapsed]
```

### Crash Recovery Test

**Simulate crash**:
1. Start GREGORE chat
2. Work for 10 minutes
3. Force close Claude Desktop
4. Restart Claude Desktop
5. New chat should say:
```
⚠️ Detected incomplete session from 5 minutes ago.
Restore context? [Yes/No]
```

---

## 🎓 What You Need To Decide

### Question 1: Integration Method

Which option do you prefer?
- **A**: NPM package (versioned, clean)
- **B**: Git submodule (git-tracked)
- **C**: Shared library (simple)
- **D**: MCP server (universal, powerful) ⭐ **RECOMMENDED**

### Question 2: Visual Feedback

How verbose should Claude be?
- **Option 1**: Full bootstrap display every chat (verbose)
- **Option 2**: One-line status every chat (concise)
- **Option 3**: Silent unless asked (minimal)

### Question 3: Automatic Checkpointing

How should Claude checkpoint?
- **Auto**: Every 3-5 tool calls (no user action needed)
- **Prompted**: Claude asks "Should I checkpoint?" every 10 minutes
- **Manual**: User says "Checkpoint" when they want

---

## ⚡ Quick Win: Manual Checkpointing TODAY

While we decide on integration method, you can use manual checkpointing NOW:

**In any GREGORE chat, say**:
```
"Save checkpoint to D:\GREGORE\checkpoints\session-[timestamp].json"
```

**Claude will**:
1. Capture current state (task, progress, decisions, files)
2. Save to JSON file
3. Confirm with summary

**To recover**:
```
"Load checkpoint from D:\GREGORE\checkpoints\session-[timestamp].json"
```

**This works TODAY** with just Desktop Commander (no integration needed).

---

## 🚀 Next Steps

**Tell me**:
1. Which integration method? (A/B/C/D)
2. How verbose at session start? (1/2/3)
3. How to handle checkpointing? (Auto/Prompted/Manual)

**Then I'll**:
1. Build the integration (MCP server if Option D)
2. Add visual bootstrap
3. Test crash recovery
4. Document usage

**Result**: You'll KNOW when crash prevention is working, and GREGORE will be crash-resistant.

---

**TL;DR**: 
- Instructions ≠ Crash prevention code
- Need actual integration (MCP server recommended)
- Visual feedback YES (you choose verbosity)
- Verification mechanism built-in
- Can use manual checkpointing TODAY while we build proper integration

What do you want to tackle first?
