# SHIM: Source of Truth Document

**Project:** SHIM (thin layer that intercepts and enhances AI platform capabilities)
**Version:** 0.3.0 (Development Philosophy Added)
**Created:** January 9, 2026  
**Last Updated:** January 11, 2026  
**Status:** Phase 1 Implementation (Week 3-4)

---

## Project Identity

**Name:** SHIM  
**Etymology:** In computing, a shim is a library that transparently intercepts API calls and changes the arguments passed, handles the operation itself, or redirects the operation elsewhere. SHIM intercepts Claude Desktop's capabilities and enhances them with persistence, coordination, and intelligence.

**Tagline:** "Never lose context again. Never repeat yourself. Never crash without recovery."

---

## What SHIM Is

A system that eliminates friction in AI-assisted development by enabling:

1. **Crash Prevention & Recovery** - Never lose context again
2. **Multi-Chat Coordination** - Parallel AI workstreams  
3. **Self-Evolution** - System improves itself over time
4. **Autonomous Operation** - AI executes while human sleeps

---

## Development Philosophy

**CRITICAL: These preferences are HARDCODED and NON-NEGOTIABLE.**

See `docs\CLAUDE_INSTRUCTIONS_PROJECT.md` §0 for complete enforcement rules.

### Core Principles

**1. Revolutionary Over Incremental**
- Design for 10x improvement, not 10%
- No "quick wins" or temporary solutions
- Do it right the first time, always

**2. No Timeline Bias**
- NEVER use: "fast/slow", "hours/days/weeks", "quick win vs long-term"
- Describe scope: "simple/comprehensive", "minimal/complete"
- User builds enterprise software in weeks, tools in hours
- Complexity is welcomed, not avoided

**3. Capability Assumption**
- User created GREGORE in 13 days, KERNL in 1 day
- Willing to climb any mountain for right solution
- Learning curves are embraced, not deterred
- Never frame complexity as reason not to do something

**4. Always Recommend Right Solution**
- Present the CORRECT solution, not the "easier" one
- Explain scope honestly without time bias
- Let user decide if worth doing
- Comprehensive solutions are normal, not "overkill"

**5. Banned Vocabulary**
```
❌ NEVER: slow, fast, hours, days, weeks, hard, easy, overkill, for now, later
✅ USE: simple, comprehensive, minimal, complete, straightforward, involved
```

### Application to SHIM

**Example: Supervisor Daemon Decision**
- ❌ WRONG: "Path A: Fast (auto-resume). Path B: Slow (300 LOC daemon)"
- ✅ RIGHT: "Supervisor daemon eliminates crashes completely. Implementation includes process monitoring, MCP integration, Windows service. This is the correct solution."

**Example: Architecture Choices**
- Don't frame "simple vs complex"
- Frame "incomplete vs complete"
- Always recommend complete solution
- User decides trade-offs

---

## Target User Profile

- Professional developers using Claude Desktop 4+ hours/day
- Works alone (no team pressure, no GTM urgency)
- Values technical correctness over shipping speed
- Willing to climb mountains (steep learning curves) for genuine payoff
- Philosophy: "Generic intelligence is commodity, contextual intelligence is monopoly"

---

## Core Documents

| Document | Purpose | Status |
|----------|---------|--------|
| `CLAUDE_INSTRUCTIONS_PROJECT.md` | Development protocols, TDD workflow, **§0 HARDCODED PREFERENCES** | ✅ Complete |
| `FRICTION_ANALYSIS.md` | 32 documented friction points from user research | ✅ Complete |
| `ARCHITECTURE.md` | System architecture and component designs | ✅ Complete |
| `ROADMAP.md` | Implementation phases and progress tracking | ✅ Complete |
| `MONETIZATION_STRATEGY.md` | Competitive analysis, pricing, go-to-market | ✅ Complete |
| `PLATFORM_LIMITATIONS.md` | Feasibility matrix, workarounds, partnership analysis | ✅ Complete |
| `COMPETITOR_RESEARCH.md` | Name validation and competitive landscape | ✅ Complete |
| **Technical Specifications** | | |
| `specs/SPEC_CRASH_PREVENTION.md` | Crash prevention technical specification | ✅ Complete |
| `specs/DATA_MODELS.md` | TypeScript interfaces and database schemas | ✅ Complete |
| `specs/IMPLEMENTATION_PLAN.md` | Week-by-week development plan for Phase 1 | ✅ Complete |

