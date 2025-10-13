# 🚀 GitHub Setup Instructions

## Your code is committed and ready! Now follow these steps:

### Step 1: Create GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** button → **"New repository"**
3. Repository name: `football-face-swap-app`
4. Description: `AI-powered football face swap application`
5. Make it **Public**
6. **DON'T** check any boxes (README, .gitignore, license)
7. Click **"Create repository"**

### Step 2: Connect Your Code to GitHub
After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/football-face-swap-app.git

# Push your code
git push -u origin master
```

### Step 3: Verify Upload
1. Refresh your GitHub repository page
2. You should see all your files including:
   - ✅ `backend/` folder with server.js
   - ✅ `src/` folder with React components
   - ✅ `public/` folder with faces and jerseys
   - ✅ `DEPLOYMENT_GUIDE.md`
   - ✅ `package.json` files

### Step 4: Deploy to Railway
Once your code is on GitHub:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `football-face-swap-app` repository
5. Railway will auto-detect it's a Node.js app

### Step 5: Configure Environment Variables
In Railway dashboard → Variables tab:
```
FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 6: Deploy! 🎉
Your backend will be live at: `https://your-app.railway.app`

---

## 🆘 Need Help?
- Make sure you're signed into GitHub
- Use your actual GitHub username in the commands
- If you get errors, check that the repository name matches exactly
