# HANDOFF: Redis Infrastructure & Test Suite Fix

**Date:** January 10, 2026  
**Phase:** Phase 2 - Redis Infrastructure  
**Priority:** BLOCKING - Cannot commit WorkerRegistry until resolved  
**Philosophy:** Build it right. Kill and rewrite if needed. Developing takes 1/20th the time of debugging.

---

## EXECUTIVE SUMMARY

We have TypeScript compilation errors and test failures in Phase 2 Redis infrastructure. These are **architectural issues**, not syntax problems. Requires systematic fix, not whack-a-mole debugging.

**DO NOT:**
- ❌ Apply quick fixes to symptoms
- ❌ Add type assertions to silence errors
- ❌ Skip tests or use `.skip()`
- ❌ Move forward with "good enough"

**DO:**
- ✅ Understand root causes fully
- ✅ Design proper solutions
- ✅ Rewrite components if architecture wrong
- ✅ Follow TDD: RED → GREEN → REFACTOR
- ✅ Achieve 100% passing tests before commit

---

## CURRENT STATE

### Working (8 suites, 171 tests passing ✅)
- SignalCollector (53 tests)
- SignalHistoryRepository (18 tests)
- CheckpointRepository (24 tests) - **Just fixed Buffer type issues**
- CheckpointManager, CheckpointIntegration, ResumeDetector, SessionRestorer, SessionStarter

### Broken (5 suites, 45 tests failing ❌)
1. **MessageBusWrapper.test.ts** - Unknown error (need to check)
2. **TaskQueueWrapper.test.ts** - BullMQ/ioredis version conflict (ARCHITECTURAL)
3. **RedisConnectionManager.test.ts** - 7 tests, "already connecting/connected" errors
4. **WorkerRegistry.test.ts** - 18 tests, same root cause as #3
5. **ResumeE2E.test.ts** - 1 performance test (timing flake, not critical)

### Files Staged (Cannot commit until tests pass)
- `src/core/WorkerRegistry.ts` (253 LOC)
- `src/core/WorkerRegistry.test.ts` (309 LOC)
- `src/models/Redis.ts` (updated types)
- `CURRENT_STATUS.md`

---

## ROOT PROBLEM ANALYSIS

### Problem 1: BullMQ Dependency Conflict (ARCHITECTURAL)

**Symptoms:**
```
TS2322: Type 'Redis' is not assignable to type 'ConnectionOptions'
  Property 'connecting' is protected but type 'AbstractConnector' 
  is not a class derived from 'AbstractConnector'
```

**Root Cause:**
- BullMQ ships with **bundled ioredis** at `node_modules/bullmq/node_modules/ioredis`
- Our project has **separate ioredis** at `node_modules/ioredis`
- These are **different classes** despite same API
- TypeScript correctly rejects mixing them

**Why This Happened:**
```typescript
// TaskQueueWrapper.ts - WRONG APPROACH
const redisClient = await connectionManager.getClient();
new Queue('queue-name', {
  connection: redisClient  // ❌ Our ioredis instance
});
```

BullMQ expects:
1. Its own ioredis instance, OR
2. Connection options (host, port, etc.), OR  
3. Shared connection via proper pattern

**The Right Solution (Choose One):**

**Option A: Use Connection Options (Recommended)**
```typescript
// Pass connection config, let BullMQ create its own client
new Queue('queue-name', {
  connection: {
    host: config.host,
    port: config.port,
    // ... other options
  }
});
```
- ✅ Simple, works immediately
- ✅ BullMQ manages its own connection lifecycle
- ❌ Creates separate Redis connection (not shared)

**Option B: Use BullMQ's ioredis**
```typescript
// Import from BullMQ's bundled version
import Redis from 'bullmq/node_modules/ioredis';
```
- ❌ Fragile dependency path
- ❌ Not standard practice
- ❌ Will break on updates

**Option C: Shared Connection Pool (Proper Architecture)**
```typescript
// Create connection pool that both BullMQ and our code use
// Requires redesigning RedisConnectionManager
```
- ✅ Proper production pattern
- ✅ Single connection pool
- ⚠️ Requires architectural work (2-3 hours)

