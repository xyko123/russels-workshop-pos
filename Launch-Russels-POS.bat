@echo off
title Starting RUSELL'S Glass, Woods & Metals POS Software...
color 0A

echo ============================================================================
echo   RUSELL'S GLASS, WOODS & METALS - WORKSHOP POS SOFTWARE
echo   "You NAME it, we BUILD it" - Tabor Lumber Compound, Digos City
echo   Point of Sale, Custom Fabrication Estimator & Inventory Management
echo   Tabor Lumber Compound, Roxas Ext., Digos City, Davao del Sur
echo ============================================================================
echo.

:: 1. Check if Node / local server is running on port 8787
netstat -ano | findstr 8787 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Starting Workshop Local POS Server on port 8787...
    start /B node server.js >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo [INFO] Workshop Local POS Server is already active on http://localhost:8787
)

:: 2. Launch in Dedicated Native POS Software Window (No browser tabs, no URL bar)
echo [INFO] Launching Dedicated Standalone POS Software Window...

:: Try Microsoft Edge App Mode (Standard on Windows 10/11)
where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start msedge --app="http://localhost:8787/app.html" --window-size=1400,850
    goto DONE
)

:: Try Google Chrome App Mode
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start chrome --app="http://localhost:8787/app.html" --window-size=1400,850
    goto DONE
)

:: Fallback default browser
start http://localhost:8787/app.html

:DONE
echo.
echo [SUCCESS] RUSELL'S POS Software is now running!
timeout /t 3 >nul
exit
