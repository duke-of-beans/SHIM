# SHIM Implementation Roadmap

**Project:** SHIM  
**Version:** 0.2.0 (Analytics & Model Routing Added)
**Last Updated:** January 11, 2026

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
│  PHASE 1.5: ANALYTICS & AUTO-EXPERIMENTATION (NEW)               │
│  Self-improvement infrastructure - built ALONGSIDE Phase 1       │
│  Duration: 2-3 weeks (parallel with Phase 1 Weeks 5-8)           │
│  LEAN-OUT: Prometheus + Statsig + Grafana (~570 LOC)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: INTELLIGENT MODEL ROUTING (NEW)                        │
│  Token optimization - automatic model selection                  │
│  Duration: 2-3 weeks                                             │
│  Dependencies: Analytics infrastructure (Phase 1.5)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: MULTI-CHAT COORDINATION                                │
│  Parallel execution - enables delegation and autonomy            │
│  Duration: 4-6 weeks                                             │
│  Dependencies: Crash Prevention, Model Routing                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: SELF-EVOLUTION ENGINE                                  │
│  Advanced intelligence - expand auto-experimentation            │
│  Duration: 4-6 weeks                                             │
│  Dependencies: All above phases                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: AUTONOMOUS OPERATION                                   │
│  Capstone - AI executes while human sleeps                       │
│  Duration: 4-6 weeks                                             │
│  Dependencies: Multi-chat + Self-evolution                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Crash Prevention (Foundation)

**Duration:** 4-6 weeks  
**Dependencies:** KERNL MCP server

### Week 1-2: Observable Signals & Metrics ✅ COMPLETE

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
2. **SignalHistoryRepository** (314 LOC, 18 tests)

### Week 3-4: Checkpoint System ✅ COMPLETE

- [x] Design checkpoint schema (Day 8)
- [x] Implement checkpoint serialization with gzip compression (Day 8)
- [x] Create SQLite storage layer - CheckpointRepository (Day 8)
- [x] Build checkpoint trigger system - CheckpointManager (Day 9)
- [x] Implement auto-checkpoint integration with live signals (Day 9)
- [x] E2E checkpoint workflow testing (Day 9)

**Status:** ✅ COMPLETE (2 days)  
**Test Coverage:** 100% (50/121 tests for checkpoint components)

**Components Delivered:**
1. **CheckpointRepository** (600+ LOC, 24 tests)
2. **CheckpointManager** (218 LOC, 19 tests)

### Week 5-6: Resume Protocol ✅ COMPLETE

- [x] Implement crash detection (Day 10)
- [x] Build resume prompt generation (Day 10)
- [x] Create context reconstruction flow (Day 11)
- [x] Integrate with session start (Day 11)
- [x] End-to-end crash→resume testing (Day 11)

**Status:** ✅ COMPLETE (2 days)  
**Test Coverage:** 100% (44/165 tests for resume components)

**Components Delivered:**
1. **ResumeDetector** (213 LOC, 18 tests)
2. **SessionRestorer** (296 LOC, 13 tests)
3. **SessionStarter** (8 tests)
4. **E2E Testing** (5 tests)

### Week 7-8: Supervisor Daemon 🎯 NEXT

- [ ] Process monitoring (PID tracking)
- [ ] Crash detection (process exit events)
- [ ] Auto-restart Claude Desktop
- [ ] Auto-navigate to crashed chat
- [ ] MCP integration (trigger auto-resume)
- [ ] Windows service deployment (NSSM)
- [ ] E2E testing (crash → auto-restart → auto-resume)

**Components to Build:**
1. **ProcessMonitor** (~150 LOC)
   - Monitor Claude Desktop process
   - Detect unexpected exits
   - Track recent checkpoint times
   
2. **AutoRestarter** (~150 LOC)
   - Launch Claude Desktop
   - Navigate to specific chat URL
   - Trigger MCP resume command
   
3. **SupervisorDaemon** (~300 LOC)
   - Main daemon loop
   - Configuration management
   - Logging and error handling
   - Windows service integration

**Architecture:**
```
SupervisorDaemon (Windows Service)
  ↓
ProcessMonitor (watches Claude Desktop)
  ↓
Crash Detected (process exit + recent checkpoint)
  ↓
AutoRestarter
  ↓ 1. Launch Claude Desktop
  ↓ 2. Navigate to chat URL
  ↓ 3. Call SHIM MCP: check_resume_needed()
  ↓
Resume Happens Automatically (via existing components)
```

