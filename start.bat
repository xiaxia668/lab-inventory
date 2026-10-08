@echo off
title Lab Inventory Management System
cd /d %~dp0

echo Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo.
    echo ========================================
    echo   ERROR: Node.js not installed!
    echo ========================================
    echo.
    echo Node.js is required to run this system.
    echo.
    echo Please download and install from:
    echo https://nodejs.org/
    echo.
    echo Recommended version: v18.x LTS or higher
    echo.
    echo After installation, restart this script.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Lab Inventory Management System
echo ========================================
echo.

if not exist "node_modules\" (
    echo [1/2] Installing dependencies (first time only)...
    echo Please wait, this may take 1-3 minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Dependency installation failed!
        echo Please check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully
    echo.
)

echo [2/2] Starting server...
echo.
echo Server will run at: http://localhost:3000
echo Browser will open automatically
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:3000
node server.js

pause
