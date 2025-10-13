@echo off
echo Starting Face Swap Application...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul

