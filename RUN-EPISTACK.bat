@echo off
REM FLF Epistemic Stack - Windows double-click launcher.
REM Hands off to the cross-platform Node runner.

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found on this PC.
  echo Install the official installer from https://nodejs.org/ (Node 20 or newer^),
  echo then double-click this file again.
  echo.
  pause
  exit /b 1
)

node scripts\run-epistack.js
pause
