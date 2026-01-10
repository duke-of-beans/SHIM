# SHIM PROJECT ENVIRONMENT BLUEPRINT
**Comprehensive Development Infrastructure Design Guide**

**Version:** 1.0.0  
**Date:** January 10, 2026  
**Purpose:** Transfer GREGORE's sophisticated development environment to SHIM  
**Audience:** SHIM project instance (Claude)

---

## EXECUTIVE SUMMARY

This document provides the complete catalog of development infrastructure capabilities proven in GREGORE, adapted as recommendations for SHIM. SHIM's instance should use this as a menu of options to design its own optimal environment.

**Core Principle:** Copy the *patterns* that eliminate friction, customize the *implementation* for SHIM's domain (crash prevention & recovery).

**GREGORE's Infrastructure Value:** 95+ KERNL tools, automatic session management, crash recovery, cross-project learning, semantic intelligence, zero technical debt enforcement, automatic git workflows, comprehensive quality gates.

**SHIM's Opportunity:** Leverage proven infrastructure while building complementary crash prevention capabilities. SHIM focuses on *predicting* crashes (observable signals), GREGORE provides infrastructure for *recovering* from them (KERNL checkpointing).

---

## PART I: SHARED GLOBAL INFRASTRUCTURE

### 1.1 Global Instructions System

**Purpose:** Consistent Claude behavior across all projects with single source of truth.

**Current GREGORE Structure:**
```
D:/GREGORE/
├── docs/
│   ├── CLAUDE_INSTRUCTIONS_GLOBAL.md      # Loaded at bootstrap (universal)
│   └── CLAUDE_INSTRUCTIONS_PROJECT.md     # GREGORE-specific
```

**RECOMMENDED for SHIM:**
```
OPTION A: Shared Global File (Preferred)
D:/
├── SHARED_CLAUDE_INSTRUCTIONS/
│   ├── GLOBAL_V4.4.0.md                   # Canonical global instructions
│   ├── CHANGELOG_GLOBAL.md                # Version history
│   └── VALIDATION_SCHEMA.json             # Consistency checks
│
├── GREGORE/
│   ├── docs/
│   │   ├── CLAUDE_INSTRUCTIONS_GLOBAL.md  # Symlink to ../SHARED
│   │   └── CLAUDE_INSTRUCTIONS_PROJECT.md # GREGORE-specific
│
└── SHIM/
    ├── docs/
    │   ├── CLAUDE_INSTRUCTIONS_GLOBAL.md  # Symlink to ../SHARED
    │   └── CLAUDE_INSTRUCTIONS_PROJECT.md # SHIM-specific

OPTION B: Copy-Based (Alternative)
- Copy GLOBAL.md to each project
- Use git hook to sync changes
- More fragile, but simpler

RECOMMENDATION: Option A with PowerShell symlinks
```

**Why Symlinks:**
- Single source of truth (no drift)
- Changes propagate immediately
- Version control tracks one file
- Windows symlinks: `New-Item -ItemType SymbolicLink -Path "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md" -Target "D:\SHARED_CLAUDE_INSTRUCTIONS\GLOBAL_V4.4.0.md"`

**Implementation Script:**
```powershell
# D:\SHIM\scripts\Setup-GlobalInstructions.ps1
param(
    [string]$SharedPath = "D:\SHARED_CLAUDE_INSTRUCTIONS",
    [string]$Version = "4.4.0"
)

# Create shared directory if not exists
if (-not (Test-Path $SharedPath)) {
    New-Item -ItemType Directory -Path $SharedPath
}

# Copy current GREGORE global as baseline
$sourceFile = "D:\GREGORE\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md"
$targetFile = "$SharedPath\GLOBAL_V$Version.md"

if (-not (Test-Path $targetFile)) {
    Copy-Item $sourceFile $targetFile
    Write-Host "✅ Created shared global instructions: $targetFile"
}

# Create symlink in SHIM
$shimLink = "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md"
if (Test-Path $shimLink) {
    Remove-Item $shimLink -Force
}

New-Item -ItemType SymbolicLink -Path $shimLink -Target $targetFile
Write-Host "✅ Created symlink: $shimLink -> $targetFile"

# Verify
if (Test-Path $shimLink) {
    Write-Host "✅ Symlink verified - reads correctly"
    Get-Content $shimLink | Select-Object -First 3
} else {
    Write-Error "❌ Symlink creation failed"
}
```

---

### 1.2 Project-Specific Instructions

**Purpose:** SHIM-specific behaviors, authorities, patterns while inheriting global foundation.

**GREGORE's Structure:**
```markdown
# CLAUDE INSTRUCTIONS - GREGORE PROJECT

## §1 BOOTSTRAP [IF GREGORE PROJECT]
cat D:\GREGORE\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md

## §2 PROJECT IDENTITY
Project: GREGORE (Project Mind MCP)
Domain: Session management, crash recovery, project intelligence

## §3 AUTHORITY PROTOCOL
[GREGORE-specific triggers...]

## §4 SACRED PRINCIPLES
[Domain-specific laws...]
```

**SHIM Should Create:**
```markdown
# CLAUDE INSTRUCTIONS - SHIM PROJECT

## §1 BOOTSTRAP [IF SHIM PROJECT]
cat D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md

## §2 PROJECT IDENTITY
Project: SHIM (Session Health & Integrity Manager)
Domain: Crash prevention, signal monitoring, checkpoint optimization

## §3 AUTHORITY PROTOCOL (SHIM-SPECIFIC)
Trigger 1: Signal Threshold Violations
Trigger 2: Checkpoint Size Violations
Trigger 3: Performance Violations
[etc...]

## §4 SACRED LAWS (SHIM-SPECIFIC)
1. Zero TypeScript errors
2. 80% test coverage minimum
3. Checkpoint creation <100ms
4. Checkpoint size <100KB target
5. Signal accuracy >90%
6. Zero data loss tolerance
```

**Key Differences from GREGORE:**
- SHIM focuses on PREVENTION (signals), GREGORE on RECOVERY (checkpoints)
- SHIM has performance constraints (100ms, 100KB)
- SHIM has accuracy metrics (90% signal detection)
- SHIM integrates with KERNL, doesn't duplicate it

---

### 1.3 In-App Instructions (Future Consideration)

**GREGORE's Approach:** Not applicable yet (no UI)

**SHIM's Future:** When SHIM has UI (Phase 2: Multi-Chat Coordinator), consider:
- In-app help for delegation
- Contextual tooltips for monitoring
- Progressive disclosure of features
- Quick reference for escalation settings

**Recommendation:** Defer until Phase 2+. Focus on MCP tool documentation for Phase 1.

---

## PART II: KERNL INTEGRATION (ESSENTIAL)

### 2.1 KERNL Tools Catalog (95 Available)

**CRITICAL:** SHIM should use KERNL as PRIMARY infrastructure. Don't rebuild what KERNL provides.

**Session Management (8 tools):**
```typescript
// Automatic crash recovery
KERNL:get_session_context({ project: "shim" })
KERNL:check_resume_needed({ project: "shim" })
KERNL:auto_checkpoint({ project: "shim", operation: "...", progress: 0.5 })
KERNL:mark_complete({ project: "shim", summary: "..." })

// Session state
KERNL:get_session_state({ project: "shim" })
KERNL:save_session_state({ project: "shim", currentTask: {...}, context: {...} })
KERNL:generate_continuation({ project: "shim" })
```

