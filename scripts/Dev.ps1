# SHIM Development Session Starter
# Version: 1.1.0
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
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "SHIM Development Session" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
}

# 1. Environment Verification
if (-not $Quick -and -not $SkipStatus) {
    Write-Host "[1/5] Environment Status..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Node.js not available" -ForegroundColor Red
    }
    
    if (Test-Path "node_modules") {
        Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Dependencies not installed. Run: npm install" -ForegroundColor Yellow
    }
    
    try {
        $null = git status --short 2>&1
        Write-Host "  [OK] Git repository initialized" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Not a git repository" -ForegroundColor Red
    }
}

# 2. Project Status
if (-not $Quick -and -not $SkipStatus) {
    Write-Host ""
    Write-Host "[2/5] Project Status..." -ForegroundColor Yellow
    
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
    Write-Host ""
    Write-Host "[3/5] Build Health..." -ForegroundColor Yellow
    
    Write-Host "  Checking TypeScript..." -NoNewline
    npx tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK] 0 errors" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Has errors" -ForegroundColor Red
    }
    
    Write-Host "  Test status:" -NoNewline
    npm test 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK] Passing" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Failing" -ForegroundColor Red
    }
}

# 4. Current Phase
if (-not $Quick -and -not $SkipStatus) {
    Write-Host ""
    Write-Host "[4/5] Current Phase..." -ForegroundColor Yellow
    
    if (Test-Path "docs/SOURCE_OF_TRUTH.md") {
        $sotContent = Get-Content "docs/SOURCE_OF_TRUTH.md" -Raw
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
    Write-Host ""
    Write-Host "[5/5] Continuation from Last Session..." -ForegroundColor Yellow
    
    if (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") {
        $continuation = Get-Content "CONTINUATION_PROMPT_NEXT_SESSION.md" -Raw
        
        if ($continuation -match "## Priority Tasks\s*\n((?:.*\n)+?)(?:\n##|\z)") {
            $tasks = $Matches[1].Trim()
            Write-Host ""
            Write-Host $tasks -ForegroundColor Cyan
            Write-Host ""
        }
    } else {
        Write-Host "  No continuation prompt found" -ForegroundColor Gray
    }
}

if (-not $Quick) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "Ready for Development" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Quick Reference Commands:" -ForegroundColor Yellow
    Write-Host "  npm test                    Run tests" -ForegroundColor White
    Write-Host "  npm test -- --watch         Watch mode" -ForegroundColor White
    Write-Host "  npx tsc --noEmit            Check TypeScript" -ForegroundColor White
    Write-Host "  npx tsc --watch             TypeScript watch mode" -ForegroundColor White
    Write-Host "  .\scripts\Validate.ps1      Pre-commit validation" -ForegroundColor White
    Write-Host "  .\scripts\Session-End.ps1   End session" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Claude Desktop Bootstrap:" -ForegroundColor Yellow
    Write-Host '  KERNL:get_session_context({ project: "shim" })' -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Quality Standards:" -ForegroundColor Yellow
    Write-Host "  Test coverage: ≥80%" -ForegroundColor Gray
    Write-Host "  Checkpoint time: <100ms" -ForegroundColor Gray
    Write-Host "  Checkpoint size: <100KB (target), <200KB (max)" -ForegroundColor Gray
    Write-Host "  Signal accuracy: >90%" -ForegroundColor Gray
    Write-Host "  Data loss: 0% tolerance" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Key Files:" -ForegroundColor Yellow
    Write-Host "  docs/specs/SPEC_CRASH_PREVENTION.md     Core spec" -ForegroundColor Gray
    Write-Host "  docs/SOURCE_OF_TRUTH.md                 Roadmap" -ForegroundColor Gray
    Write-Host "  docs/CLAUDE_INSTRUCTIONS_PROJECT.md     Dev guide" -ForegroundColor Gray
    Write-Host ""
}

if ($Quick) {
    Write-Host ""
    Write-Host "[OK] Quick status check complete" -ForegroundColor Green
    Write-Host ""
}
