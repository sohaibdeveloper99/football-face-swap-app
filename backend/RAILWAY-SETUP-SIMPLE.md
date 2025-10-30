# 🚀 Deploy Backend to Railway - SIMPLE GUIDE

## What This Does:
- Makes your backend accessible on the internet
- Works without your computer being on
- Gets you a public URL like: `https://your-app.up.railway.app`
- **Completely FREE** to start

---

## 📋 Before You Start:
1. ✅ You have your backend code
2. ✅ You have a GitHub account (free at github.com)
3. ✅ You're ready to follow 5 simple steps

---

## 🎯 5-Step Deployment:

### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Name it: `football-swap-backend`
4. Click "Create repository"

### Step 2: Push Your Code
Open PowerShell in your project folder and run:

```bash
# Go to project root
cd "C:\Users\SHUAIB LAPTOP\Desktop\my g\footballswaptry"

# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/football-swap-backend.git

# Push
git push -u origin main
```

### Step 3: Deploy to Railway
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your repository: `football-swap-backend`
6. Railway will detect your backend
7. Click "Deploy Now"
8. Wait 2-3 minutes for deployment

### Step 4: Set Environment Variables
1. In Railway, click on your project
2. Go to "Variables" tab
3. Click "+ New Variable" and add:

```
Name: NODE_ENV
Value: production

Name: PORT
Value: 5000

Name: FRONTEND_URL
Value: http://localhost:3000

Name: FACEMINT_API_KEY
Value: 3f1032f1-a2b2-11f0-97d6-e96778ed3e95
```

### Step 5: Get Your Live URL
1. In Railway, click "Settings"
2. Scroll down to "Domains"
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://your-app.up.railway.app`)

---

## ✅ Test It!

Open browser and visit:
```
https://your-app.up.railway.app/api/health
```

You should see:
```json
{"status":"OK","message":"Face Swap API is running"}
```

**SUCCESS! Your backend is now LIVE! 🎉**

---

## 🔧 Common Issues:

### Problem: "502 Bad Gateway"
**Fix:** Check Railway logs, make sure all environment variables are set

### Problem: CORS errors in frontend
**Fix:** Update `FRONTEND_URL` variable to your frontend's actual URL

### Problem: Backend won't start
**Fix:** 
1. Check Railway logs (click on your project → Logs)
2. Look for errors
3. Make sure `NODE_ENV=production` is set

---

## 📱 Update Your Frontend:

After deployment, change all API calls from:
```javascript
http://localhost:5000/api/faceswap
```

To:
```javascript
https://your-app.up.railway.app/api/faceswap
```

---

## 💰 Cost:
- **FREE** - $5 credit every month
- No credit card needed
- Perfect for small projects
- You only pay if you go over $5/month

---

## 🔄 Updating Your Backend:

Whenever you make changes:

```bash
git add .
git commit -m "Updated backend"
git push
```

Railway automatically redeploys! 🚀

---

## 📚 Need More Help?

Read the detailed guide: `DEPLOY-RAILWAY.md`