**File Operations (6 tools):**
```typescript
// Project-aware file operations
KERNL:pm_read_file({ project: "shim", path: "src/core/SignalCollector.ts" })
KERNL:pm_write_file({ project: "shim", path: "...", content: "..." })
KERNL:pm_batch_read({ project: "shim", paths: ["...", "..."] })
KERNL:pm_get_file_info({ project: "shim", path: "..." })
KERNL:pm_search_files({ project: "shim", pattern: "..." })
KERNL:pm_list_files({ project: "shim", path: "src" })
```

**Surgical Editing (1 tool):**
```typescript
// Replace exact text with verification
KERNL:sys_edit_block({
  file_path: "src/core/SignalCollector.ts",
  old_string: "const threshold = 50;",
  new_string: "const threshold = 75;",
  expected_replacements: 1
})
```

**Intelligence (6 tools):**
```typescript
// Semantic search (meaning-based, not text-based)
KERNL:search_semantic({ project: "shim", query: "checkpoint serialization logic" })

// Cross-project learning
KERNL:suggest_patterns({ currentProject: "shim", problem: "reducing checkpoint size" })
KERNL:record_pattern({ project: "shim", name: "...", problem: "...", solution: "..." })

// File indexing
KERNL:pm_index_files({ project: "shim", reindex: false })
KERNL:pm_index_status({ project: "shim" })
KERNL:read_semantic({ project: "shim", path: "...", includeRelated: true })
```

**Background Jobs (5 tools):**
```typescript
// Long-running operations with crash recovery
KERNL:start_job({ project: "shim", operation: "index_project_files", parameters: {...} })
KERNL:get_job_progress({ jobId: 123 })
KERNL:list_jobs({ project: "shim", status: "running" })
KERNL:cancel_job({ jobId: 123 })
KERNL:resume_jobs({}) // After crash
```

**Process Management (7 tools):**
```typescript
// Interactive REPL for data analysis
KERNL:sys_start_process({ command: "python3 -i", timeout_ms: 30000 })
KERNL:sys_interact_with_process({ pid: 12345, input: "import pandas as pd" })
KERNL:sys_read_process_output({ pid: 12345, offset: 0, length: 100 })
KERNL:sys_force_terminate({ pid: 12345 })
KERNL:sys_list_sessions({})
KERNL:sys_list_processes({})
KERNL:sys_kill_process({ pid: 67890 })
```

**File System Operations (10 tools):**
```typescript
// Low-level file operations
KERNL:sys_copy_file_user_to_claude({ path: "D:\\SHIM\\data.csv" })
KERNL:sys_copy_path({ source: "...", destination: "...", recursive: true })
KERNL:sys_move_path({ source: "...", destination: "..." })
KERNL:sys_delete_path({ path: "...", recursive: false })
KERNL:sys_path_exists({ path: "..." })
KERNL:sys_create_directory({ path: "..." })
KERNL:sys_write_pdf({ path: "report.pdf", content: "# Markdown..." })
KERNL:sys_edit_block({ file_path: "...", old_string: "...", new_string: "..." })
```

**Search (4 tools):**
```typescript
// Streaming file/content search
KERNL:sys_start_search({ path: "D:\\SHIM", pattern: "checkpoint", searchType: "content" })
KERNL:sys_get_more_search_results({ sessionId: "abc", offset: 0, length: 100 })
KERNL:sys_stop_search({ sessionId: "abc" })
KERNL:sys_list_searches({})
```

**Chrome Automation (20+ tools):**
```typescript
// Browser automation (if needed for testing/research)
KERNL:sys_chrome_launch({ headless: true })
KERNL:sys_chrome_navigate({ url: "https://example.com" })
KERNL:sys_chrome_click({ selector: "button.submit" })
// ... 17 more chrome tools ...
```

**Project Management (5 tools):**
```typescript
KERNL:pm_register_project({ id: "shim", name: "SHIM", path: "D:\\SHIM" })
KERNL:pm_list_projects({})
KERNL:pm_get_project({ project: "shim" })
KERNL:pm_update_project({ project: "shim", config: {...} })
KERNL:pm_delete_project({ project: "shim", confirm: true })
```

**Backlog Management (4 tools):**
```typescript
KERNL:query_backlog({ project: "shim", status: "active", priority: "P0" })
KERNL:add_epic({ project: "shim", title: "...", description: "..." })
KERNL:complete_epic({ epicId: 123, actualHours: 8 })
KERNL:get_project_status({ project: "shim" })
```

**Git Operations (2 tools):**
```typescript
KERNL:smart_commit({ project: "shim", type: "feat", scope: "signals" })
KERNL:session_package({ project: "shim", includeCommits: true })
```

**Research (2 tools):**
```typescript
KERNL:research_progressive({ project: "shim", query: "...", sections: [...] })
KERNL:search_research({ project: "shim", query: "..." })
```

**Conversation Export (4 tools):**
```typescript
KERNL:preview_conversations({ cookiesFile: "..." })
KERNL:export_conversations({ cookiesFile: "...", outputPath: "..." })
KERNL:chrome_export_conversations({ exportType: "dual" })
KERNL:chrome_export_status({})
```

**System (12 tools):**
```typescript
KERNL:sys_get_config({})
KERNL:sys_set_config_value({ key: "features.chromeExport", value: true })
KERNL:sys_get_usage_stats({ limit: 50 })
KERNL:sys_get_tool_info({ detailed: true })
KERNL:sys_run_tests({ category: "smoke" })
KERNL:sys_validate_tools({})
KERNL:sys_check_health({})
KERNL:sys_benchmark({ operation: "all", iterations: 100 })
KERNL:sys_export_tools({ format: "json", output: "D:\\tools.json" })
KERNL:sys_generate_docs({ format: "markdown", output: "D:\\TOOLS.md" })
KERNL:sys_get_version({})
```

**Total: 95 tools across 14 categories**

---

### 2.2 How SHIM Should Use KERNL

**DO:**
- Use `auto_checkpoint` every 5-10 tool calls during long operations
- Use `get_session_context` at EVERY session start
- Use `pm_batch_read` to load multiple files efficiently
- Use `sys_edit_block` for surgical code changes
- Use `search_semantic` to find code by meaning
- Use `record_pattern` to capture learnings
- Use Desktop Commander for git operations (PATH workaround)

**DON'T:**
- Rebuild checkpoint infrastructure (KERNL provides it)
- Rebuild file operations (KERNL provides surgical editing)
- Rebuild session management (KERNL provides it)
- Rebuild pattern learning (KERNL provides it)

**SHIM's Unique Value:**
- Crash PREDICTION (signals, thresholds)
- Checkpoint OPTIMIZATION (size, speed)
- Signal ACCURACY (detection algorithms)
- Performance MONITORING (100ms, 100KB targets)

**Complementary, Not Duplicate:**
```
KERNL: "How to checkpoint and recover"
SHIM: "When to checkpoint, what signals indicate crash risk"

KERNL: "Infrastructure for session management"
SHIM: "Intelligence for crash prevention"
```

---

## PART III: DEVELOPMENT WORKFLOWS

### 3.1 Bootstrap Sequence (60 seconds)

**GREGORE's Approach:**
```markdown
## §1 BOOTSTRAP [MANDATORY - AUTOMATIC - 60 SECONDS]

Step 1: Load session context (30 sec)
Step 2: Batch read project state (20 sec)
Step 3: Display status and next steps (10 sec)
```

