# Verify WiFi Portal Installation

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WiFi Portal Installation Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$dest = "C:\Program Files (x86)\MyPublicWiFi\Web"

# Check if files exist
Write-Host "Checking files..." -ForegroundColor Yellow
Write-Host ""

$files = @{
    "login.html" = "Main login page with Supabase integration"
    "style.css" = "Modern AlertNet styling"
    "success.html" = "Success page after registration"
}

$allGood = $true

foreach ($file in $files.Keys) {
    $path = "$dest\$file"
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✓ $file" -ForegroundColor Green -NoNewline
        Write-Host " ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Gray
        
        # Check if login.html contains Supabase
        if ($file -eq "login.html") {
            $content = Get-Content $path -Raw
            if ($content -match "supabase") {
                Write-Host "    ✓ Supabase integration detected" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Supabase NOT found - update may have failed" -ForegroundColor Red
                $allGood = $false
            }
        }
    } else {
        Write-Host "  ✗ $file - NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

if ($allGood) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  ✓ All files installed correctly!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test your WiFi portal:" -ForegroundColor Yellow
    Write-Host "  1. Start MyPublicWiFi hotspot" -ForegroundColor White
    Write-Host "  2. Connect from phone/tablet" -ForegroundColor White
    Write-Host "  3. Browser should show AlertNet registration" -ForegroundColor White
    Write-Host "  4. Register with phone number" -ForegroundColor White
    Write-Host "  5. Check Supabase for new entry!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  ✗ Installation issues detected" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Try running UPDATE-WIFI-PORTAL.ps1 as Administrator" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press Enter to exit..." -ForegroundColor Cyan
Read-Host
