# SHIM: Source of Truth Document

**Project:** SHIM (thin layer that intercepts and enhances AI platform capabilities)
**Version:** 0.4.0 (Analytics & Auto-Experimentation Architecture)
**Created:** January 9, 2026  
**Last Updated:** January 11, 2026  
**Status:** Phase 1 Implementation + Analytics Infrastructure Design

---

## Project Identity

**Name:** SHIM  
**Etymology:** In computing, a shim is a library that transparently intercepts API calls and changes the arguments passed, handles the operation itself, or redirects the operation elsewhere. SHIM intercepts Claude Desktop's capabilities and enhances them with persistence, coordination, and intelligence.

**Tagline:** "Never lose context again. Never repeat yourself. Never crash without recovery."

---

## What SHIM Is

A **self-improving** system that eliminates friction in AI-assisted development by enabling:

1. **Crash Prevention & Recovery** - Never lose context again
2. **Intelligent Model Routing** - Automatic model selection with token optimization
3. **Self-Evolution** - System improves itself automatically over time (Kaizen)
4. **Multi-Chat Coordination** - Parallel AI workstreams  
5. **Autonomous Operation** - AI executes while human sleeps

**NEW: Fully Automatic Self-Improvement**
- Continuous A/B testing without human intervention
- Statistical validation and gradual rollout
- Automatic parameter tuning within safety bounds
- Zero manual improvement application required

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

**5. LEAN-OUT Infrastructure**
- Use battle-tested tools for generic problems
- Custom code only for domain-specific logic
- Don't rebuild what production tools provide
- Focus development on differentiators

**6. Banned Vocabulary**
```
❌ NEVER: slow, fast, hours, days, weeks, hard, easy, overkill, for now, later
✅ USE: simple, comprehensive, minimal, complete, straightforward, involved
```

### Application to SHIM

**Example: Supervisor Daemon Decision**
- ❌ WRONG: "Path A: Fast (auto-resume). Path B: Slow (300 LOC daemon)"
- ✅ RIGHT: "Supervisor daemon eliminates crashes completely. Implementation includes process monitoring, MCP integration, Windows service. This is the correct solution."

**Example: Analytics Architecture**
- ❌ WRONG: "Build custom analytics (2,300 LOC)"
- ✅ RIGHT: "Use Prometheus + Statsig (570 LOC). Battle-tested, maintained, free tier available."

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
| `specs/SPEC_ANALYTICS.md` | Analytics & auto-experimentation specification | 🔜 Next |
| `specs/SPEC_MODEL_ROUTING.md` | Intelligent model routing specification | 🔜 Next |

---

## Research Summary

### The Four Fundamental Root Causes

After analyzing 32 friction points plus recent insights, four architectural issues explain ~85% of observed friction:

**ROOT CAUSE #1: Ephemeral Context Architecture (HIGHEST LEVERAGE)**
- Platform treats conversations as ephemeral
- No native persistence primitive between tool calls
- Everything lives in volatile context window memory
- **Fix:** Continuous state serialization with predictive checkpointing

**ROOT CAUSE #2: Manual Model Selection**
- User manually picks Opus vs Sonnet for each chat
- Wastes expensive tokens on simple tasks
- Wastes time with cheaper models on complex tasks
- **Fix:** Intelligent model routing with automatic token optimization

**ROOT CAUSE #3: Single-Chat Constraint**
- Platform enforces 1:1 human:chat model
- No primitive for chat instances to communicate
- Fundamentally blocks autonomous operation
- **Fix:** Multi-chat coordination layer via shared database

**ROOT CAUSE #4: Static System (No Learning)**
- No feedback loop for improvement
- Parameters remain fixed regardless of effectiveness
- No learning from user behavior
- **Fix:** Automatic experimentation and self-improvement (Kaizen)

---

## Tech Stack (LEAN-OUT Principle)

> "Build intelligence, not plumbing. Use battle-tested tools for generic problems."

### Infrastructure (Battle-Tested Tools)

**Core Infrastructure:**
- **Redis + BullMQ** - Job queues, messaging, distributed locks
- **SQLite** - Checkpoints, local persistence
- **File System** - Large payloads (>100KB)

**Analytics & Learning (NEW):**
- **Prometheus** - Metrics collection and time-series storage
  - Industry standard, 10+ years battle-tested
  - Node.js client: `prom-client`
  - Free, open-source
  
- **Grafana** - Dashboards and visualization
  - Built for Prometheus
  - Professional dashboards out-of-box
  - Free, open-source
  
- **Statsig** - A/B testing and experimentation
  - Built for automatic experiments
  - Statistical validation included
  - Gradual rollout built-in
  - Free tier available
  
- **simple-statistics (npm)** - Statistical analysis
  - T-tests, p-values, effect sizes
  - 130k+ downloads/week
  - Well-tested, maintained

**Process Monitoring:**
- Node.js `process` API - Monitor Claude Desktop
- Windows Service API (NSSM) - Auto-restart daemon

### Custom Code (Domain-Specific Only)

