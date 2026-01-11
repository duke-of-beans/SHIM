# 🏗️ SHIM Architecture

**Version:** 0.2.0 (Analytics & Model Routing Added)  
**Last Updated:** January 11, 2026

## Overview

**SHIM** (thin layer that intercepts and enhances AI platform capabilities) is a comprehensive **self-improving** system enabling autonomous AI-assisted development through:
- Crash Prevention & Recovery
- Intelligent Model Routing (NEW)
- Analytics & Auto-Experimentation (NEW - Kaizen Loop)
- Multi-Chat Coordination  
- Self-Evolution Engine
- Zero-Intervention Development

**Target:** Professional developers using Claude Desktop 4+ hours/day

**Name Etymology:** In computing, a shim is a library that transparently intercepts API calls and changes the arguments passed, handles the operation itself, or redirects the operation elsewhere. SHIM intercepts Claude Desktop's capabilities and enhances them with persistence, coordination, and intelligence.

**NEW: Fully Automatic Self-Improvement**
- Continuous A/B testing without human intervention
- Statistical validation and gradual rollout
- Automatic parameter tuning within safety bounds
- Zero manual improvement application required

---

## LEAN-OUT Principle

> "Build intelligence, not plumbing. Use battle-tested tools for generic problems."

**Infrastructure Stack:**
- **Redis + BullMQ** - Job queues, messaging, locks
- **Prometheus + Grafana** - Metrics storage, dashboards
- **Statsig** - A/B testing, experiments
- **simple-statistics** - Statistical validation
- **SQLite** - Local persistence
- **File System** - Large payloads

**Custom Code Focus:**
- Domain-specific logic only
- SHIM-specific intelligence
- Minimal wrappers (<100 LOC)

**Result:** ~2,770 LOC custom code (vs 5,000+ without LEAN-OUT)

---

## ARCHITECTURE COMPONENTS

### Component 1: Crash Prevention System ✅ COMPLETE

**Status:** Phase 1 Weeks 1-6 Complete

**Key Features:**
- Predictive crash detection via observable signals
- Continuous state serialization every N tool calls
- Auto-pause before predicted crash
- Instant resume with full context reconstruction

**Observable Signals:**
- Response latency (threshold: 500ms baseline × 2.5)
- Message count (threshold: 50+)
- Total tokens (threshold: >50% context window)
- Tool failure rate (threshold: >20%)
- Session duration (threshold: >90 minutes)

**Checkpoint Schema:**
- Conversation state (messages, summary, decisions)
- Task state (operation, phase, progress, blockers)
- File state (active, modified, staged, uncommitted diff)
- Tool state (active sessions, pending operations)

**Implemented Components:**
- SignalCollector (238 LOC, 53 tests) ✅
- SignalHistoryRepository (314 LOC, 18 tests) ✅
- CheckpointRepository (600+ LOC, 24 tests) ✅
- CheckpointManager (218 LOC, 19 tests) ✅
- ResumeDetector (213 LOC, 18 tests) ✅
- SessionRestorer (296 LOC, 13 tests) ✅
- SessionStarter (8 tests) ✅

**Next:** Supervisor Daemon (Week 7-8)

---

### Component 1.5: Analytics & Auto-Experimentation (NEW)

**Status:** Designed (Phase 1.5)

**Purpose:** Fully automatic self-improvement via Kaizen loop.

**Architecture (LEAN-OUT):**
```
┌─────────────────────────────────────┐
│    SHIM Core Components             │
│  (Crash Prevention, Model Routing)  │
└───────────────┬─────────────────────┘
                │ Emit metrics
                ▼
┌─────────────────────────────────────┐
│      PROMETHEUS (Battle-Tested)     │
│    Time-series metrics storage      │
│    prom-client (Node.js)            │
└───────────────┬─────────────────────┘
                │ Query metrics
                ▼
┌─────────────────────────────────────┐
│   OpportunityDetector (CUSTOM)      │
│   ~150 LOC - SHIM-specific          │
│   Pattern detection                 │
└───────────────┬─────────────────────┘
                │ Opportunities
                ▼
┌─────────────────────────────────────┐
│      STATSIG (Battle-Tested)        │
│    A/B testing framework            │
│    Free tier, automatic rollout     │
└───────────────┬─────────────────────┘
                │ Experiments
                ▼
┌─────────────────────────────────────┐
│  simple-statistics (Battle-Tested)  │
│    Statistical validation           │
│    T-tests, p-values, effect sizes  │
└───────────────┬─────────────────────┘
                │ Validated
                ▼
┌─────────────────────────────────────┐
│    SafetyBounds (CUSTOM)            │
│    ~150 LOC - SHIM-specific         │
│    Domain safety rules              │
└───────────────┬─────────────────────┘
                │ Deploy
                └──► Auto-apply to SHIM
                     (Kaizen loop)
```

