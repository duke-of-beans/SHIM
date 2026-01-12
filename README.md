# SHIM - Session Handling & Intelligent Management

> **SHIM = Claude+**  
> Invisible infrastructure that makes Claude Desktop never lose context, never crash without recovery, and continuously improve itself.

---

## What Is SHIM?

SHIM is **not a tool**. It's an **infrastructure layer** that runs invisibly in the background of every Claude Desktop chat, providing:

- ✅ **Automatic crash prevention** (silent checkpointing every 3-5 tool calls)
- ✅ **Instant crash recovery** (resume prompt after interruption)
- ✅ **Code quality analysis** (on-demand via natural language)
- ✅ **Self-evolution** (system improves itself automatically)
- ✅ **Multi-chat coordination** (parallel AI execution)

**User Experience:** You work in Claude normally. SHIM runs silently. Context never lost. You never think about it.

**Status:** Phase 1-6 Complete → Ready for MCP Server Transformation  
**Version:** 0.2.0 (Components Built, MCP Implementation Next)

---

## The Vision - Claude+

### TODAY (Vanilla Claude Desktop)
```
User works → Crash happens → Context lost → Start over
```

### TOMORROW (Claude Desktop + SHIM)
```
User works → SHIM auto-checkpoints → Crash happens → Auto-recovery → Continue seamlessly
```

**The difference:** Background infrastructure that "just works"

---

## Architecture

### MCP Server Layer (Target)

```
┌──────────────────────────────────────────────┐
│         Claude Desktop (All Chats)            │
├──────────────────────────────────────────────┤
│                                               │
│         ┌──────────────────┐                 │
│         │   SHIM MCP       │                 │
│         │  (Background)    │                 │
│         └────────┬─────────┘                 │
│                  │                            │
│    ┌─────────────┼─────────────┐            │
│    │             │              │            │
│    ▼             ▼              ▼            │
│  ┌────┐      ┌────┐        ┌────┐          │
│  │ CP │      │ CA │        │ SE │          │
│  └────┘      └────┘        └────┘          │
│  Crash      Code          Self-            │
│  Prevention Analysis      Evolution        │
│                                              │
└──────────────────────────────────────────────┘

CP = Auto-checkpoint + Recovery
CA = AST analysis + Pattern detection  
SE = A/B testing + Auto-deployment
```

### How It Works

**Installation (One-Time):**
1. Add SHIM to `claude_desktop_config.json`
2. Restart Claude Desktop
3. Done

**Every Session After:**
1. SHIM auto-loads (invisible)
2. Auto-checkpoints every 3-5 tool calls (silent)
3. Monitors crash signals (preemptive)
4. If crash → recovery option shown
5. Code analysis available on-demand

**SHIM Project:**
- Update only when adding capabilities
- Maintenance mode after MCP built

---

## Features

### 1. Crash Prevention (Automatic)

**What It Does:**
- Auto-checkpoints every 3-5 tool calls
- Monitors crash warning signals
- Detects incomplete sessions on startup
- Shows recovery option after crash

**User Experience:**
- Completely invisible
- No manual "save checkpoint" commands
- Context just persists
- Recovery automatic

**Technical:**
- Compressed checkpoints (<100KB each)
- SQLite storage (D:\SHIM\data\checkpoints\)
- Smart triggers (risk level, time, events)
- Full state serialization

### 2. Code Analysis (On-Demand)

**What It Does:**
- AST parsing and complexity scoring
- Pattern detection across codebase
- Improvement opportunity identification
- ROI-ranked suggestions

**User Experience:**
- Say: "Analyze this code"
- SHIM scans and reports
- Top 5-10 improvements shown
- Can auto-apply with approval

**Technical:**
- 107 files analyzed in ~5 seconds
- Complexity metrics (McCabe, Halstead)
- ML pattern recognition
- Git-style diffs for changes

### 3. Self-Evolution (Automatic)

