@echo off
title Meraki Musics - Official Website
echo =======================================================
echo   🎵 LAUNCHING MERAKI MUSICS OFFICIAL WEBSITE 🎵
echo =======================================================
echo.
cd /d "%~dp0"
start http://localhost:3000/preview/
node src/server.js
pause
