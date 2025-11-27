# 🚀 START HERE - Fix Google Login

## ❗ CRITICAL: Backend Server Must Be Running!

The backend server is **NOT running**. You need to start it first!

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

**Wait until you see:**
```
🚀 Server is running on http://localhost:5000
```

### Step 2: Check Environment Variables

When the server starts, you should see:
```
🔍 Environment Variables Status:
   GOOGLE_CLIENT_ID: ✅ Set
   GOOGLE_CLIENT_SECRET: ✅ Set
   ...
```

**If you see "❌ Missing"**, the `.env` file might not be in the right location.

### Step 3: Start Frontend (in another terminal)

```bash
cd frontend
npm run dev
```

### Step 4: Test Google Login

1. Open browser: `http://localhost:5173`
2. Click "Sign in"
3. Click "Sign in with Google"
4. **Watch the backend console** for logs

## 🔍 What to Check

When you click "Sign in with Google", the backend console should show:
```
🔍 Checking Google OAuth configuration...
GOOGLE_CLIENT_ID exists: true
GOOGLE_CLIENT_SECRET exists: true
✅ Generating Google OAuth authorization URL...
🔗 Redirecting to Google OAuth: https://accounts.google.com/...
```

## ❌ Common Issues

### "Cannot connect to backend server"
- **Fix**: Start the backend server! Run `npm run dev` in backend directory

### "GOOGLE_CLIENT_ID: ❌ Missing"
- **Fix**: Make sure `.env` file exists in `backend/` directory
- Restart backend server after creating/updating `.env`

### "redirect_uri_mismatch" error
- **Fix**: Add `http://localhost:5000/api/auth/google/callback` in Google Cloud Console

### Nothing happens when clicking button
- Check browser console (F12) for errors
- Check backend console for errors
- Verify both servers are running

## 📋 Quick Checklist

Before testing, make sure:

- [ ] Backend server is running (`npm run dev` in backend/)
- [ ] Frontend server is running (`npm run dev` in frontend/)
- [ ] `.env` file exists in `backend/` directory
- [ ] Backend console shows "✅ Set" for Google credentials
- [ ] No errors in backend console
- [ ] No errors in browser console

## 🆘 Need More Help?

Run these commands to check configuration:

```bash
cd backend
node test-google-oauth.js
node test-google-endpoint.js
```

Then share:
1. Backend console output when you start the server
2. Backend console output when you click "Sign in with Google"
3. Browser console errors (if any)

