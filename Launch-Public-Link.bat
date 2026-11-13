@echo off
title Generating Live Public Messenger Link...
color 0A

echo ============================================================================
echo   RUSELL'S WORKSHOP POS - GENERATING PUBLIC HTTPS LINK
echo   "You NAME it, we BUILD it" - Tabor Lumber Compound, Digos City
echo ============================================================================
echo.
echo [1/2] Checking local workshop server on port 8787...
netstat -ano | findstr 8787 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Starting background local server...
    start /B node server.js >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo [2/2] Generating instant public secure link for Messenger & mobile devices...
echo.
echo ----------------------------------------------------------------------------
echo Send this public link to your phone, friends, or panel on Messenger!
echo Keep this window OPEN while sharing the live link.
echo ----------------------------------------------------------------------------
echo.

cmd.exe /c npx.cmd localtunnel --port 8787 --subdomain russels-workshop-pos
if %ERRORLEVEL% NEQ 0 (
    echo Trying alternative public tunnel...
    cmd.exe /c npx.cmd localtunnel --port 8787
)

pause
