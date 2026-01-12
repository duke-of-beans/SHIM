# SHIM MCP SERVER - CLAUDE+ INFRASTRUCTURE

**Vision**: SHIM runs invisibly in background of ALL Claude chats, providing crash prevention and intelligence augmentation automatically.

---

## 🎯 Design Principles

### 1. **Invisible Operation**
- Auto-starts when Claude Desktop starts
- No user configuration needed
- No manual invocation required
- Silent unless there's value to show

### 2. **Zero-Friction**
- Auto-checkpointing every 3-5 minutes
- Auto-recovery on crash
- Auto-signal detection
- No "remember to checkpoint" prompts

### 3. **Always Available**
- Works in project chats (GREGORE, FINEPRINT)
- Works in non-project chats
- Works across chat boundaries
- Persistent across sessions

### 4. **Self-Healing**
- Detects crashes before they happen
- Recovers automatically
- Learns from failures
- Gets better over time

---

## 📦 MCP Server Architecture

### Server Name: `shim-mcp`

### Tools Exposed:

```typescript
// AUTOMATIC TOOLS (Claude uses without user knowing)

1. shim_auto_checkpoint()
   - Called every 3-5 Claude tool calls
   - Saves current session state
   - Returns: { success, checkpoint_id, elapsed_time }
   - Silent operation (no user-facing output)

2. shim_check_recovery()
   - Called at session start
   - Detects incomplete previous session
   - Returns: { recovery_available, session_summary, timestamp }
   - Shows recovery option to user IF detected

3. shim_monitor_signals()
   - Called automatically during session
   - Detects crash warning signs
   - Returns: { risk_level, signals_detected }
   - Triggers preemptive checkpoint if high risk

// USER-INVOKED TOOLS (Optional, for power users)

4. shim_analyze_code(directory)
   - Code quality analysis
   - Called when user asks "analyze this code"
   - Returns: { opportunities, metrics, recommendations }

5. shim_session_status()
   - Shows current SHIM status
   - Called when user asks "what's active?" or "status"
   - Returns: { checkpoints, signals, recovery_available }

6. shim_force_checkpoint()
   - Manual checkpoint
   - Called when user says "save checkpoint"
   - Returns: { checkpoint_id, state_saved }
```

---

## 🔄 Automatic Workflow

### Session Start
```
1. Claude Desktop starts
2. SHIM MCP loads automatically
3. shim_check_recovery() called
4. IF recovery available:
   → Show user: "⚠️ Resume previous session? [Yes/No]"
   → User says yes → Restore context
5. ELSE:
   → Normal chat starts
   → SHIM monitoring begins
```

### During Session
```
Every 3-5 tool calls:
  → shim_auto_checkpoint() (silent)
  → State saved to D:\SHIM\data\checkpoints\

Every 2 minutes:
  → shim_monitor_signals() (silent)
  → IF risk_level > 0.7:
    → Force immediate checkpoint
    → Warn user: "Heavy processing detected. Checkpoint saved."
```

### On Crash
```
1. Claude crashes
2. User restarts Claude
3. New session starts
4. shim_check_recovery() detects incomplete session
5. Show recovery option
6. User accepts → Full context restored
```

---

## 💾 Data Storage

### Directory Structure
```
D:\SHIM\data\
├─ checkpoints\
│  ├─ session-2026-01-12-15-30.json
│  ├─ session-2026-01-12-15-35.json
│  └─ session-2026-01-12-15-40.json (every 5 min)
│
├─ signals\
│  └─ signal-history.db (SQLite)
│
└─ recovery\
   └─ active-sessions.json (currently running)
```

### Checkpoint Format
```json
{
  "checkpoint_id": "session-2026-01-12-15-35",
  "timestamp": "2026-01-12T15:35:00Z",
  "project": "GREGORE",
  "current_task": "Implementing EPIC 42",
  "progress": 0.65,
  "decisions": [
    "Use BullMQ for job queue",
    "Redis for caching"
  ],
  "active_files": [
    "D:\\GREGORE\\src\\queue\\JobProcessor.ts"
  ],
  "tool_calls": 12,
  "duration_minutes": 25,
  "next_steps": [
    "Write tests for JobProcessor",
    "Deploy queue infrastructure"
  ],
  "conversation_summary": "Building job queue system with BullMQ..."
}
```

---

## 🎛️ User-Facing Behavior

### Completely Silent Operation (Default)

**User perspective**:
- Works in Claude normally
- Doesn't notice checkpointing
- Doesn't see SHIM at all
- Just experiences: "Claude doesn't lose context anymore"

### Optional Status Display

**User asks**: "What's active?" or "Status"

**Claude responds**:
```
✅ SHIM Active
Last checkpoint: 2 minutes ago
Session duration: 47 minutes
12 checkpoints saved
Recovery available: Yes (from 3 hours ago)
```

### Crash Recovery

