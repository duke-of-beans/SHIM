# SHIM: Platform Limitations Matrix

**Version:** 1.0.0  
**Created:** January 9, 2026  
**Purpose:** Complete feasibility assessment of SHIM features given Claude Desktop/API constraints

---

## Executive Summary

SHIM's architecture must work within Claude Desktop's constraints. Some features are fully achievable with current primitives; others require workarounds; a few would benefit from Anthropic partnership.

**Key Finding:** All four SHIM pillars are achievable WITHOUT Anthropic partnership, but some require creative engineering.

---

## Platform Capability Assessment

### What We CAN Access (MCP Primitives)

| Capability | Access Level | Notes |
|------------|--------------|-------|
| File system read/write | Full | Via MCP filesystem server |
| Database operations | Full | SQLite via custom MCP |
| Network requests | Full | HTTP/HTTPS via fetch MCP |
| Process execution | Full | Shell commands via Desktop Commander |
| Redis/BullMQ | Full | Via custom MCP server |
| Environment variables | Full | At MCP server startup |
| Conversation context | Partial | In-context only (no API to extract) |
| Tool call history | Full | MCP receives all tool calls |
| User preferences | Partial | Via userPreferences tag if configured |

### What We CANNOT Access

| Capability | Constraint | Impact | Workaround |
|------------|------------|--------|------------|
| Context window size | No API to query | Can't know exactly when crash imminent | Heuristic estimation |
| Token count | No real-time count | Same as above | Count ourselves via tiktoken |
| Conversation history | No extraction API | Can't save Claude's responses | Save at tool level only |
| Platform rate limits | Opaque | Can't predict throttling | Track patterns over time |
| Model being used | Not exposed | Can't optimize for model | Assume worst case |
| Other chat instances | Isolated | No native coordination | External coordination via Redis |

---

## Feature Feasibility Analysis

### Pillar 1: Crash Prevention & Recovery

| Feature | Feasibility | Method | Constraints |
|---------|-------------|--------|-------------|
| Token counting | ✅ HIGH | tiktoken library in MCP | Approximation only |
| Message counting | ✅ HIGH | MCP tracks tool calls | Misses non-tool messages |
| Session duration tracking | ✅ HIGH | Timestamps at each tool call | Simple |
| Checkpoint serialization | ✅ HIGH | Write to SQLite/filesystem | Tool state only, not Claude's thoughts |
| Checkpoint restoration | ✅ HIGH | MCP provides context on startup | Limited by context window |
| Crash prediction | ⚠️ MEDIUM | Heuristics from observable signals | No ground truth, must tune |
| Auto-pause before crash | ⚠️ MEDIUM | MCP returns warning, Claude must honor | Depends on Claude cooperation |
| Instant resume | ✅ HIGH | Serialize state, reload on next session | Works well |

**Overall: FULLY ACHIEVABLE** - All crash prevention features can be built with current primitives.

### Pillar 2: Multi-Chat Coordination

| Feature | Feasibility | Method | Constraints |
|---------|-------------|--------|-------------|
| Shared database | ✅ HIGH | Redis/SQLite accessible from any MCP | Simple |
| Job queues | ✅ HIGH | BullMQ works perfectly | Battle-tested |
| Distributed locks | ✅ HIGH | Redis SETNX | Standard pattern |
| Cross-chat messaging | ✅ HIGH | Redis pub/sub | Works |
| Supervisor pattern | ✅ HIGH | One chat polls queue, dispatches | Needs human to start |
| Worker pattern | ✅ HIGH | Chat claims job, executes, reports | Works |
| Context sharing | ⚠️ MEDIUM | Save/load serialized context | Limited by context window |
| Real-time coordination | ⚠️ LOW | No push notifications | Must poll |

**Key Constraint:** Claude Desktop requires human to initiate each chat. No API to programmatically spawn chats.

**Workaround:** 
1. User opens multiple chat windows manually
2. Each window connects to same SHIM backend
3. Backend coordinates via Redis
4. User can minimize windows - they continue working

**Overall: ACHIEVABLE WITH USER SETUP** - Works but requires user to open multiple windows.

