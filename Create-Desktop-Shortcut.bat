@echo off
title Creating Rusell's POS Desktop Shortcut...
color 0A

echo ============================================================================
echo   Creating Windows Desktop Shortcut for RUSELL'S POS Software
echo ============================================================================

set SCRIPT="%TEMP%\CreateShortcut-%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Rusell's POS Software.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0Launch-Russels-POS.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "RUSELL'S Glass, Woods & Metals Workshop POS Software" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo [SUCCESS] "Rusell's POS Software" shortcut has been created on your Windows Desktop!
echo Double-click that desktop icon anytime to launch your POS Software directly.
echo.
pause
