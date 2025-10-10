# Quick Start Test Script
# Run this to quickly verify your setup

Write-Host "HackQuest25 System Test - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found! Please install Python 3.13" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking Python Dependencies..." -ForegroundColor Yellow

# Check Python packages
$packages = @("whisper", "supabase", "pyaudio", "dotenv", "numpy", "torch", "requests")
$missing = @()

foreach ($package in $packages) {
    $result = python -c "import $package" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $package" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $package" -ForegroundColor Red
        $missing += $package
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing Python packages detected!" -ForegroundColor Yellow
    Write-Host "Run this command to install them:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "pip install openai-whisper supabase pyaudio python-dotenv numpy torch requests" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "Checking Configuration Files..." -ForegroundColor Yellow

# Check backend .env
if (Test-Path "backend\.env") {
    Write-Host "OK: backend/.env exists" -ForegroundColor Green
} else {
    Write-Host "MISSING: backend/.env" -ForegroundColor Red
}

# Check frontend .env
if (Test-Path "frontend\.env") {
    Write-Host "OK: frontend/.env exists" -ForegroundColor Green
} else {
    Write-Host "MISSING: frontend/.env" -ForegroundColor Red
}

Write-Host ""
Write-Host "Ready to Start Testing!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open a NEW terminal and run: cd backend; node server.js" -ForegroundColor White
Write-Host "2. Open haptic test page: start frontend/haptic-test-simple.html" -ForegroundColor White
Write-Host "3. Start ML model: cd frontend; python model.py" -ForegroundColor White
Write-Host ""
Write-Host "Full testing guide: TEST-ENTIRE-SYSTEM.md" -ForegroundColor Cyan
Write-Host ""
