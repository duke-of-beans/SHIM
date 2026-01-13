# SHIM ARCHITECTURE - v5.0 (LEAN-OUT)

**Version:** 5.0  
**Updated:** January 12, 2026  
**Philosophy:** Build Intelligence, Not Plumbing

---

## 🎯 ARCHITECTURAL PRINCIPLE

```yaml
lean_out_rule:
  build: "Intelligence (domain-specific logic)"
  use: "Existing tools (battle-tested infrastructure)"
  avoid: "Plumbing (generic infrastructure)"

decision_framework:
  generic_infrastructure: "Use existing tools ✅"
  domain_logic: "Build custom ✅"
  custom_infrastructure: "❌ NEVER"
```

---

## 📊 SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Desktop                           │
│                  (Multiple Instances)                        │
└──────────────────┬──────────────────────────────────────────┘
                   │ stdio (MCP Protocol)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP Server (Thin Coordinator)                   │
│  6-8 core tools │ 14.5kb bundle │ 311-511 LOC               │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────────┬──────────────┐
    │          │          │              │              │
    ▼          ▼          ▼              ▼              ▼
┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│SQLite  │ │ Redis  │ │ BullMQ  │ │ ESLint   │ │  Grafana   │
│Local   │ │State   │ │ Queues  │ │jscodeshift│ │Prometheus │
│Persist │ │Pub/Sub │ │Schedule │ │Analysis  │ │Monitoring │
└────────┘ └────────┘ └─────────┘ └──────────┘ └────────────┘
   Core      Redis      Redis      Existing    Existing
   (Phase1)  (Phase2)   (Phase2)   (Phase4)    (Phase5)
```

---

## 🏗️ LAYERED ARCHITECTURE

### Layer 1: MCP Server (Coordination)
**Role:** Thin stdio coordinator  
**Code:** 311-511 LOC  
**Responsibility:** Route tool calls to appropriate systems

```typescript
// MCP Server - Thin coordination only
case 'shim_auto_checkpoint':
  return checkpointService.save(context);

case 'shim_analyze_code':
  return spawn('npm', ['run', 'lint:json']);  // Use existing tool

case 'shim_monitor_metrics':
  return fetch('http://localhost:3000/api/metrics');  // Query Grafana
```

### Layer 2: Core Services (Domain Logic)
**Role:** SHIM-specific intelligence  
**Code:** 311 LOC (Phase 1)  
**Components:**
- CheckpointService - Session state management
- RecoveryService - Incomplete session detection
- SignalService - Crash warning heuristics
- SessionService - Session lifecycle

**Key:** This IS domain intelligence - build custom ✅

### Layer 3: Infrastructure (Thin Wrappers)
**Role:** Minimal wrappers around existing tools  
**Code:** 200-300 LOC (Phases 2-3)  
**Components:**
- RedisConnectionManager (~100 LOC)
- MessageBusWrapper (~50 LOC)
- WorkerRegistry (~50 LOC)
- StateSynchronizer (~50 LOC)
- LockManager (~50 LOC)

**Key:** Just wrappers, not implementations

### Layer 4: Existing Tools (Battle-Tested)
**Role:** Heavy lifting  
**Code:** 0 LOC custom  
**Tools:**
- Redis - State, Pub/Sub, Locking
- BullMQ - Job queues, Scheduling
- ESLint - Code analysis
- jscodeshift - Code transformation
- Grafana - Dashboards
- Prometheus - Metrics

**Key:** Don't rebuild these ❌

---

## 🔧 COMPONENT BREAKDOWN

### Phase 1: Core (✅ Complete)

#### SignalCollector
```typescript
// Domain intelligence - worth building
class SignalCollector {
  collectSignals(): CrashRisk {
    // SHIM-specific heuristics
    const tokenRisk = this.tokenCount > 150000 ? 0.3 : 0;
    const timeRisk = this.timeSinceCheckpoint > 480000 ? 0.4 : 0;
    const memoryRisk = this.memoryUsage > 0.8 ? 0.3 : 0;
    return { risk: tokenRisk + timeRisk + memoryRisk };
  }
}
```

#### CheckpointRepository
```typescript
// Simple persistence - use SQLite (existing)
class CheckpointRepository {
  async save(checkpoint: Checkpoint): Promise<void> {
    await this.db.run(
      'INSERT INTO checkpoints...',
      checkpoint
    );
  }
}
```

### Phase 2: Redis (🚧 40% Complete)

#### RedisConnectionManager
```typescript
// Thin wrapper - minimal custom code
class RedisConnectionManager {
  private client: Redis;  // ioredis library
  