**SHIM Should Implement:**

```powershell
# D:\SHIM\scripts\Dev.ps1
# Development session starter

# Display header
Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                    SHIM DEVELOPMENT                            ║
║         Session Health & Integrity Manager                     ║
╚════════════════════════════════════════════════════════════════╝
"@

# Step 1: Environment check
Write-Host "`n==> Environment Status" -ForegroundColor Cyan
Write-Host "    Node.js: $(node --version)"
Write-Host "    npm: $(npm --version)"
Write-Host "    TypeScript: $(npx tsc --version)"
Write-Host "    Git: $(git --version)"

# Step 2: Project status
Write-Host "`n==> Project Status" -ForegroundColor Cyan
Write-Host "    Branch: $(git branch --show-current)"
Write-Host "    Commits: $(git rev-list --count HEAD)"
Write-Host "    Uncommitted: $(git status --porcelain | Measure-Object -Line | Select-Object -ExpandProperty Lines) files"

# Step 3: Build health
Write-Host "`n==> Build Health" -ForegroundColor Cyan
npx tsc --noEmit 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ TypeScript: 0 errors" -ForegroundColor Green
} else {
    Write-Host "    ✗ TypeScript: Has errors" -ForegroundColor Red
}

npm test -- --passWithNoTests 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Tests: Passing" -ForegroundColor Green
} else {
    Write-Host "    ✗ Tests: Failing" -ForegroundColor Red
}

# Step 4: Current phase (from SOURCE_OF_TRUTH.md if exists)
if (Test-Path "docs\SOURCE_OF_TRUTH.md") {
    $phase = Select-String -Path "docs\SOURCE_OF_TRUTH.md" -Pattern "^\*\*Current Phase:\*\* (.+)$" | Select-Object -First 1
    if ($phase) {
        Write-Host "`n==> Current Phase" -ForegroundColor Cyan
        Write-Host "    $($phase.Matches.Groups[1].Value)"
    }
}

# Step 5: Continuation prompt
if (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") {
    Write-Host "`n==> Last Session" -ForegroundColor Cyan
    Get-Content "CONTINUATION_PROMPT_NEXT_SESSION.md" | Select-Object -First 10
    Write-Host "    [Full prompt: CONTINUATION_PROMPT_NEXT_SESSION.md]"
}

# Step 6: Quick commands
Write-Host @"

Quick Commands:
---------------

npm test              # Run tests
npm run build         # Build TypeScript
.\scripts\Validate.ps1 # Run all quality gates
.\scripts\Session-End.ps1 # End session properly

"@
```

---

### 3.2 Development Loop

**GREGORE's Pattern:**
```
1. Edit code
2. Auto-checkpoint (every 5-10 tool calls)
3. Run tests (TDD mode)
4. Validate
5. Commit
6. Repeat
```

**SHIM Should Follow:**

**Phase 1: Edit**
```typescript
// Use surgical editing for small changes
KERNL:sys_edit_block({
  file_path: "src/core/SignalCollector.ts",
  old_string: "const CONTEXT_WARNING = 60;",
  new_string: "const CONTEXT_WARNING = 75;",
  expected_replacements: 1
})

// Or write entire files for new modules
KERNL:pm_write_file({
  project: "shim",
  path: "src/core/NewModule.ts",
  content: "export class NewModule { ... }"
})
```

**Phase 2: Auto-Checkpoint**
```typescript
// After every 5-10 tool calls
KERNL:auto_checkpoint({
  project: "shim",
  operation: "Implementing SignalCollector",
  progress: 0.6,
  currentStep: "Adding context usage tracking",
  decisions: ["Using tiktoken for token counting", "Storing in memory, not SQLite"],
  nextSteps: ["Implement message count tracking", "Add threshold checks"],
  activeFiles: ["src/core/SignalCollector.ts", "tests/SignalCollector.test.ts"]
})
```

**Phase 3: Test (TDD)**
```powershell
# Watch mode for rapid iteration
npm test -- --watch

# Or single run
npm test -- SignalCollector.test.ts
```

**Phase 4: Validate**
```powershell
# Full quality gates
.\scripts\Validate.ps1

# Or fast mode (skip slow checks)
.\scripts\Validate.ps1 -Fast
```

**Phase 5: Commit**
```powershell
# Automated session end
.\scripts\Session-End.ps1 -CommitMessage "feat(signals): implement context usage tracking"

# Or manual
git add -A
git commit -m "feat(signals): implement context usage tracking"
```

---

### 3.3 Session End Protocol

**GREGORE's Approach:**
```markdown
1. Validate (TypeScript, tests, coverage)
2. Commit with conventional message
3. Generate continuation prompt
4. Update documentation
5. Ready for next session
```

**SHIM Should Implement:**

```powershell
# D:\SHIM\scripts\Session-End.ps1
param(
    [string]$CommitMessage,
    [switch]$SkipValidation,
    [switch]$Push
)

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                    SESSION END                                 ║
╚════════════════════════════════════════════════════════════════╝
"@

# Step 1: Validation
if (-not $SkipValidation) {
    Write-Host "`n==> Running validation..." -ForegroundColor Cyan
    .\scripts\Validate.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Validation failed. Fix issues before committing." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Git status
Write-Host "`n==> Git status" -ForegroundColor Cyan
git status

$uncommitted = git status --porcelain | Measure-Object -Line | Select-Object -ExpandProperty Lines
if ($uncommitted -eq 0) {
    Write-Host "`n✓ No uncommitted changes. Nothing to commit." -ForegroundColor Green
    exit 0
}

# Step 3: Commit message
if (-not $CommitMessage) {
    Write-Host "`n==> Commit message (conventional commits)" -ForegroundColor Cyan
    Write-Host "    Types: feat, fix, docs, test, refactor, perf, chore"
    Write-Host "    Scopes: signals, checkpoint, resume, database, mcp, spec, config"
    Write-Host "    Example: feat(signals): implement context usage tracking"
    $CommitMessage = Read-Host "`n    Message"
}

# Validate conventional commit format
if ($CommitMessage -notmatch "^(feat|fix|docs|test|refactor|perf|chore)(\(.+\))?: .+") {
    Write-Host "`n⚠ Warning: Commit message doesn't follow conventional commits" -ForegroundColor Yellow
    $continue = Read-Host "    Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Step 4: Commit
Write-Host "`n==> Committing..." -ForegroundColor Cyan
git add -A
git commit -m $CommitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Committed successfully" -ForegroundColor Green
} else {
    Write-Host "    ✗ Commit failed" -ForegroundColor Red
    exit 1
}

# Step 5: Generate continuation prompt
Write-Host "`n==> Generating continuation prompt..." -ForegroundColor Cyan
.\scripts\Continue.ps1 -Generate

# Step 6: Push (optional)
if ($Push) {
    Write-Host "`n==> Pushing to remote..." -ForegroundColor Cyan
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ Pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Push failed" -ForegroundColor Red
    }
}

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                    SESSION COMPLETE                            ║
╚════════════════════════════════════════════════════════════════╝

Next session: Run .\scripts\Dev.ps1 to resume

