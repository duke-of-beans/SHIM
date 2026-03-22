# BUGS FOUND — SHIM Sprint 1 Repair Session
**Date:** 2026-03-21
**Session:** SHIM Repair Sprint — Foundation Cleaning

---

## Summary

17 test suites failing out of 54 total, 131 tests failing out of 987.
All failures fall into 4 categories documented below.
**None of these bugs were introduced by this sprint** — they pre-existed.
This sprint did not modify test files or production logic.

---

## Category A: Test Files Use Wrong WorkerRegistry API (6 suites)

**Root cause:** `ChatCoordinator.ts`, `TaskDistributor.ts`, and `WorkerAutomation.ts` were written in
Phase 3 expecting a `WorkerRegistry` interface that doesn't match the actual implementation.
The test files reflect that imagined API, which also doesn't match.

The actual `WorkerRegistry` has:
- `registerWorker(workerId, chatId)` — no capabilities/capacity
- `unregisterWorker(workerId)`
- `updateStatus(workerId, status, currentTask?)`
- `WorkerInfo` has: `workerId`, `chatId`, `status`, `health`, `registeredAt`, `lastHeartbeat`

The Phase 3 code and its tests expect:
- `register(workerId, { capabilities, capacity })` — does NOT exist
- `deregister(workerId)` — does NOT exist
- `updateWorker(workerId, data)` — does NOT exist
- `WorkerInfo.id`, `WorkerInfo.capabilities`, `WorkerInfo.capacity` — do NOT exist

**Affected test files (Type B — test expects behavior that doesn't exist):**
- `src/core/ChatCoordinator.test.ts` — calls `workerRegistry.register()`, accesses `.capacity`
- `src/core/TaskDistributor.test.ts` — calls `workerRegistry.register()`, accesses `.id`, `.capabilities`
- `src/core/WorkerAutomation.test.ts` — calls `workerRegistry.register()`, `workerRegistry.deregister()`

**Fix required (NOT done in this sprint — would require logic change):**
Either extend `WorkerRegistry` with capabilities/capacity support OR update the Phase 3 components
to use the existing `WorkerRegistry` API. This is a design reconciliation task, not a type fix.

---

## Category B: Tests Require Live Redis (5 suites)

**Root cause:** These components wrap Redis/BullMQ and their tests require a running Redis instance.
No Redis is available in this dev environment during this sprint.

**Affected test files (Type A — infrastructure failure):**
- `src/core/StateSynchronizer.test.ts` — Redis operations (get/set state)
- `src/core/TaskQueueWrapper.test.ts` — BullMQ requires Redis
- `src/core/LockManager.test.ts` — Redis SET NX EX locking (also has TS errors in test file)
- `src/core/MessageBusWrapper.test.ts` — Redis Pub/Sub (NOTE: this PASSES — mocked correctly)
- `src/core/RedisConnectionManager.test.ts` — (NOTE: this PASSES — connection manager has retry/mock)

**Tests that DO pass with Redis mocked:** `RedisConnectionManager`, `MessageBusWrapper` — they mock
the Redis client. The failing ones attempt real Redis operations.

---

## Category C: TypeScript Errors Inside Test Files (5 suites)

**Root cause:** Test files have TS errors that ts-jest enforces at compile time.
These are bugs in the test code itself — the test files were written incorrectly.
Per sprint rules, these are documented but NOT fixed.

**Affected test files (Type B — test code errors):**
- `src/core/LockManager.test.ts` — passes `string | null` where `string` expected (acquire returns
  `string | null` but tests pass the result directly to `release()` without null check)
- `src/analytics/AutoExperimentEngine.test.ts` — uses deprecated `async (done)` pattern (removed
  in Jest 29+); uses event name `'experiment_completed'` not in the type definition
- `src/analytics/OpportunityDetector.test.ts` — type mismatch (`string | number` vs `number`)
- `src/analytics/SafetyBounds.test.ts` — similar type mismatch in test assertions
- `src/analytics/StatsigIntegration.test.ts` — likely similar (not fully inspected)

---

## Category D: Test Logic / Implementation Mismatch (4 suites)

**Root cause:** Tests test behaviors that either don't exist in the implementation or the
implementation doesn't match what tests expect. These are genuine implementation bugs.

**Affected test files (Type C — actual bugs, small/obvious fixes deferred):**
- `src/core/ProcessMonitor.test.ts` — ProcessMonitor behavior mismatch (not inspected in detail)
- `src/core/AutoRestarter.test.ts` — AutoRestarter behavior mismatch
- `src/core/SessionBalancer.test.ts` — calls `coordinator.listChats()` / `getProgressSummary()`
  which don't exist on ChatCoordinator (same API mismatch as Category A, but in SessionBalancer)
- `src/core/SupervisorDaemon.test.ts` — SupervisorDaemon behavior mismatch

**Analytics failures:**
- `src/analytics/SHIMMetrics.test.ts` — metrics behavior mismatch
- `src/models/ModelRouter.test.ts` — router behavior mismatch
- `src/models/PromptAnalyzer.test.ts` — analyzer behavior mismatch

---

## Unexpected Finding: NODE_ENV=production

The dev environment has `NODE_ENV=production` set globally, which caused npm to skip installing
devDependencies on every previous `npm install`. This is why jest/ts-jest/typescript were missing
from node_modules despite being in package.json. **All future install commands in this project must
use `set NODE_ENV=development && npm install` or `npm install --include=dev`.**

This should be documented in the project setup docs and ideally fixed at the environment level.

---

## Passing Baseline

The following categories all pass cleanly:
- All `src/evolution/` tests (11 suites) — ✅ 
- All `src/autonomy/` tests (8 suites) — ✅
- All `src/coordination/` tests (4 suites) — ✅
- Core phase 1 components: CheckpointRepository, CheckpointManager, CheckpointIntegration,
  SignalCollector, SignalHistoryRepository, ResumeDetector, ResumeE2E, SessionStarter,
  SessionRestorer, WorkerRegistry, MessageBusWrapper, RedisConnectionManager — ✅ (12 suites)
- `src/models/TokenEstimator.test.ts` — ✅

---

*Written by Cowork agent during SHIM Repair Sprint 1, 2026-03-21.*
*Do not fix test files based on this document without resolving the API design questions first.*
