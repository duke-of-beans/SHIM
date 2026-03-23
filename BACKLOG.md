# SHIM — BACKLOG
Last Updated: 2026-03-22 (Sprint 3)

## P0 — Critical (blocking Phase 4)
- [ ] Replace ioredis-mock with testcontainers real Redis for LockManager, StateSynchronizer, TaskDistributor
      → Unblocks 3 failing suites; unblocks Phase 4 planning
      → See BLOCKED_LOCKMANAGER.md for full diagnosis
- [ ] Fix CategoryD test/implementation mismatches (ProcessMonitor, AutoRestarter, SupervisorDaemon)

## P1 — High Priority (Redis/BullMQ mock gap)
- [ ] TaskQueueWrapper: BullMQ Lua scripts fail against ioredis-mock (same root cause as LockManager)
- [ ] StateSynchronizer: deep integration runtime failures (Lua gap)
- [ ] TaskDistributor: blocked by StateSynchronizer

## P2 — Analytics/Model Logic Failures (11 suites)
- [ ] OpportunityDetector — runtime assertion failures
- [ ] SafetyBounds — runtime assertion failures
- [ ] StatsigIntegration — runtime assertion failures
- [ ] AutoExperimentEngine — runtime assertion failures
- [ ] SHIMMetrics — runtime assertion failures
- [ ] ModelRouter — logic failures
- [ ] PromptAnalyzer — logic failures
- [ ] AutoRestarter — lifecycle/logic failures
- [ ] ProcessMonitor — lifecycle/logic failures
- [ ] SupervisorDaemon — lifecycle/logic failures
- [ ] Integration (evolution) — runtime failures

## P3 — Normal Queue
- [ ] Phase 4 planning (Autonomous Workflows) — blocked on P0
- [ ] Grafana/Prometheus monitoring
- [ ] Document NODE_ENV=production in README

## P4 — Eventually
- [ ] Phase 5: Kaizen loop (deferred to v6.0)
- [ ] Phase 6: External distribution

## Completed (Sprint 3 — 2026-03-22)
- [x] ChatCoordinator suite — StateSynchronizer API mismatch fixed (test-only mock)
- [x] WorkerAutomation suite — BullMQ open-handle issue fixed (test-only mocks)
- [x] LockManager flaky timing — bounds widened for CI variance
- [x] npx tsc --noEmit: 0 errors maintained
- [x] BLOCKED_LOCKMANAGER.md written

## Completed (Sprint 2 — 2026-03-22)
- [x] WorkerRegistry API mismatch fixed across 4 test files
- [x] TS errors eliminated in analytics test files
- [x] ioredis-mock installed and basic Redis mock working
- [x] 0 TypeScript compilation errors

## Completed (Sprint 1 — 2026-03-21)
- [x] SHIM-1: NODE_ENV root cause identified, devDeps installed, 71 TS errors fixed
- [x] CURRENT_STATUS.md aligned to portfolio standard
