@echo off
title Meraki Musics SEO Bot - Command Dashboard
echo =======================================================
echo   🌌 STARTING MERAKI MUSICS SEO COMMAND CENTER 🌌
echo =======================================================
echo.
cd /d "%~dp0"
start http://localhost:3000
node src/server.js
pause
