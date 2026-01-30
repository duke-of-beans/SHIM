# SHIM Development Handoff - SignalHistoryRepository GREEN Phase

**Date:** January 10, 2026  
**Session:** Continue Week 1, Days 6-7 Implementation  
**Current Phase:** Signal History Tracking - GREEN Phase  
**Project:** D:\SHIM

---

## 🎯 IMMEDIATE OBJECTIVE

**Implement SignalHistoryRepository to pass all 18 tests (currently 0/18 passing - RED phase complete)**

You are continuing a Test-Driven Development (TDD) session. The test suite is written and failing. Your job is to implement the repository to make all tests pass (GREEN phase), then optimize (REFACTOR phase).

---

## 📍 CURRENT STATUS

### What's Complete ✅

1. **SignalCollector (Days 3-5)**
   - 53/53 tests passing
   - 98.36% code coverage
   - Commit: `1c555f9`
   - Location: `D:\SHIM\src\core\SignalCollector.ts`

2. **SignalHistoryRepository Test Suite (Days 6-7 - RED Phase)**
   - 18 tests written, 0 passing (expected)
   - Commit: `2d53b6d`
   - Test file: `D:\SHIM\src\core\SignalHistoryRepository.test.ts`
   - Stub file: `D:\SHIM\src\core\SignalHistoryRepository.ts`

### What's Next 🔄

**Implement SignalHistoryRepository (GREEN phase)**

Requirements from test suite:
- SQLite database integration
- `signal_history` table with proper schema
- Indices: `idx_signal_history_session_time`, `idx_signal_history_crash_risk`
- Auto-incrementing snapshot numbers per session
- Snapshot storage (<5ms per save)
- Snapshot retrieval (<10ms for latest)
- Time-range queries
- Risk-level filtering
- Cleanup operations (retention policies)

---

## 🏗️ IMPLEMENTATION REQUIREMENTS

### Database Schema (from spec)

```sql
CREATE TABLE signal_history (
  id TEXT PRIMARY KEY,                    -- UUID v4
  session_id TEXT NOT NULL,
  snapshot_number INTEGER NOT NULL,       -- Auto-increment per session
  timestamp TEXT NOT NULL,                -- ISO 8601
  crash_risk TEXT NOT NULL,               -- 'safe' | 'warning' | 'danger'
  
  -- Serialized signals (JSON)
  signals_json TEXT NOT NULL,
  
  UNIQUE(session_id, snapshot_number)
);

CREATE INDEX idx_signal_history_session_time 
  ON signal_history(session_id, timestamp DESC);

CREATE INDEX idx_signal_history_crash_risk 
  ON signal_history(crash_risk, timestamp DESC);
```

### Key Methods to Implement

```typescript
class SignalHistoryRepository {
  // Database lifecycle
  async initialize(): Promise<void>
  async close(): Promise<void>
  
  // Test helpers
  async getTables(): Promise<string[]>
  async getIndices(): Promise<string[]>
  
  // Snapshot operations
  async saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string>
  async getSessionSnapshots(sessionId: string): Promise<SignalSnapshot[]>
  async getLatestSnapshot(sessionId: string): Promise<SignalSnapshot | null>
  
  // Queries
  async getSnapshotsByRisk(riskLevel: CrashRisk): Promise<SignalSnapshot[]>
  async getSnapshotsInTimeRange(start: string, end: string): Promise<SignalSnapshot[]>
  
  // Cleanup
  async cleanupOldSnapshots(retentionDays: number): Promise<number>
  async deleteSessionSnapshots(sessionId: string): Promise<void>
}
```

### Performance Requirements

- **Save snapshot:** <5ms average (tested with 1000 saves)
- **Retrieve latest:** <10ms (tested with 100 snapshots in session)
- **Auto-increment:** Efficient (use `MAX(snapshot_number) + 1` per session)

---

## 🔧 TECHNICAL GUIDANCE

### Dependencies Already Installed

```json
"dependencies": {
  "sqlite3": "^5.1.7",
  "uuid": "^9.0.1",
  "tiktoken": "^1.0.15"
}
```

### Recommended Implementation Pattern