---

## Research Summary

### The Three Fundamental Root Causes

After analyzing 32 friction points, three architectural issues explain ~80% of observed friction:

**ROOT CAUSE #1: Ephemeral Context Architecture (HIGHEST LEVERAGE)**
- Platform treats conversations as ephemeral
- No native persistence primitive between tool calls
- Everything lives in volatile context window memory
- Fix: Continuous state serialization with predictive checkpointing

**ROOT CAUSE #2: Single-Chat Constraint**
- Platform enforces 1:1 human:chat model
- No primitive for chat instances to communicate
- Fundamentally blocks autonomous operation
- Fix: Multi-chat coordination layer via shared database

**ROOT CAUSE #3: Tool Permission Fragmentation**
- Tools exist in silos with different permissions
- No unified capability model
- Fix: Meta-layer reasoning about tool selection with automatic fallback

### Highest-Leverage Intervention

**Continuous State Serialization with Predictive Checkpointing**

If one thing could be implemented, it would be a system that:
1. Serializes ALL conversation state every N tool calls
2. Predicts crash likelihood based on observable signals
3. Auto-pauses before predicted crash
4. Enables instant resume with full context reconstruction

---

## Tech Stack (LEAN-OUT Principle)

> "Build intelligence, not plumbing. Use battle-tested tools for generic problems."

**Infrastructure (Battle-tested):**
- Redis + BullMQ - Job queues, messaging, locks
- SQLite - Checkpoints, analytics, persistence
- File System - Large payloads

**Custom Code (Domain-specific only):**
- Crash Prediction (~200 LOC)
- Checkpoint Manager (~150 LOC)
- Supervisor Logic (~300 LOC)
- Worker Logic (~200 LOC)

---

## Current Status

### Phase 1: Crash Prevention (IN PROGRESS)

**Week 1-2: Foundation (COMPLETE ✅)**
- SignalCollector.ts - 238 LOC, 53 tests passing
- SignalHistoryRepository.ts - 314 LOC, 18 tests passing
- CheckpointRepository.ts - 600+ LOC, 24 tests passing
- Total: 95 tests passing, 98%+ coverage

**Week 3-4: Checkpoint System (CURRENT)**
- CheckpointManager - Trigger detection logic
- Auto-checkpoint workflow
- Integration with SignalCollector

**Week 5-6: Resume System**
- ResumeDetector
- SessionRestorer
- E2E testing

**Week 7-8: Supervisor Daemon (CORRECT SOLUTION)**
- Process monitoring
- Auto-restart on crash
- MCP integration for auto-resume
- Windows service deployment

---

## Relationship to Other Projects

**KERNL:** SHIM builds on KERNL's infrastructure (SQLite, session management, file operations)

**GREGORE:** SHIM was researched within GREGORE project context; developed as separate project

---

## Development Protocols

**Mandatory Reading:**
- `docs\CLAUDE_INSTRUCTIONS_PROJECT.md` §0 - HARDCODED USER PREFERENCES
- `docs\CLAUDE_INSTRUCTIONS_PROJECT.md` §1-13 - Complete development protocols

**Key Rules:**
- TDD ONLY (RED → GREEN → REFACTOR, zero exceptions)
- Zero technical debt tolerance
- Revolutionary solutions, not incremental
- No timeline bias in recommendations
- Always recommend right solution

---

*This document is the canonical source of truth for SHIM. All development should reference this first.*

*Development Philosophy: Revolutionary quality. No timelines. Right solution always. User builds enterprise software in weeks.*