#### Battle-Tested Tools (Zero Custom LOC)

**Prometheus** - Metrics collection
- Industry standard (10+ years)
- Node.js client: `prom-client`
- Perfect for time-series metrics
- Free, open-source

**Grafana** - Dashboards
- Built for Prometheus
- Professional dashboards out-of-box
- Free, open-source

**Statsig** - A/B Testing
- Automatic experiment management
- Statistical validation included
- Gradual rollout built-in
- Free tier available

**simple-statistics (npm)** - Statistical analysis
- T-tests, p-values, effect sizes
- 130k+ downloads/week
- Well-tested, maintained

#### Custom Components (~570 LOC)

**SHIMMetrics** (~100 LOC)
```typescript
// Prometheus metric definitions
class SHIMMetrics {
  // Crash prevention metrics
  crash_prediction_accuracy: Gauge;
  checkpoint_creation_time: Histogram;
  resume_success_rate: Gauge;
  
  // Model routing metrics
  model_routing_accuracy: Gauge;
  model_override_rate: Gauge;
  token_savings_total: Counter;
  
  // Multi-chat metrics
  parallel_tasks_active: Gauge;
  coordination_overhead: Histogram;
}
```

**OpportunityDetector** (~150 LOC)
```typescript
// SHIM-specific pattern detection
class OpportunityDetector {
  detectPatterns(): Opportunity[] {
    // "Checkpoint interval=5 causes 12% of crashes"
    // "Model routing wrong for 'architecture' queries"
    // "Context pruning saves 2.4M tokens/month"
  }
  
  formHypothesis(pattern: Pattern): Hypothesis {
    // "Reducing interval to 3 prevents 12% of crashes"
  }
  
  proposeExperiment(hypothesis: Hypothesis): ExperimentProposal {
    // Design A/B test with variants
  }
}
```

**StatsigIntegration** (~70 LOC)
```typescript
// Wrapper around Statsig SDK
class StatsigIntegration {
  createExperiment(proposal: ExperimentProposal): Experiment;
  getVariant(experimentId: string): Variant;
  logOutcome(experimentId: string, outcome: Outcome): void;
  checkResults(experimentId: string): ExperimentResults;
}
```

**SafetyBounds** (~150 LOC)
```typescript
// SHIM-specific safety enforcement
class SafetyBounds {
  validateSafety(improvement: Improvement): boolean {
    // Cost bounds (max $20/week increase)
    if (improvement.costIncrease > 20) return false;
    
    // Performance bounds (max 100ms latency increase)
    if (improvement.latencyIncrease > 100) return false;
    
    // Quality bounds (never sacrifice accuracy)
    if (improvement.accuracyDecrease > 0) return false;
    
    return true;
  }
  
  monitorDeployment(improvement: Improvement): void {
    // Automatic rollback if regression detected
  }
}
```

**EventEmitter** (~100 LOC)
```typescript
// Domain event emission
class EventEmitter {
  trackEvent(event: SHIMEvent): void {
    // Wrap existing operations with events
    // Feed into Prometheus metrics
  }
}
```

#### Kaizen Loop (Fully Automatic)

```
1. SHIM operates normally
   ↓ Emit metrics (prom-client)
   
2. Prometheus stores metrics
   ↓ OpportunityDetector queries
   
3. Detect patterns
   ↓ Form hypothesis
   
4. Design experiment
   ↓ Statsig creates A/B test
   
5. Run experiment (automatic)
   ↓ 50% control, 50% treatment
   
6. Validate results
   ↓ simple-statistics (t-test, p-value)
   
7. Check safety
   ↓ SafetyBounds enforcement
   
8. Gradual rollout (automatic)
   ↓ 10% → 50% → 100%
   
9. Monitor for regression
   ↓ Auto-rollback if needed
   
10. Deploy or rollback
    ↓ Log improvement
    
[LOOP - Zero human intervention]
```

#### User Control (Override Mechanism)

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

