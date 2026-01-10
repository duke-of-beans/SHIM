# ESLint Violations Fix Plan

**Status:** PENDING  
**Priority:** HIGH - Must fix before Phase 2  
**Violations:** 35 total across 9 files  
**Estimated Time:** 30-45 minutes

---

## Violation Categories

### 1. Unused Imports/Variables (14 violations)

**Files Affected:**
- CheckpointIntegration.test.ts (Checkpoint import unused)
- CheckpointManager.ts (shouldCheckpoint, risk unused)  
- ResumeDetector.ts (CrashRisk import unused, timeSince param unused)
- SessionStarter.ts (CrashSignals, CrashRisk imports unused, start variable unused)
- SignalCollector.test.ts (role param unused)

**Fix Strategy:**
```typescript
// BEFORE
import { CrashRisk } from '../models/Checkpoint';  // Unused

// AFTER - Remove entirely
// (no import)

// OR if needed for type checking only
import type { CrashRisk } from '../models/Checkpoint';

// For unused params
// BEFORE
function process(data: Data, unused: string) { }

// AFTER  
function process(data: Data, _unused: string) { }  // Prefix with _
```

---

### 2. `any` Types (14 violations)

**Files Affected:**
- CheckpointRepository.ts (7 violations - lines 222, 241, 423, 502, 515, 529, 543)
- ResumeDetector.ts (2 violations - lines 194, 222)
- SessionRestorer.ts (4 violations - lines 18, 35, 36, 37)  
- SessionStarter.ts (1 violation - line 108)
- SignalCollector.test.ts (3 violations - lines 53, 109, 267)
- SignalHistoryRepository.ts (2 violations - lines 126, 196)

**Fix Strategy:**
```typescript
// BEFORE
row: any

// AFTER - Use proper interface
interface CheckpointRow {
  checkpoint_number?: number;
  // ... other fields
}
row: CheckpointRow | undefined

// For database callbacks
(err: Error | null, row: CheckpointRow | undefined) => { }
```

---

### 3. Async Functions Without `await` (5 violations)

**Files Affected:**
- CheckpointIntegration.test.ts (line 152)
- CheckpointManager.ts (line 28)
- ResumeDetector.ts (line 71 - generateResumePrompt)
- SessionRestorer.ts (line 129 - calculateFidelity)
- SignalHistoryRepository.test.ts (line 28)

**Fix Strategy:**
```typescript
// BEFORE
async method(): Promise<void> {
  // No await calls
  return this.value;
}

// AFTER - Remove async
method(): Promise<void> {
  return Promise.resolve(this.value);
}

// OR make it actually async
async method(): Promise<void> {
  await someAsyncOperation();
  return this.value;
}
```

---

### 4. Promise Executor Return Values (5 violations)

**Files Affected:**
- CheckpointIntegration.test.ts (lines 122, 203)
- CheckpointManager.test.ts (lines 158, 160)
- ResumeE2E.test.ts (line 174)

**Fix Strategy:**
```typescript
// BEFORE
new Promise((resolve, reject) => {
  if (condition) {
    return resolve(value);  // ❌ Return is problematic
  }
  reject(error);
});

// AFTER
new Promise((resolve, reject) => {
  if (condition) {
    resolve(value);  // ✅ No return
    return;  // Early exit if needed
  }
  reject(error);
});
```

---

### 5. Return Await in Wrong Context (1 violation)

**File:** SessionRestorer.ts (line 79)

**Fix Strategy:**
```typescript
// BEFORE
async method(): Promise<Result> {
  return await operation();  // ❌ In try-catch, should not return await
}

// AFTER
async method(): Promise<Result> {
  const result = await operation();
  return result;
}
```

---

### 6. Missing Return Type (1 violation)

**File:** SignalHistoryRepository.ts (line 177)

**Fix Strategy:**
```typescript
// BEFORE
function helper() {  // ❌ Missing return type
  return value;
}

// AFTER
function helper(): ReturnType {
  return value;
}
```

---

## Implementation Order

### Step 1: Fix Unused Items (Safe, No Behavior Change)
- Remove unused imports
- Prefix unused parameters with `_`
- Remove unused variables
- **Test:** Verify tests still pass

### Step 2: Fix `any` Types (Requires Type Definitions)
- Define proper interfaces for database rows
- Update callback signatures
- **Test:** Verify TypeScript compiles, tests pass

### Step 3: Fix Async Issues (Behavioral, Careful)
- Remove unnecessary `async` keywords
- Fix promise executor returns
- Fix return await
- **Test:** Verify tests still pass, no timing regressions

### Step 4: Verify All Fixed
```bash
npm run lint  # Should show 0 errors
npm test      # Should show 165/165 passing
```

---

## Commands

```powershell
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Run tests
npm test

# Full validation
npm run validate  # TypeScript + ESLint + Tests
```

---

## Post-Fix Checklist

- [ ] 0 ESLint errors
- [ ] 165/165 tests passing
- [ ] TypeScript compiles cleanly
- [ ] No behavioral changes
- [ ] Commit with proper message

---

## Commit Message Template

```
fix: resolve 35 ESLint violations (code quality enforcement)

Categories Fixed:
- 14 unused imports/variables → removed or prefixed _
- 14 any types → replaced with proper interfaces
- 5 async without await → removed async or added await
- 2 promise executor returns → removed return statements

Files Affected:
- CheckpointRepository.ts (7 any types)
- ResumeDetector.ts (2 any + unused imports)
- SessionRestorer.ts (4 any + async issues)
- Test files (unused imports + async patterns)

Validation:
- ESLint: 35 errors → 0 errors ✅
- Tests: 165/165 passing ✅
- TypeScript: 0 errors ✅

No behavioral changes - purely code quality improvements.
```

---

**Next Session: Execute this plan before starting Phase 2**

---

*Created: January 10, 2026*  
*For: SHIM Phase 1 cleanup*  
*Priority: HIGH*