**Only shown when relevant**:
```
⚠️ Detected incomplete session from 3 hours ago:
- Project: GREGORE
- Task: Implementing EPIC 42
- Progress: 65%
- Last activity: Writing JobProcessor tests

Resume? [Yes/No]
```

---

## 🔧 MCP Server Implementation

### File: `D:\SHIM\mcp-server\src\index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CheckpointManager } from './checkpoint-manager.js';
import { SignalMonitor } from './signal-monitor.js';
import { RecoveryService } from './recovery-service.js';

const server = new Server(
  {
    name: 'shim-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize SHIM services
const checkpoint = new CheckpointManager();
const signals = new SignalMonitor();
const recovery = new RecoveryService();

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'shim_auto_checkpoint',
      description: 'Automatically save session state (called by Claude)',
      inputSchema: {
        type: 'object',
        properties: {
          current_task: { type: 'string' },
          progress: { type: 'number' },
          decisions: { type: 'array', items: { type: 'string' } },
          active_files: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    {
      name: 'shim_check_recovery',
      description: 'Check for incomplete previous session',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'shim_monitor_signals',
      description: 'Monitor crash warning signals',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'shim_analyze_code',
      description: 'Analyze code quality',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string' },
        },
        required: ['directory'],
      },
    },
    {
      name: 'shim_session_status',
      description: 'Show current SHIM status',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'shim_auto_checkpoint':
      return await checkpoint.save(request.params.arguments);
    
    case 'shim_check_recovery':
      return await recovery.check();
    
    case 'shim_monitor_signals':
      return await signals.monitor();
    
    case 'shim_analyze_code':
      return await analyzeCode(request.params.arguments.directory);
    
    case 'shim_session_status':
      return await getStatus();
    
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SHIM MCP server running');
}

main();
```

---

## 📝 Claude Desktop Configuration

### File: `claude_desktop_config.json`

Add SHIM MCP:

```json
{
  "mcpServers": {
    "shim": {
      "command": "node",
      "args": ["D:\\SHIM\\mcp-server\\dist\\index.js"]
    }
  }
}
```

**That's it!** SHIM auto-loads on Claude Desktop start.

---

## 🎯 Implementation Plan

### Phase 1: Core MCP Server (4-6 hours)
- [x] Create MCP server structure
- [ ] Implement auto-checkpoint tool
- [ ] Implement recovery check tool
- [ ] Implement signal monitor tool
- [ ] Test with Claude Desktop

### Phase 2: Auto-Invocation (2-3 hours)
- [ ] Configure Claude to call checkpoint every 3-5 tool calls
- [ ] Configure Claude to check recovery at session start
- [ ] Configure silent operation (no user-facing output)

### Phase 3: Intelligence Layer (3-4 hours)
- [ ] Integrate code analysis from existing SHIM
- [ ] Add session status tool
- [ ] Add manual checkpoint tool

### Phase 4: Testing & Polish (2 hours)
- [ ] Test crash recovery flow
- [ ] Test cross-project persistence
- [ ] Test signal detection
- [ ] Documentation

**Total**: ~12 hours development

---

## ✅ Success Criteria

### User Experience
- ✅ User works in Claude (any project, any chat)
- ✅ Claude never loses context (auto-recovery)
- ✅ No manual checkpointing needed
- ✅ No SHIM visibility (unless asked)
- ✅ "Just works™"

### Technical Validation
- ✅ MCP server auto-loads on Claude start
- ✅ Auto-checkpoint every 3-5 tool calls
- ✅ Recovery option shown after crash
- ✅ Checkpoints persist across sessions
- ✅ Works in all projects (GREGORE, FINEPRINT, etc.)

### SHIM Project Status
- ✅ No further work needed (maintenance only)
- ✅ Infrastructure "disappears" into background
- ✅ Updates only when enhancing capabilities

---

## 🚀 After Implementation

### What You'll Experience

**Day 1**: 
- Install MCP server
- Restart Claude Desktop
- SHIM loads silently

**Day 2+**:
- Work normally in Claude
- Don't think about checkpoints
- Don't think about crashes
- Context just persists

**If Claude crashes**:
- Restart Claude
- See: "Resume previous session?"
- Click yes
- Continue where you left off

**SHIM project**:
- Sits in D:\SHIM
- Rarely touched
- Only update when adding new capabilities
- Infrastructure layer

---

## 🎓 This Is The Vision

**SHIM = Claude+**

Not a tool. Not a feature. **Infrastructure.**

Like how your OS manages memory - you don't think about it, it just works.

**Questions**:
1. Should I build the MCP server now? (12 hours)
2. Want me to start with Phase 1 (core)?
3. Or would you prefer to review the architecture first?

**After this is done**:
- SHIM project becomes maintenance-only
- You never manually checkpoint
- Claude just becomes more reliable
- Infrastructure "disappears"

**This is Claude+.** Ready to build it?
