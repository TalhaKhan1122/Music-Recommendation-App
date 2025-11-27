# Debug Google OAuth - Step by Step

## Step 1: Verify Backend Server is Running

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:5000
```

**If server is not running, start it first!**

## Step 2: Check .env File

```bash
cd backend
cat .env | grep GOOGLE
```

Should show:
```
GOOGLE_CLIENT_ID=913024830948-h555rh9gci1jsqog4fttcq5jkgjtuea4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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ss
```

## Step 3: Verify Environment Variables are Loaded

When you start the backend, you should see at the top:
```
🔍 Environment Variables Status:
   GOOGLE_CLIENT_ID: ✅ Set
   GOOGLE_CLIENT_SECRET: ✅ Set
   ...
```

**If you see "❌ Missing", the .env file is not being loaded!**

## Step 4: Test the Endpoint Manually

Open browser and go to:
```
http://localhost:5000/api/auth/google
```

**Expected:** You should be redirected to Google login page

**If you see an error message:**
- Copy the exact error message
- Check backend console logs

## Step 5: Check Browser Console

1. Open your frontend app
2. Open DevTools (F12)
3. Go to Console tab
4. Click "Sign in with Google"
5. Check for any errors

## Step 6: Check Backend Console Logs

When you click the button, you should see:
```
🔍 Checking Google OAuth configuration...
GOOGLE_CLIENT_ID exists: true
GOOGLE_CLIENT_SECRET exists: true
...
✅ Generating Google OAuth authorization URL...
🔗 Redirecting to Google OAuth: https://accounts.google.com/...
```

**If you see "❌ Google OAuth credentials missing!", the .env is not loaded.**

## Common Solutions

### Solution 1: Restart Backend Server
**CRITICAL:** After creating/updating `.env`, you MUST restart the backend!

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

### Solution 2: Verify .env File Location
Make sure `.env` is in the `backend/` directory, NOT in `backend/src/`

```
backend/
├── .env          ← Should be here
├── src/
└── package.json
```

### Solution 3: Check File Encoding
The `.env` file should be UTF-8 encoded with no BOM (Byte Order Mark)

### Solution 4: Verify No Extra Spaces
```env
# ✅ CORRECT
GOOGLE_CLIENT_ID=913024830948-h555rh9gci1jsqog4fttcq5jkgjtuea4.apps.googleusercontent.com

# ❌ WRONG (no spaces around =)
GOOGLE_CLIENT_ID = 913024830948-h555rh9gci1jsqog4fttcq5jkgjtuea4.apps.googleusercontent.com
```

### Solution 5: Check Google Cloud Console
1. Verify redirect URI: `http://localhost:5000/api/auth/google/callback`
2. Must match EXACTLY (no trailing slashes, same protocol)

## Still Not Working?

Run the test script:
```bash
cd backend
node test-google-oauth.js
```

Then share:
1. Output of test script
2. Backend console logs when you click the button
3. Browser console errors (if any)
4. Exact error message you see