"@ -ForegroundColor Green
```

---

## PART IV: QUALITY GATES

### 4.1 Pre-Commit Validation

**GREGORE's Gates:**
1. TypeScript compilation (0 errors)
2. Unit tests (all passing)
3. Coverage (≥80%)
4. Linting (auto-fix)
5. Format (auto-fix)
6. Build verification

**SHIM Should Implement:**

```powershell
# D:\SHIM\scripts\Validate.ps1
param(
    [switch]$Fast,
    [switch]$SkipTests,
    [switch]$SkipCoverage,
    [switch]$SkipTypeScript
)

$ErrorActionPreference = "Stop"
$validationPassed = $true

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                    SHIM VALIDATION                             ║
╚════════════════════════════════════════════════════════════════╝
"@

# GATE 1: TypeScript Compilation
if (-not $SkipTypeScript) {
    Write-Host "`n==> Gate 1: TypeScript Compilation" -ForegroundColor Cyan
    $tscOutput = npx tsc --noEmit 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ 0 TypeScript errors" -ForegroundColor Green
    } else {
        Write-Host "    ✗ TypeScript errors detected:" -ForegroundColor Red
        Write-Host $tscOutput
        $validationPassed = $false
    }
}

# GATE 2: Unit Tests
if (-not $SkipTests) {
    Write-Host "`n==> Gate 2: Unit Tests" -ForegroundColor Cyan
    npm test -- --passWithNoTests 2>&1 | Tee-Object -Variable testOutput | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ All tests passing" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Tests failed:" -ForegroundColor Red
        Write-Host $testOutput
        $validationPassed = $false
    }
}

# GATE 3: Coverage
if (-not $SkipCoverage -and -not $Fast) {
    Write-Host "`n==> Gate 3: Test Coverage" -ForegroundColor Cyan
    npm test -- --coverage --passWithNoTests 2>&1 | Tee-Object -Variable coverageOutput | Out-Null
    
    # Parse coverage from output
    $coverageMatch = $coverageOutput | Select-String "All files\s+\|\s+([\d.]+)"
    if ($coverageMatch) {
        $coverage = [double]$coverageMatch.Matches.Groups[1].Value
        if ($coverage -ge 80) {
            Write-Host "    ✓ Coverage: $coverage% (≥80% required)" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Coverage: $coverage% (<80% threshold)" -ForegroundColor Red
            $validationPassed = $false
        }
    } else {
        Write-Host "    ⚠ Could not parse coverage" -ForegroundColor Yellow
    }
}

# GATE 4: Git Status (informational)
Write-Host "`n==> Gate 4: Git Status" -ForegroundColor Cyan
$uncommitted = git status --porcelain | Measure-Object -Line | Select-Object -ExpandProperty Lines
if ($uncommitted -gt 0) {
    Write-Host "    ⚠ $uncommitted uncommitted files" -ForegroundColor Yellow
    git status --short
} else {
    Write-Host "    ✓ Working tree clean" -ForegroundColor Green
}

# GATE 5: File Sizes (informational)
if (-not $Fast) {
    Write-Host "`n==> Gate 5: File Size Analysis" -ForegroundColor Cyan
    $largeFiles = Get-ChildItem -Recurse -File -Exclude node_modules,dist,.git | 
        Where-Object { $_.Length -gt 1MB } |
        Sort-Object Length -Descending |
        Select-Object -First 5
    
    if ($largeFiles) {
        Write-Host "    ⚠ Large files detected:" -ForegroundColor Yellow
        $largeFiles | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "      $sizeMB MB: $($_.FullName)"
        }
    } else {
        Write-Host "    ✓ No files >1MB" -ForegroundColor Green
    }
}