### Component 2: Intelligent Model Routing (NEW)

**Status:** Designed (Phase 2)

**Purpose:** Automatic model selection with token optimization.

**Problem Solved:**
- User manually picks Opus vs Sonnet for each chat
- Wastes expensive tokens on simple tasks
- Wastes time with cheaper models on complex tasks
- No learning from user behavior

**Solution:** Automatic routing to cheapest capable model + learning system.

#### Architecture

```
User Prompt
     ↓
┌─────────────────────────────────────┐
│   PromptAnalyzer (~150 LOC)         │
│   - Complexity detection            │
│   - Keyword extraction              │
│   - Task classification             │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   ModelRouter (~200 LOC)            │
│   - Routing heuristics              │
│   - Confidence scoring              │
│   - Cost estimation                 │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   Recommended Model                 │
│   (Haiku / Sonnet / Opus)           │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   User Override? (optional)         │
│   @opus, @sonnet, @haiku            │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   OverrideLearningSystem (~100 LOC) │
│   - Track patterns                  │
│   - Update heuristics (via Statsig) │
└─────────────────────────────────────┘
```

#### Components (~400 LOC custom)

**PromptAnalyzer** (~150 LOC)
```typescript
interface PromptAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  hasCodeGeneration: boolean;
  contextSize: number;
  keywords: string[];
}

class PromptAnalyzer {
  analyze(prompt: string): PromptAnalysis {
    // Keyword detection
    // Complexity scoring
    // Task classification
  }
}
```

**ModelRouter** (~200 LOC)
```typescript
interface ModelRoutingDecision {
  model: 'opus' | 'sonnet' | 'haiku';
  confidence: number;
  reasoning: string;
  estimatedTokens: number;
  costEstimate: number;
}

class ModelRouter {
  route(prompt: string): ModelRoutingDecision {
    // Initial heuristics:
    // Haiku: Simple ops, CRUD, formatting
    // Sonnet: Code, refactoring, tests
    // Opus: Architecture, complex debugging
  }
}
```

**OverrideLearningSystem** (~100 LOC)
```typescript
class OverrideLearningSystem {
  recordOverride(
    original: Model,
    override: Model,
    prompt: string
  ): void {
    // Track user corrections
  }
  
  detectPatterns(): RoutingPattern[] {
    // "User always forces Opus for 'architecture'"
  }
  
  updateHeuristics(pattern: RoutingPattern): void {
    // Via Statsig A/B test
    // Validate improvement
    // Auto-deploy if proven
  }
}
```

**TokenEstimator** (~50 LOC)
```typescript
class TokenEstimator {
  estimate(prompt: string): number {
    // Using tiktoken library
  }
  
  calculateCost(tokens: number, model: Model): number {
    // Opus: $15/$75 per 1M tokens
    // Sonnet: $3/$15 per 1M tokens
    // Haiku: $0.25/$1.25 per 1M tokens
  }
}
```

#### Token Optimization Strategies

**From GREGORE lessons:**
1. Structured data > prose (JSON index vs markdown = 12x faster)
2. Aggressive checkpointing (every 2-3 tool calls)
3. Smart context pruning (keep only relevant history)

**New SHIM features:**
4. Model routing (automatic model selection)
5. Token budget enforcement (per-task limits)
6. Learning system (improve routing over time)

#### Integration with Analytics

**Metrics emitted:**
```typescript
// Model routing decision
analytics.track({
  type: 'model_routing_decision',
  data: {
    recommended: 'sonnet',
    confidence: 0.87,
    factors: { complexity: 'medium', hasCode: true }
  }
});

// User override
analytics.track({
  type: 'model_override',
  data: {
    original: 'sonnet',
    override: 'opus',
    reason: 'needs strategic thinking'
  }
});
```

**Auto-improvement via Statsig:**
- Detect: "40% override rate for 'architecture' prompts"
- Hypothesis: "Auto-select Opus for architecture"
- Test: A/B test for 7 days
- Validate: Override rate drops to 15%
- Deploy: Automatically if statistically significant

---

### Component 3: Multi-Chat Coordination Protocol

**Status:** Designed (Phase 3)

**Infrastructure:** Redis + BullMQ (LEAN-OUT)

**Key Features:**
- Shared state via Redis
- Work delegation with BullMQ job queues
- Supervisor/Worker coordination pattern
- Cross-chat communication via Redis Pub/Sub