**Deliverable:** Zero-intervention crash recovery

---

## Phase 1 Summary

**Status:** ✅ COMPLETE (except Week 7-8)  
**Duration:** 11 days for Weeks 1-6 (ahead of schedule)  
**Tests:** 164/165 passing (99.4% pass rate)  
**Coverage:** 98%+  
**Components:** 9 core components, 3 test suites

**Ready for Phase 1.5: Analytics Infrastructure**

---

## Phase 1.5: Analytics & Auto-Experimentation (NEW)

**Duration:** 2-3 weeks (parallel with Phase 1 Week 7-8)  
**Dependencies:** Phase 1 Weeks 1-6 complete ✅  
**Philosophy:** LEAN-OUT - Use battle-tested tools, ~570 LOC custom code

### Architecture (LEAN-OUT)

```
SHIM Components
  ↓ Emit metrics
Prometheus (metrics storage - BATTLE-TESTED)
  ↓ Query metrics
OpportunityDetector (~150 LOC - CUSTOM)
  ↓ Patterns detected
Statsig (A/B testing - BATTLE-TESTED)
  ↓ Experiments run
simple-statistics (validation - BATTLE-TESTED)
  ↓ Results validated
SafetyBounds (~150 LOC - CUSTOM)
  ↓ Deploy or rollback
Auto-applied to SHIM (Kaizen loop - AUTOMATIC)
```

### Battle-Tested Tools (Zero LOC)

**Prometheus** - Metrics collection and time-series storage
- Industry standard (10+ years)
- Node.js client: `prom-client`
- Free, open-source
- Perfect for SHIM metrics

**Grafana** - Dashboards and visualization
- Built for Prometheus
- Professional dashboards out-of-box
- Free, open-source

**Statsig** - A/B testing and experimentation
- Automatic experiment management
- Statistical validation included
- Gradual rollout built-in
- Free tier available

**simple-statistics** - Statistical analysis (npm)
- T-tests, p-values, effect sizes
- 130k+ downloads/week
- Well-tested, maintained

### Week 1: Foundation

- [ ] Install and configure Prometheus
- [ ] Install and configure Grafana
- [ ] Set up Statsig account (free tier)
- [ ] Install prom-client, simple-statistics (npm)
- [ ] Create basic dashboard templates

**Deliverable:** Infrastructure ready

### Week 2: Instrumentation

- [ ] Implement SHIMMetrics (~100 LOC)
  - Prometheus metric definitions
  - Metric emission from SignalCollector
  - Metric emission from CheckpointManager
  - Metric emission from ResumeDetector
  
- [ ] Implement EventEmitter (~100 LOC)
  - Domain event definitions
  - Event emission wrapper
  - Integration with existing components

**Components:**
1. **SHIMMetrics** (~100 LOC)
   ```typescript
   // Expose SHIM metrics to Prometheus
   - crash_prediction_accuracy (gauge)
   - model_routing_accuracy (gauge)
   - checkpoint_creation_time (histogram)
   - resume_success_rate (gauge)
   - token_savings_total (counter)
   ```

2. **EventEmitter** (~100 LOC)
   ```typescript
   // Wrap existing operations with events
   analytics.trackEvent({
     type: 'checkpoint_created',
     data: { checkpointId, size, trigger }
   });
   ```

**Deliverable:** Metrics flowing into Prometheus

### Week 3: Auto-Experimentation Engine

- [ ] Implement OpportunityDetector (~150 LOC)
  - Pattern detection from Prometheus metrics
  - Hypothesis generation
  - Experiment proposals
  
- [ ] Implement StatsigIntegration (~70 LOC)
  - Experiment creation API
  - Variant assignment
  - Outcome logging
  
- [ ] Implement SafetyBounds (~150 LOC)
  - SHIM-specific safety rules
  - Bounds enforcement
  - Rollback triggers
  
- [ ] End-to-end testing (Kaizen loop)
  - Pattern detection → Experiment → Deploy
  - Rollback on regression
  - User override mechanism

**Components:**
1. **OpportunityDetector** (~150 LOC)
   ```typescript
   // SHIM-specific pattern detection
   detectPatterns(): Opportunity[] {
     // "Checkpoint interval=5 causes 12% of crashes"
     // "Model routing wrong for 'architecture' queries"
   }
   ```

