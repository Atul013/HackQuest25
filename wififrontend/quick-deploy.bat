@echo off
echo 🚀 Quick Deploy to Existing App Engine...

echo 📦 Checking required files...

if not exist "login-mypublicwifi.html" (
    echo ❌ Error: login-mypublicwifi.html not found!
    pause
    exit /b 1
)

if not exist "success.html" (
    echo ❌ Error: success.html not found!
    pause
    exit /b 1
)

if not exist "app.yaml" (
    echo ❌ Error: app.yaml not found!
    pause
    exit /b 1
)

echo ✅ All files ready for deployment

echo 🌐 Deploying to App Engine (using existing project settings)...
gcloud app deploy app.yaml --quiet

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ Deployment successful!
    echo.
    echo 🌐 Your updated WiFi portal should be live at:
    echo    https://hackquest25.el.r.appspot.com/
    echo.
    echo 📱 Test URLs:
    echo    Login: https://hackquest25.el.r.appspot.com/
    echo    Success: https://hackquest25.el.r.appspot.com/success
    echo.
    echo 🎯 Features deployed:
    echo    ✅ WiFi registration with Supabase
    echo    ✅ Live transcription alerts
    echo    ✅ Haptic feedback
    echo    ✅ Mobile responsive design
) else (
    echo ❌ Deployment failed! Check the error above.
)

echo.
echo Press any key to exit...
pause >nul