# GATE 6: Performance Benchmarks (informational)
if (-not $Fast) {
    Write-Host "`n==> Gate 6: Performance Benchmarks" -ForegroundColor Cyan
    # Run performance tests if they exist
    if (Test-Path "tests/performance") {
        npm test -- tests/performance --passWithNoTests 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Performance benchmarks passed" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ Performance benchmarks failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    - No performance tests found" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n" -NoNewline
if ($validationPassed) {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                  ✓ VALIDATION PASSED                          ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                  ✗ VALIDATION FAILED                          ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
```

---

### 4.2 Git Hooks

**Pre-Commit Hook:**
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit validation..."

# TypeScript
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors. Commit blocked."
    exit 1
fi

# Tests
npm test -- --passWithNoTests
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit blocked."
    exit 1
fi

# Coverage
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}' --passWithNoTests 2>&1 | grep -q "Coverage threshold"
if [ $? -eq 0 ]; then
    echo "❌ Coverage below 80%. Commit blocked."
    exit 1
fi

echo "✅ Pre-commit validation passed"
exit 0
```

**Post-Commit Hook:**
```bash
#!/bin/sh
# .git/hooks/post-commit

# Update CURRENT_STATUS.md with latest commit info
echo "Updating CURRENT_STATUS.md..."

# Get latest commit
LATEST_COMMIT=$(git log -1 --format="%h - %s (%cr)")

# Update timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Update file (if exists)
if [ -f "CURRENT_STATUS.md" ]; then
    # This would ideally be done by PowerShell script
    # For now, just update timestamp
    sed -i "s/Last Updated:.*/Last Updated: $TIMESTAMP/" CURRENT_STATUS.md
fi

exit 0
```

---

## PART V: DOCUMENTATION STRUCTURE

### 5.1 Source of Truth Files

**GREGORE's Structure:**
```
D:/GREGORE/
├── docs/
│   ├── SOURCE_OF_TRUTH.md                 # Current phase, week, progress
│   ├── BACKLOG_INDEX.json                 # Epic registry (262 lines)
│   ├── epics/EPIC-XXX.md                  # Individual epic specs
│   ├── CLAUDE_INSTRUCTIONS_GLOBAL.md      # Universal behavior
│   └── CLAUDE_INSTRUCTIONS_PROJECT.md     # GREGORE-specific
├── CURRENT_STATUS.md                      # Auto-updated by git hook
└── CONTINUATION_PROMPT_NEXT_SESSION.md    # Auto-generated
```

**SHIM Should Create:**
```
D:/SHIM/
├── docs/
│   ├── SOURCE_OF_TRUTH.md                 # SHIM's phase/week tracker
│   ├── ROADMAP.md                         # 4 phases, estimated timeline
│   ├── specs/
│   │   ├── SPEC_CRASH_PREVENTION.md       # Phase 1 spec
│   │   ├── SPEC_MULTI_CHAT.md             # Phase 2 spec (future)
│   │   ├── SPEC_SELF_EVOLUTION.md         # Phase 3 spec (future)
│   │   └── SPEC_AUTONOMOUS.md             # Phase 4 spec (future)
│   ├── CLAUDE_INSTRUCTIONS_GLOBAL.md      # Symlink to shared
│   └── CLAUDE_INSTRUCTIONS_PROJECT.md     # SHIM-specific
├── CURRENT_STATUS.md                      # Auto-updated
└── CONTINUATION_PROMPT_NEXT_SESSION.md    # Auto-generated
```

**Key Differences:**
- SHIM uses individual spec files (4 phases), not epic registry
- SHIM's backlog is simpler (4 phases vs 68 epics)
- SHIM focuses on specs, GREGORE on epics
- Both use SOURCE_OF_TRUTH.md for current state

---

### 5.2 Continuation Prompts

**GREGORE's Approach:**
```markdown
# CONTINUATION PROMPT - NEXT SESSION

**Last Updated:** 2026-01-09 23:45:32

## Quick Resume

You were working on: [task]
Current phase: [phase]
Current week: [week]
Progress: [X]%

## Git Status

Recent commits:
- abc1234 - feat(backlog): implement hybrid architecture
- def5678 - test(backlog): add integration tests

Uncommitted changes:
- M src/backlog/BacklogManager.ts
- A tests/BacklogManager.integration.test.ts

## Build Status

- TypeScript: ✓ 0 errors
- Tests: ✓ Passing (145/145)
- Coverage: ✓ 87.3%

## Priority Tasks

1. [Next immediate task]
2. [Following task]
3. [Then...]

## Bootstrap Commands

```typescript
// Load session context
KERNL:get_session_context({ project: "gregore" })

// Batch read active files
KERNL:pm_batch_read({
  project: "gregore",
  paths: ["src/backlog/BacklogManager.ts", "tests/..."]
})
```

**SHIM Should Generate Similar:**

```powershell
# D:\SHIM\scripts\Continue.ps1
param(
    [switch]$Generate,
    [switch]$View
)

if ($Generate) {
    # Gather information
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $branch = git branch --show-current
    $recentCommits = git log -3 --format="%h - %s (%cr)"
    $uncommitted = git status --porcelain
    
    # Get TypeScript status
    npx tsc --noEmit 2>&1 | Out-Null
    $tsStatus = if ($LASTEXITCODE -eq 0) { "✓ 0 errors" } else { "✗ Has errors" }
    
    # Get test status
    npm test -- --passWithNoTests 2>&1 | Out-Null
    $testStatus = if ($LASTEXITCODE -eq 0) { "✓ Passing" } else { "✗ Failing" }
    
    # Get coverage (if available)
    $coverageFile = "coverage/coverage-summary.json"
    if (Test-Path $coverageFile) {
        $coverage = Get-Content $coverageFile | ConvertFrom-Json
        $coveragePct = $coverage.total.lines.pct
        $coverageStatus = "✓ $coveragePct%"
    } else {
        $coverageStatus = "- Not measured"
    }
    
    # Read current phase from SOURCE_OF_TRUTH.md
    $currentPhase = "Unknown"
    $currentWeek = "Unknown"
    if (Test-Path "docs\SOURCE_OF_TRUTH.md") {
        $sot = Get-Content "docs\SOURCE_OF_TRUTH.md" -Raw
        if ($sot -match '\*\*Current Phase:\*\* (.+)') {
            $currentPhase = $matches[1]
        }
        if ($sot -match '\*\*Current Week:\*\* (.+)') {
            $currentWeek = $matches[1]
        }
    }
    
    # Identify active files (modified in last 24 hours)
    $activeFiles = Get-ChildItem -Recurse -File -Path src,tests -Exclude node_modules,dist |
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } |
        Select-Object -ExpandProperty FullName |
        ForEach-Object { $_.Replace((Get-Location).Path + "\", "") }
    
    # Generate prompt
    $prompt = @"
# CONTINUATION PROMPT - NEXT SESSION

**Last Updated:** $timestamp

## Quick Resume

Current phase: $currentPhase
Current week: $currentWeek
Branch: $branch

## Git Status

Recent commits:
$recentCommits

Uncommitted changes:
$uncommitted

## Build Status

- TypeScript: $tsStatus
- Tests: $testStatus
- Coverage: $coverageStatus

## Active Files

$($activeFiles -join "`n")

## Priority Tasks

1. [Manually update based on current work]
2. [Next task]
3. [Following task]

## Technical Context

[Manually add any important context from current session]

## Bootstrap Commands

``````typescript
// Load session context
KERNL:get_session_context({ project: "shim" })

// Batch read active files
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    $(($activeFiles | ForEach-Object { """$_""" }) -join ",`n    ")
  ]
})
``````

## Session Metrics

- Session duration: [Track manually]
- Tool calls: [Track manually]
- Checkpoints: [Track manually]
- Files modified: $($activeFiles.Count)

---

*Auto-generated by Continue.ps1. Manually enhance Priority Tasks and Technical Context.*
"@
    
    # Write to file
    $prompt | Out-File -FilePath "CONTINUATION_PROMPT_NEXT_SESSION.md" -Encoding utf8
    
    Write-Host "✓ Generated CONTINUATION_PROMPT_NEXT_SESSION.md" -ForegroundColor Green
}

if ($View) {
    if (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") {
        Get-Content "CONTINUATION_PROMPT_NEXT_SESSION.md"
    } else {
        Write-Host "❌ No continuation prompt found. Run with -Generate first." -ForegroundColor Red
    }
}
```

---

## PART VI: TESTING INFRASTRUCTURE

### 6.1 Jest Configuration

**SHIM Should Use:**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true
};
```

---

### 6.2 Test Structure

**GREGORE's Pattern:**
```
tests/
├── unit/                    # Pure functions, no dependencies
│   ├── BacklogParser.test.ts
│   └── EpicValidator.test.ts
├── integration/             # Multiple components together
│   ├── BacklogManager.integration.test.ts
│   └── KERNL.integration.test.ts
├── performance/             # Benchmark tests
│   └── BacklogQuery.perf.test.ts
└── fixtures/                # Test data
    ├── sample-epic.md
    └── sample-backlog.json
```

**SHIM Should Follow:**
```
tests/
├── unit/
│   ├── SignalCollector.test.ts
│   ├── CheckpointManager.test.ts
│   └── ResumeDetector.test.ts
├── integration/
│   ├── CrashPrevention.integration.test.ts
│   └── KERNL.integration.test.ts
├── performance/
│   ├── CheckpointCreation.perf.test.ts    # Target: <100ms
│   └── CheckpointSize.perf.test.ts        # Target: <100KB
└── fixtures/
    ├── sample-checkpoint.json
    └── sample-conversation.json
```

---

### 6.3 Example Test

```typescript
// tests/unit/SignalCollector.test.ts
import { SignalCollector } from '../../src/core/SignalCollector';

describe('SignalCollector', () => {
  let collector: SignalCollector;

  beforeEach(() => {
    collector = new SignalCollector();
  });

  describe('trackMessage', () => {
    it('should increment message count', () => {
      collector.trackMessage('user', 'Hello');
      expect(collector.getMessageCount()).toBe(1);
      
      collector.trackMessage('assistant', 'Hi there');
      expect(collector.getMessageCount()).toBe(2);
    });

    it('should calculate context usage percentage', () => {
      // Simulate filling 60% of context
      for (let i = 0; i < 30; i++) {
        collector.trackMessage('user', 'x'.repeat(1000));
      }
      
      const usage = collector.getContextUsage();
      expect(usage.percentage).toBeGreaterThan(50);
      expect(usage.percentage).toBeLessThan(70);
    });
  });

  describe('checkThresholds', () => {
    it('should warn at 75% context', () => {
      // Fill to 75%
      for (let i = 0; i < 37; i++) {
        collector.trackMessage('user', 'x'.repeat(1000));
      }
      
      const signals = collector.checkThresholds();
      expect(signals.contextWarning).toBe(true);
      expect(signals.contextCritical).toBe(false);
    });

    it('should trigger critical at 90% context', () => {
      // Fill to 90%
      for (let i = 0; i < 45; i++) {
        collector.trackMessage('user', 'x'.repeat(1000));
      }
      
      const signals = collector.checkThresholds();
      expect(signals.contextCritical).toBe(true);
    });
  });

  describe('performance', () => {
    it('should track message in <1ms', () => {
      const start = performance.now();
      collector.trackMessage('user', 'Test message');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1);
    });

    it('should check thresholds in <10ms', () => {
      // Add 100 messages
      for (let i = 0; i < 100; i++) {
        collector.trackMessage('user', `Message ${i}`);
      }
      
      const start = performance.now();
      collector.checkThresholds();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });
  });
});
```

---

## PART VII: ERROR PREVENTION PATTERNS

### 7.1 TypeScript Strictness

**SHIM Should Use:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Key Settings:**
- `strict: true` - Maximum type safety
- `noUnusedLocals: true` - Catch dead code
- `noImplicitReturns: true` - Ensure all paths return
- `noFallthroughCasesInSwitch: true` - Prevent switch bugs

---

### 7.2 Input Validation

**Pattern:**
```typescript
// src/utils/validation.ts
export function validateCheckpoint(checkpoint: unknown): Checkpoint {
  if (!checkpoint || typeof checkpoint !== 'object') {
    throw new Error('Checkpoint must be an object');
  }

  const c = checkpoint as any;

  if (!c.metadata || typeof c.metadata !== 'object') {
    throw new Error('Checkpoint.metadata required');
  }

  if (!c.state || typeof c.state !== 'object') {
    throw new Error('Checkpoint.state required');
  }

  // Validate metadata
  if (typeof c.metadata.timestamp !== 'number') {
    throw new Error('metadata.timestamp must be number');
  }

  if (typeof c.metadata.messageCount !== 'number') {
    throw new Error('metadata.messageCount must be number');
  }

  // Return typed checkpoint
  return checkpoint as Checkpoint;
}
```

---

### 7.3 Error Handling

**Pattern:**
```typescript
// Wrap risky operations
export async function createCheckpoint(
  state: ConversationState
): Promise<CheckpointResult> {
  try {
    // Validate input
    if (!state || !state.messages) {
      throw new Error('Invalid conversation state');
    }

    // Perform operation
    const checkpoint = await serializeState(state);
    const compressed = await compressCheckpoint(checkpoint);

    // Validate output
    if (compressed.byteLength > MAX_CHECKPOINT_SIZE) {
      throw new Error(`Checkpoint too large: ${compressed.byteLength} bytes`);
    }

    return {
      success: true,
      checkpoint: compressed,
      metadata: {
        size: compressed.byteLength,
        messageCount: state.messages.length
      }
    };
  } catch (error) {
    // Log error (use proper logger in production)
    console.error('Checkpoint creation failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Never silently fail. Always return status or throw.**

---

## PART VIII: SCRIPTS LIBRARY

### 8.1 Setup Script

**Purpose:** One-time environment setup

**Location:** `D:\SHIM\scripts\Setup.ps1`

**Features:**
- Verify prerequisites (Node.js, npm, git, TypeScript)
- Install dependencies
- Create git hooks
- Prompt for KERNL registration
- Create documentation structure
- Verify configuration
- Run initial build test

**Usage:**
```powershell
.\scripts\Setup.ps1            # Full setup
.\scripts\Setup.ps1 -SkipDependencies  # Skip npm install
.\scripts\Setup.ps1 -SkipGitHooks      # Skip hook creation
```

---

### 8.2 Development Starter

**Purpose:** Quick session initialization

**Location:** `D:\SHIM\scripts\Dev.ps1`

**Features:**
- Display environment status
- Show project status (branch, commits, uncommitted)
- Check build health (TypeScript, tests)
- Display current phase from SOURCE_OF_TRUTH.md
- Show continuation prompt from last session
- Quick command reference

**Usage:**
```powershell
.\scripts\Dev.ps1              # Start development session
```

---

### 8.3 Validation Script

**Purpose:** Pre-commit quality gates

**Location:** `D:\SHIM\scripts\Validate.ps1`

**Features:**
- Gate 1: TypeScript compilation (0 errors required)
- Gate 2: Unit tests (must pass)
- Gate 3: Coverage (≥80% threshold)
- Gate 4: Git status (informational)
- Gate 5: File size analysis (>1MB warning)
- Gate 6: Performance benchmarks (informational)

**Usage:**
```powershell
.\scripts\Validate.ps1         # Full validation
.\scripts\Validate.ps1 -Fast   # Skip slow checks
.\scripts\Validate.ps1 -SkipTests  # Skip tests
```

---

### 8.4 Session End Script

**Purpose:** Automated commit workflow

**Location:** `D:\SHIM\scripts\Session-End.ps1`

**Features:**
- Run validation automatically
- Check git status
- Compose conventional commit message (interactive or parameter)
- Commit with validation
- Generate continuation prompt
- Optional push to remote

**Usage:**
```powershell
.\scripts\Session-End.ps1 -CommitMessage "feat(signals): implement context tracking"
.\scripts\Session-End.ps1 -Push  # Also push to remote
```

---

### 8.5 Continuation Generator

**Purpose:** Create session resume prompts

**Location:** `D:\SHIM\scripts\Continue.ps1`

**Features:**
- Gather git info (commits, uncommitted)
- Gather build status (TypeScript, tests, coverage)
- Identify active files (modified in last 24 hours)
- Generate CONTINUATION_PROMPT_NEXT_SESSION.md
- Include bootstrap commands

**Usage:**
```powershell
.\scripts\Continue.ps1 -Generate  # Create prompt
.\scripts\Continue.ps1 -View      # Display prompt
```

---

## PART IX: UTILITY PATTERNS

### 9.1 Batch File Reading

**When to Use:** Loading multiple files at session start

**Pattern:**
```typescript
// Claude Desktop MCP command
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    "src/core/SignalCollector.ts",
    "src/core/CheckpointManager.ts",
    "tests/SignalCollector.test.ts",
    "docs/SOURCE_OF_TRUTH.md"
  ]
})
```

**Benefits:**
- Single tool call vs 4 separate calls
- Faster context loading
- Atomic operation

---

### 9.2 Surgical Editing

**When to Use:** Small, precise changes to existing files

**Pattern:**
```typescript
// Change a constant
KERNL:sys_edit_block({
  file_path: "src/core/SignalCollector.ts",
  old_string: "const CONTEXT_WARNING = 60;",
  new_string: "const CONTEXT_WARNING = 75;",
  expected_replacements: 1
})

