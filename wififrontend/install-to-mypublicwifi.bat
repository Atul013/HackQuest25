@echo off
echo ========================================
echo Installing AlertNet UI to MyPublicWiFi
echo ========================================
echo.

set "SOURCE=%~dp0"
set "DEST=C:\Program Files (x86)\MyPublicWiFi\Web"

echo Creating backup...
if not exist "%DEST%\backup_original" mkdir "%DEST%\backup_original"
copy "%DEST%\login.html" "%DEST%\backup_original\login_backup.html" /Y >nul 2>&1
copy "%DEST%\style.css" "%DEST%\backup_original\style_backup.css" /Y >nul 2>&1
echo Backup created in: %DEST%\backup_original
echo.

echo Installing new files...
copy "%SOURCE%login-mypublicwifi.html" "%DEST%\login.html" /Y
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy login.html
    echo Please run this file as Administrator!
    pause
    exit /b 1
)

copy "%SOURCE%style-modern.css" "%DEST%\style.css" /Y
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy style.css
    echo Please run this file as Administrator!
    pause
    exit /b 1
)

copy "%SOURCE%success.html" "%DEST%\success.html" /Y
if %errorlevel% neq 0 (
    echo WARNING: Failed to copy success.html
)
echo.

echo ========================================
echo SUCCESS! Installation complete!
echo ========================================
echo.
echo Files installed:
echo   - login.html (AlertNet registration page)
echo   - style.css (Modern styling)
echo   - success.html (Success page after registration)
echo.
echo Next steps:
echo 1. Go back to MyPublicWiFi application
echo 2. Click "Preview" to see the new design
echo 3. Click "Save changes" to activate it
echo.
pause

