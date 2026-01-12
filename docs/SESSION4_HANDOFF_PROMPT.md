# SHIM SESSION 4 HANDOFF PROMPT

**Copy and paste this entire message to start Session 4**

---

# Context: SHIM Backend Integration - Session 4

I'm continuing work on SHIM (Session Handling & Intelligent Management) from Session 3. I need to complete API signature alignment between the MCP service layer and backend components.

## 🎯 Current State

**What's Done (Session 3):**
- ✅ Infrastructure facade layer created (10 components, 510 LOC)
- ✅ Import paths fixed (all modules resolving)
- ✅ Main SHIM project compiles cleanly (0 errors)
- ✅ Comprehensive documentation created
- ✅ Git commits complete (2 commits)

**What's Blocked:**
- ⚠️ MCP server has ~114 TypeScript compilation errors
- ⚠️ API signature mismatches between services and backend
- ⚠️ Constructor signature mismatches
- ⚠️ Missing type exports
- ⚠️ Method name/parameter mismatches

## 📚 Documentation Available

**Read these first:**
1. `D:\SHIM\docs\SESSION3_HANDOFF.md` (306 lines) - Complete session summary
2. `D:\SHIM\docs\API_MISMATCH_REFERENCE.md` (181 lines) - Quick lookup for API fixes

**Key info:**
- Root cause: Services written against planned API, backend implements different API
- Scope: ~114 signature mismatches across 9 services
- Estimate: 2.5-3 hours to fix

## 🎯 Session 4 Objectives

**Goal:** Fix all compilation errors in MCP server, achieve 100% clean build

**Tasks:**
1. Export missing types from backend components (~10 types)
2. Fix constructor signatures in services (~9 constructors)
3. Align method calls with actual backend APIs (~95 method fixes)
4. Compile with zero errors
5. Git commit

## 🚀 Recommended Approach

### Phase 1: Export Missing Types (30 min)
```typescript
// Example: src/analytics/OpportunityDetector.ts
// Add: export type DetectorConfig = { ... };
```

Backend files to update:
- `src/analytics/OpportunityDetector.ts` → Export `DetectorConfig`
- `src/analytics/SafetyBounds.ts` → Export `BoundConfig`
- `src/autonomy/GoalDecomposer.ts` → Export `Goal` type
- `src/evolution/DeploymentManager.ts` → Export `DeploymentConfig`
- Others documented in API_MISMATCH_REFERENCE.md

### Phase 2: Fix Constructors (45 min)
Pattern: Services instantiate components with wrong signatures

Example fix:
```typescript
// BEFORE (wrong):
this.messageBus = new MessageBusWrapper(config);

// AFTER (correct):
const redis = new RedisConnectionManager();
this.messageBus = new MessageBusWrapper(redis);
```

### Phase 3: Fix Method Calls (60 min)
Pattern: Services call methods that don't exist or have wrong signatures

Example fix:
```typescript
// BEFORE (wrong):
const results = await this.detector.detect(metrics);

// AFTER (correct):
// Either: Add detect() method to backend
// Or: Use existing method with correct signature
```

### Phase 4: Validate (30 min)
```bash
cd D:\SHIM\mcp-server
npm run build  # Should show 0 errors
```

## 🛠️ Quick Commands

**Check compilation errors:**
```bash
cd D:\SHIM\mcp-server
npm run build 2>&1 | Select-Object -First 50
```

**Find backend implementation:**
```bash
Desktop Commander:read_file(path="src/analytics/OpportunityDetector.ts", length=30)
```

**Search for method signatures:**
```bash
Desktop Commander:start_search(
  path="D:\\SHIM\\src", 
  pattern="methodName",
  searchType="content"
)
```

## 📊 Progress Tracking

Start with this checkpoint:
```typescript
KERNL:auto_checkpoint({
  project: "shim",
  operation: "Backend Integration - Phase 2: API Alignment",
  progress: 0.35,  // Session 3 left off at 35%
  currentStep: "Starting Session 4 - API signature fixes",
  decisions: [
    "Phase 1: Export missing types",
    "Phase 2: Fix constructor signatures", 
    "Phase 3: Align method calls"
  ],
  nextSteps: [
    "Read API_MISMATCH_REFERENCE.md",
    "Fix ~10 type exports",
    "Fix ~9 constructor calls",
    "Fix ~95 method signatures",
    "Compile with 0 errors"
  ],
  activeFiles: [
    "D:\\SHIM\\mcp-server\\src\\services\\*.ts"
  ]
})
```

## 📁 File Locations

**Services to fix (9 files):**
```
D:\SHIM\mcp-server\src\services\
├─ AnalyticsService.ts (~30 errors)
├─ AutonomyService.ts (~15 errors)
├─ CoordinationService.ts (~12 errors)
├─ EvolutionService.ts (~20 errors)
├─ InfrastructureService.ts (~15 errors)
├─ ModelsService.ts (~5 errors)
├─ MLService.ts (~3 errors)
├─ MonitoringService.ts (~2 errors)
└─ PerformanceService.ts (~4 errors)
```

**Backend components (reference):**
```
D:\SHIM\src\
├─ analytics\ (5 components)
├─ autonomy\ (8 components)
├─ coordination\ (4 components)
├─ evolution\ (10 components)
├─ core\ (14 components)
└─ infrastructure\ (6 components)
```

## 🎯 Success Criteria

- [ ] All TypeScript compilation errors fixed
- [ ] MCP server builds cleanly (0 errors)
- [ ] No type mismatches
- [ ] All 104 tools compile successfully
- [ ] Git commit with detailed message
- [ ] Documentation updated

## 🚨 Important Notes

**Quality Standards:**
- Fix API calls systematically (don't skip errors)
- Test compilation after each phase
- Use `edit_block` for surgical fixes (not full file rewrites)
- Commit after each major phase

**LEAN-OUT Principle:**
- If backend method missing → Add minimal implementation
- Prefer backend changes over service workarounds
- Keep stubs simple (full implementation later)

**Common Patterns:**
- Constructor signature mismatch: Check backend constructor requirements
- Method doesn't exist: Either add to backend or find equivalent method
- Type not exported: Add export to backend file
- Wrong parameters: Match backend method signature

## 🔗 Git Status

**Latest Commits:**
```
997f47a docs: Update status - Session 3 infrastructure layer complete
f15df63 feat(infrastructure): Add facade layer for MCP service integration
```

**Branch:** master  
**Working Directory:** Clean (all changes committed)

---

## ⚡ START HERE

1. Read `SESSION3_HANDOFF.md` (5 min)
2. Read `API_MISMATCH_REFERENCE.md` (3 min)
3. Run checkpoint command above
4. Start Phase 1: Export missing types
5. Compile frequently to track progress
6. Use systematic approach (don't rush)

**Expected Duration:** 2.5-3 hours  
**Expected Outcome:** MCP server compiles cleanly, all 104 tools ready for testing

---

**Let's fix these API signatures and get SHIM fully integrated! 🚀**
