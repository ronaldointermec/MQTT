@echo off
title Iniciando Monitor RFID...
start rfid-monitor.exe
timeout /t 3
start http://localhost:3000
exit