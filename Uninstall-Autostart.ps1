$ErrorActionPreference = 'Stop'
$taskName = 'YouTube Discord Presence Bridge'
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "No '$taskName' task is installed for this computer."
  exit 0
}

if ($task.State -eq 'Running') {
  Stop-ScheduledTask -TaskName $taskName
}
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Removed '$taskName'. Local bridge configuration and browser pairing were left in place."
