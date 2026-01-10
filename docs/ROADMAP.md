# SHIM Implementation Roadmap

**Project:** SHIM  
**Version:** 0.1.0  
**Last Updated:** January 10, 2026

---

## Overview

SHIM implementation follows a dependency-ordered approach where each phase enables the next.

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: CRASH PREVENTION                                       │
│  Foundation - nothing else matters if sessions crash             │
│  Duration: 4-6 weeks                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: MULTI-CHAT COORDINATION                                │
│  Parallel execution - enables delegation and autonomy            │
│  Duration: 4-6 weeks                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: SELF-EVOLUTION ENGINE                                  │
│  Intelligence - system improves itself over time                 │
│  Duration: 6-8 weeks                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: AUTONOMOUS OPERATION                                   │
│  Capstone - AI executes while human sleeps                       │
│  Duration: 4-6 weeks                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Crash Prevention (Foundation)

**Duration:** 4-6 weeks  
**Dependencies:** KERNL MCP server

### Week 1-2: Observable Signals & Metrics

- [x] Define crash signal interfaces (Day 1-2)
- [x] Implement tool call metrics collection (Day 3-4)
- [x] Implement session metrics collection (Day 4-5)
- [x] Implement response behavior metrics (Day 5)
- [x] Build metrics aggregation pipeline (Day 6-7)
- [x] Implement signal history persistence (Day 6-7)

**Status:** ✅ COMPLETE (7 days)  
**Test Coverage:** 98.36% (71/71 tests passing)  
**Commits:** 4 (b4ac99e, 863ee09, 3922f36, 91b69c5)

**Components Delivered:**
1. **SignalCollector** (238 LOC, 53 tests)
   - Real-time crash risk scoring (Critical/Moderate/Low)
   - Tool call frequency & error rate tracking
   - Session duration & message count monitoring
   - Response behavior analysis (timeouts, interruptions)
   - Automatic risk level escalation logic

2. **SignalHistoryRepository** (314 LOC, 18 tests)
   - SQLite storage with WAL mode for concurrency
   - Automatic snapshot numbering per session
   - Time-range and risk-level queries
   - Retention-based cleanup (auto-delete old snapshots)
   - Batch insert optimization (60x faster: 35s → 0.6s for 1000 snapshots)

**Key Lessons Learned:**
1. **Race Conditions in Async Code:** `forEach()` with async callbacks executes concurrently. For database operations requiring sequential execution (like auto-incrementing), use recursive processing or `for...of` loops.
2. **Option B Perfection:** Implemented BOTH single-save and batch-save methods rather than choosing one approach.
3. **Transaction Batching:** Single transactions around bulk operations provide massive SQLite performance gains (60x improvement).

### Week 3-4: Checkpoint System

- [x] Design checkpoint schema (Day 8)
- [x] Implement checkpoint serialization with gzip compression (Day 8)
- [x] Create SQLite storage layer - CheckpointRepository (Day 8)
- [x] Build checkpoint trigger system - CheckpointManager (Day 9)
- [ ] Implement auto-checkpoint integration with live signals
- [ ] E2E checkpoint workflow testing

**Status:** 🚧 IN PROGRESS (Day 9)  
**Test Coverage:** 100% (114/114 tests passing)  
**Performance:** All benchmarks met

**Components Delivered:**
1. **CheckpointRepository** (600+ LOC, 24 tests)
   - Complete checkpoint data model with 6 state categories
   - Gzip compression (typical 3-5x ratio)
   - Auto-increment checkpoint numbers per session
   - Resume event tracking
   - Retention-based cleanup
   - Query by risk level, session, restoration status
   - Composite sorting (timestamp + checkpoint_number)
   - WAL mode for concurrent access

2. **CheckpointManager** (218 LOC, 19 tests)
   - Multi-trigger detection (danger zone, warning zone, tool call interval, time interval)
   - Priority-based triggering (danger > warning > intervals)
   - Automatic checkpoint creation with full state capture
   - Counter/timer resets after checkpointing
   - Auto-checkpoint workflow API (single method call)
   - Checkpoint statistics API
   - Performance: Trigger checks <10ms, Creation <150ms

**Key Implementation Details:**

**CheckpointRepository:**
- Serializes 6 state categories separately (conversation, task, file, tool, signals, preferences)
- Each category compressed independently for optimal compression
- Supports both explicit checkpoint numbers and auto-increment
- UNIQUE constraint on (session_id, checkpoint_number)
- Resume events stored separately with foreign key to checkpoints
- Cleanup by retention period (configurable days)

