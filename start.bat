@echo off
cd /d %~dp0

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo Recommended version: v18.x LTS or higher
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

echo.
echo ========================================
echo   Lab Inventory Management System
echo ========================================
echo.
echo Starting server...
echo.

start http://localhost:3000
node server.js

pause