// Change a function implementation
KERNL:sys_edit_block({
  file_path: "src/core/SignalCollector.ts",
  old_string: `  checkThresholds(): SignalStatus {
    return { warning: false, critical: false };
  }`,
  new_string: `  checkThresholds(): SignalStatus {
    const usage = this.getContextUsage();
    return {
      warning: usage.percentage >= 75,
      critical: usage.percentage >= 90
    };
  }`,
  expected_replacements: 1
})
```

**Benefits:**
- Surgical precision (only change what needs changing)
- Verification (errors if text not found exactly once)
- Character-level diff on near-miss
- Preserves rest of file

---

### 9.3 Semantic Search

**When to Use:** Finding code by meaning, not text

**Pattern:**
```typescript
// Find checkpoint logic
KERNL:search_semantic({
  project: "shim",
  query: "checkpoint serialization and compression logic",
  limit: 5,
  minRelevance: 0.5
})

// Find signal detection
KERNL:search_semantic({
  project: "shim",
  query: "how we detect when context usage is too high",
  fileTypes: [".ts"]
})

// Find performance optimization
KERNL:search_semantic({
  project: "shim",
  query: "code that optimizes checkpoint size or speed"
})
```

**Benefits:**
- Meaning-based (not text match)
- Understands intent
- Cross-file connections
- Learns from patterns

---

### 9.4 Pattern Recording

**When to Use:** Capture valuable learnings for future use

**Pattern:**
```typescript
// After solving a problem
KERNL:record_pattern({
  project: "shim",
  name: "Checkpoint Size Reduction",
  problem: "Checkpoints were 500KB, exceeding 100KB target by 5x",
  solution: `Use structured references instead of duplicating data:
    - Message IDs instead of full message objects
    - Tool call IDs instead of full tool results
    - Compressed strings for large values
    Result: 500KB → 85KB (83% reduction)`,
  implementation: `
    1. Create MessageRegistry to track messages by ID
    2. Store only ID in checkpoint state
    3. Reconstruct full message on resume from registry
    4. Use zlib compression for remaining content
  `,
  metrics: {
    before: { avgSize: 500000, time: 250 },
    after: { avgSize: 85000, time: 120 },
    improvement: "83% smaller, 2x faster"
  }
})
```

**Benefits:**
- Cross-project learning (GREGORE can learn from SHIM)
- Automatic suggestions when similar problems arise
- Institutional knowledge capture
- Prevents rediscovering solutions

---

## PART X: SHIM-SPECIFIC RECOMMENDATIONS

### 10.1 Crash Prevention Utilities

**SHIM Should Create:**

**1. Signal Monitor**
```typescript
// scripts/monitor-signals.ts
// Real-time signal monitoring during development

