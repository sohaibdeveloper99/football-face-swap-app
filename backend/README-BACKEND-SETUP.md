# Backend Always-On Setup Guide

## What This Does
Instead of manually running `npm start` every time you turn on your computer, this setup makes your backend server:
- ✅ Start automatically when Windows boots
- ✅ Keep running even if it crashes (auto-restart)
- ✅ Keep running even when you close the terminal
- ✅ Always available at http://localhost:5000

## Quick Setup (Easiest Method)

### Option 1: Run the Setup Script (Recommended)
1. Double-click `setup-backend-always-on.bat`
2. Follow the on-screen instructions
3. Done! Your backend is now always running

### Option 2: Manual Setup
Run these commands in PowerShell (as Administrator):

```powershell
# Navigate to backend folder
cd backend

# Install PM2
npm install -g pm2

# Start the backend with PM2
npm run pm2:start

# Save the current PM2 processes
pm2 save

# Setup auto-start on Windows boot
pm2 startup
```

## Common Commands

After setup, you can use these commands:

```bash
# Check if backend is running
pm2 status

# View backend logs
pm2 logs face-swap-backend

# Stop the backend
pm2 stop face-swap-backend

# Restart the backend
pm2 restart face-swap-backend

# Delete from PM2 (but keep it running)
pm2 delete face-swap-backend
```

## What is PM2?
PM2 is like a babysitter for your server:
- It starts your backend automatically
- If it crashes, PM2 restarts it automatically
- It keeps running even after you close the terminal
- It logs everything so you can see what happened

## Troubleshooting

### If backend won't start:
```bash
cd backend
pm2 restart face-swap-backend
```

### If you want to disable auto-start:
```bash
pm2 unstartup
```

### To completely remove PM2:
```bash
pm2 kill
npm uninstall -g pm2
```

## Testing
After setup, check if it's working:
1. Open browser
2. Go to: http://localhost:5000/api/health
3. You should see: {"status":"OK","message":"Face Swap API is running"}

---

**Your backend is now running 24/7!** 🎉





