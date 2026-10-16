$env:PATH = "$env:LOCALAPPDATA\Programs\nodejs;$env:PATH"
Set-Location -Path $PSScriptRoot
Write-Host "Starting Pharmly (Backend + Frontend)..." -ForegroundColor Cyan
npm run dev:all
