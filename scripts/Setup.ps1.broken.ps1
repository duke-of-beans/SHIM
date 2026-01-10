# SHIM Environment Setup Script
# Version: 1.0.0
# Purpose: One-time setup for SHIM development environment

[CmdletBinding()]
param(
    [switch]$SkipNpmInstall,
    [switch]$SkipGitHooks,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "SHIM Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Cyan

# Navigate to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "[1/7] Verifying Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check git
try {
    $gitVersion = git --version
    Write-Host "  ✓ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Git not found. Please install Git from https://git-scm.com" -ForegroundColor Red
    exit 1
}

# Check TypeScript
try {
    $tscVersion = npx tsc --version
    Write-Host "  ✓ TypeScript: $tscVersion" -ForegroundColor Green
} catch {
    Write-Host "  ! TypeScript not found (will be installed with dependencies)" -ForegroundColor Yellow
}

Write-Host "`n[2/7] Installing Dependencies..." -ForegroundColor Yellow

if (-not $SkipNpmInstall) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⊙ Skipped (SkipNpmInstall flag)" -ForegroundColor Gray
}

Write-Host "`n[3/7] Creating Git Hooks..." -ForegroundColor Yellow

if (-not $SkipGitHooks) {
    $hooksDir = Join-Path $ProjectRoot ".git\hooks"
    
    # Pre-commit hook
    $preCommitPath = Join-Path $hooksDir "pre-commit"
    $preCommitContent = @'
#!/bin/sh
# SHIM Pre-Commit Hook
# Runs validation before allowing commit

echo "Running SHIM pre-commit validation..."

# TypeScript compilation check
echo "  [1/3] TypeScript compilation..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "  ✗ TypeScript errors found. Fix before committing."
    exit 1
fi

# Unit tests
echo "  [2/3] Running tests..."
npm test -- --passWithNoTests
if [ $? -ne 0 ]; then
    echo "  ✗ Tests failed. Fix before committing."
    exit 1
fi

# Coverage check
echo "  [3/3] Checking coverage..."
npm test -- --coverage --passWithNoTests > /dev/null 2>&1
COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o 'pct":[0-9.]*' | cut -d':' -f2)
if [ $(echo "$COVERAGE < 80" | bc) -eq 1 ]; then
    echo "  ✗ Coverage below 80% (current: $COVERAGE%). Add tests before committing."
    exit 1
fi

echo "  ✓ All pre-commit checks passed"
exit 0
'@
    
    Set-Content -Path $preCommitPath -Value $preCommitContent -Force
    Write-Host "  ✓ Created pre-commit hook" -ForegroundColor Green
    
    # Post-commit hook
    $postCommitPath = Join-Path $hooksDir "post-commit"
    $postCommitContent = @'
#!/bin/sh
# SHIM Post-Commit Hook
# Updates documentation after commit

echo "Updating CURRENT_STATUS.md..."

# Get latest commit info
COMMIT_HASH=$(git log -1 --format="%H" | cut -c1-7)
COMMIT_MSG=$(git log -1 --format="%s")
COMMIT_DATE=$(git log -1 --format="%cd" --date=format:"%Y-%m-%d %H:%M:%S")

# Update CURRENT_STATUS.md using printf instead of heredoc
{
  echo "# SHIM - Current Status"
  echo ""
  echo "**Last Updated:** $COMMIT_DATE"
  echo "**Latest Commit:** $COMMIT_HASH - $COMMIT_MSG"
  echo ""
  echo "## Build Status"
  echo "- TypeScript: 0 errors"
  echo "- Tests: Check with \`npm test\`"
  echo "- Coverage: Check with \`npm test -- --coverage\`"
  echo ""
  echo "## Recent Changes"
  echo "\`\`\`"
  git log -3 --format="- %h: %s (%cr)" | head -n 3
  echo "\`\`\`"
  echo ""
  echo "## Next Steps"
  echo "See CONTINUATION_PROMPT_NEXT_SESSION.md for detailed next steps."
} > CURRENT_STATUS.md

echo "  ✓ CURRENT_STATUS.md updated"
'@
    
    Set-Content -Path $postCommitPath -Value $postCommitContent -Force
    Write-Host "  ✓ Created post-commit hook" -ForegroundColor Green
    
} else {
    Write-Host "  ⊙ Skipped (SkipGitHooks flag)" -ForegroundColor Gray
}

Write-Host "`n[4/7] Verifying Configuration Files..." -ForegroundColor Yellow

