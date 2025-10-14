# 🔧 API Configuration Guide

## 🎯 **Current Setup:**
Your frontend is now configured to use the **production backend** at:
`https://football-face-swap-app.onrender.com`

## 🔄 **How to Switch Between Environments:**

### **For Production (Current):**
In `src/config/api.js`, set:
```javascript
environment: 'production'
```

### **For Local Development:**
In `src/config/api.js`, set:
```javascript
environment: 'development'
```

## 🚀 **Testing Your App:**

### **1. Start Your Frontend:**
```bash
npm start
```

### **2. Test the Face Swap:**
1. Go to `http://localhost:3000`
2. Upload a target image (jersey/face)
3. Upload your source image (your face)
4. Click "Swap Faces"
5. Your app will now call the live backend at `https://football-face-swap-app.onrender.com`

### **3. Test Admin Panel:**
1. Go to `http://localhost:3000/admin`
2. Login with:
   - **Username:** `admin`
   - **Password:** `football123`

## 🎉 **Your App is Now Live!**

- ✅ **Backend:** `https://football-face-swap-app.onrender.com`
- ✅ **Frontend:** Running on `http://localhost:3000`
- ✅ **API Integration:** Working with live backend

## 🔧 **Files Updated:**
- `src/services/faceSwapService.js` - Main API service
- `src/AdminPanel.js` - Admin panel API calls
- `src/config/api.js` - Centralized configuration

## 🆘 **Troubleshooting:**
- If face swap fails, check the browser console for errors
- Make sure your backend is running at the Render URL
- Test the health endpoint: `https://football-face-swap-app.onrender.com/api/health`
