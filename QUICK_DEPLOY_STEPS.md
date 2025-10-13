# ⚡ Quick Deployment Steps (Railway)

## 🎯 Fastest Way to Deploy (5 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin master
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js ✅

### Step 3: Add Environment Variables
In Railway dashboard → Variables:
```
FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 4: Done! 🎉
Your API will be live at: `https://your-app.railway.app`

Test it: `https://your-app.railway.app/api/health`

---

## 🔄 Update Frontend
Change your frontend API URL from:
- `http://localhost:5000` 
- To: `https://your-app.railway.app`

---

## 🆘 Need Help?
- Check Railway logs if something goes wrong
- Make sure environment variables are set
- Test locally first: `npm start` in backend folder
