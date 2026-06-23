# Biozone Daily Backup Scheduler
# Run this script to schedule daily backups

$backupPath = Join-Path $PSScriptRoot "daily_backup.bat"
$taskName = "Biozone Daily Backup"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Scheduled task '$taskName' already exists. Removing it first..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create new daily task
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$backupPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2am  # Run at 2:00 AM daily
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Daily backup of Biozone database including all lab results"

Write-Host "Daily backup scheduled successfully!"
Write-Host "Task will run daily at 2:00 AM"
Write-Host "Task Name: $taskName"
Write-Host "Backup Script: $backupPath"