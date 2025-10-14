# 🔧 Backend Troubleshooting Guide

## 🚨 **Issue: "Cannot connect to server"**

Your backend at `https://football-face-swap-app.onrender.com` is not responding properly.

## 🔍 **How to Check if Backend is Running:**

### **Step 1: Check Render Dashboard**
1. Go to [render.com](https://render.com)
2. Sign in to your account
3. Find your `football-face-swap-app` service
4. Check the **"Logs"** tab for any errors
5. Check the **"Metrics"** tab for service status

### **Step 2: Test Backend Health**
Try these URLs in your browser:
- `https://football-face-swap-app.onrender.com/api/health`
- `https://football-face-swap-app.onrender.com/`

### **Step 3: Common Issues & Solutions**

#### **Issue 1: Service is Sleeping (Free Tier)**
**Problem:** Render free tier services "sleep" after 15 minutes of inactivity
**Solution:** 
- Make a request to wake it up
- Or upgrade to a paid plan

#### **Issue 2: Build Failed**
**Problem:** Backend failed to build or start
**Solution:**
1. Check Render logs for build errors
2. Verify `package.json` has correct start script
3. Check environment variables are set

#### **Issue 3: Environment Variables Missing**
**Problem:** Backend can't start without required env vars
**Solution:**
1. Go to Render dashboard → Environment tab
2. Add these variables:
   ```
   FACEMINT_API_KEY=3f1032f1-a2b2-11f0-97d6-e96778ed3e95
   NODE_ENV=production
   FRONTEND_URL=https://ajak-medical.firebaseapp.com
   ```

#### **Issue 4: Port Configuration**
**Problem:** Backend not listening on correct port
**Solution:**
- Render automatically sets `PORT` environment variable
- Your server should use `process.env.PORT || 5000`

## 🚀 **Quick Fixes:**

### **Fix 1: Restart the Service**
1. Go to Render dashboard
2. Click on your service
3. Click "Manual Deploy" → "Deploy latest commit"

### **Fix 2: Check Logs**
1. In Render dashboard, go to "Logs" tab
2. Look for error messages
3. Common errors:
   - "Module not found"
   - "Port already in use"
   - "Environment variable missing"

### **Fix 3: Verify Configuration**
Make sure your `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## 🔧 **Backend Health Check:**

### **Expected Response from `/api/health`:**
```json
{
  "status": "OK",
  "message": "Face Swap API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **If Backend is Down:**
1. **Check Render logs** for error messages
2. **Restart the service** from Render dashboard
3. **Verify environment variables** are set
4. **Check if service is sleeping** (free tier issue)

## 🎯 **Frontend Configuration:**

Your frontend is configured to call:
- **Backend URL:** `https://football-face-swap-app.onrender.com`
- **Health Check:** `https://football-face-swap-app.onrender.com/api/health`
- **Face Swap API:** `https://football-face-swap-app.onrender.com/api/faceswap`

## 🆘 **If Still Not Working:**

1. **Check Render Status:** https://status.render.com
2. **Try Alternative Backend:** Deploy to Railway or Heroku
3. **Use Local Backend:** Run `npm start` in backend folder for testing

## 📞 **Next Steps:**

1. **Go to Render dashboard** and check your service status
2. **Look at the logs** to see what's wrong
3. **Restart the service** if needed
4. **Test the health endpoint** in your browser

**The most common issue is that Render free tier services go to sleep after inactivity. Try accessing the health endpoint to wake it up!**
