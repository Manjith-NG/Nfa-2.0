# Push local NFA project to https://github.com/Manjith-NG/Nfa
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "=== NFA GitHub Push ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
  Write-Host "ERROR: Not a git repository. Run from the NFA project folder." -ForegroundColor Red
  exit 1
}

$remoteUrl = "https://github.com/Manjith-NG/Nfa.git"
$existing = git remote get-url origin 2>$null
if (-not $existing) {
  git remote add origin $remoteUrl
  Write-Host "Added remote: origin -> $remoteUrl"
} elseif ($existing -ne $remoteUrl) {
  git remote set-url origin $remoteUrl
  Write-Host "Updated remote origin -> $remoteUrl"
}

# Stage and commit if needed
$status = git status --porcelain
if ($status) {
  git add -A
  git -c user.name="Manjith-NG" -c user.email="Manjith-NG@users.noreply.github.com" `
    commit -m "Update project files before GitHub push"
  Write-Host "Committed local changes."
}

Write-Host ""
Write-Host "Checking GitHub repository..." -ForegroundColor Yellow
try {
  $null = Invoke-RestMethod -Uri "https://api.github.com/repos/Manjith-NG/Nfa" -TimeoutSec 12
  Write-Host "Repository exists on GitHub." -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "WARNING: Repository not found (or private without login)." -ForegroundColor Red
  Write-Host "Create it first:" -ForegroundColor Yellow
  Write-Host "  1. Open https://github.com/new"
  Write-Host "  2. Owner: Manjith-NG"
  Write-Host "  3. Name: Nfa"
  Write-Host "  4. Do NOT add README / .gitignore / license"
  Write-Host "  5. Create repository, then run this script again"
  Write-Host ""
  $continue = Read-Host "Continue push anyway? (y/N)"
  if ($continue -ne "y" -and $continue -ne "Y") { exit 1 }
}

Write-Host ""
Write-Host "Pushing branch 'main' to origin..." -ForegroundColor Yellow
Write-Host "(Sign in to GitHub if a browser or login window opens)" -ForegroundColor Gray
Write-Host ""

git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Push FAILED." -ForegroundColor Red
  Write-Host "See PUSH_GITHUB.md for authentication and troubleshooting steps."
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "SUCCESS! Code is on GitHub:" -ForegroundColor Green
Write-Host "  https://github.com/Manjith-NG/Nfa" -ForegroundColor Cyan
Write-Host ""
