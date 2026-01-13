# SHIM Phase 2 Bootstrap - Multi-Chat Coordination

**Phase:** Phase 2 (Multi-Chat Coordination via Redis)  
**Status:** Ready to Start  
**Prerequisites:** ✅ Phase 1 Complete  
**Date:** January 13, 2026

---

## Quick Start

### Bootstrap Sequence (2 minutes)

```powershell
# 1. Navigate to SHIM
cd D:\SHIM

# 2. Verify Phase 1 complete
git log --oneline -10

# 3. Read this bootstrap document
# (You're reading it now!)

# 4. Start Week 1-2: Redis Infrastructure
```

---

## Phase 2 Overview

**Goal:** Enable parallel Claude Desktop instances to coordinate via Redis

**Duration:** 4-6 weeks (Weeks 5-12 from project start)

**Approach:** **LEAN-OUT** - Use battle-tested tools (Redis + BullMQ), minimal custom wrappers

---

## Architecture (LEAN-OUT)

```
┌──────────────────────────────────────────────────┐
│  Multiple Claude Desktop Instances               │
│  (Supervisor + Workers)                          │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  Redis (Battle-Tested Infrastructure)            │
│  - Pub/Sub for messages                          │
│  - Queues via BullMQ                             │
│  - Distributed locks                             │
│  - Shared state                                  │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│  SHIM Wrappers (~300 LOC custom code)            │
│  - ChatRegistry (~100 LOC)                       │
│  - TaskQueue wrapper (~100 LOC)                  │
│  - MessageBus wrapper (~100 LOC)                 │
└──────────────────────────────────────────────────┘
```

**Why LEAN-OUT:**
- Redis: Battle-tested (15+ years), millions of deployments
- BullMQ: Production-grade job queues, 10k+ stars
- Saves ~1,400 LOC vs custom implementation
- Free, open-source, well-documented

---

## Week 1-2: Redis Infrastructure (CURRENT FOCUS)

### Objectives

1. **Set up Redis server** (Docker)
2. **Install dependencies** (ioredis, BullMQ)
3. **Build minimal wrappers** (~300 LOC)
4. **Test infrastructure** (100% coverage)

---

## Components to Build (Week 1-2)

### 1. RedisConnectionManager (~100 LOC)

**Purpose:** Manage Redis connection lifecycle

**Features:**
- Connection establishment
- Health monitoring
- Auto-reconnection with exponential backoff
- Error handling
- Connection pooling

**TDD Approach:**
```typescript
// Test file FIRST: RedisConnectionManager.test.ts
describe('RedisConnectionManager', () => {
  it('should connect to Redis', async () => { ... });
  it('should handle connection failures gracefully', async () => { ... });
  it('should reconnect automatically', async () => { ... });
  it('should emit health events', async () => { ... });
  it('should close connections cleanly', async () => { ... });
});

// Then implementation: RedisConnectionManager.ts
class RedisConnectionManager {
  constructor(config: RedisConfig) { ... }
  async connect(): Promise<void> { ... }
  async disconnect(): Promise<void> { ... }
  isHealthy(): boolean { ... }
  getConnection(): Redis { ... }
}
```

**Estimated:** 1-2 days

---

### 2. MessageBusWrapper (~150 LOC)

**Purpose:** Wrap Redis Pub/Sub for type-safe messages

**Features:**
- Channel subscription management
- Message publishing with schemas
- Pattern subscriptions (wildcards)
- Multiple subscribers per channel
- Message serialization/deserialization
- Error handling

**TDD Approach:**
```typescript
// Test file FIRST: MessageBusWrapper.test.ts
describe('MessageBusWrapper', () => {
  it('should publish messages to channels', async () => { ... });
  it('should subscribe to channels', async () => { ... });
  it('should support pattern subscriptions', async () => { ... });
  it('should handle message serialization', async () => { ... });
  it('should support multiple subscribers', async () => { ... });
});

// Then implementation: MessageBusWrapper.ts
class MessageBusWrapper {
  constructor(redis: Redis) { ... }
  async publish(channel: string, message: object): Promise<void> { ... }
  async subscribe(channel: string, handler: Handler): Promise<void> { ... }
  async subscribePattern(pattern: string, handler: Handler): Promise<void> { ... }
  async unsubscribe(channel: string): Promise<void> { ... }
}
```

**Estimated:** 2-3 days

---

### 3. WorkerRegistry (~100 LOC)

**Purpose:** Track active Claude Desktop instances

**Features:**
- Worker registration (ID, metadata)
- Heartbeat monitoring
- Worker discovery (list active workers)
- Automatic cleanup (stale workers)
- Status tracking (idle, busy, offline)

**TDD Approach:**
```typescript
// Test file FIRST: WorkerRegistry.test.ts
describe('WorkerRegistry', () => {
  it('should register workers', async () => { ... });
  it('should update worker heartbeats', async () => { ... });
  it('should list active workers', async () => { ... });
  it('should detect stale workers', async () => { ... });
  it('should unregister workers', async () => { ... });
});

// Then implementation: WorkerRegistry.ts
class WorkerRegistry {
  constructor(redis: Redis) { ... }
  async registerWorker(id: string, metadata: object): Promise<void> { ... }
  async heartbeat(id: string): Promise<void> { ... }
  async listActive(): Promise<WorkerInfo[]> { ... }
  async unregister(id: string): Promise<void> { ... }
}
```

**Estimated:** 1-2 days

---

### 4. TaskQueueWrapper (~100 LOC)

