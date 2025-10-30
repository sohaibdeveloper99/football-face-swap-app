# 🔄 Update Railway URLs for Firebase Hosting

## ✅ What Needs to Be Updated

Since you've deployed your frontend to **Firebase Hosting inclusivereh**, you need to update the Railway backend configuration to allow requests from your new Firebase domain.

---

## 🌐 Your Firebase Hosting URL

After deploying to Firebase, your app will be available at:
- **Primary:** `https://rivalkit-85fd6.web.app`
- **Alternate:** `https://rivalkit-85fd6.firebaseapp.com`

---

## 📝 Step 1: Update Railway Environment Variable

### Go to Railway Dashboard
1. Visit: https://railway.app
2. Click on your backend service (football-face-swap-app)
3. Go to the **"Variables"** tab

### Update FRONTEND_URL
1. Find the variable: `FRONTEND_URL`
2. Click **Edit** or **Update**
3. Change the value to:
   ```
   https://rivalkit-85fd6.web.app
   ```
4. Click **Save**

### Add Multiple Domains (Optional but Recommended)
If you want to support both Firebase domains, add:
```
FRONTEND_URL=https://rivalkit-85fd6.web.app,https://rivalkit-85fd6.firebaseapp.com
```

**Note:** The backend code is configured to accept multiple origins, so you can also add them separately if Railway supports multiple values.

---

## ✅ Step 2: Verify Backend CORS Configuration

The backend code in `backend/server.js` is already configured to:
- ✅ Accept requests from `FRONTEND_URL` environment variable
- ✅ Allow all origins (as a fallback)
- ✅ Support multiple frontend URLs

**Current CORS configuration:**
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
这个 'https://localhost流动:3000'
];
```

**Note:** The current code allows all origins (`callback(null, true)`), but it's still good practice to set `FRONTEND_URL` for logging and future security.

---

## 🧪 Step 3: Test the Connection

After updating the Railway variable:

1. **Railway will automatically redeploy** (or trigger a manual redeploy)
2. **Test your Firebase app:**
   - Go to: `https://rivalkit-85fd6.web.app`
   - Try the face swap feature
   - Check browser console for any CORS errors

3. **If you see CORS errors:**
   - Make sure Railway has redeployed
   - Check that `FRONTEND_URL` is set correctly in Railway
   - Verify the backend is running: Visit your Railway backend URL + `/api/health`

---

## 📊 Environment Variables Summary

### Railway Backend Variables:
| Variable | Current Value | New Value |
|----------|--------------|-----------|
| `FRONTEND_URL` | `http://localhost:3000` | `https://rivalkit-85fd6.web.app` |
| `NODE_ENV` | `production` | Keep as is |
| `PORT` | `5000` | Keep as is |
| `FACEMINT_API_KEY` | `3f1032f1-a2b2-11f0-97d6-e96778ed3e95` | Keep as is |

---

## 🔍 Verify Backend Status

After updating, check your backend health:
```
https://your-railway-app.up.railway.app/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Face Swap API is running"
}
```

---

## ⚠️ Important Notes

1. **Local Development:** 
   - If you're still developing locally, keep `http://localhost:3000` in your local `.env` file
   - The Railway variable only affects the deployed backend

2. **Multiple Environments:**
   - Railway uses the `FRONTEND_URL` from environment variables
   - Your local backend can still use `http://localhost:3000` from `config.env`

3. **Backend URL in Frontend:**
   - The frontend code uses: `https://football-face-swap-app-production-3324.up.railway.app`
   - This doesn't need to change unless your Railway backend URL changed

---

## ✅ Quick Checklist

- [ ] Update `FRONTEND_URL` in Railway to `https://rivalkit-85fd6.web.app`
- [ ] Wait for Railway to redeploy
- [ ] Test face swap feature on Firebase hosting
- [ ] Check browser console for errors
- [ ] Verify backend health endpoint works

---

## 🎉 You're Done!

Once you update the Railway variable, your Firebase-hosted frontend will be able to communicate with your Railway backend without CORS issues!