  async connect(): Promise<void> {
    this.client = new Redis(config);  // Use existing
    this.setupHealthChecks();         // ~20 LOC custom
  }
}
```

#### MessageBusWrapper
```typescript
// Thin wrapper over Redis Pub/Sub
class MessageBusWrapper {
  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }
  
  async subscribe(channel: string, handler: Function): Promise<void> {
    await this.redis.subscribe(channel);
    this.redis.on('message', (ch, msg) => handler(JSON.parse(msg)));
  }
}
```

### Phase 4: Tool Composition (📅 Planned)

#### Code Analysis - Use Existing ✅
```typescript
// Don't build custom analyzer - use existing tools
async function analyzeCode(path: string) {
  const results = await Promise.all([
    exec('eslint --format json'),        // Use ESLint
    exec('tsc --noEmit'),                 // Use TypeScript
    exec('complexity-report --format json'),  // Use complexity-report
    exec('jscpd --format json')          // Use jscpd
  ]);
  
  // Optional: Aggregate results (~50 LOC)
  return aggregateResults(results);
}
```

#### Code Transformation - Use Existing ✅
```typescript
// Don't build custom transformer - use jscodeshift
async function refactorCode(path: string, transform: string) {
  return exec(`jscodeshift -t ${transform} ${path}`);
}
```

#### Monitoring - Use Existing ✅
```yaml
# Don't build custom dashboard - use Grafana
monitoring:
  metrics_collection: "Prometheus"
  dashboards: "Grafana"
  alerts: "Alertmanager"
  custom_code: "0 LOC"
```

---

## 🔄 DATA FLOW

### Checkpoint Flow
```
Claude Action
   ↓
MCP Tool Call (shim_auto_checkpoint)
   ↓
CheckpointService (domain logic)
   ↓
SQLite (local persist)
   ↓
Redis (distributed state) - Phase 2
```

### Multi-Chat Coordination Flow (Phase 3)
```
Chat Instance A
   ↓
MCP Tool Call (send_message)
   ↓
MessageBusWrapper (thin wrapper)
   ↓
Redis Pub/Sub (existing tool)
   ↓
MessageBusWrapper (thin wrapper)
   ↓
Chat Instance B
```

### Code Analysis Flow (Phase 4)
```
User Request
   ↓
MCP Tool Call (shim_analyze_code)
   ↓
Process Spawn (exec)
   ↓
ESLint, TSC, complexity-report (existing tools)
   ↓
Optional Aggregator (~50 LOC)
   ↓
