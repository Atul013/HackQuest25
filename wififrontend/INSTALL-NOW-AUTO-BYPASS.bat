@echo off
:: ================================================================
:: AlertNet WiFi Portal Installer - AUTO-BYPASS VERSION
:: ================================================================
:: This installs the updated WiFi portal with SMART BYPASS logic:
::   - Tries to get location (for browsers that support it)
::   - If blocked: Auto-proceeds WITHOUT location
::   - Shows friendly "developmental stage" message
::   - 100% registration success rate!
:: ================================================================

echo.
echo ================================================================
echo   ALERTNET WIFI PORTAL - AUTO-BYPASS INSTALLER
echo ================================================================
echo.
echo  WHAT'S NEW IN THIS VERSION:
echo.
echo    AUTOMATIC BYPASS - No more failures!
echo    Location blocked? No problem - proceeds anyway
echo    Friendly message: "Still in developmental stages"
echo    Users get emergency alerts (general, not location-specific)
echo.
echo ================================================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  ERROR: This script requires Administrator privileges!
    echo.
    echo  Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo  Admin privileges confirmed
echo.

:: Set paths
set "SOURCE=%~dp0login-mypublicwifi.html"
set "DEST=C:\Program Files (x86)\MyPublicWiFi\Web\login.html"
set "BACKUP=C:\Program Files (x86)\MyPublicWiFi\Web\login.backup.html"

:: Check if source exists
if not exist "%SOURCE%" (
    echo  ERROR: Source file not found!
    echo  Expected: %SOURCE%
    echo.
    pause
    exit /b 1
)

:: Check if MyPublicWiFi is installed
if not exist "C:\Program Files (x86)\MyPublicWiFi\Web\" (
    echo  ERROR: MyPublicWiFi Web folder not found!
    echo  Please ensure MyPublicWiFi is installed.
    echo.
    pause
    exit /b 1
)

echo  Creating backup of current login.html...
if exist "%DEST%" (
    copy /Y "%DEST%" "%BACKUP%" >nul 2>&1
    echo  Backup created: login.backup.html
)
echo.

echo  Installing new WiFi portal with AUTO-BYPASS...
copy /Y "%SOURCE%" "%DEST%"

if %errorLevel% equ 0 (
    echo.
    echo ================================================================
    echo   INSTALLATION SUCCESSFUL!
    echo ================================================================
    echo.
    echo  NEW FEATURES ACTIVE:
    echo.
    echo    Location permission requested (tries first)
    echo    If blocked: Auto-proceeds without location
    echo    Shows: "Developmental version, HTTPS not available"
    echo    Registration succeeds 100% of the time!
    echo.
    echo  MOBILE USER EXPERIENCE:
    echo.
    echo    1. Fill phone number
    echo    2. Check location checkbox
    echo    3. Click "Register"
    echo    4. See: "Location blocked, proceeding anyway"
    echo    5. Success page loads!
    echo    6. User receives emergency alerts
    echo.
    echo  FILE LOCATIONS:
    echo    Installed: C:\Program Files ^(x86^)\MyPublicWiFi\Web\login.html
    echo    Backup:    login.backup.html (same folder)
    echo    Source:    %~dp0
    echo.
    echo ================================================================
    echo   READY FOR TESTING!
    echo ================================================================
    echo.
    echo  TEST NOW:
    echo    1. Connect mobile device to MyPublicWiFi hotspot
    echo    2. Browser opens portal automatically
    echo    3. Fill form, check location box
    echo    4. Click Register
    echo    5. Should proceed successfully (even if location blocked!)
    echo.
) else (
    echo.
    echo  ERROR: Installation failed!
    echo  Error code: %errorLevel%
    echo.
    echo  Possible causes:
    echo    - MyPublicWiFi is running (close and retry)
    echo    - File is locked
    echo    - Insufficient permissions
    echo.
)

pause
