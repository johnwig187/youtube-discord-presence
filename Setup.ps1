$ErrorActionPreference = 'Stop'
$configFile = Join-Path $PSScriptRoot 'bridge\config.json'
if (Test-Path -LiteralPath $configFile) {
  throw 'This copy is already configured. Existing pairing was preserved. Use Start.cmd, or back up and remove its local config before pairing again.'
}
$runtime = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $runtime) { throw 'Install Node.js 22 or newer from https://nodejs.org, then open a new terminal and rerun Setup.cmd.' }
$major = [int]((& $runtime --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw 'Node.js 22 or newer is required.' }
$clientId = Read-Host 'Discord Application ID (Developer Portal > your application > General Information)'
if ($clientId -notmatch '^\d{17,22}$') { throw 'Application ID must be 17-22 digits.' }
$bytes = New-Object byte[] 24
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$token = -join ($bytes | ForEach-Object { $_.ToString('x2') })
@{clientId=$clientId;token=$token} | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding ascii
$runtime | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime.txt') -Encoding ascii
Write-Host "Pairing code: $token"
Write-Host "In brave://extensions enable Developer mode, choose Load unpacked, select: $(Join-Path $PSScriptRoot 'extension')"
Write-Host 'Paste the pairing code into extension options. Run Start.cmd to start the bridge.'
Write-Host 'Keep this pairing code private. Do not include local config or runtime files in Git.'
