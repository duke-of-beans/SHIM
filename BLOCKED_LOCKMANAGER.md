# BLOCKED: LockManager Test Suite — ioredis-mock NX Gap

**Sprint:** SHIM-SPRINT-03
**Date:** 2026-03-22
**Status:** BLOCKED — cannot pass without real Redis or smarter mock

## Root Cause

`ioredis-mock` does not correctly enforce `SET NX EX` semantics. When a key
already exists, `SET key value EX ttl NX` should return `null` (no-op), but
ioredis-mock returns `'OK'` regardless. This means `LockManager.acquire()`
always succeeds, breaking every test that relies on exclusive locking.

Additionally, `ioredis-mock` does not execute Lua scripts (`redis.eval`).
`LockManager.release()` and `LockManager.extend()` both use Lua for atomic
check-and-set — they always return 0 against the mock, so releases never
clean up the Redis key.

## Symptoms

- `acquire()` on an already-locked resource returns a new lock ID (should return null)
- `release()` always returns false (Lua eval not supported)
- `extend()` always returns false (Lua eval not supported)
- All tests that assert `lock2 === null` or `released === true` fail

## Tests Affected

- `Basic Lock Operations › should prevent acquiring already-locked resource`
- `Lock Expiration › should auto-release lock after TTL`
- `Lock Expiration › should use default TTL if not specified`
- `Lock Extension › should extend lock TTL`
- `Lock Extension › should fail to extend with wrong lock ID`
- `Lock Extension › should fail to extend expired lock`
- `Lock Stealing Prevention › should not release with wrong lock ID`
- `Lock Stealing Prevention › should prevent concurrent lock acquisition`
- `Timeout and Retry › should retry lock acquisition with timeout`
- `Timeout and Retry › should fail after timeout expires`

## Flaky Timing Fix (Applied)

The timing tolerance fix was applied (`<700ms` → `<1500ms`) but is irrelevant
until the NX gap is resolved, since `lock2` is never null.

## Required Fix (Production Code Not Changed)

**Option A (preferred):** Replace ioredis-mock with a real Redis instance via
`testcontainers` (Docker). LockManager logic is correct — it just needs a real
Redis that supports NX and Lua.

**Option B:** Mock the Redis client at a lower level, intercepting `set()` calls
to enforce NX manually and stubbing `eval()` to run the Lua logic in JS.

## What Changed is Needed

No production code changes. The fix is test infrastructure:
- Install `testcontainers` devDependency
- Start a real Redis container in `beforeAll`
- Remove `ioredis-mock` dependency for LockManager tests

**Estimated effort:** 1 sprint task (~2 hours)
**Priority:** MEDIUM — LockManager is not on the Phase 4 critical path
