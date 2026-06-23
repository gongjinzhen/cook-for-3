@echo off
echo ================================
echo   Cook For U - Starting Services
echo ================================

echo Starting Backend (port 3001)...
start "Backend" node.exe "C:\Users\Roborock\Desktop\cook\cook-for-u-v2\backend\server.js"
timeout /t 3 /nobreak > nul

echo Starting Frontend (port 5173)...
start "Frontend" node.exe "C:\Users\Roborock\Desktop\cook\cook-for-u-v2\frontend\node_modules\vite\bin\vite.js" --host
timeout /t 5 /nobreak > nul

echo.
echo Services should be running:
echo   Backend: http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause > nul

echo Stopping services...
taskkill /f /im node.exe > nul 2>&1
echo Done.
