@echo off
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
cd /d "%~dp0"
echo Starting Pharmly (Backend + Frontend)...
npm run dev:all
pause