# Check tsconfig.json
if (Test-Path "tsconfig.json") {
    Write-Host "  ✓ tsconfig.json exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ tsconfig.json missing" -ForegroundColor Red
}

# Check jest.config.js
if (Test-Path "jest.config.js") {
    Write-Host "  ✓ jest.config.js exists" -ForegroundColor Green
} else {
    Write-Host "  ! jest.config.js missing (tests will use defaults)" -ForegroundColor Yellow
}

# Check package.json
if (Test-Path "package.json") {
    Write-Host "  ✓ package.json exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ package.json missing" -ForegroundColor Red
}

Write-Host "`n[5/7] Creating Documentation Templates..." -ForegroundColor Yellow

# Create CURRENT_STATUS.md if not exists
if (-not (Test-Path "CURRENT_STATUS.md") -or $Force) {
    $currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $currentBranch = git branch --show-current
    
    $statusContent = @'
# SHIM - Current Status

**Last Updated:** {0}
**Branch:** {1}

## Build Status
TypeScript: Run npx tsc --noEmit to check
Tests: Run npm test to check
Coverage: Run npm test -- --coverage to check

## Recent Activity
Environment just initialized. Run .\scripts\Dev.ps1 to begin development.

## Next Steps
1. Read IMPLEMENTATION_CHECKLIST.md for setup verification
2. Register project with KERNL
3. Begin SignalCollector implementation

'@ -f $currentDate, $currentBranch
    
    Set-Content -Path "CURRENT_STATUS.md" -Value $statusContent -Force
    Write-Host "  ✓ Created CURRENT_STATUS.md" -ForegroundColor Green
} else {
    Write-Host "  ⊙ CURRENT_STATUS.md already exists" -ForegroundColor Gray
}

# Create CONTINUATION_PROMPT_NEXT_SESSION.md if not exists
if (-not (Test-Path "CONTINUATION_PROMPT_NEXT_SESSION.md") -or $Force) {
    $currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    $continuationContent = @'
# SHIM - Session Continuation Prompt

**Generated:** {0}

## Quick Start
1. Open Claude Desktop
2. Run bootstrap: KERNL:get_session_context({{ project: "shim" }})
3. Check for incomplete work and resume if needed
4. Continue implementation

## Current Phase
Week 1: Core Infrastructure Setup

## Priority Tasks
1. Complete environment setup verification
2. Register with KERNL
3. Begin SignalCollector implementation (see docs/specs/SPEC_CRASH_PREVENTION.md)

## Active Files
- Setup in progress

## Technical Context
- Target: 80% test coverage
- Checkpoint size: <100KB (target), <200KB (max)
- Checkpoint creation: <100ms
- Signal accuracy: >90%

'@ -f $currentDate
    
    Set-Content -Path "CONTINUATION_PROMPT_NEXT_SESSION.md" -Value $continuationContent -Force
    Write-Host "  ✓ Created CONTINUATION_PROMPT_NEXT_SESSION.md" -ForegroundColor Green
} else {
    Write-Host "  ⊙ CONTINUATION_PROMPT_NEXT_SESSION.md already exists" -ForegroundColor Gray
}

Write-Host "`n[6/7] Running Initial Build Test..." -ForegroundColor Yellow

npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ TypeScript compilation successful (0 errors)" -ForegroundColor Green
} else {
    Write-Host "  ✗ TypeScript compilation has errors. Review and fix." -ForegroundColor Yellow
}

Write-Host "`n[7/7] KERNL Registration Instructions..." -ForegroundColor Yellow

Write-Host @"

  To complete setup, register SHIM with KERNL in Claude Desktop:

  1. Open Claude Desktop
  2. Run this command:

     KERNL:pm_register_project({
       id: "shim",
       name: "SHIM",
       path: "D:\\SHIM"
     })

  3. Index project files:

     KERNL:pm_index_files({ project: "shim" })

  4. Verify registration:

     KERNL:pm_get_project({ project: "shim" })

"@ -ForegroundColor Cyan

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Register with KERNL (see instructions above)" -ForegroundColor White
Write-Host "  2. Run .\scripts\Dev.ps1 to start development" -ForegroundColor White
Write-Host "  3. Read IMPLEMENTATION_CHECKLIST.md for verification" -ForegroundColor White
Write-Host "  4. Begin SignalCollector implementation`n" -ForegroundColor White

Write-Host "Estimated setup time: 15 minutes" -ForegroundColor Gray
Write-Host "Next phase: Week 1, Days 2-5 (SignalCollector)`n" -ForegroundColor Gray