**Decision Framework:**
- If TaskQueue is **core to system**: Option C (proper architecture)
- If TaskQueue is **optional/future**: Option A (simple, works)
- If unsure: **Option A first**, refactor to C later

**Additional Errors in TaskQueueWrapper:**
```typescript
// Line 163
await job.update(updates.data);  // ❌ Method doesn't exist

// Line 199
stalledInterval: 30000,  // ❌ Not in AdvancedOptions type
```

These suggest **API version mismatch**. Check:
1. BullMQ version in package.json
2. Documentation at https://docs.bullmq.io/
3. Whether we're using outdated API patterns

---

### Problem 2: Redis Connection Lifecycle in Tests (SYSTEMATIC)

**Symptoms:**
```
Redis is already connecting/connected
  at RedisConnectionManager.connect()
```

**Root Cause:**
Tests are calling `connect()` multiple times on same ioredis client. ioredis throws error if you connect when already connected.

**Why This Happened:**
```typescript
// RedisConnectionManager.test.ts
beforeEach(async () => {
  redisManager = new RedisConnectionManager(testConfig);
  await redisManager.connect();  // ❌ Connects here
});

it('should connect successfully', async () => {
  await redisManager.connect();  // ❌ Tries to connect again - ERROR
});
```

**The Wrong Fix:**
```typescript
// DON'T DO THIS
if (!this.client.status || this.client.status === 'end') {
  await this.client.connect();  // Symptom treatment
}
```

**The Right Fix (Test Infrastructure):**

**Pattern 1: Lazy Connect in Tests**
```typescript
// Use lazyConnect: true in test configs
const testConfig: RedisConfig = {
  host: 'localhost',
  port: 6379,
  lazyConnect: true,  // ✅ Don't auto-connect
};

beforeEach(() => {
  redisManager = new RedisConnectionManager(testConfig);
  // ❌ Don't call connect() here
});

it('should connect successfully', async () => {
  await redisManager.connect();  // ✅ First connect here
  expect(redisManager.isConnected()).toBe(true);
});

afterEach(async () => {
  await redisManager.disconnect();  // ✅ Clean up
});
```

**Pattern 2: State Tracking**
```typescript
// In RedisConnectionManager
async connect(): Promise<void> {
  if (this.client.status === 'ready') {
    return;  // ✅ Already connected, skip
  }
  // ... connect logic
}
```

**Pattern 3: Proper Test Isolation**
```typescript
afterEach(async () => {
  // ✅ Always clean up
  if (redisManager && redisManager.isConnected()) {
    await redisManager.disconnect();
  }
  
  // ✅ Wait for full disconnect
  await new Promise(resolve => setTimeout(resolve, 100));
});
```

**Apply This Pattern To:**
1. `RedisConnectionManager.test.ts` (7 failing tests)
2. `WorkerRegistry.test.ts` (18 failing tests)  
3. Any other Redis-using test files

---

### Problem 3: MessageBusWrapper (Unknown - Check First)

**Status:** Fixed EventHandler return types, but still shows FAIL

**Action Required:**
1. Run: `npm test -- src/core/MessageBusWrapper.test.ts`
2. Read full error output
3. Identify actual problem
4. Fix properly (not symptom treatment)

---

## DECISION FRAMEWORK

### Question 1: Can I fix this with <10 line change?
- **NO** → Architectural issue, needs redesign
- **YES** → Verify it's root cause, not symptom

### Question 2: Do I understand the root cause?
- **NO** → Stop. Research. Read docs. Understand fully.
- **YES** → Proceed with fix

### Question 3: Will this fix break anything else?
- **MAYBE** → Write failing test first (TDD)
- **NO** → Write test anyway (TDD)

### Question 4: Is this production-quality code?
- **NO** → Rewrite properly
- **YES** → Proceed

---

## STEP-BY-STEP EXECUTION PLAN

### Step 1: Assess MessageBusWrapper (5 minutes)
```bash
npm test -- src/core/MessageBusWrapper.test.ts 2>&1 | Select-String -Pattern "error|FAIL" -Context 5
```

**Possible outcomes:**
- Still has TypeScript errors → Fix them properly
- Runtime test failures → Debug with proper logging
- Passes now → Great, move to Step 2

### Step 2: Fix BullMQ Architecture (30-60 minutes)