**Architecture Pattern:**
```
┌─────────────────┐
│  SUPERVISOR     │ (Project-level orchestration)
│  Claude Chat    │
└────────┬────────┘
         │ Task assignment via BullMQ
         ▼
┌────────────────────────────────┐
│  WORKER POOL                   │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Chat 1│ │Chat 2│ │Chat 3│   │
│  └──────┘ └──────┘ └──────┘   │
└────────────────────────────────┘
         │ Progress updates (Redis Pub/Sub)
         ▼
┌─────────────────┐
│  REDIS + BullMQ │ (Shared infrastructure)
│  - Job queues   │
│  - Pub/Sub      │
│  - Locks        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  SQLite         │ (Local persistence)
│  - Checkpoints  │
│  - Analytics    │
└─────────────────┘
```

**LEAN-OUT Analysis:**
```
PROBLEM: Job queue, message bus, locks
CUSTOM: Build from scratch (BAD - 1,500 LOC)
LEAN-OUT: Redis + BullMQ (GOOD - 300 LOC wrappers)

Savings: 1,200 LOC eliminated
```

**Custom Wrappers (~300 LOC):**
- ChatRegistry (~100 LOC)
- TaskQueue wrapper (~100 LOC)
- MessageBus wrapper (~100 LOC)

---

### Component 4: Self-Evolution Engine (Expanded)

**Status:** Designed (Phase 4)

**Purpose:** Expand auto-experimentation to all components.

**Builds on Phase 1.5 Analytics Infrastructure:**
- Phase 1.5: Basic Kaizen loop (checkpoint tuning, model routing)
- Phase 4: Advanced experiments (cross-component, user modeling)

#### Advanced Experimentation

**Cross-Component Learning:**
```typescript
// Example: Optimize entire workflow
experiment = {
  name: 'crash_prevention_workflow',
  hypothesis: 'Combined improvements across components',
  variants: {
    control: {
      checkpointInterval: 5,
      modelRouting: 'conservative',
      contextPruning: 'minimal'
    },
    treatment: {
      checkpointInterval: 3,
      modelRouting: 'aggressive',
      contextPruning: 'smart'
    }
  },
  metrics: ['crash_rate', 'cost', 'user_satisfaction']
};
```

**User Behavior Modeling:**
```typescript
// Learn personal preferences
userModel = {
  preferredModels: {
    'architecture': 'opus',
    'implementation': 'sonnet',
    'tests': 'haiku'
  },
  workPatterns: {
    morningFocus: 'strategic',
    afternoonFocus: 'implementation'
  },
  tolerances: {
    maxLatency: 200,  // ms
    maxCost: 30  // $/week
  }
};
```

#### Guardrails

```typescript
interface EvolutionGuardrails {
  // Safety limits
  maxAutoChangesPerSession: 3;
  requireHumanApproval: ['Level 3 changes', 'Breaking changes'];
  rollbackOnRegression: true;
  
  // Validation gates
  mustImproveMetrics: ['crashRate', 'interventionRate'];
  mustNotDegrade: ['responseLatency', 'successRate'];
  
  // Audit trail
  logAllChanges: true;
  enableRevert: true;
}
```

---

### Component 5: Autonomous Development Engine

**Status:** Designed (Phase 5)

**Purpose:** Execute development workflows without human intervention.

**Dependencies:** Multi-chat + Self-evolution

#### Autonomous Workflow Types

**Type A: Code Implementation (Supervised)**
```
User: "Implement feature X"
      │
      ▼
┌─────────────────────────────────────────────┐
│  AUTONOMOUS EXECUTION                        │
│                                              │
│  1. Parse requirement                        │
│  2. Design approach (checkpoint)             │
│  3. Implement code                           │
│  4. Run TypeScript check                     │
│  5. Run tests                                │
│  6. Auto-commit if clean                     │
│  7. Report completion                        │
│                                              │
│  Escalate if: Test failures, ambiguity,     │
│               architectural decisions        │
└─────────────────────────────────────────────┘
```

**Type B: Background Monitoring (Unsupervised)**
```
┌─────────────────────────────────────────────┐
│  BACKGROUND PROCESSES                        │
│                                              │
│  • Watch file changes → Auto-compile        │
│  • Monitor build → Alert on failures        │
│  • Track git status → Suggest commits       │
│  • Observe patterns → Suggest optimizations │
│                                              │
│  Runs continuously. No escalation needed.   │
└─────────────────────────────────────────────┘
```

