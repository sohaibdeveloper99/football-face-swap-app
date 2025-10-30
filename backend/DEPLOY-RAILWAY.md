# Deploy Backend to Railway (Production)

## What is Railway?
Railway is a cloud platform that hosts your backend online, so:
- ✅ Your backend is accessible from anywhere (not just localhost)
- ✅ It runs 24/7 without your computer being on
- ✅ It's free for small projects
- ✅ Easy to deploy

## Prerequisites
1. GitHub account (free)
2. Railway account (free at railway.app)

## Step-by-Step Deployment Guide

### STEP 1: Push Your Code to GitHub
(If not already done)

1. Create a new repository on GitHub
2. Open terminal in your project root (`footballswaptry` folder)
3. Run these commands:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Railway deployment"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/footballswaptry.git

# Push to GitHub
git push -u origin main
```

### STEP 2: Deploy to Railway

#### 2.1: Create Railway Account
1. Go to https://railway.app
2. Sign up (use GitHub option for easy setup)
3. Click "New Project"

#### 2.2: Deploy Your Backend
1. Click "Deploy from GitHub repo"
2. Select your `footballswaptry` repository
3. Select the `backend` folder as the root
4. Click "Deploy Now"

#### 2.3: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab → Add these:

```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
FACEMINT_API_KEY=your_facemint_api_key
```

Important: Replace `your_facemint_api_key` with your actual API key from config.env

#### 2.4: Get Your Live URL
1. In Railway dashboard, go to Settings
2. Click "Generate Domain"
3. Copy the URL (e.g., `your-app.up.railway.app`)
4. This is your LIVE backend URL! 🎉

### STEP 3: Test Your Live Backend
Visit: `https://your-app.up.railway.app/api/health`

You should see: `{"status":"OK","message":"Face Swap API is running"}`

## Updating Your Frontend

After deployment, update your frontend to use the Railway URL:

1. Find where your frontend makes API calls
2. Replace `http://localhost:5000` with your Railway URL
3. Example: `https://your-app.up.railway.app/api/faceswap`

## Troubleshooting

### Backend won't start on Railway:
1. Check logs in Railway dashboard
2. Make sure environment variables are set
3. Check that PORT is not hardcoded (should use `process.env.PORT`)

### CORS errors:
Update `FRONTEND_URL` in Railway variables to your actual frontend URL

### API errors:
Make sure all API keys are set in Railway environment variables

## Cost
Railway has a free tier:
- $5 free credit monthly
- Perfect for small projects
- You pay only when you go over limits

## Useful Railway Commands (CLI)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

**Your backend is now LIVE on the internet!** 🌐





