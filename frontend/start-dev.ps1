#!/usr/bin/env pwsh
<#
.SYNOPSIS
Start Biozone development server with HTTPS support
.DESCRIPTION
This script generates SSL certificates (if needed) and starts the Vite dev server
.EXAMPLE
./start-dev.ps1
#>

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " BIOZONE DEVELOPMENT SERVER (HTTPS)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies" -ForegroundColor Red
        exit 1
    }
}

# Generate certificates if they don't exist
if (-not (Test-Path "localhost.pem") -or -not (Test-Path "localhost-key.pem")) {
    Write-Host "`nGenerating HTTPS certificates..." -ForegroundColor Yellow
    node generate-certs.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Certificates generated successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "`n⚠️  Certificate generation had issues" -ForegroundColor Yellow
        Write-Host "Continuing anyway - you may see HTTPS warnings`n" -ForegroundColor Yellow
    }
}

# Start dev server
Write-Host "Starting Vite dev server on https://localhost:5173..." -ForegroundColor Green
Write-Host "⏳ Development server starting..." -ForegroundColor Cyan
Write-Host ""

npm run dev

# Keep window open on error
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Dev server exited with error code: $LASTEXITCODE" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
