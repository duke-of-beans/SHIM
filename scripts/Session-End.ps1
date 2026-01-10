# SHIM Session End Script
# Version: 1.0.0
# Purpose: End development session with validation, commit, and documentation

[CmdletBinding()]
param(
    [string]$CommitMessage = "",
    [string]$Type = "",
    [string]$Scope = "",
    [string]$Description = "",
    [switch]$SkipValidation,
    [switch]$Push,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "SHIM Session End" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Cyan

# 1. Check Git Status
Write-Host "[1/6] Checking Git Status..." -ForegroundColor Yellow

$gitStatus = git status --short 2>$null
if (-not $gitStatus) {
    Write-Host "  ✓ No changes to commit" -ForegroundColor Green
    Write-Host "`nGenerating continuation prompt...`n" -ForegroundColor Yellow
    & "$PSScriptRoot\Continue.ps1" -Generate
    Write-Host "`nSession end complete (no changes to commit)`n" -ForegroundColor Green
    exit 0
}

$changeCount = ($gitStatus -split "`n").Count
Write-Host "  Found $changeCount changed files" -ForegroundColor Cyan

# 2. Run Validation
if (-not $SkipValidation) {
    Write-Host "`n[2/6] Running Validation..." -ForegroundColor Yellow
    
    & "$PSScriptRoot\Validate.ps1" -Quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n  ✗ Validation failed" -ForegroundColor Red
        
        if ($Force) {
            Write-Host "  ! Continuing anyway (--Force specified)" -ForegroundColor Yellow
        } else {
            Write-Host "`nOptions:" -ForegroundColor Yellow
            Write-Host "  1. Fix the errors and run Session-End.ps1 again" -ForegroundColor White
            Write-Host "  2. Run with --Force to bypass validation" -ForegroundColor White
            Write-Host "  3. Run with --SkipValidation to skip validation`n" -ForegroundColor White
            exit 1
        }
    } else {
        Write-Host "  ✓ All validation gates passed" -ForegroundColor Green
    }
} else {
    Write-Host "`n[2/6] Validation: SKIPPED" -ForegroundColor Gray
}

# 3. Compose Commit Message
Write-Host "`n[3/6] Composing Commit Message..." -ForegroundColor Yellow

# Conventional commit types
$ValidTypes = @("feat", "fix", "test", "docs", "refactor", "perf", "chore")
$ValidScopes = @("signals", "checkpoint", "resume", "database", "mcp", "spec", "config")

if ($CommitMessage) {
    # Use provided commit message directly
    $FinalCommitMessage = $CommitMessage
    Write-Host "  Using provided message: $CommitMessage" -ForegroundColor Cyan
} elseif ($Type -and $Description) {
    # Build from parameters
    if ($Scope) {
        $FinalCommitMessage = "${Type}(${Scope}): ${Description}"
    } else {
        $FinalCommitMessage = "${Type}: ${Description}"
    }
    Write-Host "  Built message: $FinalCommitMessage" -ForegroundColor Cyan
} else {
    # Interactive composition
    Write-Host "`n  Conventional Commits Format: type(scope): description`n" -ForegroundColor Gray
    
    Write-Host "  Valid types: " -NoNewline -ForegroundColor Gray
    Write-Host ($ValidTypes -join ", ") -ForegroundColor Cyan
    Write-Host "  Valid scopes: " -NoNewline -ForegroundColor Gray
    Write-Host ($ValidScopes -join ", ") -ForegroundColor Cyan
    Write-Host ""
    
    # Get type
    do {
        $InputType = Read-Host "  Type (e.g., feat, fix, test)"
        if ($InputType -and $ValidTypes -contains $InputType) {
            $Type = $InputType
            break
        }
        Write-Host "  ! Invalid type. Choose from: $($ValidTypes -join ', ')" -ForegroundColor Yellow
    } while ($true)
    
    # Get scope (optional)
    $InputScope = Read-Host "  Scope (optional, e.g., signals, checkpoint)"
    if ($InputScope -and $ValidScopes -contains $InputScope) {
        $Scope = $InputScope
    } else {
        $Scope = ""
    }
    
    # Get description
    do {
        $InputDescription = Read-Host "  Description (brief summary of changes)"
        if ($InputDescription) {
            $Description = $InputDescription
            break
        }
        Write-Host "  ! Description required" -ForegroundColor Yellow
    } while ($true)
    
    # Build final message
    if ($Scope) {
        $FinalCommitMessage = "${Type}(${Scope}): ${Description}"
    } else {
        $FinalCommitMessage = "${Type}: ${Description}"
    }
    
    Write-Host "`n  Final commit message: $FinalCommitMessage" -ForegroundColor Cyan
    $confirm = Read-Host "  Proceed with commit? (Y/n)"
    if ($confirm -and $confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "`n  Commit cancelled`n" -ForegroundColor Yellow
        exit 0
    }
}

# 4. Stage and Commit
Write-Host "`n[4/6] Committing Changes..." -ForegroundColor Yellow

git add -A
Write-Host "  ✓ Staged all changes" -ForegroundColor Green

git commit -m $FinalCommitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Commit created: $FinalCommitMessage" -ForegroundColor Green
    
    $commitHash = git log -1 --format="%H" | Select-Object -First 7
    Write-Host "  Commit hash: $commitHash" -ForegroundColor Cyan
} else {
    Write-Host "  ✗ Commit failed" -ForegroundColor Red
    exit 1
}

# 5. Generate Continuation Prompt
Write-Host "`n[5/6] Generating Continuation Prompt..." -ForegroundColor Yellow

& "$PSScriptRoot\Continue.ps1" -Generate
Write-Host "  ✓ CONTINUATION_PROMPT_NEXT_SESSION.md updated" -ForegroundColor Green
Write-Host "  ✓ CURRENT_STATUS.md updated" -ForegroundColor Green

# 6. Optional Push
if ($Push) {
    Write-Host "`n[6/6] Pushing to Remote..." -ForegroundColor Yellow
    
    $branch = git branch --show-current
    git push origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Pushed to origin/$branch" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Push failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n[6/6] Push: SKIPPED (use --Push to push)" -ForegroundColor Gray
}

# Summary
Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "Session End Complete" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Green

Write-Host "Committed:" -ForegroundColor Yellow
Write-Host "  $FinalCommitMessage`n" -ForegroundColor Cyan

Write-Host "Next Session:" -ForegroundColor Yellow
Write-Host "  1. Open Claude Desktop" -ForegroundColor White
Write-Host "  2. Run: KERNL:get_session_context({ project: `"shim`" })" -ForegroundColor Cyan
Write-Host "  3. Check for incomplete work and resume if needed" -ForegroundColor White
Write-Host "  4. Run: .\scripts\Dev.ps1`n" -ForegroundColor White

Write-Host "Documentation updated:" -ForegroundColor Yellow
Write-Host "  • CONTINUATION_PROMPT_NEXT_SESSION.md" -ForegroundColor Gray
Write-Host "  • CURRENT_STATUS.md`n" -ForegroundColor Gray