**Phase 1: Crash Prevention (~1,000 LOC)**
- SignalCollector - Crash prediction (~200 LOC) ✅
- CheckpointManager - Trigger detection (~150 LOC)
- SessionRestorer - Context restoration (~150 LOC)
- Supervisor Daemon - Process monitoring (~300 LOC)
- CheckpointRepository - Storage (~200 LOC) ✅

**Phase 1.5: Analytics & Auto-Improvement (~570 LOC)**
- SHIMMetrics - Prometheus integration (~100 LOC)
- OpportunityDetector - Pattern detection (~150 LOC)
- SafetyBounds - Domain-specific safety (~150 LOC)
- StatsigIntegration - Experiment management (~70 LOC)
- EventEmitter - Domain events (~100 LOC)

**Phase 2: Model Routing (~400 LOC)**
- ModelRouter - Routing decisions (~200 LOC)
- PromptAnalyzer - Complexity detection (~150 LOC)
- TokenEstimator - Cost calculation (~50 LOC)

**Phase 3: Multi-Chat Coordination (~800 LOC)**
- ChatCoordinator - Chat orchestration (~300 LOC)
- TaskDistributor - Work allocation (~200 LOC)
- StateSync - Shared state (~300 LOC)

**Total Custom Code: ~2,770 LOC** (vs 5,000+ LOC without LEAN-OUT)

**Savings: 2,230 LOC eliminated** by using battle-tested tools

---

## New Architecture: Self-Improving Kaizen Model

### Fully Automatic Improvement Loop

```
1. SHIM operates normally
   ↓
2. Emit metrics (Prometheus)
   ↓
3. Detect patterns (OpportunityDetector - custom)
   ↓
4. Design experiment (Statsig - battle-tested)
   ↓
5. Run A/B test (Statsig - automatic)
   ↓
6. Validate results (simple-statistics - automatic)
   ↓
7. Gradual rollout (Statsig - automatic)
   ↓
8. Monitor for regression (SafetyBounds - custom)
   ↓
9. Deploy or rollback (automatic)
   ↓
10. Log improvement (Prometheus)
    ↓
[LOOP - Zero human intervention]
```

### User Control (Override Mechanism)

```typescript
// User sets bounds (optional)
shimConfig.autoImprovement = {
  enabled: true,
  maxCostIncrease: 20,  // $/week
  maxLatencyIncrease: 100,  // ms
  requireApproval: ['model_routing_changes'],
  autoApprove: ['checkpoint_tuning', 'compression']
};

// User sees monthly report
SHIM Auto-Improvements This Month:
✓ Checkpoint interval optimized (-12% crash rate)
✓ Model routing improved (+25% accuracy)
✓ Context pruning enhanced (2.4M tokens saved)

Net benefit: $119 + 8.5 hours saved
```

**Default:** Automatic within safety bounds. User can override/rollback anytime.

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

**Week 7-8: Supervisor Daemon**
- Process monitoring
- Auto-restart on crash
- MCP integration for auto-resume
- Windows service deployment

### Phase 1.5: Analytics Infrastructure (NEW - DESIGNED)

**Foundation (Parallel with Phase 1):**
- Prometheus + Grafana setup
- SHIMMetrics implementation (~100 LOC)
- Event emission from existing components
- Basic dashboards

**Auto-Experimentation Engine:**
- OpportunityDetector (~150 LOC)
- Statsig integration (~70 LOC)
- SafetyBounds enforcement (~150 LOC)
- Statistical validation (simple-statistics)

**Timeline:** Built in parallel with Phase 1 Week 5-8

### Phase 2: Intelligent Model Routing (DESIGNED)

**Components:**
- ModelRouter (~200 LOC)
- PromptAnalyzer (~150 LOC)
- Token optimization strategies
- Override learning system

**Dependencies:** Analytics infrastructure (Phase 1.5)

### Phase 3: Multi-Chat Coordination

**Components:**
- Chat orchestration
- Task distribution
- Shared state management

**Dependencies:** Crash prevention (Phase 1), Model routing (Phase 2)

---

## Relationship to Other Projects

**KERNL:** SHIM builds on KERNL's infrastructure (SQLite, session management, file operations)

**GREGORE:** 
- SHIM researched within GREGORE context
- Token optimization strategies borrowed from GREGORE
- Developed as separate project

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
- LEAN-OUT: Use battle-tested tools for generic problems

---

## Competitive Differentiation

**What competitors offer:**
- Analytics dashboards (requires human analysis)
- Recommendations (requires human approval)
- Configuration options (requires human tuning)

**What SHIM offers:**
- **Fully automatic Kaizen** (self-improvement without human intervention)
- **Intelligent model routing** (automatic cost optimization)
- **Zero-intervention crash recovery** (supervisor daemon)
- **Compound intelligence** (gets smarter every day)

**This is the moat:** Self-improving architecture that learns from every user.

---

*This document is the canonical source of truth for SHIM. All development should reference this first.*

*Development Philosophy: Revolutionary quality. No timelines. Right solution always. LEAN-OUT infrastructure. User builds enterprise software in weeks.*

*Architecture: Self-improving Kaizen model with automatic experimentation and deployment within safety bounds.*
