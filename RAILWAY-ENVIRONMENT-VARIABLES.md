# 🔐 Railway Environment Variables Setup

## Required Environment Variables

Add these in Railway dashboard → Your Service → Variables Tab:

---

## ✅ **REQUIRED** Variables:

### 1. `NODE_ENV`
```
Name: NODE_ENV
Value: production
```
**Purpose:** Tells Node.js this is a production environment

---

### 2. `PORT`
```
Name: PORT
Value: 5000
```
**Purpose:** Port for the server (Railway will override this, but set it anyway)

---

### 3. `FACEMINT_API_KEY`
```
Name: FACEMINT_API_KEY
Value: 3f1032f1-a2b2-11f0-97d6-e96778ed3e95
```
**Purpose:** API key for face swap service (you already have this)

---

## 📱 **RECOMMENDED** Variables:

### 4. `FRONTEND_URL`
```
Name: FRONTEND_URL
Value: https://rivalkit-85fd6.web.app
```
**Purpose:** For CORS - allows your frontend to call the backend

**⚠️ UPDATED FOR FIREBASE HOSTING:**
- For Firebase Hosting: `https://rivalkit-85fd6.web.app`
- For localhost development: `http://localhost:3000`
- For Vercel/Netlify: `https://your-frontend.vercel.app`
- For multiple origins: Add multiple values (separate with comma if needed)

**Current Setup:** Your app is deployed to Firebase Hosting, so use the Firebase URL above!

---

## 🔑 **OPTIONAL** Variables:

### 5. `PIAPI_API_KEY` (Optional)
```
Name: PIAPI_API_KEY
Value: (leave empty if not using)
```
**Purpose:** Alternative face swap provider

### 6. `AKOOL_API_KEY` (Optional)
```
Name: AKOOL_API_KEY
Value: (leave empty if not using)
```
**Purpose:** Alternative face swap provider

---

## 📝 Step-by-Step: How to Add in Railway

### Step 1: Go to Railway Dashboard
1. Visit: https://railway.app
2. Click your project: `football-face-swap-app`
3. Click your backend service

### Step 2: Open Variables Tab
1. Click **"Variables"** tab (or "Environment Variables")
2. Click **"+ New Variable"** button

### Step 3: Add Each Variable
For each variable:
1. **Name:** (e.g., `NODE_ENV`)
2. **Value:** (e.g., `production`)
3. Click **"Add"**

### Step 4: Add All Variables
Repeat for all required variables listed above.

### Step 5: Save
Railway will automatically redeploy after you add variables!

---

## ✅ Complete List to Copy/Paste:

```
NODE_ENV=production
PORT=5000
FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95
FRONTEND_URL=https://rivalkit-85fd6.web.app
```

---

## 🎯 Quick Setup:

### Minimum Required:
- `NODE_ENV=production`
- `FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95`

### Recommended:
- Add all variables above for best results

---

## ⚠️ Important Notes:

1. **Never commit** `.env` files to GitHub (they're in .gitignore)
2. **Railway automatically** redeploys when you add variables
3. **CORS:** ✅ `FRONTEND_URL` is updated to Firebase Hosting URL: `https://rivalkit-85fd6.web.app`
4. **API Keys:** Keep them secret - don't share publicly

**🔄 ACTION REQUIRED:** If you already have `FRONTEND_URL` set in Railway, update it to the Firebase URL above!

---

## 🔍 How to Check if Variables are Set:

After adding, check Railway logs. You should see:
```
✅ Face Swap API server running on port 5000
```

If you see errors about missing API keys, double-check your variables!

---

**Add these variables in Railway dashboard now!** ✅



