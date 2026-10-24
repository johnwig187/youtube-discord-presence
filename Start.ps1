$ErrorActionPreference = 'Stop'
$runtimeFile = Join-Path $PSScriptRoot 'runtime.txt'
if (!(Test-Path -LiteralPath $runtimeFile)) { throw 'Run Setup.cmd for this copy first.' }
$runtime = (Get-Content -LiteralPath $runtimeFile -Raw).Trim()
if (!(Test-Path -LiteralPath $runtime)) { throw 'The configured Node executable is unavailable. Install Node.js and update the local runtime.txt path.' }
& $runtime (Join-Path $PSScriptRoot 'bridge\server.js')
exit $LASTEXITCODE