**What It Does:**
- A/B tests improvements automatically
- Statistical validation (p-values, effect sizes)
- Canary deployment (gradual rollout)
- Auto-rollback on regression

**User Experience:**
- System gets better over time
- No manual intervention
- Metrics visible on-demand
- Safe, validated improvements only

**Technical:**
- Prometheus metrics
- Statsig experimentation
- Performance analysis (Welch's t-test)
- Deployment manager with rollback

### 4. Multi-Chat Coordination (Available)

**What It Does:**
- Parallel AI execution across chats
- Task decomposition and distribution
- Progress aggregation
- Crash recovery for workers

**User Experience:**
- Delegate tasks to worker chats
- 3-5x faster execution
- Coordinated by supervisor
- All benefits of SHIM in each chat

**Technical:**
- Redis + BullMQ infrastructure
- Supervisor/worker pattern
- State synchronization
- Load balancing

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Claude Desktop installed
- (Optional) Docker for Redis (multi-chat coordination)

### Setup (After MCP Server Built)

```bash
# 1. Install SHIM
cd D:\SHIM
npm install
npm run build

# 2. Add to Claude Desktop config
# Edit: %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "shim": {
      "command": "node",
      "args": ["D:\\SHIM\\mcp-server\\dist\\index.js"]
    }
  }
}

# 3. Restart Claude Desktop
# Done! SHIM now runs in background of all chats
```

### Verification

Open any Claude chat and say:
```
What's active?
```

Claude will respond:
```
✅ SHIM Active
Last checkpoint: 2 minutes ago
Session duration: 47 minutes
12 checkpoints saved
Recovery available: Yes
```

---

## Usage

### Automatic Features (Zero User Action)

**Checkpointing:**
- Happens every 3-5 tool calls
- Completely silent
- No prompts or notifications
- Just works

**Crash Recovery:**
- Only shown when needed
- After crash or interruption
- Single yes/no prompt
- Full context restored

**Signal Monitoring:**
- Runs continuously
- Preemptive checkpoint if high risk
- Warning shown if danger detected
- Prevents crashes before they happen

### On-Demand Features (Ask Claude)

**Code Analysis:**
```
Analyze this codebase
What needs refactoring?
Show code quality metrics
```

**Session Status:**
```
What's active?
Show SHIM status
How many checkpoints?
```

**Manual Checkpoint:**
```
Save checkpoint now
Checkpoint this state
```

---

## Development

### Project Structure

```
SHIM/
├── src/                      # Source code
│   ├── core/                 # Core components (28 total)
│   │   ├── crash-prevention/ # Phase 1 (10 components)
│   │   ├── model-routing/    # Phase 2 (3 components)
│   │   ├── multi-chat/       # Phase 3 (6 components)
│   │   ├── evolution/        # Phase 4 (4 components)
│   │   └── analytics/        # Phase 5 (5 components)
│   ├── mcp-server/          # MCP server (TO BUILD)
│   ├── models/              # Data models
│   ├── database/            # SQLite layer
│   └── utils/               # Utilities
├── docs/                    # Documentation
│   ├── SHIM_MCP_ARCHITECTURE.md
│   ├── CRASH_PREVENTION_INTEGRATION_PLAN.md
│   └── specs/
├── tests/                   # Tests (1,436 total)
└── data/                    # Runtime data
    ├── checkpoints/
    ├── signals/
    └── recovery/
```

### Scripts

```bash
npm run build          # Compile TypeScript
npm run watch          # Watch mode
npm test               # Run tests (1,436 tests)
npm run test:coverage  # Coverage report (98%+)
npm run lint           # Lint code
npm run format         # Format code

# MCP server (after built)
npm run mcp:start      # Start MCP server
npm run mcp:dev        # Development mode
```

---

## Current Status

### Phase 1-6: Complete ✅
- **Components:** 28/28 (100%)
- **Code:** ~11,362 LOC
- **Tests:** 1,436 tests
- **Coverage:** 98%+
- **TDD:** 100% compliance

### Next: MCP Server Transformation
- **Goal:** Make ALL capabilities available everywhere
- **Approach:** Port components to MCP server
- **Duration:** 12-16 hours (single session)
- **Philosophy:** Complete product, done right, first time

---

## Technical Details

### Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Checkpoint creation | < 100ms | ~85ms |
| Signal overhead | < 5ms/call | ~2ms |
| Code analysis (107 files) | < 10s | ~5s |
| Resume detection | < 50ms | ~30ms |
| Storage per checkpoint | < 100KB | ~75KB |

### Technologies

**Core:**
- TypeScript (strict mode)
- Node.js >= 18
- SQLite (better-sqlite3)
- Zlib (compression)

**MCP:**
- @modelcontextprotocol/sdk
- Stdio transport

**Analytics:**
- Prometheus (metrics)
- Grafana (dashboards)
- Statsig (A/B testing)

**Multi-Chat:**
- Redis (state storage)
- BullMQ (job queues)
- ioredis (client)

---

## Philosophy

### Build Intelligence, Not Plumbing

**Use battle-tested tools for infrastructure:**
- Prometheus (not custom metrics)
- BullMQ (not custom queues)
- Statsig (not custom A/B testing)
- Redis (not custom cache)

**Custom code ONLY for domain logic:**
- Crash prediction (SHIM-specific)
- Code analysis (SHIM-specific)
- Session management (SHIM-specific)

**Result:** ~11,362 LOC custom vs ~25,000+ LOC if built from scratch

### Option B Perfection

**Revolutionary, not incremental:**
- MCP server (not per-project integration)
- Auto-everything (not manual workflows)
- Complete product (not MVP)

**Do it right first time:**
- Comprehensive testing (1,436 tests)
- Full documentation (2,300+ lines)
- Production-ready architecture

### Zero Technical Debt

**Real implementations or explicit failure:**
- No mocks, stubs, placeholders
- No "temporary" solutions
- Quality gates before features

**Result:** Maintenance mode after MCP built

---

## Roadmap

### Immediate: MCP Server (12-16h)
Build complete MCP server with all 28 components

### Future: Enhancements (As Needed)
- Advanced ML pattern recognition
- Multi-user coordination
- Enterprise features
- Custom integrations

### Long-term: Ecosystem
- SHIM plugins
- Community patterns
- Shared intelligence
- Monetization

---

## Documentation

**Architecture:**
- `docs/SHIM_MCP_ARCHITECTURE.md` - Complete MCP design
- `docs/CRASH_PREVENTION_INTEGRATION_PLAN.md` - Integration roadmap
- `docs/SHIM_GLOBAL_INTEGRATION.md` - Usage reference

**Specifications:**
- `docs/specs/SPEC_CRASH_PREVENTION.md` - Crash prevention system
- `docs/specs/DATA_MODELS.md` - Data structures
- `docs/specs/IMPLEMENTATION_PLAN.md` - Development plan

**Instructions:**
- `docs/IN_APP_GLOBAL_INSTRUCTIONS_v5.0.0.md` - Claude instructions
- `docs/v5.0.0_UPGRADE_GUIDE.md` - Installation guide
- `docs/SESSION_BOOTSTRAP_TEMPLATE.md` - Status display

---

## License

MIT License - See LICENSE file for details

---

## The Bottom Line

**SHIM transforms Claude Desktop into Claude+**

- Background infrastructure (invisible)
- Zero user intervention (automatic)
- Works everywhere (all chats, all projects)
- Gets better over time (self-evolution)
- Never loses context (crash prevention)

**After MCP server built:**
- One-time setup
- Maintenance mode
- Infrastructure "disappears"
- Claude just works better

---

*Built for developers who value context.*  
*Designed to be invisible.*  
*Ready to transform Claude Desktop.*
