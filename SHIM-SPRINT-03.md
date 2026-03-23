Execute Sprint SHIM-SPRINT-03 — Phase 3 Runtime Integration Fixes.
Run FIRST. No dependencies.

Read these files FIRST before doing anything:
  Filesystem:read_file D:\Projects\SHIM\CURRENT_STATUS.md
  Filesystem:read_file D:\Projects\SHIM\ROADMAP.md
  Filesystem:read_file D:\Projects\SHIM\src\coordination\ChatCoordinator.ts
  Filesystem:read_file D:\Projects\SHIM\src\infrastructure\StateSynchronizer.ts
  Filesystem:read_file D:\Projects\SHIM\src\coordination\WorkerAutomation.ts

Summary: SHIM Sprint 2 eliminated all TypeScript compile errors (0 failing to compile).
16 suites still fail at runtime. This sprint targets the two highest-priority runtime
blockers: ChatCoordinator state initialization gap and WorkerAutomation lifecycle timing.
After this sprint: ChatCoordinator and WorkerAutomation suites pass, suite count drops
from 16 failing to ≤12 failing, and Phase 4 planning can begin.

Tasks:

1. Fix ChatCoordinator runtime failures — test file only:
   Root cause: ChatCoordinator.assignTasks() calls StateSynchronizer.updateFields()
   which throws "State not found" when worker state hasn't been initialized.
   Fix: In ChatCoordinator.test.ts, add beforeEach that pre-seeds worker state in
   the Redis mock before any test that calls assignTasks().
   Pre-seeding pattern: call the same state initialization that WorkerRegistry.registerWorker()
   would call, directly on the StateSynchronizer mock before the assign call.
   DO NOT modify production code. Test file changes only.
   Verify: ChatCoordinator test suite passes after fix.

2. Fix WorkerAutomation runtime failures — test file only:
   Root cause: timing/lifecycle — worker start/stop sequencing in tests doesn't
   match the async initialization pattern in production.
   Diagnosis approach: read the specific failure messages from the jest output,
   identify whether failures are timing (use fake timers) or sequence (reorder
   setup/teardown). Apply the minimal fix in the test file only.
   DO NOT modify production code. Test file changes only.
   Verify: WorkerAutomation test suite passes (or documents exactly why it can't
   without a production code change, in which case write BLOCKED_WORKERAUTOMATION.md).

<!-- phase:execute -->

3. Fix LockManager flaky timing test:
   One test in LockManager.test.ts fails ~20% of runs due to timing sensitivity.
   Identify the specific test, apply either: fake timers (jest.useFakeTimers),
   increased timeout, or rewritten assertion that doesn't depend on real-time elapsed.
   DO NOT change production lock timing logic.

4. Quality gate:
   Run: pytest equivalent for Node — npx jest --testPathPattern="ChatCoordinator|WorkerAutomation|LockManager"
   All three targeted suites must pass.
   Run full suite: npx jest — record new pass/fail counts in MORNING_BRIEFING.
   Target: ≤12 failing suites (down from 16). Document actual result honestly.

5. Phase 4 readiness assessment:
   Read ROADMAP.md Phase 4-5 section.
   Based on current test state after this sprint, write a 1-paragraph assessment:
   "Phase 4 is [ready/not ready] because [specific reason]. Blocking items: [list].
   Recommended next sprint: [specific target]."
   Write this to CURRENT_STATUS.md under a new "## Phase 4 Readiness" section.

6. Portfolio compliance check:
   - CURRENT_STATUS.md: update verified metrics block with new pass/fail counts
   - CHANGELOG.md: add SHIM-SPRINT-03 entry
   - BACKLOG.md: create if missing; add remaining 13+ failing suites as backlog items
     grouped by category (Redis/BullMQ mock gap, analytics logic, model/core logic)

7. Session close:

   FRICTION PASS — collect, triage FIX NOW / BACKLOG / LOG ONLY, present [A/B/C].

   MORNING_BRIEFING.md — write to D:\Projects\SHIM\ BEFORE git add:
   Sections: SHIPPED, QUALITY GATES, DECISIONS MADE BY AGENT,
   UNEXPECTED FINDINGS, FRICTION LOG, NEXT QUEUE.

   git add + commit + push — MORNING_BRIEFING.md included.
   Commit message via commit-msg.txt:
     SHIM-SPRINT-03: Phase 3 runtime fixes — ChatCoordinator state seeding,
     WorkerAutomation lifecycle, LockManager flaky timing

CRITICAL CONSTRAINTS:
- Production code changes require explicit justification. If a test cannot pass
  without a production code change, write BLOCKED_[SUITE].md explaining exactly
  what change is needed and why. Do not make the change without flagging it.
- Shell: cmd (not PowerShell). NODE_ENV=production is set globally — use
  --include=dev on any npm install.
- TypeScript: npx tsc --noEmit must still return 0 errors after this sprint.
- MORNING_BRIEFING.md written BEFORE git add. Included in commit.

Project: D:\Projects\SHIM
Shell: cmd (not PowerShell). cd /d D:\Projects\SHIM
Git: D:\Program Files\Git\cmd\git.exe — full path. Commit via commit-msg.txt.
Node: node in PATH. npm install --include=dev if needed.

ACCEPTANCE CRITERIA:
  ChatCoordinator.test.ts: suite passes (0 failing tests)
  WorkerAutomation.test.ts: suite passes OR BLOCKED_WORKERAUTOMATION.md written
  LockManager.test.ts: suite passes consistently (run 3x to verify)
  npx tsc --noEmit: 0 errors
  Full jest run: ≤12 failing suites (documented in MORNING_BRIEFING)
  CURRENT_STATUS.md: verified metrics block updated with new counts
  CURRENT_STATUS.md: Phase 4 Readiness section added
  CHANGELOG.md: SHIM-SPRINT-03 entry present
  MORNING_BRIEFING.md: exists at D:\Projects\SHIM\