**Type C: Recovery Operations (Automatic)**
```
┌─────────────────────────────────────────────┐
│  AUTO-RECOVERY                               │
│                                              │
│  Detect crash → Load checkpoint              │
│             → Restore context                │
│             → Continue operation             │
│             → Notify user if desired         │
│                                              │
│  Zero intervention. Self-healing.            │
└─────────────────────────────────────────────┘
```

---

## Complete System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│              (Claude Desktop + MCP)                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                  SHIM CORE LAYER                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Crash      │  │ Model      │  │ Multi-Chat │            │
│  │ Prevention │  │ Routing    │  │ Coord      │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────────┬─────────────────────────────────┘
                             │ Emit events/metrics
                             ▼
┌──────────────────────────────────────────────────────────────┐
│           ANALYTICS & AUTO-EXPERIMENTATION                   │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐               │
│  │Prometheus │  │ Statsig  │  │simple-stats│ (Battle-Tested)│
│  └───────────┘  └──────────┘  └────────────┘               │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Opportunity  │  │ SafetyBounds │ (Custom ~300 LOC)      │
│  │ Detector     │  │              │                         │
│  └──────────────┘  └──────────────┘                        │
└────────────────────────────┬─────────────────────────────────┘
                             │ Improvements (validated)
                             └──► Auto-apply to SHIM Core
                                  (Kaizen loop)
                                  
┌──────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE (Battle-Tested)                  │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐              │
│  │   Redis    │  │  BullMQ  │  │   SQLite   │              │
│  └────────────┘  └──────────┘  └────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

---

## LOC Breakdown (LEAN-OUT)

### Custom Code (~2,770 LOC)

**Phase 1: Crash Prevention (~1,000 LOC)**
- SignalCollector: 238 LOC ✅
- SignalHistoryRepository: 314 LOC ✅
- CheckpointRepository: 600+ LOC ✅
- CheckpointManager: 218 LOC ✅
- ResumeDetector: 213 LOC ✅
- SessionRestorer: 296 LOC ✅
- SessionStarter: ~100 LOC ✅
- SupervisorDaemon: ~300 LOC (next)

**Phase 1.5: Analytics (~570 LOC)**
- SHIMMetrics: ~100 LOC
- OpportunityDetector: ~150 LOC
- StatsigIntegration: ~70 LOC
- SafetyBounds: ~150 LOC
- EventEmitter: ~100 LOC

**Phase 2: Model Routing (~400 LOC)**
- PromptAnalyzer: ~150 LOC
- ModelRouter: ~200 LOC
- TokenEstimator: ~50 LOC

**Phase 3: Multi-Chat (~800 LOC)**
- ChatRegistry: ~100 LOC
- TaskQueue wrapper: ~100 LOC
- MessageBus wrapper: ~100 LOC
- ChatCoordinator: ~200 LOC
- TaskDistributor: ~200 LOC
- WorkerAutomation: ~200 LOC
- StateSync: ~300 LOC

**Total: ~2,770 LOC**

### Eliminated Code (via LEAN-OUT)

**Without LEAN-OUT (estimated):**
- Custom analytics: ~1,250 LOC
- Custom A/B testing: ~1,050 LOC
- Custom job queue: ~1,500 LOC
- **Total: ~6,570 LOC**

**With LEAN-OUT:**
- Custom code: ~2,770 LOC
- **Savings: 3,800 LOC (58% reduction)**

**Maintenance burden eliminated:** ~3,800 LOC × years

---

## Technology Stack

**Battle-Tested Infrastructure:**
- Redis + BullMQ (job queues, messaging, locks)
- Prometheus + Grafana (metrics, dashboards)
- Statsig (A/B testing, experiments)
- simple-statistics (statistical validation)
- SQLite (local persistence)
- tiktoken (token estimation)

**Custom Components:**
- TypeScript (strict mode, ESLint)
- Jest (testing framework)
- Domain-specific intelligence (~2,770 LOC)

**Result:** Focus on intelligence, not plumbing

---

*This architecture follows LEAN-OUT principles: battle-tested tools for infrastructure, custom code only for domain-specific logic.*

*Total custom code: ~2,770 LOC (vs 6,570 without LEAN-OUT)*  
*Savings: 3,800 LOC eliminated (58% reduction in maintenance burden)*  
*Focus: Build intelligence, not plumbing*