2. **StatsigIntegration** (~70 LOC)
   ```typescript
   // Wrapper around Statsig SDK
   createExperiment(opportunity: Opportunity): Experiment
   getVariant(experimentId: string): Variant
   logOutcome(experimentId: string, outcome: Outcome): void
   ```

3. **SafetyBounds** (~150 LOC)
   ```typescript
   // SHIM-specific safety enforcement
   validateSafety(improvement: Improvement): boolean {
     // Check cost bounds
     // Check performance bounds
     // Check quality bounds
   }
   ```

**Deliverable:** Fully automatic Kaizen loop

---

## Phase 1.5 Summary

**Custom Code:** ~570 LOC  
**Eliminated Code:** ~1,730 LOC (by using battle-tested tools)  
**Savings:** 75% reduction in maintenance burden

**Deliverable:** Self-improving SHIM that gets better automatically

---

## Phase 2: Intelligent Model Routing (NEW)

**Duration:** 2-3 weeks  
**Dependencies:** Analytics infrastructure (Phase 1.5)

### Week 1: Core Routing Logic

- [ ] Implement PromptAnalyzer (~150 LOC)
  - Complexity detection
  - Keyword extraction
  - Task classification
  
- [ ] Implement ModelRouter (~200 LOC)
  - Routing heuristics
  - Confidence scoring
  - Cost estimation
  
- [ ] Implement TokenEstimator (~50 LOC)
  - Token counting (tiktoken)
  - Cost calculation
  - Savings tracking

**Components:**
1. **PromptAnalyzer** (~150 LOC)
   ```typescript
   analyzePrompt(prompt: string): PromptAnalysis {
     complexity: 'simple' | 'medium' | 'complex';
     requiresReasoning: boolean;
     requiresCreativity: boolean;
     hasCodeGeneration: boolean;
     keywords: string[];
   }
   ```

2. **ModelRouter** (~200 LOC)
   ```typescript
   routeToModel(prompt: string): ModelRoutingDecision {
     model: 'opus' | 'sonnet' | 'haiku';
     confidence: number;
     reasoning: string;
     estimatedCost: number;
   }
   ```

**Initial Heuristics:**
- **Haiku:** Simple file ops, CRUD, formatting, tests
- **Sonnet:** Code implementation, refactoring, documentation
- **Opus:** Architecture, complex debugging, strategic analysis

### Week 2: Learning System

- [ ] Implement OverrideLearningSystem (~100 LOC)
  - Track user overrides
  - Detect patterns
  - Update routing heuristics
  
- [ ] Integration with Statsig
  - A/B test routing changes
  - Validate improvements
  - Auto-deploy better heuristics

**Components:**
1. **OverrideLearningSystem** (~100 LOC)
   ```typescript
   recordOverride(original: Model, override: Model, prompt: string)
   detectPatterns(): RoutingPattern[]
   updateHeuristics(pattern: RoutingPattern): void
   ```

**Deliverable:** Model routing that learns from user behavior

### Week 3: Token Optimization

- [ ] Implement token budget enforcement
- [ ] Context pruning strategies
- [ ] Automatic fallback (Opus → Sonnet if budget exceeded)
- [ ] Monthly savings reporting

**Deliverable:** Automatic cost optimization

---

## Phase 2 Summary

**Custom Code:** ~400 LOC  
**Integration:** Analytics infrastructure (Phase 1.5)

**Value Proposition:**
- Automatic model selection
- Token cost optimization
- Learning from user behavior
- Monthly cost savings reports

---

## Phase 3: Multi-Chat Coordination

**Duration:** 4-6 weeks  
**Dependencies:** Crash Prevention (Phase 1), Model Routing (Phase 2)  
**Infrastructure:** Redis + BullMQ (LEAN-OUT)

### Week 1-2: Infrastructure (LEAN-OUT)

- [ ] Set up Redis server
- [ ] Install BullMQ, ioredis (npm)
- [ ] Implement chat registry (~100 LOC - CUSTOM)
- [ ] Wrap BullMQ queues (~100 LOC - CUSTOM)
- [ ] Wrap Redis Pub/Sub (~100 LOC - CUSTOM)

**LEAN-OUT Analysis:**
```
PROBLEM: Job queue, message bus, distributed locks
CUSTOM: Build from scratch (BAD - 1,500 LOC)
LEAN-OUT: Redis + BullMQ (GOOD - 300 LOC wrappers)
```