### Pillar 3: Self-Evolution Engine

| Feature | Feasibility | Method | Constraints |
|---------|-------------|--------|-------------|
| Pattern logging | ✅ HIGH | MCP logs all interactions | Easy |
| Success/failure tracking | ✅ HIGH | Track outcomes | Works |
| Replay analysis | ✅ HIGH | Store and analyze later | Works |
| Prompt optimization | ⚠️ MEDIUM | A/B test variations | Needs volume |
| Automatic tool selection | ⚠️ MEDIUM | Learn patterns | Training data needed |
| Self-modification | ⚠️ LOW | Can update MCP code | Risky |
| Cross-session learning | ✅ HIGH | Persistent database | Works |

**Overall: ACHIEVABLE** - Core features work; advanced optimization needs data.

### Pillar 4: Autonomous Operation

| Feature | Feasibility | Method | Constraints |
|---------|-------------|--------|-------------|
| Background execution | ⚠️ MEDIUM | Chat runs while user away | Rate limits apply |
| Long-running tasks | ⚠️ MEDIUM | Task queue with checkpoints | Must handle crashes |
| Human-in-loop approval | ✅ HIGH | Queue results for review | Works |
| Parallel execution | ✅ HIGH | Multiple chats via Redis | Works |
| Overnight processing | ⚠️ LOW | Rate limits, crashes | Needs robust recovery |
| API-based execution | ✅ HIGH | Use Claude API instead | Costs more |

**Key Insight:** True autonomous operation works better via Claude API than Claude Desktop. Desktop is optimized for interactive use.

**Recommended Architecture:**
- Use Claude Desktop for interactive development
- Use Claude API for autonomous background tasks
- Share context between them via SHIM database

**Overall: ACHIEVABLE VIA HYBRID** - Desktop for interactive, API for autonomous.

---

## What Would Require Anthropic Partnership

### Features Blocked Without Partnership

| Feature | Current Limitation | What Partnership Enables |
|---------|-------------------|--------------------------|
| Native crash prevention | No context window API | Real-time token count, graceful pause |
| Multi-chat spawn | Manual window creation | API to programmatically create chats |
| Cross-chat context | Isolated conversations | Native context sharing |
| Push notifications | Polling only | Real-time events |
| Custom model context | Fixed protocol | Extended context for recovery |

### Partnership Value Proposition

**What Anthropic Gets:**
1. Solved user pain point (crashes, lost context)
2. Reference implementation for session management
3. Increased user satisfaction → reduced churn
4. Data on crash patterns for platform improvement

**What SHIM Gets:**
1. Native integration (no workarounds)
2. Better crash prediction (ground truth data)
3. Programmatic multi-chat (true autonomous)
4. Competitive moat (if exclusive)

### Partnership Not Required For MVP

All core SHIM features work without Anthropic partnership. Partnership would enhance but is not blocking.

---

## MCP-Specific Limitations

### Known MCP Constraints (2025)

| Constraint | Impact | Workaround |
|------------|--------|------------|
| Tool response truncation (~700 chars in Claude Code) | Long responses cut off | Chunk responses, use temp files |
| No streaming responses | Can't show progress | Status files, polling |
| Cold start latency | First tool call slow | Keep MCP server warm |
| Memory limits | Large contexts fail | Serialize to disk |
| Rate limiting on MCP calls | Can't spam tools | Batch operations |

### MCP Architecture Recommendations

1. **Keep MCP servers stateless** - State in Redis/SQLite
2. **Use file-based handoff for large data** - Don't pass through MCP
3. **Implement heartbeat** - Detect MCP server crashes
4. **Version protocol** - Allow rolling upgrades

---

## Workaround Documentation

### Workaround 1: Context Window Estimation

**Problem:** No API to query current context window usage.

**Solution:**
```typescript
// Estimate tokens using tiktoken
import { encoding_for_model } from "tiktoken";

function estimateTokens(text: string): number {
  const enc = encoding_for_model("gpt-4"); // Approximation
  return enc.encode(text).length;
}

// Track cumulative usage
let totalTokens = 0;
function trackMessage(content: string) {
  totalTokens += estimateTokens(content);
  if (totalTokens > DANGER_THRESHOLD) {
    triggerCheckpoint();
  }
}
```

