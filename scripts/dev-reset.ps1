# Stop stuck dev servers, clear corrupted .next cache, regenerate Prisma, start dev
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

& "$PSScriptRoot\kill-ports.ps1"

if (Test-Path ".next") {
  Write-Host "Removing .next cache..."
  Remove-Item -Recurse -Force ".next"
}

Write-Host "Regenerating Prisma client..."
npx prisma generate

Write-Host "Starting dev server..."
npm run dev