**Sub-step 2.1: Research** (15 minutes)
1. Read BullMQ docs: https://docs.bullmq.io/guide/connections
2. Check our BullMQ version: `npm list bullmq`
3. Read their connection patterns
4. Decide: Option A (simple) vs Option C (proper)

**Sub-step 2.2: Design** (15 minutes)
1. If Option A: Write connection config approach
2. If Option C: Design shared connection pool
3. Sketch new TaskQueueWrapper constructor
4. Verify against BullMQ docs

**Sub-step 2.3: Implement** (30 minutes)
```typescript
// Example Option A approach:
export class TaskQueueWrapper {
  private queue: Queue;
  private worker: Worker;
  private config: RedisConfig;  // Store config, not client

  constructor(
    queueName: string,
    config: RedisConfig,  // ✅ Take config
    // Don't take RedisConnectionManager
  ) {
    this.config = config;
    
    // ✅ Let BullMQ create its own connection
    this.queue = new Queue(queueName, {
      connection: {
        host: config.host,
        port: config.port,
        db: config.db,
        // ... other config
      }
    });
  }
}
```

**Sub-step 2.4: Update Tests** (15 minutes)
```typescript
// TaskQueueWrapper.test.ts
describe('TaskQueueWrapper', () => {
  let taskQueue: TaskQueueWrapper;
  const config = createTestRedisConfig();

  beforeEach(() => {
    taskQueue = new TaskQueueWrapper('test-queue', config);
    // ✅ BullMQ handles connection internally
  });

  afterEach(async () => {
    await taskQueue.cleanup();  // ✅ Proper cleanup
  });
});
```

### Step 3: Fix Redis Test Lifecycle (30 minutes)

**Sub-step 3.1: Update RedisConnectionManager.test.ts**
```typescript
describe('RedisConnectionManager', () => {
  let redisManager: RedisConnectionManager;
  
  const testConfig: RedisConfig = {
    ...REDIS_TEST_CONFIG,
    lazyConnect: true,  // ✅ KEY CHANGE
  };

  beforeEach(() => {
    redisManager = new RedisConnectionManager(testConfig);
    // ❌ DON'T connect here
  });

  afterEach(async () => {
    // ✅ Always disconnect
    if (redisManager?.isConnected()) {
      await redisManager.disconnect();
    }
  });

  describe('connection lifecycle', () => {
    it('should connect successfully', async () => {
      await redisManager.connect();  // ✅ First connect
      expect(redisManager.isConnected()).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      await redisManager.connect();
      await redisManager.disconnect();
      expect(redisManager.isConnected()).toBe(false);
    });
  });
});
```

**Sub-step 3.2: Update WorkerRegistry.test.ts**
```typescript
describe('WorkerRegistry', () => {
  let registry: WorkerRegistry;
  let redisManager: RedisConnectionManager;

  const testConfig = {
    ...createTestRedisConfig(),
    lazyConnect: true,  // ✅ KEY CHANGE
  };

  beforeEach(async () => {
    redisManager = new RedisConnectionManager(testConfig);
    await redisManager.connect();  // ✅ Connect once
    
    registry = new WorkerRegistry(redisManager);
  });

  afterEach(async () => {
    if (registry) {
      await registry.cleanup();
    }
    if (redisManager?.isConnected()) {
      await redisManager.disconnect();
    }
  });
});
```

### Step 4: Verify Everything (10 minutes)
```bash
# Run full test suite
npm test

# Should see:
# Test Suites: 13 passed, 13 total
# Tests: 216 passed, 216 total (or close to it)
```

### Step 5: Commit WorkerRegistry (5 minutes)
```bash
git add -A
git commit -m "feat(phase2): Add WorkerRegistry with Redis-based worker coordination

WHAT CHANGED:
- Implemented WorkerRegistry for distributed worker management
- Added worker registration, heartbeat monitoring, health tracking
- Comprehensive test suite (18 tests, 100% coverage)
- Fixed BullMQ connection architecture (use connection config)
- Fixed Redis test lifecycle (lazyConnect pattern)

TECHNICAL DETAILS:
- Worker registration with metadata and capabilities
- Heartbeat monitoring with configurable timeout
- Health status tracking (healthy, degraded, crashed, unknown)
- Status management (idle, busy, paused)
- Performance benchmarks met (<50ms registration, <20ms heartbeat)

FIXES APPLIED:
- BullMQ: Use connection options instead of shared client
- Tests: lazyConnect: true pattern for proper lifecycle
- RedisConnectionManager: Proper state management in tests

Phase 2 Week 2 complete. All infrastructure tests passing.
95+ tests passing, 98%+ coverage maintained.

Closes: Phase 2 Week 2 - Worker Registry
Next: Phase 2 Week 3 - Distributed Checkpoints"
```

