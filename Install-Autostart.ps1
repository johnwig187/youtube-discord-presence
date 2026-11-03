$ErrorActionPreference = 'Stop'

$runtimeFile = Join-Path $PSScriptRoot 'runtime.txt'
$configFile = Join-Path $PSScriptRoot 'bridge\config.json'
$startScript = Join-Path $PSScriptRoot 'Start.ps1'
$taskName = 'YouTube Discord Presence Bridge'

foreach ($requiredFile in @($runtimeFile, $configFile, $startScript)) {
  if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
    throw "Required setup file is missing: $requiredFile. Run Setup.cmd and complete manual setup first."
  }
}

$runtime = (Get-Content -LiteralPath $runtimeFile -Raw).Trim()
if (-not (Test-Path -LiteralPath $runtime -PathType Leaf)) {
  throw 'The configured Node executable is unavailable. Run Setup.cmd again or repair runtime.txt.'
}

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  throw "The task '$taskName' already exists for this computer. Run Uninstall-Autostart.cmd before reinstalling it."
}

$powerShell = Join-Path $PSHOME 'powershell.exe'
if (-not (Test-Path -LiteralPath $powerShell -PathType Leaf)) {
  $powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
}

$action = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`"" -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Starts the local YouTube and YouTube Music Discord presence bridge after this Windows user signs in.' | Out-Null
Write-Host "Installed '$taskName' for $env:USERNAME. It will start at the next sign-in."
Write-Host 'The bridge uses the existing local pairing. Discord desktop must be open in this same Windows session.'