**Purpose:** Wrap BullMQ for type-safe job queues

**Features:**
- Job creation with priorities
- Job claiming (worker side)
- Job completion/failure reporting
- Queue monitoring (pending, active, completed)
- Dead letter queue (failed jobs)

**TDD Approach:**
```typescript
// Test file FIRST: TaskQueueWrapper.test.ts
describe('TaskQueueWrapper', () => {
  it('should add jobs to queue', async () => { ... });
  it('should process jobs with priorities', async () => { ... });
  it('should handle job failures', async () => { ... });
  it('should track queue metrics', async () => { ... });
  it('should support retries', async () => { ... });
});

// Then implementation: TaskQueueWrapper.ts
class TaskQueueWrapper {
  constructor(redis: Redis, queueName: string) { ... }
  async addJob(data: object, priority?: number): Promise<string> { ... }
  async process(handler: JobHandler): Promise<void> { ... }
  async getQueueStats(): Promise<QueueStats> { ... }
}
```

**Estimated:** 2-3 days

---

### 5. StateManager (~150 LOC)

**Purpose:** Distributed state synchronization

**Features:**
- Shared state storage (Redis hash maps)
- Atomic updates (Redis transactions)
- State subscriptions (watch for changes)
- Conflict resolution (last-write-wins)
- State queries (get/set/delete)

**TDD Approach:**
```typescript
// Test file FIRST: StateManager.test.ts
describe('StateManager', () => {
  it('should store and retrieve state', async () => { ... });
  it('should handle atomic updates', async () => { ... });
  it('should detect state changes', async () => { ... });
  it('should resolve conflicts', async () => { ... });
  it('should clean up old state', async () => { ... });
});

// Then implementation: StateManager.ts
class StateManager {
  constructor(redis: Redis) { ... }
  async get(key: string): Promise<any> { ... }
  async set(key: string, value: any): Promise<void> { ... }
  async subscribe(key: string, handler: Handler): Promise<void> { ... }
  async atomicUpdate(key: string, updater: Function): Promise<void> { ... }
}
```

**Estimated:** 2-3 days

---

## Infrastructure Requirements

### Docker + Redis

```bash
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

**Commands:**
```powershell
# Start Redis
docker-compose up -d redis

# Verify Redis running
docker ps
redis-cli ping  # Should return "PONG"

# Stop Redis
docker-compose down
```

---

### npm Dependencies

```bash
# Install Redis client + BullMQ
npm install --save ioredis bullmq

# Install types
npm install --save-dev @types/ioredis
```

**Already in package.json:**
- ✅ `ioredis: ^5.9.1`
- ✅ `bullmq: ^5.66.4`

---

## TDD Workflow (RED → GREEN → REFACTOR)

### Standard Process

```
1. RED Phase:
   - Write test file FIRST
   - Run tests (should FAIL)
   - Commit test file: "test: [Component] test suite"

2. GREEN Phase:
   - Write minimal implementation
   - Run tests (should PASS)
   - Commit implementation: "feat: [Component] implementation"

3. REFACTOR Phase (if needed):
   - Improve code quality
   - Keep tests GREEN
   - Commit refactor: "refactor: [Component] optimization"
```

**Quality Gates:**
- 95%+ test coverage (target: 98%+)
- All tests passing
- ESLint clean
- No technical debt

---

## Estimated Timeline (Week 1-2)

```
Day 1-2: RedisConnectionManager + tests (100 LOC)
Day 3-4: MessageBusWrapper + tests (150 LOC)
Day 5-6: WorkerRegistry + tests (100 LOC)
Day 7-8: TaskQueueWrapper + tests (100 LOC)
Day 9-10: StateManager + tests (150 LOC)
Day 11-12: Integration testing + documentation

Total: ~600 LOC custom code
Tests: ~400 LOC test code
Coverage: 98%+ target
```

---

## Success Criteria

### Week 1-2 Complete When:

✅ Redis running in Docker  
✅ All 5 components built and tested  
✅ 100+ tests passing  
✅ 95%+ coverage  
✅ Integration tests pass  
✅ Documentation complete  

**Deliverable:** Redis infrastructure ready for Week 3-4 (Supervisor Pattern)

---

## Next Steps (Week 3-4)

After Week 1-2 infrastructure complete:

**Week 3-4: Supervisor Pattern**
- ChatCoordinator (~200 LOC)
- TaskDistributor (~200 LOC)
- Task decomposition logic
- Progress aggregation

---

## References

### Files to Read

```powershell
# Phase overview
cat D:\SHIM\docs\ROADMAP.md  # Lines 450-550 (Phase 3 section)

# Current status
cat D:\SHIM\CURRENT_STATUS.md

# Completion report
cat D:\SHIM\PHASE1_COMPLETION_REPORT.md
```

### Documentation

- **Redis:** https://redis.io/docs/
- **ioredis:** https://github.com/redis/ioredis
- **BullMQ:** https://docs.bullmq.io/

---

## Bootstrap Complete!

You're ready to start **Week 1-2: Redis Infrastructure**.

**First Task:** Build RedisConnectionManager

**Estimated Time:** 4-6 hours (with tests)

**Approach:** TDD (RED → GREEN → REFACTOR)

---

*Bootstrap Date: January 13, 2026*  
*Phase 1: COMPLETE ✅*  
*Phase 2 Week 1-2: STARTING NOW*  
*Philosophy: LEAN-OUT (Battle-tested tools + minimal wrappers)*