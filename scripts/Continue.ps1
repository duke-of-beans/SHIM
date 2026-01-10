# SHIM Continuation Prompt Generator
# Version: 1.0.0
# Purpose: Generate comprehensive continuation prompt for next session

[CmdletBinding()]
param(
    [switch]$Generate,
    [switch]$View
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if ($View) {
    if (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") {
        Get-Content "CONTINUATION_PROMPT_NEXT_SESSION.md" | Write-Host
    } else {
        Write-Host "CONTINUATION_PROMPT_NEXT_SESSION.md not found" -ForegroundColor Red
        Write-Host "Run with -Generate to create it" -ForegroundColor Yellow
    }
    exit 0
}

if (-not $Generate) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\Continue.ps1 -Generate    Generate continuation prompt" -ForegroundColor White
    Write-Host "  .\Continue.ps1 -View        View current continuation prompt" -ForegroundColor White
    exit 0
}

Write-Host "`nGenerating continuation prompt..." -ForegroundColor Yellow

# Gather information
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$branch = git branch --show-current 2>$null
$commitCount = git rev-list --count HEAD 2>$null
$gitStatus = git status --short 2>$null

# Get recent commits
$recentCommits = git log -5 --format="- %h: %s (%cr)" 2>$null | Out-String

# Check TypeScript status
npx tsc --noEmit 2>&1 | Out-Null
$tscStatus = if ($LASTEXITCODE -eq 0) { "✓ 0 errors" } else { "✗ Has errors" }

# Check test status
npm test -- --passWithNoTests 2>&1 | Out-Null
$testStatus = if ($LASTEXITCODE -eq 0) { "✓ Passing" } else { "✗ Failing" }

# Check coverage if available
$coverageStatus = "Not available"
if (Test-Path "coverage\coverage-summary.json") {
    $coverage = Get-Content "coverage\coverage-summary.json" -Raw | ConvertFrom-Json
    $linesCoverage = $coverage.total.lines.pct
    $coverageStatus = "${linesCoverage}%"
}

# Get current phase/week from SOURCE_OF_TRUTH.md
$currentPhase = "Phase 1: Core Infrastructure"
$currentWeek = "Week 1: Setup & SignalCollector"

if (Test-Path "docs\SOURCE_OF_TRUTH.md") {
    $sotContent = Get-Content "docs\SOURCE_OF_TRUTH.md" -Raw
    if ($sotContent -match "## Current Phase\s*\n\s*(.+)") {
        $currentPhase = $Matches[1].Trim()
    }
    if ($sotContent -match "## Current Week\s*\n\s*(.+)") {
        $currentWeek = $Matches[1].Trim()
    }
}

# Identify active files (recently modified)
$activeFiles = @()
if ($gitStatus) {
    $modifiedFiles = $gitStatus | Select-String "^\s*M\s+" | ForEach-Object { 
        $_ -replace "^\s*M\s+", ""
    }
    $activeFiles += $modifiedFiles
}

# Add key implementation files
$keyFiles = @(
    "src/lib/signals/SignalCollector.ts",
    "src/lib/checkpoint/CheckpointManager.ts",
    "src/lib/resume/ResumeDetector.ts",
    "src/lib/storage/DatabaseManager.ts"
)

foreach ($file in $keyFiles) {
    if ((Test-Path $file) -and ($activeFiles -notcontains $file)) {
        $activeFiles += $file
    }
}

# Generate continuation prompt content
$continuationContent = @"
# SHIM - Session Continuation Prompt

**Generated:** $timestamp
**Branch:** $branch
**Total Commits:** $commitCount

---

## Session Summary

### Build Status
- **TypeScript:** $tscStatus
- **Tests:** $testStatus
- **Coverage:** $coverageStatus
- **Git Status:** $(if($gitStatus){"$($gitStatus.Count) files changed"}else{"Clean"})

### Recent Commits
``````
$recentCommits
``````

---

## What We Were Working On

### Uncommitted Changes
$(if ($gitStatus) {
    $stagedFiles = $gitStatus | Select-String "^[MADRCU]" | ForEach-Object { "- $_" } | Out-String
    if ($stagedFiles) { "**Staged:**`n$stagedFiles" } else { "" }
    
    $unstagedFiles = $gitStatus | Select-String "^.[MADRCU]" | ForEach-Object { "- $_" } | Out-String
    if ($unstagedFiles) { "**Unstaged:**`n$unstagedFiles" } else { "" }
} else {
    "No uncommitted changes"
})

### Latest Commits
$(git log -3 --format="- **%h**: %s (%cr)%n  %b" 2>$null)

---

## Decisions Made

Review recent commits for architectural and implementation decisions.

Key decision areas:
- Signal collection strategy
- Checkpoint format and compression
- Resume detection algorithm
- Database schema and indexing
- Performance optimization approaches

---

## Progress Indicators

### Current Phase
$currentPhase

### Current Week
$currentWeek

### Phase Completion
- [ ] SignalCollector (context tracking, message counting, timing signals)
- [ ] CheckpointManager (serialization, compression, storage)
- [ ] ResumeDetector (crash detection, checkpoint validation, resume orchestration)
- [ ] Integration testing
- [ ] Performance benchmarks
- [ ] Documentation

---

## Next Steps