import { SignalCollector } from '../src/core/SignalCollector';

const collector = new SignalCollector();

// Watch mode
setInterval(() => {
  const status = collector.checkThresholds();
  const usage = collector.getContextUsage();
  
  console.clear();
  console.log('=== SHIM Signal Monitor ===');
  console.log(`Context Usage: ${usage.percentage.toFixed(1)}% (${usage.tokens}/${usage.maxTokens} tokens)`);
  console.log(`Messages: ${collector.getMessageCount()}`);
  console.log(`Tool Calls: ${collector.getToolCallCount()}`);
  console.log(`Warning: ${status.contextWarning ? 'YES' : 'no'}`);
  console.log(`Critical: ${status.contextCritical ? 'YES' : 'no'}`);
  
  if (status.contextCritical) {
    console.log('\n⚠️  CRITICAL: Checkpoint recommended NOW');
  } else if (status.contextWarning) {
    console.log('\n⚠️  WARNING: Checkpoint recommended soon');
  }
}, 1000);
```

**2. Checkpoint Inspector**
```powershell
# scripts/Inspect-Checkpoint.ps1
param(
    [string]$CheckpointId,
    [switch]$Latest
)

# Load checkpoint from database
# Decompress
# Pretty-print JSON
# Show metadata (size, compression, signals)

# Usage: .\scripts\Inspect-Checkpoint.ps1 -Latest
```

**3. Crash Simulator**
```typescript
// scripts/simulate-crash.ts
// Generate realistic crash scenarios for testing

import { SignalCollector } from '../src/core/SignalCollector';
import { CheckpointManager } from '../src/core/CheckpointManager';

