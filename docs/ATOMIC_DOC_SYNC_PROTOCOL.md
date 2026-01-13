# ATOMIC DOCUMENTATION SYNC PROTOCOL v1.0

**Critical Rule:** Documentation drift = system failure  
**Solution:** Atomic updates to all source-of-truth files

---

## 🎯 SOURCE OF TRUTH FILES (The Four Pillars)

These files MUST stay synchronized:

1. **ROADMAP.md** - Strategic view (phases, milestones, dates)
2. **CURRENT_STATUS.md** - Tactical view (components, LOC, tests, blockers)
3. **ARCHITECTURE.md** - Technical view (design, decisions, patterns)
4. **CLAUDE_INSTRUCTIONS_PROJECT.md** - Operational view (protocols, workflows)

---

## 🔒 ATOMIC UPDATE RULE

**NEVER update one file without updating all four.**

### Update Triggers (MANDATORY sync after each):
- ✅ Phase completion
- ✅ Component completion
- ✅ Major milestone (e.g., "Phase 2 complete")
- ✅ Blocker resolution
- ✅ Architecture decision
- ✅ Git commit (production code changes)

### Update Frequency:
- **Minimum:** Every git commit
- **Recommended:** Every significant checkpoint (3-5 tool calls)

---

## 📋 UPDATE CHECKLIST (Use Every Time)

### Before Any Git Commit:

```yaml
documentation_sync_checklist:
  step_1_gather_facts:
    - current_phase: "Which phase are we in?"
    - phase_progress: "What % complete?"
    - components_done: "What finished this session?"
    - loc_added: "How many LOC production + test?"
    - tests_added: "How many tests written?"
    - blockers_resolved: "What blockers cleared?"
    - new_blockers: "Any new blockers?"
    
  step_2_update_all_four:
    - roadmap: "Update phase status, progress %, dates"
    - current_status: "Update components, LOC, tests, blockers"
    - architecture: "Update component diagram, decisions"
    - instructions: "Update protocols, current focus, next actions"
    
  step_3_verify_consistency:
    - phase_status: "Same in all 4 files?"
    - loc_counts: "Same in all 4 files?"
    - test_counts: "Same in all 4 files?"
    - blocker_status: "Same in all 4 files?"
    - dates: "All show same 'Last Updated'?"
    
  step_4_commit_together:
    - git_add: "git add ROADMAP.md CURRENT_STATUS.md docs/ARCHITECTURE.md docs/CLAUDE_INSTRUCTIONS_PROJECT.md"
    - git_commit: "docs: Sync all source-of-truth files (Phase X: Y%)"
```

---

## 🔄 SYNCHRONIZATION PROTOCOL

### Protocol A: After Component Completion

```typescript
async function syncDocsAfterComponent(component: string) {
  const facts = {
    component: component,
    phase: getCurrentPhase(),
    progress: calculateProgress(),
    loc: countLOC(),
    tests: countTests(),
    blockers: getBlockers()
  };
  
  // Update ALL FOUR files atomically
  await Promise.all([
    updateRoadmap(facts),
    updateCurrentStatus(facts),
    updateArchitecture(facts),
    updateInstructions(facts)
  ]);
  
  // Verify consistency
  await verifyAllFilesMatch(facts);
  
  // Commit together
  await gitCommit('docs: Sync after ${component} completion');
}
```

### Protocol B: After Phase Completion

```typescript
async function syncDocsAfterPhase(phase: number) {
  const facts = {
    phase: phase,
    status: 'COMPLETE',
    totalLOC: sumAllLOC(),
    totalTests: sumAllTests(),
    nextPhase: phase + 1,
    date: new Date().toISOString()
  };
  
  // Update ALL FOUR files atomically
  await Promise.all([
    updateRoadmap(facts),
    updateCurrentStatus(facts),
    updateArchitecture(facts),
    updateInstructions(facts)
  ]);
  
  // Verify consistency
  await verifyAllFilesMatch(facts);
  
  // Commit together
  await gitCommit(`docs: Phase ${phase} COMPLETE - Sync all source-of-truth`);
}
```

### Protocol C: Bootstrap Verification

```typescript
async function verifyDocSyncOnBootstrap() {
  const files = [
    'ROADMAP.md',
    'CURRENT_STATUS.md',
    'docs/ARCHITECTURE.md',
    'docs/CLAUDE_INSTRUCTIONS_PROJECT.md'
  ];
  
  const phases = files.map(f => extractPhaseStatus(f));
  const locs = files.map(f => extractLOCCount(f));
  const tests = files.map(f => extractTestCount(f));
  const dates = files.map(f => extractLastUpdated(f));
  
  // Check consistency
  if (!allSame(phases)) {
    throw new DocSyncError('Phase status mismatch across files');
  }
  if (!allSame(locs)) {
    throw new DocSyncError('LOC count mismatch across files');
  }
  if (!allSame(tests)) {
    throw new DocSyncError('Test count mismatch across files');
  }
  
  // Warn if dates differ by >1 day
  if (maxDiff(dates) > 86400000) {
    console.warn('WARNING: Documentation dates differ by >1 day');
  }
}
```

---

## 🚨 ENFORCEMENT MECHANISMS

### 1. Git Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if production code changed
if git diff --cached --name-only | grep -E '^src/'; then
  # Production code changed - docs MUST be updated
  
  docs=(
    "ROADMAP.md"
    "CURRENT_STATUS.md"
    "docs/ARCHITECTURE.md"
    "docs/CLAUDE_INSTRUCTIONS_PROJECT.md"
  )
  
  for doc in "${docs[@]}"; do
    if ! git diff --cached --name-only | grep -q "$doc"; then
      echo "ERROR: $doc not updated with production code changes"
      echo "RULE: All 4 source-of-truth files MUST be updated together"
      exit 1
    fi
  done
  
  # Verify consistency
  ./scripts/verify-doc-sync.sh || exit 1