**Battle-Tested Tools:**
- **Redis** - In-memory data structure store
- **BullMQ** - Queue management with Redis backend
- **ioredis** - Redis client for Node.js

**Custom Wrappers (~300 LOC):**
- ChatRegistry (~100 LOC)
- TaskQueue wrapper (~100 LOC)
- MessageBus wrapper (~100 LOC)

### Week 3-4: Supervisor Pattern

- [ ] Implement ChatCoordinator (~200 LOC)
- [ ] Build task decomposition logic (~150 LOC)
- [ ] Create task assignment (~100 LOC)
- [ ] Build progress aggregation (~100 LOC)

**Components:**
1. **ChatCoordinator** (~200 LOC)
   - Supervisor chat orchestration
   - Task decomposition
   - Worker assignment
   
2. **TaskDistributor** (~200 LOC)
   - Task queue management
   - Load balancing
   - Priority handling

### Week 5-6: Worker Automation

- [ ] Implement worker loop (~200 LOC)
- [ ] Build task claiming logic (~100 LOC)
- [ ] Create execution reporting (~100 LOC)
- [ ] Build state synchronization (~300 LOC)

**Components:**
1. **WorkerAutomation** (~200 LOC)
   - Autonomous task execution
   - Result reporting
   - Error handling
   
2. **StateSync** (~300 LOC)
   - Shared state management
   - Conflict resolution
   - Consistency guarantees

**Deliverable:** Parallel AI execution

---

## Phase 3 Summary

**Custom Code:** ~1,100 LOC  
**Battle-Tested Tools:** Redis + BullMQ  
**Eliminated Code:** ~1,400 LOC (by using BullMQ vs custom queue)

---

## Phase 4: Self-Evolution Engine

**Duration:** 4-6 weeks  
**Dependencies:** All above phases  
**Goal:** Expand auto-experimentation to all components

### Week 1-2: Cross-Component Learning

- [ ] Multi-component pattern detection
- [ ] Holistic optimization experiments
- [ ] User behavior modeling

### Week 3-4: Advanced Experiments

- [ ] Complex parameter tuning
- [ ] Strategy comparison (A/B/C/D testing)
- [ ] Ensemble methods

### Week 5-6: User Intelligence

- [ ] Personal preference learning
- [ ] Custom heuristic generation
- [ ] Predictive suggestions

**Deliverable:** Advanced self-improvement capabilities

---

## Phase 5: Autonomous Operation

**Duration:** 4-6 weeks  
**Dependencies:** Multi-chat + Self-evolution

### Week 1-2: Goal Management

- [ ] Goal decomposition
- [ ] Sub-goal tracking
- [ ] Progress reporting

### Week 3-4: Autonomous Execution

- [ ] Overnight operation
- [ ] Decision-making under uncertainty
- [ ] Recovery from failures

### Week 5-6: Human Review

- [ ] Work review interface
- [ ] Approval workflows
- [ ] Feedback integration

**Deliverable:** AI that works while you sleep

---

## Total Project Timeline

**Phase 1:** 4-6 weeks (11 days actual for Weeks 1-6)  
**Phase 1.5:** 2-3 weeks (parallel with Phase 1 Week 7-8)  
**Phase 2:** 2-3 weeks  
**Phase 3:** 4-6 weeks  
**Phase 4:** 4-6 weeks  
**Phase 5:** 4-6 weeks

**Total:** 18-26 weeks (~4-6 months)

**LEAN-OUT Savings:**
- Custom code: ~2,770 LOC (vs ~5,000+ LOC without)
- Maintenance burden: 45% reduction
- Development hours: ~200 hours saved
- Ongoing maintenance: ~100 hours/year saved

---

## Success Criteria

**Phase 1:** Zero context loss from crashes  
**Phase 1.5:** System improves itself monthly  
**Phase 2:** 30%+ token cost reduction  
**Phase 3:** 3+ parallel AI workstreams  
**Phase 4:** 10+ automatic improvements deployed  
**Phase 5:** 8+ hours of autonomous work daily

---

*This roadmap follows LEAN-OUT principles: battle-tested tools for infrastructure, custom code only for domain-specific logic.*

*Total custom code: ~2,770 LOC (vs 5,000+ without LEAN-OUT)*  
*Focus: Build intelligence, not plumbing*
