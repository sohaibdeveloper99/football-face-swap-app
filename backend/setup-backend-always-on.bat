@echo off
echo =====================================
echo BACKEND ALWAYS-ON SETUP
echo =====================================
echo.
echo This will install PM2 and setup your backend to always run.
echo.

REM Navigate to backend folder
cd /d "%~dp0"

echo Step 1: Installing PM2 globally...
call npm install -g pm2

echo.
echo Step 2: Starting backend with PM2...
call npm run pm2:start

echo.
echo Step 3: Saving PM2 configuration...
call pm2 save

echo.
echo Step 4: Setting up auto-start on boot...
call pm2 startup

echo.
echo =====================================
echo SETUP COMPLETE!
echo =====================================
echo.
echo Your backend is now running with PM2!
echo.
echo Useful commands:
echo - View status: pm2 status
echo - View logs: pm2 logs face-swap-backend
echo - Stop server: pm2 stop face-swap-backend
echo - Restart server: pm2 restart face-swap-backend
echo.
echo Press any key to exit...
pause >nul





