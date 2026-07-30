# Restore weekly.db from the daily backup. Run manually when the live db is broken/missing.
# 1. Stop the backend (close the "Backend" cmd window / stop uvicorn) before running this.
# 2. Run this script.
# 3. Restart the backend and verify: curl http://localhost:8100/api/weeks

$ErrorActionPreference = "Stop"

$root    = Split-Path -Parent $PSScriptRoot
$backup  = Join-Path $root "backups\weekly_backup.db"
$live    = Join-Path $root "weekly.db"

if (-not (Test-Path $backup)) {
    Write-Error "No backup found at $backup - nothing to restore from."
    exit 1
}

if (Test-Path $live) {
    $broken = Join-Path $root ("weekly.db.broken." + (Get-Date -Format "yyyyMMdd_HHmmss"))
    Copy-Item $live $broken
    Write-Host "Current weekly.db saved as $broken (in case you need it back)"
}

Copy-Item $backup $live -Force
Write-Host "Restored weekly.db from $backup"
Write-Host "Now restart the backend and verify with: curl http://localhost:8100/api/weeks"
