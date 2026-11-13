@echo off
title Deploying to GitHub & Vercel...
color 0B

echo ============================================================================
echo   RUSELL'S WORKSHOP POS - 1-CLICK GITHUB PUSH FOR VERCEL
echo   Lead Proponent: ALVARADO, JETHRO OLIVER A.
echo ============================================================================
echo.

set /p GITHUB_USER="Enter your GitHub username (e.g., jethroalvarado): "
if "%GITHUB_USER%"=="" (
    echo [ERROR] GitHub username cannot be empty!
    pause
    exit /b
)

set REPO_NAME=russels-workshop-pos
echo.
echo [1/4] Initializing Git repository & author info...
git init
git config user.name "Alvarado, Jethro Oliver A."
git config user.email "jethroalvarado05@gmail.com"

echo [2/4] Staging all workshop system files, assets and configs...
git add .

echo [3/4] Creating commit...
git commit -m "BSIT Mini-Capstone: Rusell's Glass, Woods & Metals POS - System Integration & Architecture"

echo [4/4] Setting main branch & remote origin...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo ----------------------------------------------------------------------------
echo Ready to push to: https://github.com/%GITHUB_USER%/%REPO_NAME%.git
echo Make sure you have created the repository on https://github.com/new first!
echo ----------------------------------------------------------------------------
echo.
set /p DO_PUSH="Push now to GitHub? (Y/N): "
if /i "%DO_PUSH%"=="Y" (
    git push -u origin main
    echo.
    echo ============================================================================
    echo [SUCCESS] Pushed to GitHub!
    echo Now open https://vercel.com/new and select "%REPO_NAME%" to deploy!
    echo ============================================================================
)

echo.
pause
