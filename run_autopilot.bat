@echo off
title Meraki Musics SEO Bot - 100% Autopilot Daemon
echo =======================================================
echo   🌌 MERAKI MUSICS 100% ZERO-TOUCH AUTOPILOT DAEMON 🌌
echo =======================================================
echo.
echo  * Synchronizing all 57+ songs and shorts...
echo  * Generating high-CTR SEO packages & Schema.org...
echo  * Dispatching IndexNow to Bing, Yandex & Google...
echo  * Running hourly checks and daily spotlight rotations...
echo.
echo  You can minimize this window. The bot runs silently 24/7.
echo =======================================================
echo.
cd /d "%~dp0"
node src/scheduler.js
pause
