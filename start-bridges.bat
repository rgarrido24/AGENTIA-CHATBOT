@echo off
echo Iniciando bridges de WhatsApp...
echo.

REM Bridge 1: Izzi
start "Bridge Izzi" cmd /k "set AGENTIA_WHATSAPP_CLIENT_ID=izzi && set PORT=10001 && node scripts/whatsapp-bridge.js"

REM Espera 3 segundos antes de abrir el segundo para no saturar el arranque
timeout /t 3 /nobreak >nul

REM Bridge 2: Agentia Ventas
start "Bridge Agentia Ventas" cmd /k "set AGENTIA_WHATSAPP_CLIENT_ID=agentia-ventas && set PORT=10002 && node scripts/whatsapp-bridge.js"

echo.
echo Bridges iniciados en terminales separadas.
echo.
echo  Bridge Izzi          -> http://localhost:10001/health
echo  Bridge Agentia Ventas -> http://localhost:10002/health
echo.
echo Para ver el QR de cada bridge, abre:
echo  http://localhost:10001/qr
echo  http://localhost:10002/qr
echo.
pause