```typescript
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export class SignalHistoryRepository {
  private db: sqlite3.Database | null = null;

  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else {
          this.createSchema()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async createSchema(): Promise<void> {
    // Create table + indices
  }

  async saveSnapshot(sessionId: string, signals: CrashSignals): Promise<string> {
    // 1. Get next snapshot_number: SELECT MAX(snapshot_number) FROM ... WHERE session_id = ?
    // 2. Generate UUID
    // 3. Serialize signals to JSON
    // 4. INSERT with all fields
    // 5. Return UUID
  }

  // ... implement other methods
}
```

### Auto-Incrementing Snapshots

For each session, snapshot_number should start at 1 and increment:

```sql
-- Get next number for session
SELECT COALESCE(MAX(snapshot_number), 0) + 1 
FROM signal_history 
WHERE session_id = ?
```

---

## 🧪 TESTING PROTOCOL

### Run Tests

```powershell
cd D:\SHIM
npm test -- SignalHistoryRepository
```

### Expected Progression

1. **Start:** 0/18 passing (current - RED phase)
2. **After basic implementation:** 10-12/18 passing
3. **After query methods:** 15-17/18 passing
4. **GREEN phase complete:** 18/18 passing
5. **Check coverage:** `npm run test:coverage`
6. **Target:** >90% coverage

### Test Suites

- **Initialization (3 tests):** Database file, table, indices
- **Snapshot Storage (4 tests):** Save, auto-increment, timestamps
- **Snapshot Retrieval (6 tests):** By session, by risk, by time range, ordering
- **Cleanup (3 tests):** Retention policies, delete session
- **Performance (2 tests):** 1000 saves <5ms avg, latest retrieval <10ms

---

## 📂 FILE LOCATIONS

```
D:\SHIM\
├── src\core\
│   ├── SignalCollector.ts          ✅ COMPLETE (53/53 tests)
│   ├── SignalCollector.test.ts     ✅ COMPLETE
│   ├── SignalHistoryRepository.ts  🔄 STUB (implement this)
│   └── SignalHistoryRepository.test.ts  ✅ TESTS WRITTEN
├── docs\specs\
│   ├── SPEC_CRASH_PREVENTION.md    📖 Reference
│   └── IMPLEMENTATION_PLAN.md      📋 Roadmap
├── package.json
└── tsconfig.json
```

---

## 🎓 QUALITY STANDARDS (FROM GLOBAL INSTRUCTIONS)

### TDD Methodology

1. ✅ **RED:** Tests written, failing (DONE - current state)
2. 🔄 **GREEN:** Implement to pass tests (YOUR TASK)
3. ⏳ **REFACTOR:** Optimize after all tests pass

### Code Quality Requirements

- **No placeholders:** Real implementations only
- **Error handling:** Proper try-catch, meaningful errors
- **Type safety:** Full TypeScript types, no `any`
- **Performance:** Meet <5ms and <10ms requirements
- **Clean code:** Single responsibility, no duplication

### Commit Standards

```bash
# After GREEN phase (all tests passing)
git add -A
git commit -m "feat: SignalHistoryRepository implementation (GREEN phase)

- SQLite integration with proper schema
- Auto-incrementing snapshot numbers per session
- Time-range and risk-level queries
- Cleanup operations with retention policies
- Performance: <5ms saves, <10ms retrievals
- 18/18 tests passing
- Coverage: XX%

Week 1, Days 6-7: Signal History Tracking"
```

---

## 🚀 GETTING STARTED

### Step 1: Verify Environment

```powershell
cd D:\SHIM
.\scripts\Dev.ps1
```

Expected output:
```
✅ SHIM Environment Ready
📁 Working Directory: D:\SHIM
🔧 Node: v22.x.x
📦 Dependencies: OK
🧪 Tests: 71 total (53 SignalCollector + 18 SignalHistoryRepository)
```

### Step 2: Run Tests (RED Phase Verification)

```powershell
npm test -- SignalHistoryRepository
```

Expected: **0/18 passing** (all failing with "Not implemented")

### Step 3: Implement Repository

Open `D:\SHIM\src\core\SignalHistoryRepository.ts` and replace stub methods with real implementations.

