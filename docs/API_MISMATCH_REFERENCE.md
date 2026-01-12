# API MISMATCH REFERENCE - Quick Lookup

**Purpose:** Quick reference for Session 4 API alignment  
**Status:** Discovered mismatches from compilation errors

---

## CONSTRUCTOR MISMATCHES

### MessageBusWrapper
```typescript
// Service calls:
new MessageBusWrapper(config);  // ❌ Wrong

// Backend expects:
new MessageBusWrapper(redisConnectionManager);  // ✅ Correct
```

### CheckpointRepository
```typescript
// Service calls:
new CheckpointRepository();  // ❌ Wrong (0 args)

// Backend expects:
new CheckpointRepository(dbPath);  // ✅ Correct (1 arg)
```

### SignalHistoryRepository
```typescript
// Service calls:
new SignalHistoryRepository();  // ❌ Wrong (0 args)

// Backend expects:
new SignalHistoryRepository(dbPath);  // ✅ Correct (1 arg)
```

### WorkerRegistry
```typescript
// Service calls:
new WorkerRegistry();  // ❌ Wrong (0 args)

// Backend expects:
new WorkerRegistry(redisConnectionManager);  // ✅ Correct (1 arg)
```

---

## MISSING TYPE EXPORTS

### Analytics Components
- `DetectorConfig` (OpportunityDetector) - Not exported
- `BoundConfig` (SafetyBounds) - Not exported
- `EngineStatus.experiments` - Property doesn't exist

### Autonomy Components
- `Goal` type - Not exported from GoalDecomposer

### Evolution Components
- `DeploymentConfig` - Not exported from DeploymentManager

---

## METHOD SIGNATURE MISMATCHES

### AutoExperimentEngine
```typescript
// Service calls:
engine.configure(config);  // ❌ Method signature wrong

// Backend has:
constructor(config);  // Configure in constructor only
```

### OpportunityDetector
```typescript
// Service calls:
detector.detect(metrics);  // ❌ Method doesn't exist

// Backend needs:
// Method to be added or service updated
```

### WorkerRegistry
```typescript
// Service calls:
registry.register(workerId, metadata);  // ❌ Method doesn't exist
registry.listAll();  // ❌ Method doesn't exist
registry.getHealth(workerId);  // ❌ Method doesn't exist

// Backend needs:
// These methods to be added
```

### CheckpointRepository
```typescript
// Service calls:
repo.list(filters);  // ❌ Method doesn't exist
repo.restore(checkpointId);  // ❌ Method doesn't exist
repo.delete(checkpointId);  // ❌ Method doesn't exist

// Backend has:
load(sessionId);  // Different interface
save(checkpoint);  // Different interface
```

---

## PATTERN: PLANNED VS ACTUAL APIs

### Planned API (Services Expect)
Services were designed with rich, high-level APIs:
- `list()`, `query()`, `getHistory()` methods
- Flexible parameter objects
- Multiple convenience methods

### Actual API (Backend Provides)
Backend implements simpler, lower-level APIs:
- Basic CRUD operations
- Fixed parameter lists
- Fewer methods, more focused

---

## SESSION 4 TODO CHECKLIST

### Phase 1: Type Exports ☐
- [ ] Export DetectorConfig from OpportunityDetector
- [ ] Export BoundConfig from SafetyBounds
- [ ] Export Goal from GoalDecomposer
- [ ] Export DeploymentConfig from DeploymentManager
- [ ] Add missing properties to EngineStatus

### Phase 2: Constructor Fixes ☐
- [ ] AnalyticsService constructors
- [ ] AutonomyService constructors
- [ ] CoordinationService constructors
- [ ] EvolutionService constructors
- [ ] InfrastructureService constructors
- [ ] ModelsService constructors
- [ ] MLService constructors
- [ ] MonitoringService constructors
- [ ] PerformanceService constructors

### Phase 3: Method Additions ☐
- [ ] Add WorkerRegistry methods (register, listAll, getHealth)
- [ ] Add CheckpointRepository methods (list, restore, delete)
- [ ] Add OpportunityDetector methods (detect, getHistory)
- [ ] Add methods for remaining ~50 mismatches

### Phase 4: Validation ☐
- [ ] Compile with zero errors
- [ ] Test tool invocations
- [ ] Document any deferred work

---

## QUICK COMMANDS FOR SESSION 4

### Check Compilation
```bash
cd D:\SHIM\mcp-server
npm run build 2>&1 | Select-Object -First 20
```

### Find Method Signature
```bash
cd D:\SHIM\src
Desktop Commander:start_search(path=".", pattern="methodName", searchType="content")
```

### List Exports
```bash
Desktop Commander:read_file(path="src/analytics/OpportunityDetector.ts", length=20)
```

---

**Last Updated:** January 12, 2026  
**Session:** 3 (Backend Integration - Phase 1)  
**Next:** Session 4 (API Alignment)
