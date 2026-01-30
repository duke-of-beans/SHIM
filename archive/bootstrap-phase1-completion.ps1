#!/usr/bin/env pwsh
# SHIM Phase 1 Completion - Quick Start
# Run this to bootstrap the next session

Write-Host "🚀 SHIM Phase 1 Completion - Session Bootstrap" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
Set-Location D:\SHIM

# Show current status
Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host "  ✅ MCP Server: Operational (98 tools verified)"
Write-Host "  ✅ Tests Passing: 95/95 (checkpoint + signal systems)"
Write-Host "  ⏳ Supervisor Daemon: NOT YET BUILT"
Write-Host ""

# Verify MCP server
Write-Host "🔍 Verifying MCP Server..." -ForegroundColor Yellow
Set-Location mcp-server
$process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

if ($process.HasExited) {
    Write-Host "  ❌ MCP Server failed to start!" -ForegroundColor Red
} else {
    Write-Host "  ✅ MCP Server running (PID: $($process.Id))" -ForegroundColor Green
    Stop-Process -Id $process.Id -Force
}

Set-Location ..

# Run existing tests
Write-Host ""
Write-Host "🧪 Running Existing Tests..." -ForegroundColor Yellow
npm test --silent 2>&1 | Select-String -Pattern "Tests:|PASS|FAIL"

# Show what needs to be built
Write-Host ""
Write-Host "📋 TODO - Build Supervisor Daemon (~600 LOC):" -ForegroundColor Yellow
Write-Host "  1. ProcessMonitor.ts      (~150 LOC + 15 tests) - 2 hours"
Write-Host "  2. AutoRestarter.ts       (~150 LOC + 12 tests) - 2 hours"
Write-Host "  3. SupervisorDaemon.ts    (~300 LOC + 10 tests) - 2 hours"
Write-Host ""

# Create directories if needed
Write-Host "📁 Setting Up Directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src\supervisor" | Out-Null
New-Item -ItemType Directory -Force -Path "__tests__\supervisor" | Out-Null
Write-Host "  ✅ Directories ready" -ForegroundColor Green
Write-Host ""

# Show handoff document
Write-Host "📄 Full Details Available:" -ForegroundColor Yellow
Write-Host "  D:\SHIM\HANDOFF_PHASE1_COMPLETION.md (522 lines)"
Write-Host ""

# Next action
Write-Host "🎯 Next Action:" -ForegroundColor Cyan
Write-Host "  Read handoff document, then start with ProcessMonitor test:"
Write-Host "  code __tests__\supervisor\ProcessMonitor.test.ts"
Write-Host ""
Write-Host "💡 TDD Workflow: RED → GREEN → REFACTOR → COMMIT" -ForegroundColor Green
Write-Host ""
