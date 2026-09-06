@echo off
title Meraki Musics - Push to GitHub Pages
echo ==========================================================
echo   🚀 CONNECT & DEPLOY MERAKI MUSICS TO GITHUB PAGES 🚀
echo ==========================================================
echo.
cd /d "%~dp0"

echo 1. Checking Git repository status...
if not exist ".git" (
    echo Initializing local Git repository...
    git init
    git branch -M main
)

echo.
echo 2. Building latest static site...
call node src/cli.js build-site

echo.
echo 3. Staging and committing files...
git add .
git commit -m "Deploy Meraki Musics static website & SEO engine"

echo.
echo ==========================================================
echo 4. Connect to your GitHub repository:
echo.
echo If you haven't created a GitHub repository yet:
echo   - Go to: https://github.com/new
echo   - Name your repo (e.g. "merakimusics" or "merakimusics.github.io")
echo   - Choose Public and click "Create repository"
echo ==========================================================
echo.
set /p REPO_URL="Paste your GitHub repository URL here (e.g. https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo.
    echo No URL provided. You can run this script again anytime.
    pause
    exit /b
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
echo.
echo Pushing to GitHub main branch...
git push -u origin main

echo.
echo ==========================================================
echo   ✅ PUSH COMPLETE!
echo.
echo GitHub Actions will now automatically publish your site!
echo Go to your repo -> Settings -> Pages -> Source: "GitHub Actions"
echo ==========================================================
pause
