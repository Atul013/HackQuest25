@echo off
echo 🚀 Deploying WiFi Frontend to Google Cloud App Engine...

REM ================================
REM CONFIGURE YOUR PROJECT HERE
REM ================================
echo Please enter your Google Cloud Project ID:
set /p PROJECT_ID="Project ID: "

if "%PROJECT_ID%"=="" (
    echo ❌ Error: Project ID cannot be empty!
    pause
    exit /b 1
)

echo 📝 Using project: %PROJECT_ID%

REM Set the project
echo Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

echo 📦 Preparing files for deployment...

REM Check if required files exist
if not exist "login-mypublicwifi.html" (
    echo ❌ Error: login-mypublicwifi.html not found!
    exit /b 1
)

if not exist "success.html" (
    echo ❌ Error: success.html not found!
    exit /b 1
)

if not exist "app.yaml" (
    echo ❌ Error: app.yaml not found!
    exit /b 1
)

echo ✅ All required files found

REM Deploy to App Engine
echo 🌐 Deploying to Google Cloud App Engine...
gcloud app deploy app.yaml --quiet

if %ERRORLEVEL% == 0 (
    echo ✅ Deployment successful!
    echo 🌐 Your WiFi portal is now live at:
    echo    https://%PROJECT_ID%.el.r.appspot.com/
    echo.
    echo 📱 URLs:
    echo    Main login: https://%PROJECT_ID%.el.r.appspot.com/
    echo    Success page: https://%PROJECT_ID%.el.r.appspot.com/success
    echo.
    echo 🎯 To update, just run this script again!
) else (
    echo ❌ Deployment failed!
    exit /b 1
)

pause