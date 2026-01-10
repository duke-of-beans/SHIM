# SHIM: Source of Truth Document

**Project:** SHIM (thin layer that intercepts and enhances AI platform capabilities)
**Version:** 0.2.0 (Technical Specifications Complete)
**Created:** January 9, 2026  
**Last Updated:** January 10, 2026  
**Status:** Phase 3 Complete - Ready for Implementation

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
| `FRICTION_ANALYSIS.md` | 32 documented friction points from user research | ✅ Complete |
| `ARCHITECTURE.md` | System architecture and component designs | ✅ Complete |
| `ROADMAP.md` | Implementation phases and timeline | ✅ Complete |
| `MONETIZATION_STRATEGY.md` | Competitive analysis, pricing, go-to-market | ✅ Complete |
| `PLATFORM_LIMITATIONS.md` | Feasibility matrix, workarounds, partnership analysis | ✅ Complete |
| `COMPETITOR_RESEARCH.md` | Name validation and competitive landscape | ✅ Complete |
| **Technical Specifications** | | |
| `specs/SPEC_CRASH_PREVENTION.md` | Crash prevention technical specification | ✅ **NEW** |
| `specs/DATA_MODELS.md` | TypeScript interfaces and database schemas | ✅ **NEW** |
| `specs/IMPLEMENTATION_PLAN.md` | Week-by-week development plan for Phase 1 | ✅ **NEW** |

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

## Implementation Estimates

| Component | MVP | Full | Dependencies |
|-----------|-----|------|--------------|
| Crash Prevention | 3-4 weeks | 8-12 weeks | KERNL |
| Multi-Chat Coordination | 4-6 weeks | 10-14 weeks | Crash Prevention |
| Self-Evolution Engine | 6-8 weeks | 16-20 weeks | Multi-Chat |
| Autonomous Development | 4-6 weeks | 12-16 weeks | All above |

**Total:** 4-6 months for full system

---

## Relationship to Other Projects

**KERNL:** SHIM builds on KERNL's infrastructure (SQLite, session management, file operations)

**GREGORE:** SHIM was researched within GREGORE project context; will be developed as separate project

---

## Project Status

### Phase 1: Research & Strategy (COMPLETE ✅)
- Opus analyzed 32 friction points
- Identified 3 root causes
- Designed 4-pillar architecture
- Validated technical feasibility
- Created monetization strategy

### Phase 2: Strategic Analysis (COMPLETE ✅)
- Competitive landscape analysis
- Platform limitations assessment
- LEAN-OUT infrastructure decisions
- Open-core licensing strategy

### Phase 3: Technical Specifications (COMPLETE ✅)
- Crash prevention specification (356 lines)
- Data models & schemas (339 lines)
- Implementation plan with week-by-week breakdown
- Project scaffolding:
  - `package.json` with all dependencies
  - `tsconfig.json` with strict TypeScript config
  - `jest.config.js` with 80% coverage thresholds
  - `src/models/Checkpoint.ts` - Complete TypeScript interfaces
  - `src/core/SignalCollector.ts` - Full implementation with tiktoken
  - `src/database/schema.sql` - Complete SQLite schema
  - `README.md` - Comprehensive project documentation

### Phase 4: Implementation (READY TO START)
**Next Steps:**
1. ☐ Run `npm install` to install dependencies
2. ☐ Run `npm run build` to compile TypeScript
3. ☐ Run `npm run db:migrate` to initialize database
4. ☐ Begin Week 1: SignalCollector testing and refinement
5. ☐ Continue per IMPLEMENTATION_PLAN.md

---

*This document is the canonical source of truth for SHIM. All development should reference this first.*