**CheckpointManager:**
- Four trigger types: danger_zone (risk='danger'), warning_zone (risk='warning'), tool_call_interval (default 5 calls), time_interval (default 10 minutes)
- Priority system ensures critical triggers override routine intervals
- Integrates with SignalCollector for risk assessment
- Full state capture includes conversation, task, file, tool states plus signals and preferences
- Automatic counter/timer resets prevent duplicate triggering
- Auto-checkpoint workflow combines trigger check + creation in single API call

### Week 5-6: Resume Protocol

- [ ] Implement crash detection
- [ ] Build resume prompt generation
- [ ] Create context reconstruction flow
- [ ] Integrate with session start
- [ ] End-to-end crash→resume testing

**Deliverable:** Working crash recovery from any interruption

---

## Phase 2: Multi-Chat Coordination

**Duration:** 4-6 weeks  
**Dependencies:** Phase 1 complete, Redis

### Week 1-2: Infrastructure

- [ ] Set up Redis server
- [ ] Install BullMQ, ioredis
- [ ] Implement chat registry
- [ ] Create task queue wrappers
- [ ] Build message bus (Redis Pub/Sub)

### Week 3-4: Supervisor Pattern

- [ ] Implement supervisor initialization
- [ ] Build task decomposition logic
- [ ] Create worker registration
- [ ] Implement task assignment
- [ ] Build progress aggregation

### Week 5-6: Worker Automation

- [ ] Implement worker loop
- [ ] Build task claiming logic
- [ ] Create execution reporting
- [ ] Implement crash recovery for workers
- [ ] Integration testing

**Deliverable:** Parallel chat execution with coordination

---

## Phase 3: Self-Evolution Engine

**Duration:** 6-8 weeks  
**Dependencies:** Phase 2 complete

### Week 1-2: Observation Layer

- [ ] Define evolution metrics
- [ ] Implement pattern detection
- [ ] Build bottleneck identification
- [ ] Create failure clustering
- [ ] Historical analysis system

### Week 3-4: Analysis Engine

- [ ] Implement improvement detection
- [ ] Build proposal generation
- [ ] Create ROI estimation
- [ ] Implement prioritization
- [ ] Guardrails system

### Week 5-6: Implementation Pipeline

- [ ] Level 1: Auto-configuration
- [ ] Level 2: Workflow suggestions
- [ ] Level 3: Human-approved changes
- [ ] Rollback mechanisms
- [ ] Audit trail

### Week 7-8: Learning Loop

- [ ] Feedback collection
- [ ] Model refinement
- [ ] Cross-project learning
- [ ] Pattern library
- [ ] Continuous improvement

**Deliverable:** Self-improving system

---

## Phase 4: Autonomous Operation

**Duration:** 4-6 weeks  
**Dependencies:** Phase 3 complete

### Week 1-2: Supervised Autonomy

- [ ] Implement Type A (code implementation)
- [ ] Build escalation protocol
- [ ] Create decision boundaries
- [ ] Human notification system
- [ ] Safety guardrails

### Week 3-4: Background Operations

- [ ] Implement Type B (monitoring)
- [ ] File watcher integration
- [ ] Build status alerting
- [ ] Pattern observation
- [ ] Optimization suggestions

### Week 5-6: Auto-Recovery

- [ ] Implement Type C (recovery)
- [ ] Self-healing workflows
- [ ] Zero-intervention recovery
- [ ] Performance optimization
- [ ] End-to-end autonomous testing

**Deliverable:** Zero-intervention development sessions

---

## Success Metrics

| Metric | Current | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|---------|
| Crashes/10 hrs | ~3-5 | Recoverable | Recoverable | <1 | <0.5 |
| Recovery time | 10-30 min | <2 min | <1 min | <30 sec | <10 sec |
| Context loss | 100% | <10% | <5% | <1% | 0% |
| Parallel chats | 1 | 1 | 3-5 | 5+ | 5+ |
| Manual intervention | Every msg | Every msg | Major only | Rare | Exceptions |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Platform changes break signals | Medium | High | Abstract signal layer |
| Redis complexity | Low | Medium | Start with SQLite fallback |
| Crash prediction inaccurate | Medium | Medium | Heuristic first, ML later |
| Multi-chat UX friction | High | Medium | Minimize manual setup |
| Self-evolution safety | Low | High | Strict guardrails, human approval |

---

## MVP Definition

**Minimum Viable SHIM (Phase 1 only):**
- Crash prediction (heuristic)
- Automatic checkpointing
- One-click resume
- Full context recovery

**Value proposition:** "Never lose your work again"

---

*Roadmap will be updated as implementation progresses.*
