# ============================================================
# AlertNet WiFi Portal Installation Script (FINAL VERSION)
# ============================================================

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AlertNet WiFi Portal Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "E:\Projects\HackQuest25\wififrontend"
$destDir = "C:\Program Files (x86)\MyPublicWiFi\Web"
$backupDir = "$destDir\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Verify source files exist
Write-Host "[1/5] Verifying source files..." -ForegroundColor Yellow
$sourceFiles = @{
    "$sourceDir\login-mypublicwifi.html" = "login.html"
    "$sourceDir\style-modern.css" = "style.css"
    "$sourceDir\success.html" = "success.html"
}

$allExist = $true
foreach ($source in $sourceFiles.Keys) {
    if (Test-Path $source) {
        $size = (Get-Item $source).Length
        Write-Host "  ✓ Found: $(Split-Path $source -Leaf) ($([math]::Round($size/1024, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $source" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host ""
    Write-Host "ERROR: Some source files are missing!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create backup
Write-Host ""
Write-Host "[2/5] Creating backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$backupFiles = @("login.html", "style.css")
foreach ($file in $backupFiles) {
    $destPath = "$destDir\$file"
    if (Test-Path $destPath) {
        Copy-Item $destPath "$backupDir\$file" -Force
        Write-Host "  ✓ Backed up: $file" -ForegroundColor Green
    }
}

# Copy files
Write-Host ""
Write-Host "[3/5] Installing new files..." -ForegroundColor Yellow
$errors = 0

foreach ($source in $sourceFiles.Keys) {
    $destName = $sourceFiles[$source]
    $destPath = "$destDir\$destName"
    
    try {
        Copy-Item $source $destPath -Force
        Write-Host "  ✓ Installed: $destName" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed: $destName - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

# Verify installation
Write-Host ""
Write-Host "[4/5] Verifying installation..." -ForegroundColor Yellow

$loginPath = "$destDir\login.html"
if (Test-Path $loginPath) {
    $content = Get-Content $loginPath -Raw
    
    if ($content -match "supabase") {
        Write-Host "  ✓ login.html has Supabase integration" -ForegroundColor Green
        $hasSupabase = $true
    } else {
        Write-Host "  ✗ login.html missing Supabase code" -ForegroundColor Red
        $hasSupabase = $false
    }
    
    if ($content -match "validateAndSubmit") {
        Write-Host "  ✓ login.html has geolocation function" -ForegroundColor Green
    } else {
        Write-Host "  ✗ login.html missing geolocation code" -ForegroundColor Red
    }
    
    $size = (Get-Item $loginPath).Length
    Write-Host "  ✓ File size: $([math]::Round($size/1024, 2)) KB" -ForegroundColor Green
} else {
    Write-Host "  ✗ login.html not found!" -ForegroundColor Red
    $errors++
}

# Show results
Write-Host ""
Write-Host "[5/5] Installation Complete!" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $hasSupabase) {
    Write-Host "SUCCESS! All files installed correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Files installed:" -ForegroundColor Cyan
    Write-Host "  • login.html (with Supabase + Geolocation)" -ForegroundColor White
    Write-Host "  • style.css (AlertNet design)" -ForegroundColor White
    Write-Host "  • success.html (registration success page)" -ForegroundColor White
    Write-Host ""
    Write-Host "Backup location: $backupDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard (already open in browser)" -ForegroundColor White
    Write-Host "2. Go to SQL Editor" -ForegroundColor White
    Write-Host "3. Paste the SQL from supabase-wifi-subscriptions.sql" -ForegroundColor White
    Write-Host "4. Click 'Run' to create the wifi_subscriptions table" -ForegroundColor White
    Write-Host "5. Test the portal on a mobile device" -ForegroundColor White
} else {
    Write-Host "WARNING: Installation completed with errors!" -ForegroundColor Red
    Write-Host "Please check the messages above." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
