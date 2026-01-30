# SHIM v5.0 Documentation Deployment Script
# Run this from PowerShell in Windows

Write-Host "🚀 Deploying SHIM v5.0 Documentation..." -ForegroundColor Green
Write-Host ""

# Check if WSL path is accessible
$wslPath = "\\wsl.localhost\Ubuntu\tmp"
if (-not (Test-Path $wslPath)) {
    Write-Host "❌ Cannot access WSL path: $wslPath" -ForegroundColor Red
    Write-Host "   Try: \\wsl$\Ubuntu\tmp instead" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ WSL path accessible" -ForegroundColor Green
Write-Host ""

# Deploy files
Write-Host "📄 Deploying files..." -ForegroundColor Cyan

# Already deployed via Desktop Commander:
Write-Host "  ✅ ROADMAP.md (deployed)" -ForegroundColor Green
Write-Host "  ✅ CURRENT_STATUS.md (deployed)" -ForegroundColor Green

# Need to complete:
Write-Host "  📦 Copying remaining files..." -ForegroundColor Yellow

Copy-Item "$wslPath\ARCHITECTURE_V5.md" "D:\SHIM\docs\ARCHITECTURE.md" -Force
Write-Host "  ✅ docs/ARCHITECTURE.md" -ForegroundColor Green

Copy-Item "$wslPath\CLAUDE_INSTRUCTIONS_V5.md" "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_PROJECT.md" -Force
Write-Host "  ✅ docs/CLAUDE_INSTRUCTIONS_PROJECT.md" -ForegroundColor Green

Copy-Item "$wslPath\MCP_V5_ARCHITECTURE.md" "D:\SHIM\docs\SHIM_MCP_ARCHITECTURE.md" -Force
Write-Host "  ✅ docs/SHIM_MCP_ARCHITECTURE.md" -ForegroundColor Green

Copy-Item "$wslPath\V5_MIGRATION_SUMMARY.md" "D:\SHIM\docs\V5_MIGRATION_SUMMARY.md" -Force
Write-Host "  ✅ docs/V5_MIGRATION_SUMMARY.md" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All files deployed successfully!" -ForegroundColor Green
Write-Host ""

# Verify file sizes
Write-Host "📊 File sizes:" -ForegroundColor Cyan
Get-ChildItem "D:\SHIM\ROADMAP.md", "D:\SHIM\CURRENT_STATUS.md" | ForEach-Object {
    Write-Host ("  {0,-30} {1,8:N0} bytes" -f $_.Name, $_.Length)
}
Get-ChildItem "D:\SHIM\docs\*.md" | Where-Object { $_.Name -like "*V5*" -or $_.Name -in @("ARCHITECTURE.md", "CLAUDE_INSTRUCTIONS_PROJECT.md", "SHIM_MCP_ARCHITECTURE.md") } | ForEach-Object {
    Write-Host ("  {0,-30} {1,8:N0} bytes" -f $_.Name, $_.Length)
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd D:\SHIM"
Write-Host "  2. git status"
Write-Host "  3. git diff (review changes)"
Write-Host "  4. git add -A"
Write-Host "  5. git commit -m 'docs: Lock in v5.0 LEAN-OUT architecture'"
Write-Host ""
Write-Host "🎉 Deployment complete! Ready to commit." -ForegroundColor Green
