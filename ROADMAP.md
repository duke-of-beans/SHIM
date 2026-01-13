# SHIM PROJECT ROADMAP - v5.0 (LEAN-OUT Architecture)

**Version:** 5.0 (LEAN-OUT Compliant)  
**Updated:** January 12, 2026  
**Status:** Phase 2 In Progress (40%)  
**Philosophy:** Build Intelligence, Not Plumbing

---

## 🎯 EXECUTIVE SUMMARY

**SHIM v5.0** = **LEAN-OUT architecture**: build intelligence, not plumbing.

```yaml
v2_0_rejected:
  approach: "Build 98 custom tools (8000 LOC)"
  result: "Crashed with TypeScript dependency error"
  violation: "Built plumbing instead of using existing tools"

v5_0_approved:
  approach: "6 core tools + existing tools"
  tools: "Redis, BullMQ, ESLint, jscodeshift, Grafana"
  code: "811-1011 LOC custom (87-96% reduction)"
  compliance: "✅ LEAN-OUT - build intelligence only"
```

---

## 📋 PHASES

| Phase | Status | Custom Code | Existing Tools |
|-------|--------|-------------|----------------|
| 1: Core | ✅ Complete | 311 LOC | SQLite |
| 2: Redis | 🚧 40% | +200 LOC | Redis, BullMQ |
| 3: Multi-Chat | 📅 Planned | +200 LOC | Redis Pub/Sub, Redlock |
| 4: Tools | 📅 Planned | +0-200 LOC | ESLint, jscodeshift, Grafana |
| 5: Production | 📅 Planned | +100 LOC | Prometheus, Alertmanager |
| 6: Kaizen | 🔮 v6.0 | +300 LOC | BullMQ cron |

**Total:** 811-1311 LOC vs 8000 in v2.0 (87-96% reduction)

---

## ✅ PHASE 1: CORE (COMPLETE)

**Tests:** 95/95 passing | **Coverage:** 98%+

### MCP Tools (6 core tools, 14.5kb bundle)
1. `shim_auto_checkpoint` - Auto-save session
2. `shim_check_recovery` - Detect incomplete sessions  
3. `shim_monitor_signals` - Collect crash signals
4. `shim_session_status` - Report status
5. `shim_force_checkpoint` - Manual checkpoint
6. `shim_clear_state` - Clear data

---

## 🚧 PHASE 2: REDIS (40% COMPLETE)

**Goal:** Use **Redis + BullMQ** (existing tools), not custom infrastructure

### Completed
- ✅ RedisConnectionManager
- ✅ MessageBusWrapper (Pub/Sub)

### In Progress  
- 🚧 WorkerRegistry (blocked: missing types)

### Planned
- ⬜ StateSynchronizer
- ⬜ LockManager (Redis Redlock)
- ⬜ BullMQ Integration

**Custom Code:** ~200 LOC thin wrappers

---

## 📅 PHASE 3: MULTI-CHAT (PLANNED)

**Goal:** Coordinate multiple chat instances

1. Chat Registry - Redis K/V (~50 LOC)
2. Inter-Chat Messaging - Redis Pub/Sub (~50 LOC)
3. Leader Election - Redis Redlock (~50 LOC)
4. Task Distribution - BullMQ queues (~50 LOC)

**Custom Code:** ~200 LOC | **Existing:** Redis, BullMQ

---

## 📅 PHASE 4: TOOL COMPOSITION (PLANNED)

**Goal:** Use existing tools via MCP, NOT custom implementations

### Code Analysis - Use Existing ✅
```bash
npm run analyze:all
  → eslint --format json
  → tsc --noEmit
  → complexity-report --format json
  → jscpd --format json
```

### Code Transformation - Use Existing ✅
```bash
npx jscodeshift -t transform.js src/
npx ts-morph refactor.ts
npm run lint:fix
```

### Monitoring - Use Existing ✅
- Grafana + Prometheus + Alertmanager
- Zero custom dashboard code

**Custom Code:** 0-200 LOC (optional aggregator)

---

## 📅 PHASE 5: PRODUCTION (PLANNED)

1. Error handling (BullMQ retry built-in)
2. Performance (Redis pooling/caching)
3. Monitoring (Grafana + Prometheus)
4. Documentation
5. Security (zod validation)

**Custom Code:** ~100 LOC

---

## 🔮 PHASE 6: KAIZEN (v6.0 - DEFERRED)

**Decision:** Prove core value first, add Kaizen after stable

### Why Build Later?
```yaml
prerequisite: "Phases 1-5 complete"
reason: "Prove crash prevention before autonomous improvement"
build_when: "User demand + core stable"
```

### Design (When Built)
- Experiment engine (~300 LOC domain logic)
- BullMQ scheduling (existing tool)
- Prometheus metrics (existing tool)
- Simple heuristics (not ML)

**Worth Building:** ✅ Domain intelligence, not plumbing

---

## 📊 COMPARISON

### v2.0 ❌ Violated LEAN-OUT
- 98 custom tools
- 8000 LOC
- Built generic infrastructure
- Result: Crashed

### v5.0 ✅ LEAN-OUT Compliant
- 6 core tools + existing
- 811-1011 LOC (87-96% less)
- Built intelligence only
- Result: Works

---

## 🎯 SUCCESS CRITERIA

### Phase 1 ✅
- [x] 95/95 tests passing
- [x] 98% coverage
- [x] MCP server works

### Phase 2 🚧 (40%)
- [x] Redis stable
- [x] Pub/Sub works
- [ ] Worker registry
- [ ] State sync
- [ ] BullMQ integrated

### Phases 3-5 📅
- Multi-chat coordination
- All existing tools integrated
- Grafana deployed
- Production ready

---

## 📋 NEXT ACTIONS

### Today
1. ✅ Update all docs to v5.0
2. ⬜ Complete WorkerRegistry types
3. ⬜ Test Redis end-to-end
4. ⬜ Begin StateSynchronizer

### This Week
- Complete Phase 2
- Integration tests
- Document tool patterns

### This Month
- Begin Phase 3
- Set up Grafana
- Start Phase 4

---

## 🎓 LESSONS

**v2.0 Failure:** Built plumbing (generic infrastructure)  
**v5.0 Success:** Build intelligence (domain logic only)

**Rule:** Use battle-tested tools, build only SHIM-specific logic

---

## 📚 RELATED DOCS

- `CURRENT_STATUS.md` - Real-time status
- `docs/ARCHITECTURE.md` - v5.0 architecture
- `docs/CLAUDE_INSTRUCTIONS_PROJECT.md` - Dev protocols
- `docs/MCP_LEAN_OUT_REDESIGN.md` - v2→v5 evolution
- `docs/SHIM_V2_TOOL_AUDIT.md` - 98 tools analyzed

---

**Status:** Phase 2 (40% complete)  
**Version:** 5.0 (LEAN-OUT)  
**Updated:** January 12, 2026

*"Build Intelligence, Not Plumbing"*
