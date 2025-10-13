# 🚀 Backend Deployment Guide

## Option 1: Railway (Recommended for Beginners)

### Step 1: Prepare Your Code
1. Make sure your backend folder is ready (✅ Already done!)
2. Your `package.json` has the correct start script
3. Your `Procfile` is created for deployment

### Step 2: Push to GitHub
1. Open your terminal in the project folder
2. Run these commands:
```bash
git add .
git commit -m "Prepare backend for deployment"
git push origin master
```

### Step 3: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect it's a Node.js app

### Step 4: Configure Environment Variables
In Railway dashboard:
1. Go to your project → Variables tab
2. Add these environment variables:
   - `PORT` = `5000` (Railway will set this automatically)
   - `FRONTEND_URL` = `https://your-frontend-domain.com`
   - `FACEMINT_API_KEY` = `3f1032f1-a2b2-11f0-97d6-e96778ed3e95`
   - `NODE_ENV` = `production`

### Step 5: Deploy!
1. Railway will automatically deploy your app
2. You'll get a URL like: `https://your-app-name.railway.app`
3. Test your API: `https://your-app-name.railway.app/api/health`

---

## Option 2: Render (Alternative)

### Step 1: Create Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `face-swap-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

### Step 3: Environment Variables
Add the same environment variables as Railway

---

## Option 3: Heroku (Alternative)

### Step 1: Install Heroku CLI
Download from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git push heroku master
```

---

## 🔧 After Deployment

### Update Your Frontend
Once deployed, update your frontend to use the new backend URL:

1. Find your backend URL (e.g., `https://your-app.railway.app`)
2. Update your frontend API calls to use this URL instead of `localhost:5000`

### Test Your API
Visit: `https://your-backend-url.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Face Swap API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🆘 Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in `package.json`
2. **App crashes**: Check logs in your hosting platform
3. **Environment variables**: Make sure they're set correctly
4. **CORS errors**: Update `FRONTEND_URL` in environment variables

### Getting Help:
- Check your hosting platform's logs
- Make sure your `server.js` starts without errors locally
- Verify all environment variables are set

---

## 💡 Pro Tips

1. **Railway** is the easiest for beginners
2. **Render** has a good free tier
3. **Heroku** is popular but has limited free tier
4. Always test your API after deployment
5. Keep your environment variables secure
6. Monitor your app's performance and logs

---

## 🎉 Success!

Once deployed, your backend will be accessible from anywhere in the world! Your face swap app will work for users globally.