fi
```

### 2. Bootstrap Verification

```typescript
// Add to session bootstrap
async function bootstrap() {
  // Step 1: Load instructions
  await loadInstructions();
  
  // Step 2: VERIFY DOC SYNC (NEW)
  await verifyDocSync();  // <-- MANDATORY CHECK
  
  // Step 3: Load status
  await loadStatus();
  
  // Step 4: Run tests
  await runTests();
}
```

### 3. Checkpoint Protocol Enhancement

```typescript
async function checkpoint(context: Context) {
  // Save session state
  await saveCheckpoint(context);
  
  // CHECK: Has production code changed?
  if (context.filesChanged.some(f => f.startsWith('src/'))) {
    // Production code changed - sync docs NOW
    await syncAllDocs(context);
  }
}
```

---

## 📊 CONSISTENCY VERIFICATION SCRIPT

```bash
#!/bin/bash
# scripts/verify-doc-sync.sh

echo "Verifying documentation synchronization..."

# Extract phase status from each file
phase_roadmap=$(grep -m1 "Status:" ROADMAP.md | cut -d: -f2)
phase_status=$(grep -m1 "Phase:" CURRENT_STATUS.md | cut -d: -f2)
phase_arch=$(grep -m1 "Status:" docs/ARCHITECTURE.md | cut -d: -f2)
phase_instr=$(grep -m1 "Phase:" docs/CLAUDE_INSTRUCTIONS_PROJECT.md | cut -d: -f2)

# Compare
if [[ "$phase_roadmap" != "$phase_status" ]] || \
   [[ "$phase_status" != "$phase_arch" ]] || \
   [[ "$phase_arch" != "$phase_instr" ]]; then
  echo "ERROR: Phase status mismatch!"
  echo "  ROADMAP: $phase_roadmap"
  echo "  STATUS: $phase_status"
  echo "  ARCH: $phase_arch"
  echo "  INSTR: $phase_instr"
  exit 1
fi

echo "✅ Documentation synchronized"
exit 0
```

---

## 🎓 BEST PRACTICES

### DO:
- ✅ Update all 4 files together
- ✅ Verify consistency before commit
- ✅ Use same date/version in all files
- ✅ Check consistency on bootstrap
- ✅ Automate verification

### DON'T:
- ❌ Update one file without others
- ❌ Commit code without updating docs
- ❌ Skip consistency verification
- ❌ Assume docs are current
- ❌ Defer documentation updates

---

## 📋 MANDATORY UPDATE TEMPLATE

### When Completing Component:

```yaml
# Update ALL FOUR files with:

component: "[ComponentName]"
phase: "[Current Phase]"
progress: "[X%]"
loc_added: "[production + test]"
tests_added: "[count]"
date: "[YYYY-MM-DD]"

# Then commit:
git add ROADMAP.md CURRENT_STATUS.md docs/ARCHITECTURE.md docs/CLAUDE_INSTRUCTIONS_PROJECT.md
git commit -m "docs: Sync after [ComponentName] completion"
```

### When Completing Phase:

```yaml
# Update ALL FOUR files with:

phase: "[Phase Number]"
status: "COMPLETE"
total_loc: "[cumulative]"
total_tests: "[cumulative]"
next_phase: "[Phase Number + 1]"
date: "[YYYY-MM-DD]"

# Then commit:
git add ROADMAP.md CURRENT_STATUS.md docs/ARCHITECTURE.md docs/CLAUDE_INSTRUCTIONS_PROJECT.md
git commit -m "docs: Phase [N] COMPLETE - Sync all source-of-truth"
```

---

## 🔍 DETECTION: How to Know Docs Are Out of Sync

### Red Flags:
- Different phase status across files
- Different LOC counts across files
- Different test counts across files
- Last updated dates differ by >1 day
- Blockers mentioned in some files but not others
- Components marked complete in one file but planned in another

### Recovery Protocol:
1. Stop all development work
2. Audit all 4 files
3. Determine ground truth (from git log + actual code)
4. Update all 4 files to match ground truth
5. Commit sync
6. Resume development

---

## 📈 SUCCESS METRICS

### Documentation Health:
- ✅ Phase status matches across all 4 files
- ✅ LOC counts match across all 4 files
- ✅ Test counts match across all 4 files
- ✅ Last updated within 24 hours of each other
- ✅ Blockers consistent across all 4 files
- ✅ No contradictions between files

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Immediate (Today)
1. ✅ Audit current state (done)
2. ⬜ Synchronize all 4 files to match reality
3. ⬜ Commit synchronized state
4. ⬜ Create verification script

### Phase 2: Short-term (This Week)
1. ⬜ Add pre-commit hook
2. ⬜ Update bootstrap to verify sync
3. ⬜ Update checkpoint protocol
4. ⬜ Document protocol in CLAUDE_INSTRUCTIONS

### Phase 3: Long-term (Next Week)
1. ⬜ Automate sync process
2. ⬜ Add CI/CD checks
3. ⬜ Create sync dashboard
4. ⬜ Monitor compliance

---

**Version:** 1.0  
**Created:** January 13, 2026  
**Status:** READY FOR IMPLEMENTATION  
**Priority:** CRITICAL - Must implement before any more development

---

*"One source of truth is powerful. Four synchronized sources of truth is unstoppable."*