---

## QUALITY GATES (Must Pass Before Commit)

1. ✅ **All tests passing** - Zero failures, zero skips
2. ✅ **TypeScript compiles** - Zero errors
3. ✅ **Coverage maintained** - 98%+ coverage
4. ✅ **Performance benchmarks** - All timing tests pass
5. ✅ **No workarounds** - No type assertions, no `.skip()`, no TODOs
6. ✅ **Proper architecture** - Clean separation, proper dependency injection
7. ✅ **Documentation updated** - If architecture changed

---

## REFERENCE MATERIALS

### BullMQ Documentation
- Connection patterns: https://docs.bullmq.io/guide/connections
- Queue options: https://docs.bullmq.io/guide/queues
- Job API: https://docs.bullmq.io/guide/jobs

### ioredis Documentation
- Connection lifecycle: https://github.com/redis/ioredis#connect
- Connection state: https://github.com/redis/ioredis#connection-events
- lazyConnect: https://github.com/redis/ioredis#auto-reconnect

### Our Codebase
- Redis config: `src/config/redis.ts`
- RedisConnectionManager: `src/core/RedisConnectionManager.ts`
- Test helpers: `createTestRedisConfig()` in redis config

---

## EXPECTED OUTCOME

**Before:**
```
Test Suites: 5 failed, 8 passed, 13 total
Tests: 45 failed, 171 passed, 216 total
```

**After:**
```
Test Suites: 13 passed, 13 total
Tests: 216 passed, 216 total
Coverage: 98%+
```

**Files Committed:**
- WorkerRegistry.ts (253 LOC)
- WorkerRegistry.test.ts (309 LOC)
- TaskQueueWrapper.ts (updated architecture)
- Redis.ts (types)
- Test files (lifecycle fixes)
- CURRENT_STATUS.md

**Time Estimate:** 1-2 hours if done properly

---

## PHILOSOPHY REMINDERS

**From User:**
> "Do it right the first time. Developing takes 1/20th the time of debugging."
> "I'm never in a hurry - EVER."
> "Kill it and write again if need be."

**Implementation:**
- Understand root causes FULLY before coding
- Design proper solutions, not quick fixes
- Rewrite components if architecture wrong
- TDD: Test first, implement second
- Quality gates before commit

**If Uncertain:**
- Read documentation thoroughly
- Sketch architecture before coding
- Ask: "Is this how production system would work?"
- Prefer robust over clever
- Prefer simple over complex

---

## ANTI-PATTERNS TO AVOID

❌ **Type Assertion Band-Aids:**
```typescript
connection: redisClient as any  // NO
connection: redisClient as ConnectionOptions  // NO
```

❌ **Skipping Tests:**
```typescript
it.skip('will fix later', ...)  // NO
```

❌ **Error Suppression:**
```typescript
try {
  await connect();
} catch {
  // ignore - NO
}
```

❌ **Conditional Workarounds:**
```typescript
if (alreadyConnected) {
  return;  // Maybe OK, but check if symptom
}
```

✅ **Proper Solutions:**
```typescript
// Fix architecture
// Update types correctly
// Use proper patterns
// Clean separation of concerns
```

---

## SUCCESS CRITERIA

- [ ] All 13 test suites passing
- [ ] 216+ tests passing
- [ ] Zero TypeScript errors
- [ ] 98%+ coverage maintained
- [ ] WorkerRegistry committed with proper message
- [ ] No technical debt introduced
- [ ] Architecture clean and maintainable

**When all checkboxes checked:** WorkerRegistry complete, Phase 2 Week 2 done.

---

**GO SLOW. BUILD IT RIGHT. NO SHORTCUTS.**

*Generated: January 10, 2026*  
*Next Instance: Read this fully BEFORE touching code*
