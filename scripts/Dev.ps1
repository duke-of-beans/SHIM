# SHIM Development Session Starter
# Version: 1.0.0
# Purpose: Start a development session with context and status

[CmdletBinding()]
param(
    [switch]$Quick,
    [switch]$ShowContinuation,
    [switch]$SkipStatus
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if (-not $Quick) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "SHIM Development Session" -ForegroundColor Cyan
    Write-Host "==================================================`n" -ForegroundColor Cyan
}

# 1. Environment Verification
if (-not $Quick -and -not $SkipStatus) {
    Write-Host "[1/5] Environment Status..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Node.js not available" -ForegroundColor Red
    }
    
    if (Test-Path "node_modules") {
        Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ! Dependencies not installed. Run: npm install" -ForegroundColor Yellow
    }
    
    try {
        $gitStatus = git status --short 2>&1
        Write-Host "  ✓ Git repository initialized" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Not a git repository" -ForegroundColor Red
    }
}

# 2. Project Status
if (-not $Quick -and -not $SkipStatus) {
    Write-Host "`n[2/5] Project Status..." -ForegroundColor Yellow
    
    $branch = git branch --show-current 2>$null
    if ($branch) {
        Write-Host "  Branch: $branch" -ForegroundColor Cyan
    }
    
    $commitCount = git rev-list --count HEAD 2>$null
    if ($commitCount) {
        Write-Host "  Commits: $commitCount" -ForegroundColor Cyan
    }
    
    $latestCommit = git log -1 --format="%h: %s (%cr)" 2>$null
    if ($latestCommit) {
        Write-Host "  Latest: $latestCommit" -ForegroundColor Cyan
    }
    
    $uncommittedChanges = git status --short 2>$null
    if ($uncommittedChanges) {
        $changeCount = ($uncommittedChanges -split "`n").Count
        Write-Host "  Uncommitted changes: $changeCount files" -ForegroundColor Yellow
    } else {
        Write-Host "  Working tree: Clean" -ForegroundColor Green
    }
}

# 3. Build Health
if (-not $Quick -and -not $SkipStatus) {
    Write-Host "`n[3/5] Build Health..." -ForegroundColor Yellow
    
    Write-Host "  Checking TypeScript..." -NoNewline
    npx tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓ 0 errors" -ForegroundColor Green
    } else {
        Write-Host " ✗ Has errors (run npx tsc --noEmit)" -ForegroundColor Red
    }
    
    Write-Host "  Test status:" -NoNewline
    $testResult = npm test -- --passWithNoTests 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓ Passing" -ForegroundColor Green
    } else {
        Write-Host " ✗ Failing (run npm test)" -ForegroundColor Red
    }
}

# 4. Current Phase
if (-not $Quick -and -not $SkipStatus) {
    Write-Host "`n[4/5] Current Phase..." -ForegroundColor Yellow
    
    if (Test-Path "docs\SOURCE_OF_TRUTH.md") {
        $sotContent = Get-Content "docs\SOURCE_OF_TRUTH.md" -Raw
        if ($sotContent -match "## Current Phase\s*\n\s*(.+)") {
            Write-Host "  $($Matches[1])" -ForegroundColor Cyan
        }
        
        if ($sotContent -match "## Current Week\s*\n\s*(.+)") {
            Write-Host "  $($Matches[1])" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  Phase 1: Core Infrastructure" -ForegroundColor Cyan
        Write-Host "  Week 1: Setup & SignalCollector" -ForegroundColor Cyan
    }
}

# 5. Continuation from Last Session
if ($ShowContinuation -or (-not $Quick -and -not $SkipStatus)) {
    Write-Host "`n[5/5] Continuation from Last Session..." -ForegroundColor Yellow
    
    if (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") {
        $continuation = Get-Content "CONTINUATION_PROMPT_NEXT_SESSION.md" -Raw
        
        # Extract priority tasks
        if ($continuation -match "## Priority Tasks\s*\n((?:.*\n)+?)(?:\n##|\z)") {
            $tasks = $Matches[1].Trim()
            Write-Host "`n$tasks`n" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  No continuation prompt found" -ForegroundColor Gray
        Write-Host "  Run .\scripts\Continue.ps1 -Generate to create one" -ForegroundColor Gray
    }
}

if (-not $Quick) {
    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host "Ready for Development" -ForegroundColor Green
    Write-Host "==================================================`n" -ForegroundColor Green
    
    Write-Host "Quick Reference Commands:" -ForegroundColor Yellow
    Write-Host "  npm test              Run tests" -ForegroundColor White
    Write-Host "  npm test -- --watch   Run tests in watch mode" -ForegroundColor White
    Write-Host "  npx tsc --noEmit      Check TypeScript compilation" -ForegroundColor White
    Write-Host "  npx tsc --watch       Watch mode for TypeScript" -ForegroundColor White
    Write-Host "  .\scripts\Validate.ps1         Pre-commit validation" -ForegroundColor White
    Write-Host "  .\scripts\Session-End.ps1      End session (commit + docs)" -ForegroundColor White
    Write-Host "  .\scripts\Continue.ps1         Generate continuation prompt`n" -ForegroundColor White
    
    Write-Host "Claude Desktop Bootstrap:" -ForegroundColor Yellow
    Write-Host "  KERNL:get_session_context({ project: `"shim`" })" -ForegroundColor Cyan
    Write-Host "  KERNL:pm_batch_read({" -ForegroundColor Cyan
    Write-Host "    project: `"shim`"," -ForegroundColor Cyan
    Write-Host "    paths: [`"CURRENT_STATUS.md`", `"CONTINUATION_PROMPT_NEXT_SESSION.md`"]" -ForegroundColor Cyan
    Write-Host "  })`n" -ForegroundColor Cyan
    
    Write-Host "Quality Reminders:" -ForegroundColor Yellow
    Write-Host "  • Maintain ≥80% test coverage" -ForegroundColor Gray
    Write-Host "  • Keep checkpoint creation <100ms" -ForegroundColor Gray
    Write-Host "  • Keep checkpoint size <100KB (target), <200KB (max)" -ForegroundColor Gray
    Write-Host "  • Target >90% signal accuracy" -ForegroundColor Gray
    Write-Host "  • Zero tolerance for data loss`n" -ForegroundColor Gray
    
    Write-Host "Key Files:" -ForegroundColor Yellow
    Write-Host "  docs\specs\SPEC_CRASH_PREVENTION.md    - Core specification" -ForegroundColor Gray
    Write-Host "  docs\SOURCE_OF_TRUTH.md                - Roadmap & decisions" -ForegroundColor Gray
    Write-Host "  docs\CLAUDE_INSTRUCTIONS_PROJECT.md    - Development guide" -ForegroundColor Gray
    Write-Host "  IMPLEMENTATION_CHECKLIST.md            - Setup verification`n" -ForegroundColor Gray
}

if ($Quick) {
    Write-Host "✓ Quick status check complete`n" -ForegroundColor Green
}
