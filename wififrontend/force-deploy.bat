@echo off
echo 🚀 FORCE DEPLOYING TO APP ENGINE - FIXING TRANSCRIPTION ALERTS...
echo.

echo 📋 Checking files...
if not exist "success.html" (
    echo ❌ success.html not found!
    pause
    exit /b 1
)

if not exist "app.yaml" (
    echo ❌ app.yaml not found!
    pause
    exit /b 1
)

echo ✅ Files found
echo.

echo 🔐 Setting correct account...
gcloud config set account sahilkhk001@gmail.com
echo.

echo 🚀 DEPLOYING NOW - NO CONFIRMATION...
gcloud app deploy app.yaml --quiet --promote --stop-previous-version
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ DEPLOYMENT SUCCESSFUL!
    echo 🌐 Your site is live at: https://hackquest25.el.r.appspot.com/success.html
    echo 🧪 Testing transcription alerts...
    start https://hackquest25.el.r.appspot.com/success.html
) else (
    echo ❌ DEPLOYMENT FAILED!
    echo.
    echo 🔄 Trying alternative method...
    gcloud app deploy --version=transcription-fix --quiet
)

pause