Return Results
```

---

## 📏 CODE BUDGET

### By Phase

| Phase | Component | Custom LOC | Existing Tools |
|-------|-----------|------------|----------------|
| 1 | Core Services | 311 | SQLite |
| 2 | Redis Wrappers | +200 | Redis, BullMQ |
| 3 | Coordination | +200 | Redis Pub/Sub, Redlock |
| 4 | Tool Composition | +0-200 | ESLint, jscodeshift, Grafana |
| 5 | Production | +100 | Prometheus, Alertmanager |
| 6 | Kaizen (v6.0) | +300 | BullMQ cron |
| **Total** | **1011-1311** | **vs 8000 in v2.0** |

### By Category

| Category | Custom Code | Existing Tool | Decision |
|----------|-------------|---------------|----------|
| Domain Logic | 611 LOC | N/A | ✅ Build (intelligence) |
| Thin Wrappers | 400 LOC | Redis, BullMQ | ✅ Build (minimal) |
| Infrastructure | 0 LOC | Redis, BullMQ | ✅ Use existing |
| Analysis | 0 LOC | ESLint, TSC | ✅ Use existing |
| Transformation | 0 LOC | jscodeshift | ✅ Use existing |
| Monitoring | 0 LOC | Grafana | ✅ Use existing |

---

## 🎯 ARCHITECTURAL DECISIONS

### Decision 1: MCP Server Size
**Question:** How many tools in MCP server?  
**Decision:** 6-8 core tools only  
**Rationale:** Thin coordinator, not computation engine  
**Result:** 14.5kb bundle (was 2MB in v2.0)

### Decision 2: Redis vs Custom Queue
**Question:** Build custom job queue?  
**Decision:** Use BullMQ + Redis  
**Rationale:** Battle-tested, feature-rich, maintained  
**Result:** 0 LOC custom queue code

### Decision 3: Code Analysis
**Question:** Build AST analyzer?  
**Decision:** Use ESLint, TSC, complexity-report  
**Rationale:** Existing tools better than custom  
**Result:** 0 LOC custom analyzer

### Decision 4: Monitoring Dashboard
**Question:** Build custom dashboard?  
**Decision:** Use Grafana + Prometheus  
**Rationale:** Grafana far superior to custom UI  
**Result:** 0 LOC custom dashboard

### Decision 5: Kaizen Loop Timing
**Question:** Build Kaizen now?  
**Decision:** Defer to v6.0  
**Rationale:** Prove core value first  
**Result:** Focus on Phases 1-5 stability

---

## 🔐 SECURITY

### Authentication
- Local SQLite - No auth needed
- Redis - Optional password
- MCP - stdio (local process)
- Grafana - User auth

### Data Privacy
- Checkpoints stored locally (SQLite)
- Redis state temporary/ephemeral
- No sensitive data in logs
- zod validation on all inputs

---

## 📈 PERFORMANCE

### Targets
```yaml
checkpoint_save: "<100ms"
recovery_detect: "<500ms"
tool_invocation: "<2s"
redis_ops: "<10ms"
mcp_bundle_size: "<50kb"
memory_usage: "<100MB"
```

### Optimizations
- Redis connection pooling
- SQLite WAL mode
- Lazy loading
- Async operations
- Minimal dependencies

---

## 🧪 TESTING STRATEGY

### Unit Tests
- All core services (95 tests)
- Redis wrappers (20+ tests planned)
- 95%+ coverage required

### Integration Tests
- Redis end-to-end (planned)
- Multi-chat coordination (planned)
- Tool composition (planned)

### E2E Tests
- Full workflow (planned)
- Crash scenarios (planned)
- Recovery flows (planned)

---

## 📚 TECHNOLOGY STACK

### Core
- Language: TypeScript (strict)
- Runtime: Node.js 18+
- Protocol: MCP (stdio)

### Storage
- Local: SQLite
- Distributed: Redis
- Queues: BullMQ

### External Tools
- Analysis: ESLint, TSC, complexity-report, jscpd
- Transformation: jscodeshift, ts-morph, prettier
- Monitoring: Grafana, Prometheus, Alertmanager

### Libraries
- Redis: ioredis
- Validation: zod
- Testing: Jest
- Build: esbuild

---

## 🔮 FUTURE (v6.0)

### Kaizen Loop
```yaml
components:
  experiment_engine: "~300 LOC domain logic"
  scheduling: "BullMQ cron"
  metrics: "Prometheus + Grafana"
  learning: "Simple heuristics (not ML)"

rationale: "Domain intelligence - worth building"
timing: "After Phases 1-5 stable"
```

---

**Architecture:** v5.0 (LEAN-OUT)  
**Principle:** Build Intelligence, Not Plumbing  
**Status:** Phase 2 (40% complete)  
**Updated:** January 12, 2026
