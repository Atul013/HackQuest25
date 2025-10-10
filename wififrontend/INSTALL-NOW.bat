@echo off
echo ============================================================
echo   AlertNet WiFi Portal Installation
echo ============================================================
echo.

set SOURCE=E:\Projects\HackQuest25\wififrontend
set DEST=C:\Program Files (x86)\MyPublicWiFi\Web

echo [Step 1/3] Backing up existing files...
copy "%DEST%\login.html" "%DEST%\login_backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.html" >nul 2>&1
copy "%DEST%\style.css" "%DEST%\style_backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.css" >nul 2>&1
echo   ✓ Backup complete
echo.

echo [Step 2/3] Installing AlertNet files...
copy /Y "%SOURCE%\login-mypublicwifi.html" "%DEST%\login.html"
if errorlevel 1 (
    echo   ✗ FAILED to copy login.html
    pause
    exit /b 1
)
echo   ✓ login.html installed

copy /Y "%SOURCE%\style-modern.css" "%DEST%\style.css"
if errorlevel 1 (
    echo   ✗ FAILED to copy style.css
    pause
    exit /b 1
)
echo   ✓ style.css installed

copy /Y "%SOURCE%\success.html" "%DEST%\success.html"
if errorlevel 1 (
    echo   ✗ FAILED to copy success.html
    pause
    exit /b 1
)
echo   ✓ success.html installed
echo.

echo [Step 3/3] Verifying installation...
findstr /C:"supabase" "%DEST%\login.html" >nul
if errorlevel 1 (
    echo   ✗ Supabase integration NOT FOUND
) else (
    echo   ✓ Supabase integration confirmed
)

findstr /C:"validateAndSubmit" "%DEST%\login.html" >nul
if errorlevel 1 (
    echo   ✗ Geolocation code NOT FOUND
) else (
    echo   ✓ Geolocation code confirmed
)
echo.

echo ============================================================
echo   INSTALLATION COMPLETE!
echo ============================================================
echo.
echo Files installed:
echo   • login.html (WiFi registration with Supabase)
echo   • style.css (AlertNet design)
echo   • success.html (Registration success page)
echo.
echo NEXT STEPS:
echo 1. Open Supabase Dashboard (SQL Editor)
echo 2. Run the SQL from: supabase-wifi-subscriptions.sql
echo 3. Test on a mobile device connected to MyPublicWiFi
echo.
pause
