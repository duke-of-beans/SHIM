$services = @(
  "AutonomyService.ts",
  "CoordinationService.ts",
  "EvolutionService.ts",
  "InfrastructureService.ts",
  "ModelsService.ts",
  "MLService.ts",
  "MonitoringService.ts",
  "PerformanceService.ts",
  "ConfigurationService.ts",
  "LoggingService.ts"
)

foreach ($service in $services) {
  $path = "D:\SHIM\mcp-server\src\services\$service"
  if (Test-Path $path) {
    $content = Get-Content $path -Raw
    $content = $content -replace "from '\.\.\/\.\.\/\.\.\/src\/(.+?)\.js'", "from '@shim/`$1'"
    $content = $content -replace "from '\.\.\/\.\.\/src\/(.+?)\.js'", "from '@shim/`$1'"
    Set-Content $path -Value $content -NoNewline
    Write-Host "Updated $service"
  }
}
