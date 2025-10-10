# WiFi Portal Update Script
# Run this to install updated files with Supabase integration

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  AlertNet WiFi Portal - Update Files" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$source = "E:\Projects\HackQuest25\wififrontend"
$dest = "C:\Program Files (x86)\MyPublicWiFi\Web"
$backupDir = "$dest\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Create backup
Write-Host "Creating backup..." -ForegroundColor Yellow
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

if (Test-Path "$dest\login.html") {
    Copy-Item "$dest\login.html" "$backupDir\login.html" -Force
    Write-Host "  ✓ Backed up login.html" -ForegroundColor Gray
}
if (Test-Path "$dest\style.css") {
    Copy-Item "$dest\style.css" "$backupDir\style.css" -Force
    Write-Host "  ✓ Backed up style.css" -ForegroundColor Gray
}
if (Test-Path "$dest\success.html") {
    Copy-Item "$dest\success.html" "$backupDir\success.html" -Force
    Write-Host "  ✓ Backed up success.html" -ForegroundColor Gray
}

Write-Host "  Backup saved to: $backupDir" -ForegroundColor Cyan
Write-Host ""

# Copy new files
Write-Host "Installing updated files..." -ForegroundColor Yellow

try {
    Copy-Item "$source\login-mypublicwifi.html" "$dest\login.html" -Force
    Write-Host "  ✓ Installed login.html (with Supabase integration)" -ForegroundColor Green
    
    Copy-Item "$source\style-modern.css" "$dest\style.css" -Force
    Write-Host "  ✓ Installed style.css" -ForegroundColor Green
    
    Copy-Item "$source\success.html" "$dest\success.html" -Force
    Write-Host "  ✓ Installed success.html" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  ✓ Installation Successful!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "New Features:" -ForegroundColor Yellow
    Write-Host "  • Phone numbers automatically saved to Supabase" -ForegroundColor White
    Write-Host "  • GPS location tracking" -ForegroundColor White
    Write-Host "  • User preferences stored" -ForegroundColor White
    Write-Host "  • Geofence verification ready" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Make sure you ran the SQL script in Supabase" -ForegroundColor White
    Write-Host "  2. Test the WiFi portal on a mobile device" -ForegroundColor White
    Write-Host "  3. Check Supabase Table Editor for new registrations" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Installation failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Your original files are backed up at:" -ForegroundColor Yellow
    Write-Host $backupDir -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Press Enter to exit..." -ForegroundColor Cyan
Read-Host