async function simulateCrash() {
  const collector = new SignalCollector();
  
  // Simulate long session
  for (let i = 0; i < 60; i++) {
    collector.trackMessage('user', generateRealisticMessage());
    collector.trackMessage('assistant', generateLongResponse());
    
    // Random tool calls
    if (Math.random() > 0.5) {
      collector.trackToolCall('some_tool', {}, 'success', Math.random() * 1000);
    }
  }
  
  // Checkpoint before crash
  const checkpoint = await manager.createCheckpoint({...});
  
  // Simulate crash (exit process)
  process.exit(1);
}
```

---

## PART XI: SOFT RECOMMENDATIONS

### 11.1 What to Adopt from GREGORE

**High Priority (Essential):**
1. ✅ KERNL session management (auto-checkpoint, resume detection)
2. ✅ Quality gates (TypeScript, tests, coverage)
3. ✅ Git workflow automation (pre-commit, post-commit)
4. ✅ Continuation prompts (zero context loss)
5. ✅ Surgical editing (precision changes)
6. ✅ Batch file operations (efficient loading)

**Medium Priority (Valuable):**
1. ✅ Semantic search (find code by meaning)
2. ✅ Pattern recording (capture learnings)
3. ✅ Development scripts (Dev.ps1, Validate.ps1, etc.)
4. ✅ SOURCE_OF_TRUTH.md (phase/week tracking)
5. ⚠️ Symlinked global instructions (or use copy-based)

**Low Priority (Optional):**
1. ⚠️ Epic backlog system (SHIM uses simpler spec-based approach)
2. ⚠️ Multi-project management (SHIM is single project for now)
3. ⚠️ Chrome automation (not needed for Phase 1)
4. ⚠️ Conversation export (nice-to-have, not critical)

---

### 11.2 What SHIM Should Customize

**SHIM-Specific Needs:**

1. **Performance Constraints**
   - Checkpoint creation <100ms (GREGORE has no such limit)
   - Checkpoint size <100KB target (GREGORE has no such limit)
   - Signal detection <10ms (GREGORE doesn't do signal detection)

2. **Accuracy Metrics**
   - Track signal detection accuracy (>90% target)
   - Measure false positive rate for crash prediction
   - Monitor checkpoint compression ratio

3. **Integration Testing**
   - SHIM needs extensive integration tests (not just unit)
   - Test actual crash scenarios and recovery
   - Test signal accuracy with real conversation patterns

4. **Backlog Structure**
   - SHIM uses 4 phase specs, not 68 epics
   - Simpler, more linear progression
   - Focus on specifications, not task tracking

5. **Authority Triggers**
   - Signal threshold violations (60%/75% context, 35/50 messages)
   - Checkpoint size violations (<100KB target, 200KB max)
   - Performance violations (<100ms creation, <10ms detection)
   - Data integrity violations (zero tolerance)

---

### 11.3 Progressive Adoption Strategy

**Week 1: Core Setup**
- Run Setup.ps1
- Register with KERNL
- Create basic project instructions
- Setup git hooks
- Create SOURCE_OF_TRUTH.md

**Week 2: Quality Infrastructure**
- Implement Validate.ps1
- Setup test infrastructure (Jest)
- Configure coverage thresholds
- Create first performance tests

**Week 3: Development Workflows**
- Create Dev.ps1, Session-End.ps1, Continue.ps1
- Test full development loop
- Practice checkpoint workflow
- Verify continuation prompts work

**Week 4: Intelligence Layer**
- Enable semantic search
- Create first pattern records
- Test cross-project learning
- Setup research tracking

**Week 5+: Advanced Features**
- Background jobs (if needed)
- Chrome automation (if needed)
- Multi-project coordination (Phase 2)

---

## PART XII: DECISION FRAMEWORK

### 12.1 Adoption Decision Matrix

**For each GREGORE capability, ask:**

| Question | Answer | Decision |
|----------|--------|----------|
| Does SHIM need this? | Yes | Adopt |
| Does SHIM need this? | No | Skip |
| Does SHIM need modified version? | Yes | Customize |
| Does this conflict with SHIM's domain? | Yes | Skip or redesign |
| Does this add complexity without value? | Yes | Skip |
| Is this infrastructure vs domain logic? | Infrastructure | Adopt |
| Is this infrastructure vs domain logic? | Domain-specific | Customize |

**Example Decisions:**

| Capability | Decision | Reason |
|------------|----------|--------|
| KERNL session management | ✅ Adopt | Core infrastructure, perfect fit |
| Quality gates | ✅ Adopt | Universal best practice |
| Epic backlog | ❌ Skip | SHIM uses spec-based approach |
| Semantic search | ✅ Adopt | Valuable for finding code |
| Performance metrics | ✅ Customize | SHIM has specific targets (100ms, 100KB) |
| Chrome automation | ⏸️ Defer | Not needed for Phase 1 |

---

## PART XIII: GETTING STARTED

### 13.1 Quick Start (30 minutes)

**If you just want to start coding:**

1. Run setup:
   ```powershell
   cd D:\SHIM
   .\scripts\Setup.ps1
   ```

2. Register with KERNL:
   ```typescript
   KERNL:pm_register_project({
     id: "shim",
     name: "SHIM",
     path: "D:\\SHIM"
   })
   ```

3. Start developing:
   ```powershell
   .\scripts\Dev.ps1
   ```

4. Begin Week 1 implementation (SignalCollector)

---

### 13.2 Deep Dive (2-3 hours)

**If you want to understand everything:**

1. Read this blueprint thoroughly (60 min)
2. Read CLAUDE_INSTRUCTIONS_PROJECT.md (30 min)
3. Read scripts/README.md (30 min)
4. Experiment with KERNL tools (30 min)
5. Run Setup.ps1 and test workflows (30 min)

---

### 13.3 Incremental Adoption (1 week)

**If you want to adopt gradually:**

**Day 1:** Setup + KERNL registration
**Day 2:** Git hooks + quality gates
**Day 3:** Development scripts + workflows
**Day 4:** Test infrastructure + coverage
**Day 5:** Intelligence layer + semantic search
**Day 6-7:** Practice full development loop

---

## PART XIV: QUESTIONS TO CONSIDER

### 14.1 For SHIM Instance

**Before implementation, SHIM should ask:**

1. **Infrastructure:**
   - Do I want shared global instructions (symlink) or per-project copies?
   - Do I need all 95 KERNL tools or just core session management?
   - Should I adopt GREGORE's exact git workflow or simplify?

2. **Testing:**
   - Is 80% coverage right for SHIM, or should it be higher?
   - Do I need performance tests from Day 1, or add later?
   - Should I test with real crash scenarios or synthetic data?

3. **Documentation:**
   - Do I want GREGORE's epic-based backlog or spec-based approach?
   - How detailed should SOURCE_OF_TRUTH.md be?
   - Should I auto-generate continuation prompts or manual?

4. **Workflows:**
   - Do I want fully automated commits or manual control?
   - Should Validate.ps1 block commits or just warn?
   - Do I need all 6 validation gates or fewer?

5. **Intelligence:**
   - Should I enable semantic search from Day 1?
   - Do I want pattern recording for Phase 1?
   - How much cross-project learning do I expect?

---

### 14.2 Critical Evaluation

**SHIM should critically assess:**

1. **Complexity vs Value:**
   - Is this infrastructure overkill for a 4-phase project?
   - Will automation save time or add cognitive load?
   - Do I need GREGORE-level sophistication?

2. **Maintenance Burden:**
   - Can I maintain 5 PowerShell scripts + docs?
   - Will quality gates slow down iteration?
   - Is the learning curve worth it?

3. **Domain Fit:**
   - Does GREGORE's approach match SHIM's needs?
   - Are there conflicts (epic vs spec structure)?
   - Should SHIM invent its own patterns?

4. **Risk Assessment:**
   - What if symlinks break?
   - What if KERNL becomes unavailable?
   - What if automation fails silently?

---

## PART XV: FINAL RECOMMENDATIONS

### 15.1 Conservative Approach (Minimal)

**Adopt only essentials:**
- KERNL session management (get_session_context, auto_checkpoint)
- Basic git hooks (pre-commit TypeScript + tests)
- Simple Validate.ps1 (TypeScript, tests, coverage)
- SOURCE_OF_TRUTH.md for phase tracking
- Manual continuation prompts

**Skip:**
- Development scripts
- Semantic search
- Pattern recording
- Automated commits
- Batch operations

**Outcome:** Basic infrastructure, low complexity, slower iteration

---

### 15.2 Balanced Approach (Recommended)

**Adopt core infrastructure:**
- Full KERNL session management
- Complete quality gates (6 gates)
- All development scripts (Setup, Dev, Validate, Session-End, Continue)
- Git workflow automation
- Batch file operations
- SOURCE_OF_TRUTH.md + continuation prompts

**Add later:**
- Semantic search (Week 4+)
- Pattern recording (when lessons emerge)
- Chrome automation (Phase 2+)

**Outcome:** Sophisticated infrastructure, managed complexity, fast iteration

---

### 15.3 Aggressive Approach (Maximum)

**Adopt everything:**
- Full GREGORE infrastructure
- All 95 KERNL tools
- Complete intelligence layer
- Symlinked global instructions
- Pattern recording from Day 1
- Background jobs
- Chrome automation

**Outcome:** Maximum capability, highest complexity, steep learning curve

---

### 15.4 My Recommendation

**For SHIM specifically:**

**Phase 1 (Weeks 1-6): Balanced Approach**
- Core session management ✅
- Quality gates (6 gates) ✅
- Development scripts (all 5) ✅
- Git automation ✅
- Batch operations ✅
- Surgical editing ✅

**Phase 2 (Weeks 7-12): Add Intelligence**
- Semantic search ✅
- Pattern recording ✅
- Cross-project learning ✅

**Phase 3+: As Needed**
- Background jobs (only if multi-chat needs them)
- Chrome automation (only if testing needs it)

**Rationale:**
- SHIM is a 4-phase project, not 68-epic marathon
- Crash prevention needs quality, not quantity of tools
- Start focused, expand when clear value

---

## PART XVI: CONCLUSION

### 16.1 What You're Getting

**Infrastructure:**
- 95 KERNL tools for session management, file ops, intelligence
- 5 PowerShell scripts for automation
- Git hooks for quality enforcement
- Complete testing infrastructure
- Documentation templates

**Workflows:**
- 60-second bootstrap sequence
- Automatic crash recovery
- Zero context loss
- Surgical code editing
- Pattern learning across projects

**Quality:**
- 6 validation gates before every commit
- 80% coverage threshold
- 0 TypeScript errors
- Automated continuation prompts
- Performance targets (<100ms, <100KB)

---

### 16.2 Remember

**Core Principle:** Copy the *patterns* that eliminate friction, customize the *implementation* for SHIM's domain.

**GREGORE took months to build this.** SHIM can adopt proven patterns in days.

**Not everything is relevant.** Choose wisely. Quality culture > feature velocity.

**SHIM's unique value:**
- Crash PREDICTION (signals)
- Checkpoint OPTIMIZATION (size/speed)
- Performance MONITORING (metrics)

**KERNL provides:**
- Crash RECOVERY (checkpoints)
- Session MANAGEMENT (state)
- File OPERATIONS (batch, surgical)

**Together:** Revolutionary crash prevention system with sophisticated infrastructure.

---

**Next:** SHIM instance reviews this blueprint, asks clarifying questions, and designs custom project instructions that leverage these capabilities while staying true to SHIM's crash prevention mission.

---

*End of Blueprint - Version 1.0.0*  
*"Infrastructure is the foundation. Build it right, build it once."*
