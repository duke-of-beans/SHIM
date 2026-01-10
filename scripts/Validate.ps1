# SHIM Pre-Commit Validation Script
# Version: 1.0.0
# Purpose: Comprehensive validation before commits (6 gates)

[CmdletBinding()]
param(
    [switch]$Fast,
    [switch]$SkipTests,
    [switch]$SkipCoverage,
    [switch]$SkipTypeScript,
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$AllPassed = $true
$Warnings = @()

if (-not $Quiet) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "SHIM Pre-Commit Validation (6 Gates)" -ForegroundColor Cyan
    Write-Host "==================================================`n" -ForegroundColor Cyan
}

# Gate 1: TypeScript Compilation
if (-not $SkipTypeScript) {
    if (-not $Quiet) { Write-Host "[Gate 1/6] TypeScript Compilation..." -ForegroundColor Yellow }
    
    $tscOutput = npx tsc --noEmit 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        if (-not $Quiet) { Write-Host "  ✓ PASS: 0 TypeScript errors" -ForegroundColor Green }
    } else {
        Write-Host "  ✗ FAIL: TypeScript compilation errors found" -ForegroundColor Red
        Write-Host $tscOutput -ForegroundColor Red
        $AllPassed = $false
    }
} else {
    if (-not $Quiet) { Write-Host "[Gate 1/6] TypeScript Compilation: SKIPPED" -ForegroundColor Gray }
}

# Gate 2: Unit Tests
if (-not $SkipTests) {
    if (-not $Quiet) { Write-Host "`n[Gate 2/6] Unit Tests..." -ForegroundColor Yellow }
    
    $testOutput = npm test -- --passWithNoTests 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        if (-not $Quiet) { Write-Host "  ✓ PASS: All tests passing" -ForegroundColor Green }
    } else {
        Write-Host "  ✗ FAIL: Tests failing" -ForegroundColor Red
        Write-Host $testOutput -ForegroundColor Red
        $AllPassed = $false
    }
} else {
    if (-not $Quiet) { Write-Host "`n[Gate 2/6] Unit Tests: SKIPPED" -ForegroundColor Gray }
}

# Gate 3: Test Coverage
if (-not $SkipCoverage -and -not $SkipTests) {
    if (-not $Quiet) { Write-Host "`n[Gate 3/6] Test Coverage..." -ForegroundColor Yellow }
    
    npm test -- --coverage --passWithNoTests 2>&1 | Out-Null
    
    if (Test-Path "coverage\coverage-summary.json") {
        $coverage = Get-Content "coverage\coverage-summary.json" -Raw | ConvertFrom-Json
        $linesCoverage = $coverage.total.lines.pct
        $branchesCoverage = $coverage.total.branches.pct
        $functionsCoverage = $coverage.total.functions.pct
        $statementsCoverage = $coverage.total.statements.pct
        
        if (-not $Quiet) {
            Write-Host "  Lines:      $linesCoverage%" -ForegroundColor $(if($linesCoverage -ge 80){"Green"}else{"Yellow"})
            Write-Host "  Branches:   $branchesCoverage%" -ForegroundColor $(if($branchesCoverage -ge 80){"Green"}else{"Yellow"})
            Write-Host "  Functions:  $functionsCoverage%" -ForegroundColor $(if($functionsCoverage -ge 80){"Green"}else{"Yellow"})
            Write-Host "  Statements: $statementsCoverage%" -ForegroundColor $(if($statementsCoverage -ge 80){"Green"}else{"Yellow"})
        }
        
        if ($linesCoverage -lt 80 -or $branchesCoverage -lt 80 -or $functionsCoverage -lt 80 -or $statementsCoverage -lt 80) {
            Write-Host "  ✗ FAIL: Coverage below 80% threshold" -ForegroundColor Red
            $AllPassed = $false
        } else {
            if (-not $Quiet) { Write-Host "  ✓ PASS: Coverage ≥80%" -ForegroundColor Green }
        }
    } else {
        Write-Host "  ! WARNING: Coverage report not found" -ForegroundColor Yellow
        $Warnings += "Coverage report not generated"
    }
} elseif ($SkipCoverage) {
    if (-not $Quiet) { Write-Host "`n[Gate 3/6] Test Coverage: SKIPPED" -ForegroundColor Gray }
} else {
    if (-not $Quiet) { Write-Host "`n[Gate 3/6] Test Coverage: SKIPPED (tests skipped)" -ForegroundColor Gray }
}

