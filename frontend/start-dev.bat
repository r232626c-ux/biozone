@echo off
REM Start Biozone with HTTPS - Windows batch script
REM Run from biozone/frontend/ directory

echo.
echo ========================================
echo  BIOZONE DEVELOPMENT SERVER (HTTPS)
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies
        exit /b 1
    )
)

REM Generate certificates if they don't exist
if not exist "localhost.pem" (
    echo.
    echo Generating HTTPS certificates...
    call node generate-certs.js
    if errorlevel 1 (
        echo.
        echo WARNING: Certificate generation failed
        echo Continuing anyway - you may see HTTPS warnings
        echo.
    ) else (
        echo Certificates generated successfully!
        echo.
    )
)

REM Start dev server
echo Starting Vite dev server on https://localhost:5173...
echo.
call npm run dev

pause
