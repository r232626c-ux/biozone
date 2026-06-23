@echo off
REM Daily Backup Script for Biozone
REM Run this script daily to backup the database

echo Starting Biozone daily backup...

REM Set the date for filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATESTAMP=%datetime:~0,8%
set TIMESTAMP=%datetime:~8,6%

REM Change to backend directory
cd /d "%~dp0"

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run new daily backup script
python daily_backup.py

REM Also run validation
python validate_db.py

REM Deactivate venv
call venv\Scripts\deactivate.bat

echo Backup and validation completed: %DATESTAMP%
echo.

REM Optional: Copy to a backup folder
if not exist "backups" mkdir "backups"

echo Backup saved to backups folder.
pause