### Priority 1: Core Implementation
1. Complete SignalCollector implementation
   - Context window usage tracking (60% warning, 75% critical)
   - Message count tracking (35 warning, 50 critical)
   - Response time analysis
   - Signal correlation engine

2. Implement CheckpointManager
   - Conversation state serialization
   - Checkpoint compression (<100KB target, <200KB max)
   - Storage with metadata
   - Fast checkpoint creation (<100ms)

3. Build ResumeDetector
   - Crash detection (multiple signals)
   - Checkpoint validation (integrity check)
   - Resume decision logic (>90% accuracy)
   - Seamless resumption

### Priority 2: Quality & Testing
1. Maintain ≥80% test coverage
2. Add performance benchmarks
3. Integration test suite
4. Error handling and edge cases

### Priority 3: Documentation
1. Update SPEC_CRASH_PREVENTION.md with implementation details
2. Document design decisions
3. Create usage examples
4. Performance tuning guide

---

## Active Files

$(if ($activeFiles.Count -gt 0) {
    $activeFiles | ForEach-Object { "- $_" } | Out-String
} else {
    "- No active files (clean working tree)"
})

### Key Implementation Files
- src/lib/signals/SignalCollector.ts
- src/lib/checkpoint/CheckpointManager.ts
- src/lib/resume/ResumeDetector.ts
- src/lib/storage/DatabaseManager.ts
- src/lib/mcp/ShimMcpServer.ts

---

## Technical Context

### Performance Targets
- **Checkpoint creation:** <100ms (target), <200ms (max)
- **Checkpoint size:** <100KB (target), <200KB (max, compressed)
- **Resume accuracy:** >90% correct decisions
- **Signal accuracy:** >90% true positives

### Quality Thresholds
- **Test coverage:** ≥80% (lines, branches, functions, statements)
- **TypeScript errors:** 0 (enforced by pre-commit hook)
- **Test pass rate:** 100% (enforced by pre-commit hook)

### Data Integrity
- **Zero tolerance for data loss**
- **Fail loudly, never silently**
- **Verify checkpoint integrity before storage**
- **Validate resume state before application**

---

## Known Issues / Blockers

$(if (Test-Path "docs\BLOCKERS.md") {
    Get-Content "docs\BLOCKERS.md" -Raw
} else {
    "None documented. Create docs\BLOCKERS.md if needed."
})

---

## Bootstrap Commands for Next Session

``````typescript
// 1. Get session context (checks for incomplete work)
KERNL:get_session_context({ 
  project: "shim",
  messageCount: 20 
})

// 2. Load project state
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    "CURRENT_STATUS.md",
    "CONTINUATION_PROMPT_NEXT_SESSION.md",
    "docs/SOURCE_OF_TRUTH.md"
  ]
})

// 3. If resuming incomplete work, load active files
$(if ($activeFiles.Count -gt 0) {
    "KERNL:pm_batch_read({`n  project: `"shim`",`n  paths: [`n" + 
    ($activeFiles | ForEach-Object { "    `"$_`"" } | Join-String -Separator ",`n") +
    "`n  ]`n})"
} else {
    "// No active files to load"
})
``````

---

## Session Metrics

- **Total commits:** $commitCount
- **Active files:** $($activeFiles.Count)
- **Build health:** $(if($tscStatus -match "✓"){"Passing"}else{"Failing"})
- **Test health:** $(if($testStatus -match "✓"){"Passing"}else{"Failing"})
- **Coverage:** $coverageStatus

---

## Quick Reference

**Start Development:**
``````powershell
.\scripts\Dev.ps1
``````

**Run Tests (Watch Mode):**
``````powershell
npm test -- --watch
``````

**Check TypeScript:**
``````powershell
npx tsc --noEmit
``````

**Validate Before Commit:**
``````powershell
.\scripts\Validate.ps1
``````

**End Session:**
``````powershell
.\scripts\Session-End.ps1
``````

---

*Generated by Continue.ps1 v1.0.0*
"@

# Write continuation prompt
Set-Content -Path "CONTINUATION_PROMPT_NEXT_SESSION.md" -Value $continuationContent -Force
Write-Host "  ✓ Generated CONTINUATION_PROMPT_NEXT_SESSION.md" -ForegroundColor Green

# Update CURRENT_STATUS.md
$statusContent = @"
# SHIM - Current Status

**Last Updated:** $timestamp
**Branch:** $branch
**Commits:** $commitCount

## Build Status
- **TypeScript:** $tscStatus
- **Tests:** $testStatus
- **Coverage:** $coverageStatus

## Recent Changes
``````
$(git log -3 --format="- %h: %s (%cr)")
``````

## Git Status
$(if ($gitStatus) { "$($gitStatus.Count) files changed" } else { "Working tree clean" })

## Next Steps
See CONTINUATION_PROMPT_NEXT_SESSION.md for detailed next steps.

## Quick Actions
- Run tests: ``npm test``
- Check TypeScript: ``npx tsc --noEmit``
- Start development: ``.\scripts\Dev.ps1``
- End session: ``.\scripts\Session-End.ps1``
"@

Set-Content -Path "CURRENT_STATUS.md" -Value $statusContent -Force
Write-Host "  ✓ Updated CURRENT_STATUS.md" -ForegroundColor Green

Write-Host "`n✓ Continuation prompt generated successfully`n" -ForegroundColor Green