### Workaround 2: Multi-Chat Without API

**Problem:** Can't programmatically spawn chat windows.

**Solution:**
1. User opens desired number of Claude Desktop windows
2. Each window loads SHIM MCP server
3. MCP registers window with Redis (unique ID)
4. Supervisor chat assigns work via job queue
5. Worker chats poll for jobs, execute, report back

**User Experience:**
```
1. "Hey Claude, I want 5 parallel workers"
2. Claude: "Please open 4 more Claude Desktop windows. I'll coordinate."
3. User opens windows
4. Claude: "All 5 workers registered. Ready for parallel execution."
```

### Workaround 3: Crash Recovery Without Push

**Problem:** No push notification when crash is imminent.

**Solution:**
```typescript
// Checkpoint every N tool calls
let toolCallsSinceCheckpoint = 0;
const CHECKPOINT_INTERVAL = 5;

function onToolCall(tool: string, args: any) {
  toolCallsSinceCheckpoint++;
  
  if (toolCallsSinceCheckpoint >= CHECKPOINT_INTERVAL) {
    saveCheckpoint();
    toolCallsSinceCheckpoint = 0;
  }
}

// Also checkpoint on warning signs
function detectWarning(): boolean {
  return (
    totalTokens > WARNING_THRESHOLD ||
    sessionDuration > MAX_SESSION_DURATION ||
    messageCount > MAX_MESSAGES
  );
}
```

### Workaround 4: Long-Running Tasks

**Problem:** Claude Desktop sessions time out, crash.

**Solution:**
```typescript
// Break into resumable units
interface Task {
  id: string;
  steps: Step[];
  currentStep: number;
  checkpoint: any;
}

async function executeTask(task: Task) {
  for (let i = task.currentStep; i < task.steps.length; i++) {
    // Execute step
    await executeStep(task.steps[i]);
    
    // Checkpoint after each step
    task.currentStep = i + 1;
    await saveTaskCheckpoint(task);
    
    // Check if we should pause
    if (shouldPause()) {
      return { status: 'paused', task };
    }
  }
  return { status: 'complete', task };
}
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| MCP protocol changes | Medium | High | Abstract MCP layer, version protocol |
| Token estimation inaccurate | High | Medium | Conservative thresholds, tune over time |
| Redis unavailable | Low | High | Local SQLite fallback |
| Multi-chat race conditions | Medium | Medium | Distributed locks, idempotent operations |
| Checkpoint corruption | Low | High | Checksums, multiple backups |

### Platform Risks

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| Anthropic blocks MCP servers | Very Low | Critical | Open source, community pressure |
| Rate limits tighten | Medium | High | API fallback, graceful degradation |
| Claude Desktop deprecated | Low | Critical | Port to Claude Code / API |
| Competitor bundles similar | Medium | Medium | Move fast, build moat |

---

## Implementation Priority

Based on feasibility analysis, recommended order:

1. **Crash Prevention** - Fully achievable, highest user value
2. **Checkpoint/Resume** - Fully achievable, enables everything else
3. **Self-Evolution (logging)** - Easy, provides data for later
4. **Multi-Chat Coordination** - Achievable with user setup
5. **Autonomous Operation** - Hybrid approach (Desktop + API)
6. **Self-Evolution (optimization)** - Needs data from steps 1-4

---

## Conclusion

SHIM's core vision is **fully achievable** with current Claude Desktop + MCP capabilities. No Anthropic partnership required for MVP.

Key architectural decisions:
1. Use heuristics for crash prediction (no ground truth available)
2. Require user to open multiple windows for parallel execution
3. Use API for autonomous/background tasks, Desktop for interactive
4. Checkpoint aggressively, assume crashes will happen
5. Design for graceful degradation when limits hit

Partnership with Anthropic would enhance but not enable core features. Ship without partnership, negotiate from strength if successful.

---

*Last Updated: January 9, 2026*
