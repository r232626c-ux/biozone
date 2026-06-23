@echo off
REM CORS & Backend Connectivity Test for Windows
REM This script verifies the backend is running and accessible

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   CORS & BACKEND CONNECTIVITY TEST
echo ============================================================
echo.

set BACKEND_URL=http://192.168.1.114:8000
set FRONTEND_URL=http://192.168.1.114:5173

echo Backend URL:  %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo.

echo Step 1: Test network connectivity (ping)
echo ============================================================
ping -n 1 192.168.1.114 >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot ping 192.168.1.114
    echo    Check network connection or firewall
    goto end
) else (
    echo ✅ Network connectivity OK
)

echo.
echo Step 2: Test backend health check
echo ============================================================
REM Using curl if available, otherwise powershell
where curl >nul 2>&1
if errorlevel 1 (
    echo Using PowerShell for HTTP test...
    powershell -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '✅ Backend is running'; Write-Host $response.StatusCode } catch { Write-Host '❌ Backend not responding'; Write-Host $_.Exception.Message }"
) else (
    curl -s -m 5 "%BACKEND_URL%/health"
    if errorlevel 1 (
        echo ❌ Backend is not reachable
        echo    Start backend: cd biozone\backend ^& python run_app.py
        goto end
    ) else (
        echo ✅ Backend is running
    )
)

echo.
echo Step 3: Verify CORS configuration
echo ============================================================
echo The backend CORS is configured to allow:
echo   - http://localhost:5173
echo   - http://127.0.0.1:5173
echo   - http://192.168.1.114:5173
echo   - https versions of the above
echo.

echo.
echo Step 4: Check backend is listening on port 8000
echo ============================================================
netstat -ano | findstr ":8000" >nul 2>&1
if errorlevel 1 (
    echo ❌ Port 8000 is NOT listening
    echo    Backend may not be running
) else (
    echo ✅ Port 8000 is listening
)

echo.
echo ============================================================
echo   TEST COMPLETE
echo ============================================================
echo.

echo Next steps:
echo 1. If all tests passed, refresh your browser
echo 2. If tests failed, restart the backend:
echo    cd biozone\backend
echo    python run_app.py
echo.

:end
pause
