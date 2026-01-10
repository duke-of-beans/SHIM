# SHIM - Session Handling & Intelligent Management

> Never lose context again. Never repeat yourself. Never crash without recovery.

---

## Overview

SHIM is a crash prevention and recovery system for Claude Desktop that eliminates context loss through continuous checkpointing and intelligent resume protocols.

**Status:** Phase 1 Development (Crash Prevention)  
**Version:** 0.1.0

---

## Features

### Phase 1: Crash Prevention (Current)

- ✅ **Predictive Crash Detection** - Observable signals predict crash likelihood
- ✅ **Automatic Checkpointing** - State saved every 5 tool calls (configurable)
- ✅ **Instant Resume** - Full context restoration after interruption
- ✅ **Compressed Storage** - <100KB per checkpoint with gzip
- ✅ **Smart Triggers** - Checkpoint on danger zones, time intervals, events

### Future Phases

- 🔜 **Multi-Chat Coordination** (Phase 2) - Parallel AI workstreams
- 🔜 **Self-Evolution** (Phase 3) - System improves itself over time
- 🔜 **Autonomous Operation** (Phase 4) - AI executes while you sleep

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- KERNL MCP Server (for project integration)
- Desktop Commander (for tool state capture)

### Setup

```bash
# Navigate to project
cd D:\SHIM

# Install dependencies
npm install

# Build TypeScript
npm run build

# Initialize database
npm run db:migrate

# Run tests
npm test
```

---

## Usage

### As MCP Server

```bash
# Start SHIM MCP server
npm run mcp:start

# In Claude Desktop, MCP tools will be available:
# - shim_get_crash_risk
# - shim_checkpoint
# - shim_check_resume
# - shim_list_checkpoints
```

### Programmatic API

```typescript
import { SignalCollector, CheckpointManager } from 'shim';

// Initialize signal collector
const collector = new SignalCollector();

// Track tool calls
collector.onToolCall('bash_tool', args, result, latency);

// Check crash risk
const risk = collector.getCrashRisk(); // 'safe' | 'warning' | 'danger'

// Create checkpoint
const checkpointManager = new CheckpointManager(db, collector);
const checkpoint = await checkpointManager.createCheckpoint(sessionContext);
```

---

## Architecture

### Core Components

```
┌──────────────────────────────────────────────┐
│  SHIM Crash Prevention System                │
├──────────────────────────────────────────────┤
│                                               │
│  ┌──────────────┐  ┌──────────────┐         │
│  │   SIGNAL     │  │  CHECKPOINT  │         │
│  │  COLLECTOR   │→│   MANAGER    │         │
│  └──────────────┘  └──────────────┘         │
│         │                  │                  │
│         └──────────┬───────┘                  │
│                    ▼                           │
│         ┌──────────────────┐                  │
│         │  SQLITE DATABASE │                  │
│         │  • Checkpoints   │                  │
│         │  • Signal History│                  │
│         └──────────────────┘                  │
│                    ▲                           │
│         ┌──────────┴───────┐                  │
│  ┌──────────────┐  ┌──────────────┐         │
│  │   RESUME     │  │     MCP      │         │
│  │   DETECTOR   │  │   SERVER     │         │
│  └──────────────┘  └──────────────┘         │
│                                               │
└──────────────────────────────────────────────┘
```

### Data Flow

1. **Signal Collection** - Track every tool call, message, latency
2. **Risk Assessment** - Evaluate crash likelihood
3. **Checkpoint Trigger** - Create checkpoint when needed
4. **State Serialization** - Capture conversation, task, files, tools
5. **Storage** - Compressed checkpoint saved to SQLite
6. **Resume Detection** - Check for incomplete work on session start
7. **Context Restoration** - Generate resume prompt from checkpoint

---

## Configuration

### Default Settings

```typescript
const DEFAULT_CONFIG = {
  // Checkpoint intervals
  toolCallInterval: 5,              // Every 5 tool calls
  timeInterval: 10 * 60 * 1000,     // Every 10 minutes
  
  // Thresholds
  dangerThresholds: {
    contextWindowUsage: 0.75,       // 75% context usage
    messageCount: 50,
    sessionDuration: 90 * 60 * 1000, // 90 minutes
  },
  
  // Storage
  maxCheckpointsPerSession: 20,
  checkpointRetentionDays: 30,
  compressCheckpoints: true,
};
```

---

## Development

### Project Structure

```
SHIM/
├── src/
│   ├── core/                 # Core logic
│   │   ├── SignalCollector.ts
│   │   ├── CheckpointManager.ts
│   │   └── ResumeDetector.ts
│   ├── models/               # Data models
│   │   └── Checkpoint.ts
│   ├── database/             # Database layer
│   │   ├── schema.sql
│   │   └── CheckpointRepository.ts
│   ├── mcp/                  # MCP server
│   │   └── CrashPreventionMCP.ts
│   └── utils/                # Utilities
├── docs/                     # Documentation
│   ├── specs/                # Technical specs
│   └── research/             # Research docs
├── tests/                    # Tests
└── dist/                     # Compiled output
```

### Scripts

```bash
npm run build          # Compile TypeScript
npm run watch          # Watch mode
npm test               # Run tests
npm run test:watch     # Watch tests
npm run test:coverage  # Coverage report
npm run lint           # Lint code
npm run format         # Format code
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Performance

### Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Checkpoint creation | < 100ms | TBD |
| Storage per checkpoint | < 100KB | TBD |
| Signal overhead | < 5ms/call | TBD |
| Resume detection | < 50ms | TBD |

---

## Roadmap

- [x] Phase 1: Crash Prevention (4-6 weeks) **← Current**
  - [x] Observable signals ✅
  - [x] Checkpoint system (in progress)
  - [ ] Resume protocol
  - [ ] Testing & optimization

- [ ] Phase 2: Multi-Chat Coordination (4-6 weeks)
  - [ ] Redis infrastructure
  - [ ] Supervisor/worker pattern
  - [ ] Job queue integration

- [ ] Phase 3: Self-Evolution Engine (6-8 weeks)
  - [ ] Pattern detection
  - [ ] Improvement proposals
  - [ ] Learning loop

- [ ] Phase 4: Autonomous Operation (4-6 weeks)
  - [ ] Supervised autonomy
  - [ ] Background monitoring
  - [ ] Auto-recovery

---

## Documentation

- **Technical Specs:** `docs/specs/`
  - `SPEC_CRASH_PREVENTION.md` - Crash prevention system
  - `DATA_MODELS.md` - Data structures and schemas
  - `IMPLEMENTATION_PLAN.md` - Week-by-week development plan

- **Research:** `docs/`
  - `SOURCE_OF_TRUTH.md` - Project overview
  - `ARCHITECTURE.md` - System architecture
  - `PLATFORM_LIMITATIONS.md` - Feasibility analysis
  - `MONETIZATION_STRATEGY.md` - Business strategy

---

## License

MIT License - See LICENSE file for details

---

*Built with ❤️ for developers who value context.*
