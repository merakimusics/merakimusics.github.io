@echo off
title Meraki Musics SEO Bot - Background Daemon
echo =======================================================
echo   🌌 MERAKI MUSICS SEO BACKGROUND DAEMON 🌌
echo =======================================================
echo.
cd /d "%~dp0"
node src/scheduler.js
pause
