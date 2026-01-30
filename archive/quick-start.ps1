#!/usr/bin/env pwsh
# SHIM Next Session Quick Start
# 
# Automatically loads context and shows next steps

Write-Host ""
Write-Host "🚀 SHIM - Session Quick Start" -ForegroundColor Cyan
Write-Host "═" * 60
Write-Host ""

# Show current status
Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host "  Components: 25/28 (89%)" -ForegroundColor White
Write-Host "  Infrastructure: DEPLOYED ✅" -ForegroundColor Green
Write-Host "  Docker App: BLOCKED by TypeScript errors ❌" -ForegroundColor Red
Write-Host ""

# Show handoff document location
Write-Host "📝 Handoff Document:" -ForegroundColor Yellow
Write-Host "  Location: D:\SHIM\HANDOFF_TYPESCRIPT_FIXES_AND_PHASE4.md" -ForegroundColor White
Write-Host ""

# Show next steps
Write-Host "🎯 Next Steps (3 hours total):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Part 1: Fix TypeScript Errors (1 hour)" -ForegroundColor Cyan
Write-Host "    • Fix AutoExperimentEngine.ts (3 errors)" -ForegroundColor Gray
Write-Host "    • Fix SHIMMetrics.ts (10 errors)" -ForegroundColor Gray
Write-Host "    • Fix StatsigIntegration.ts (3 errors)" -ForegroundColor Gray
Write-Host "    • Enable Docker app container" -ForegroundColor Gray
Write-Host ""
Write-Host "  Part 2: Complete Phase 4 (2 hours)" -ForegroundColor Cyan
Write-Host "    • Build ExperimentGenerator (40 min)" -ForegroundColor Gray
Write-Host "    • Build PerformanceAnalyzer (40 min)" -ForegroundColor Gray
Write-Host "    • Build DeploymentManager (40 min)" -ForegroundColor Gray
Write-Host ""

# Quick commands
Write-Host "⚡ Quick Commands:" -ForegroundColor Yellow
Write-Host "  Read handoff:  cat D:\SHIM\HANDOFF_TYPESCRIPT_FIXES_AND_PHASE4.md" -ForegroundColor White
Write-Host "  Check errors:  npm run build" -ForegroundColor White
Write-Host "  Run tests:     npm test" -ForegroundColor White
Write-Host "  Infrastructure: docker-compose -f docker-compose.simple.yml ps" -ForegroundColor White
Write-Host ""

# Infrastructure status
Write-Host "🏗️ Infrastructure Status:" -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.simple.yml ps | Out-Null
    Write-Host "  Redis:      " -NoNewline -ForegroundColor White
    docker exec shim-redis redis-cli ping | Out-Null
    Write-Host "✅ RUNNING" -ForegroundColor Green
    
    Write-Host "  Prometheus: " -NoNewline -ForegroundColor White
    Write-Host "✅ RUNNING (http://localhost:9090)" -ForegroundColor Green
    
    Write-Host "  Grafana:    " -NoNewline -ForegroundColor White
    Write-Host "✅ RUNNING (http://localhost:3000)" -ForegroundColor Green
} catch {
    Write-Host "  Infrastructure not running" -ForegroundColor Red
    Write-Host "  Start: docker-compose -f docker-compose.simple.yml up -d" -ForegroundColor Gray
}
Write-Host ""

# Recommendation
Write-Host "💡 Recommendation:" -ForegroundColor Yellow
Write-Host "  1. Read handoff document (full context)" -ForegroundColor White
Write-Host "  2. Run 'npm run build' to see TypeScript errors" -ForegroundColor White
Write-Host "  3. Fix one file at a time, test after each" -ForegroundColor White
Write-Host "  4. Once TS clean, build Phase 4 components (TDD)" -ForegroundColor White
Write-Host ""

Write-Host "═" * 60
Write-Host "Ready to complete SHIM! 🎯" -ForegroundColor Green
Write-Host ""