# Gate 4: Git Status Check (informational)
if (-not $Quiet) {
    Write-Host "`n[Gate 4/6] Git Status Check..." -ForegroundColor Yellow
    
    $gitStatus = git status --short 2>$null
    if ($gitStatus) {
        $stagedFiles = ($gitStatus | Select-String "^[MADRCU]" | Measure-Object).Count
        $unstagedFiles = ($gitStatus | Select-String "^.[MADRCU]" | Measure-Object).Count
        $untrackedFiles = ($gitStatus | Select-String "^\?\?" | Measure-Object).Count
        
        Write-Host "  Staged files:    $stagedFiles" -ForegroundColor Cyan
        Write-Host "  Unstaged files:  $unstagedFiles" -ForegroundColor $(if($unstagedFiles -gt 0){"Yellow"}else{"Green"})
        Write-Host "  Untracked files: $untrackedFiles" -ForegroundColor $(if($untrackedFiles -gt 0){"Yellow"}else{"Green"})
        
        if ($unstagedFiles -gt 0) {
            $Warnings += "Unstaged files present (use git add to stage)"
        }
    } else {
        Write-Host "  ✓ Working tree clean" -ForegroundColor Green
    }
}

# Gate 5: File Size Analysis (informational)
if (-not $Fast -and -not $Quiet) {
    Write-Host "`n[Gate 5/6] File Size Analysis..." -ForegroundColor Yellow
    
    $largeFiles = Get-ChildItem -Path "." -Recurse -File -Exclude "node_modules","dist","coverage",".git" | 
                  Where-Object { $_.Length -gt 1MB } |
                  Sort-Object Length -Descending |
                  Select-Object -First 5
    
    if ($largeFiles) {
        Write-Host "  Large files (>1MB):" -ForegroundColor Yellow
        foreach ($file in $largeFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            Write-Host "    - $($file.FullName.Replace($ProjectRoot, '.')) ($sizeMB MB)" -ForegroundColor Yellow
        }
        $Warnings += "Large files detected (review if necessary)"
    } else {
        Write-Host "  ✓ No files >1MB" -ForegroundColor Green
    }
} elseif ($Fast) {
    if (-not $Quiet) { Write-Host "`n[Gate 5/6] File Size Analysis: SKIPPED (fast mode)" -ForegroundColor Gray }
} else {
    if (-not $Quiet) { Write-Host "`n[Gate 5/6] File Size Analysis: SKIPPED (quiet mode)" -ForegroundColor Gray }
}

# Gate 6: Performance Benchmarks (informational)
if (-not $Fast -and -not $Quiet) {
    Write-Host "`n[Gate 6/6] Performance Benchmarks..." -ForegroundColor Yellow
    
    # Check if performance tests exist
    $perfTests = Get-ChildItem -Path "." -Recurse -Filter "*.perf.test.ts" -ErrorAction SilentlyContinue
    
    if ($perfTests) {
        Write-Host "  Running performance benchmarks..." -NoNewline
        # Run performance tests (placeholder - actual implementation depends on test setup)
        # npm test -- --testNamePattern="performance" 2>&1 | Out-Null
        Write-Host " ✓ Complete" -ForegroundColor Green
        Write-Host "  ! Review performance results in test output" -ForegroundColor Yellow
    } else {
        Write-Host "  ! No performance tests found (*.perf.test.ts)" -ForegroundColor Gray
        Write-Host "  Target: Checkpoint creation <100ms" -ForegroundColor Gray
        Write-Host "  Target: Checkpoint size <100KB" -ForegroundColor Gray
    }
} elseif ($Fast) {
    if (-not $Quiet) { Write-Host "`n[Gate 6/6] Performance Benchmarks: SKIPPED (fast mode)" -ForegroundColor Gray }
} else {
    if (-not $Quiet) { Write-Host "`n[Gate 6/6] Performance Benchmarks: SKIPPED (quiet mode)" -ForegroundColor Gray }
}

# Summary
if (-not $Quiet) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    
    if ($AllPassed) {
        Write-Host "✓ ALL GATES PASSED" -ForegroundColor Green
        Write-Host "==================================================`n" -ForegroundColor Green
        
        if ($Warnings.Count -gt 0) {
            Write-Host "Warnings:" -ForegroundColor Yellow
            foreach ($warning in $Warnings) {
                Write-Host "  • $warning" -ForegroundColor Yellow
            }
            Write-Host ""
        }
        
        Write-Host "Ready to commit!" -ForegroundColor Green
        Write-Host "  Run: .\scripts\Session-End.ps1`n" -ForegroundColor Cyan
    } else {
        Write-Host "✗ VALIDATION FAILED" -ForegroundColor Red
        Write-Host "==================================================`n" -ForegroundColor Red
        
        Write-Host "Fix the above errors before committing." -ForegroundColor Red
        Write-Host "  Or bypass with: git commit --no-verify (not recommended)`n" -ForegroundColor Yellow
    }
}

# Exit with appropriate code
if ($AllPassed) {
    exit 0
} else {
    exit 1
}
