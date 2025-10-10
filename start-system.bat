@echo off
echo ========================================
echo   Starting Backend Server
echo ========================================
cd backend
start cmd /k "node server.js"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo   Opening Haptic Test Page
echo ========================================
cd ..
start frontend\haptic-test-simple.html
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   Ready to Start ML Model
echo ========================================
echo.
echo To start the ML model, open a NEW terminal and run:
echo   cd frontend
echo   python model.py
echo.
echo Press any key to exit this window...
pause > nul
