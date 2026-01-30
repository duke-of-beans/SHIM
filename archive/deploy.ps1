#!/usr/bin/env pwsh
# SHIM Production Deployment Script
# 
# Automates complete production infrastructure deployment
# 
# Usage:
#   .\deploy.ps1              # Deploy all services
#   .\deploy.ps1 -Down        # Stop all services
#   .\deploy.ps1 -Status      # Check status

param(
    [switch]$Down,
    [switch]$Status,
    [switch]$Logs,
    [switch]$Build
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 SHIM Production Deployment" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Handle different modes
if ($Status) {
    Write-Host "📊 Service Status:" -ForegroundColor Yellow
    Write-Host ""
    docker-compose ps
    Write-Host ""
    
    Write-Host "Health Checks:" -ForegroundColor Yellow
    Write-Host ""
    
    # Redis
    Write-Host "Redis:" -NoNewline
    try {
        docker exec shim-redis redis-cli ping | Out-Null
        Write-Host " ✅ HEALTHY" -ForegroundColor Green
    } catch {
        Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
    }
    
    # Prometheus
    Write-Host "Prometheus:" -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ HEALTHY" -ForegroundColor Green
        } else {
            Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
        }
    } catch {
        Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
    }
    
    # Grafana
    Write-Host "Grafana:" -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ HEALTHY" -ForegroundColor Green
        } else {
            Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
        }
    } catch {
        Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  Grafana:    http://localhost:3000 (admin / shim_admin_2026)"
    Write-Host "  Prometheus: http://localhost:9090"
    Write-Host "  Redis:      localhost:6379"
    Write-Host ""
    exit 0
}

if ($Logs) {
    Write-Host "📜 Viewing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose logs -f
    exit 0
}

if ($Down) {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    docker-compose down
    Write-Host ""
    Write-Host "✅ All services stopped" -ForegroundColor Green
    exit 0
}

if ($Build) {
    Write-Host "🔨 Building images..." -ForegroundColor Yellow
    docker-compose build --no-cache
    Write-Host ""
    Write-Host "✅ Build complete" -ForegroundColor Green
    exit 0
}

# Default: Deploy everything
Write-Host "🚀 Starting production deployment..." -ForegroundColor Yellow
Write-Host ""

# Create required directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
$dirs = @("logs", "checkpoints", "backups")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "  Created $dir/" -ForegroundColor Gray
    }
}
Write-Host ""

# Start services
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow

# Wait for Redis
$retries = 30
while ($retries -gt 0) {
    try {
        docker exec shim-redis redis-cli ping | Out-Null
        Write-Host "✅ Redis is healthy" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 1
        $retries--
    }
}

if ($retries -eq 0) {
    Write-Host "❌ Redis failed to start" -ForegroundColor Red
    exit 1
}

# Wait for Prometheus
$retries = 30
while ($retries -gt 0) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus is healthy" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
        $retries--
    }
}

if ($retries -eq 0) {
    Write-Host "❌ Prometheus failed to start" -ForegroundColor Red
    exit 1
}

# Wait for Grafana
$retries = 30
while ($retries -gt 0) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Grafana is healthy" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
        $retries--
    }
}

if ($retries -eq 0) {
    Write-Host "❌ Grafana failed to start" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "Access your dashboards:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 Grafana:    http://localhost:3000" -ForegroundColor White
Write-Host "     Username:   admin" -ForegroundColor Gray
Write-Host "     Password:   shim_admin_2026" -ForegroundColor Gray
Write-Host ""
Write-Host "  📈 Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  💾 Redis:      localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  .\deploy.ps1 -Status    # Check service health"
Write-Host "  .\deploy.ps1 -Logs      # View logs"
Write-Host "  .\deploy.ps1 -Down      # Stop all services"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Grafana (http://localhost:3000)"
Write-Host "  2. View 'SHIM - Cost Optimization' dashboard"
Write-Host "  3. Run: npm run demo:cost"
Write-Host "  4. Watch real-time savings appear!"
Write-Host ""
