# SHIM Continuation Script
# Automatically loads context for next session

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "=== SHIM SESSION CONTINUATION ===" -ForegroundColor Cyan
Write-Host ""

# Show handoff prompt if it exists
if (Test-Path "HANDOFF_PROMPT_SIGNAL_HISTORY.md") {
    Write-Host "[HANDOFF PROMPT]" -ForegroundColor Yellow
    Write-Host ""
    Get-Content "HANDOFF_PROMPT_SIGNAL_HISTORY.md"
    Write-Host ""
} else {
    Write-Host "WARNING: No handoff prompt found" -ForegroundColor Yellow
    Write-Host ""
}

# Show current status
Write-Host "=== CURRENT STATUS ===" -ForegroundColor Cyan
Write-Host ""

$branch = git branch --show-current 2>$null
$commitCount = git rev-list --count HEAD 2>$null
Write-Host "Branch: $branch" -ForegroundColor White
Write-Host "Commits: $commitCount" -ForegroundColor White
Write-Host ""

# Recent commits
Write-Host "Recent commits:" -ForegroundColor White
git log -5 --format="  %h: %s (%cr)" 2>$null
Write-Host ""

# Git status
$gitStatus = git status --short 2>$null
if ($gitStatus) {
    Write-Host "Modified files: $($gitStatus.Count)" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "Working tree: Clean" -ForegroundColor Green
}
Write-Host ""

# Quick commands
Write-Host "=== QUICK COMMANDS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  npm test -- SignalHistoryRepository    # Run tests" -ForegroundColor Gray
Write-Host "  npm run test:coverage                  # Check coverage" -ForegroundColor Gray  
Write-Host "  .\scripts\Dev.ps1                      # Start dev mode" -ForegroundColor Gray
Write-Host ""

Write-Host "OK - Ready to continue" -ForegroundColor Green
Write-Host ""
