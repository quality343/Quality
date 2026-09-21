# Starts the project-local PostgreSQL 16 dev instance for QUALITY Hearing Care.
# Data directory: .localdb/data (gitignored). Port 5433 to avoid the machine's
# pre-existing postgres service on 5432.
#
# Usage:  powershell -NoProfile -File scripts/dev-db-start.ps1
param()
$ErrorActionPreference = "Stop"

$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$dataDir = Join-Path $PSScriptRoot "..\.localdb\data"
$logFile = Join-Path $PSScriptRoot "..\.localdb\logfile"

if (-not (Test-Path $dataDir)) {
  Write-Host "No data directory found. Run init first:"
  Write-Host "  mkdir .localdb; 'qhc' | Set-Content .localdb\pwfile"
  Write-Host "  & '$pgBin\initdb.exe' -D $dataDir -U qhc --pwfile=.localdb\pwfile -E UTF8 --locale=C"
  exit 1
}

# Clean environment: PG DLLs fail to init when launched from Git Bash env (0xC0000142).
$env:PGLOCALEDIR = $null
$env:PGSYSCONFDIR = $null

& "$pgBin\pg_ctl.exe" -D $dataDir -o "-p 5433" -l $logFile start
& "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5433