**Implementation Order (recommended):**
1. `initialize()` + `createSchema()` → Passes 3 initialization tests
2. `saveSnapshot()` → Passes 4 storage tests
3. `getSessionSnapshots()` + `getLatestSnapshot()` → Passes retrieval tests
4. `getSnapshotsByRisk()` + `getSnapshotsInTimeRange()` → Passes query tests
5. `cleanupOldSnapshots()` + `deleteSessionSnapshots()` → Passes cleanup tests
6. Optimize for performance tests

### Step 4: Iterative Testing

After each method implementation:
```powershell
npm test -- SignalHistoryRepository
```

Watch tests turn green incrementally.

### Step 5: GREEN Phase Complete

When all 18 tests pass:
```powershell
npm run test:coverage  # Check coverage (target: >90%)
git add -A
git commit -m "feat: SignalHistoryRepository implementation (GREEN phase) ..."
```

### Step 6: REFACTOR Phase (if needed)

- Review code for duplication
- Optimize database queries
- Add explanatory comments
- Ensure performance requirements met
- Run tests after each refactor

---

## 📋 REFERENCE MATERIALS

### Key Spec Sections

**SPEC_CRASH_PREVENTION.md:**
- Section 2.1: Checkpoint Data Model (signal structure)
- Section 2.2: Database Schema (table definitions)
- Days 6-7: Signal History Tracking (implementation plan)

### Similar Implementations

**SignalCollector.ts** - Reference for:
- Clean TypeScript patterns
- Error handling approach
- Performance optimization
- Test coverage strategies

---

## 🎯 SUCCESS CRITERIA

### GREEN Phase Complete When:

- ✅ All 18 tests passing
- ✅ Coverage >90%
- ✅ No TypeScript errors
- ✅ Performance requirements met (<5ms saves, <10ms reads)
- ✅ Database file created at correct path
- ✅ Proper indices for query optimization
- ✅ Auto-increment working correctly
- ✅ Cleanup operations functional

### Optional REFACTOR Phase:

- Code review for duplication
- Optimize slow queries (if any)
- Add JSDoc comments
- Extract complex logic to helper methods

---

## 🛠️ TROUBLESHOOTING

### If Tests Timeout
- Check database locks (close connections properly)
- Use `PRAGMA journal_mode=WAL` for better concurrency
- Verify `close()` called in `afterEach()`

### If Performance Tests Fail
- Add index on `(session_id, timestamp DESC)`
- Use prepared statements for bulk operations
- Batch inserts in transactions

### If Auto-Increment Fails
- Verify `MAX(snapshot_number)` query per session
- Check UNIQUE constraint on `(session_id, snapshot_number)`
- Ensure `COALESCE(MAX(...), 0) + 1` for first snapshot

### If Timestamp Tests Fail
- Use `new Date().toISOString()` for consistent format
- Store as TEXT in SQLite (ISO 8601)
- Query with string comparison (ISO format sorts correctly)

---

## 📞 CONTINUATION PROTOCOL

### After This Session

**Next Task:** Week 1, Days 8-9 - Metrics Dashboard (Optional)

**Or Skip To:** Week 1, Day 10 - Integration Testing

**Location:** See `docs/specs/IMPLEMENTATION_PLAN.md`

### Project Context Retention

- **Project:** SHIM (Session Handling & Intelligent Management)
- **Phase:** Week 1-2 (Observable Signals & Metrics)
- **Overall Goal:** Crash Prevention System for Claude Desktop
- **Methodology:** TDD (Test-Driven Development)
- **Quality Bar:** Production-grade, >90% coverage, <5ms performance

---

## ✅ FINAL CHECKLIST

Before considering this task complete:

- [ ] All 18 tests passing
- [ ] Coverage report generated (`npm run test:coverage`)
- [ ] Coverage >90%
- [ ] No TypeScript errors (`npm run build`)
- [ ] Performance tests passing (<5ms, <10ms)
- [ ] Code committed with descriptive message
- [ ] Test database cleaned up (test.db removed)
- [ ] Ready to proceed to Days 8-9 or Day 10

---

**Good luck! You have everything you need to complete this flawlessly.**

**Remember:**
- TDD discipline: Make tests pass, then optimize
- Quality over speed: Do it right the first time
- Performance matters: <5ms saves, <10ms reads
- Clean commits: Descriptive messages with metrics

**You're 40% through Week 1-2. Keep up the excellent TDD momentum!** 🚀
