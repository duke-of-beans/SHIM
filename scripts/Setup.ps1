# SHIM Environment Setup Script
# Version: 1.1.0 (Clean rewrite)

[CmdletBinding()]
param(
    [switch]$SkipNpmInstall,
    [switch]$SkipGitHooks,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SHIM Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Step 1: Prerequisites
Write-Host "[1/7] Verifying Prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "  [OK] npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] npm not found" -ForegroundColor Red
    exit 1
}

try {
    $gitVersion = git --version
    Write-Host "  [OK] Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Git not found. Install from https://git-scm.com" -ForegroundColor Red
    exit 1
}

try {
    $tscVersion = npx tsc --version
    Write-Host "  [OK] TypeScript: $tscVersion" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] TypeScript not found (will be installed)" -ForegroundColor Yellow
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "[2/7] Installing Dependencies..." -ForegroundColor Yellow

if (-not $SkipNpmInstall) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] SkipNpmInstall flag set" -ForegroundColor Gray
}

# Step 3: Git hooks
Write-Host ""
Write-Host "[3/7] Creating Git Hooks..." -ForegroundColor Yellow

if (-not $SkipGitHooks) {
    $hooksDir = Join-Path $ProjectRoot ".git\hooks"
    
    # Pre-commit hook
    $preCommitPath = Join-Path $hooksDir "pre-commit"
    if (-not (Test-Path $preCommitPath) -or $Force) {
        @'
#!/bin/sh
# SHIM Pre-Commit Hook

echo "Running SHIM pre-commit validation..."

# TypeScript check
npm run type-check
if [ $? -ne 0 ]; then
    echo "[FAIL] TypeScript errors found"
    exit 1
fi

# Tests
npm test -- --silent
if [ $? -ne 0 ]; then
    echo "[FAIL] Tests failed"
    exit 1
fi

echo "[OK] Pre-commit validation passed"
exit 0
'@ | Out-File -FilePath $preCommitPath -Encoding ASCII -Force
        
        Write-Host "  [OK] Created pre-commit hook" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] pre-commit hook exists" -ForegroundColor Gray
    }
    
    # Post-commit hook
    $postCommitPath = Join-Path $hooksDir "post-commit"
    if (-not (Test-Path $postCommitPath) -or $Force) {
        @'
#!/bin/sh
# SHIM Post-Commit Hook

echo "Updating session status..."

# Get current info
current_date=$(date '+%Y-%m-%d %H:%M:%S')
current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
commit_msg=$(git log -1 --pretty=%B)

# Update status file
{
    echo "# SHIM - Current Status"
    echo ""
    echo "**Last Commit:** $current_date"
    echo "**Branch:** $current_branch"
    echo "**Message:** $commit_msg"
    echo ""
    echo "## Build Status"
    echo "Check with: npm run type-check && npm test"
    echo ""
} > CURRENT_STATUS.md

exit 0
'@ | Out-File -FilePath $postCommitPath -Encoding ASCII -Force
        
        Write-Host "  [OK] Created post-commit hook" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] post-commit hook exists" -ForegroundColor Gray
    }
} else {
    Write-Host "  [SKIP] SkipGitHooks flag set" -ForegroundColor Gray
}

# Step 4: Build
Write-Host ""
Write-Host "[4/7] Building Project..." -ForegroundColor Yellow

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build successful" -ForegroundColor Green

# Step 5: Run tests
Write-Host ""
Write-Host "[5/7] Running Tests..." -ForegroundColor Yellow

npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Tests passed" -ForegroundColor Green

# Step 6: Create session files
Write-Host ""
Write-Host "[6/7] Creating Session Files..." -ForegroundColor Yellow

# Current status
if (-not (Test-Path "CURRENT_STATUS.md") -or $Force) {
    $currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $currentBranch = git branch --show-current
    
    @"
# SHIM - Current Status

**Last Updated:** $currentDate
**Branch:** $currentBranch

## Build Status
- TypeScript: Run ``npm run type-check`` to verify
- Tests: Run ``npm test`` to verify
- Coverage: Run ``npm test -- --coverage`` to check

## Recent Activity
Environment just initialized. Run ``.\scripts\Dev.ps1`` to begin development.

## Next Steps
1. Read IMPLEMENTATION_CHECKLIST.md for verification
2. Register with KERNL: ``KERNL:pm_register_project()``
3. Begin SignalCollector implementation

"@ | Out-File -FilePath "CURRENT_STATUS.md" -Encoding UTF8 -Force
    
    Write-Host "  [OK] Created CURRENT_STATUS.md" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] CURRENT_STATUS.md exists" -ForegroundColor Gray
}

# Continuation prompt
if (-not (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") -or $Force) {
    $currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    @"
# SHIM - Session Continuation Prompt

**Generated:** $currentDate

## Quick Start
1. Open Claude Desktop
2. Run: ``KERNL:get_session_context({ project: "shim" })``
3. Check for incomplete work and resume if needed
4. Continue implementation

## Current Phase
Week 1: Core Infrastructure Setup

## Priority Tasks
1. Complete environment setup verification
2. Register with KERNL
3. Begin SignalCollector implementation

## Technical Context
- Target: 80% test coverage
- Checkpoint size: <100KB target, <200KB max
- Checkpoint creation: <100ms
- Signal accuracy: >90%

"@ | Out-File -FilePath "CONTINUATION_PROMPT_NEXT_SESSION.md" -Encoding UTF8 -Force
    
    Write-Host "  [OK] Created CONTINUATION_PROMPT_NEXT_SESSION.md" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] CONTINUATION_PROMPT_NEXT_SESSION.md exists" -ForegroundColor Gray
}

# Step 7: Summary
Write-Host ""
Write-Host "[7/7] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Register with KERNL (see IMPLEMENTATION_CHECKLIST.md)" -ForegroundColor White
Write-Host "  2. Run .\scripts\Dev.ps1 to start development session" -ForegroundColor White
Write-Host "  3. Read docs/specs/SPEC_CRASH_PREVENTION.md" -ForegroundColor White
Write-Host ""
