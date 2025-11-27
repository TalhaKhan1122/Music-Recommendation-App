# Google OAuth Troubleshooting Guide

If Google login/signup is not working, follow these steps to diagnose and fix the issue.

## Common Issues and Solutions

### 1. "Google OAuth is not configured" Error

**Problem:** Backend returns 503 with message "Google OAuth is not configured"

**Solution:**
1. Make sure `.env` file exists in the `backend/` directory
2. Add the following to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```
3. Restart your backend server after adding credentials

### 2. "redirect_uri_mismatch" Error

**Problem:** Google returns error about redirect URI mismatch

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   (Replace with your production URL in production)
5. Save changes
6. Wait a few minutes for changes to propagate
7. Try again

### 3. OAuth Flow Starts but Callback Fails

**Symptoms:**
- Clicking Google button redirects to Google
- After authorizing, you get redirected back but see an error

**Check:**
1. **Backend logs** - Look for error messages in your backend console
2. **Frontend console** - Check browser console for errors
3. **Network tab** - Check if the callback request is successful

**Common causes:**
- MongoDB connection issue
- Missing environment variables
- Invalid JWT secret
- Database schema mismatch

### 4. Token Received but User Not Logged In

**Symptoms:**
- Redirect happens successfully
- Token is in localStorage
- But user is not authenticated

**Solution:**
1. Check browser console for errors
2. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
3. Make sure `/auth/callback` route exists in frontend
4. Check if AuthContext is properly initialized

### 5. CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests fail with CORS policy errors

**Solution:**
1. Make sure backend has CORS enabled (should already be enabled)
2. Check `FRONTEND_URL` in backend `.env` matches your frontend URL
3. Verify backend is running on correct port

### 6. "Invalid Client" or "Invalid Grant" Errors

**Problem:** Google returns invalid client or invalid grant error

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Make sure there are no extra spaces in `.env` file
3. Check that credentials match exactly what's in Google Console
4. If credentials were recently regenerated, restart backend server

## Debugging Steps

### Step 1: Verify Environment Variables

Check that all required variables are set in `backend/.env`:

```bash
# In backend directory
cat .env | grep GOOGLE
```

Should show:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Step 2: Check Backend Logs

Start backend server and watch for logs:

```bash
cd backend
npm run dev
```

When you click "Sign in with Google", you should see:
- `🔐 Exchanging authorization code for tokens...`
- `✅ Tokens received, verifying ID token...`
- `👤 User info received: ...`
- `✅ JWT token generated, redirecting to frontend...`

If you see errors, they will indicate the problem.

### Step 3: Check Frontend Console

Open browser DevTools (F12) and check:
- **Console tab**: For any JavaScript errors
- **Network tab**: For failed requests
- **Application tab**: Check if token is stored in localStorage

### Step 4: Verify Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Check OAuth consent screen is configured
3. Verify redirect URI matches exactly: `http://localhost:5000/api/auth/google/callback`
4. Check that test users are added (if in testing mode)

### Step 5: Test OAuth Flow Manually

1. Visit: `http://localhost:5000/api/auth/google`
2. You should be redirected to Google
3. After authorizing, you should be redirected back
4. Check the URL for `token` and `success` parameters

## Quick Checklist

- [ ] `.env` file exists in `backend/` directory
- [ ] `GOOGLE_CLIENT_ID` is set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `.env`
- [ ] `FRONTEND_URL` matches frontend URL (default: `http://localhost:5173`)
- [ ] `BACKEND_URL` matches backend URL (default: `http://localhost:5000`)
- [ ] Backend server is running
- [ ] Redirect URI is added in Google Console
- [ ] OAuth consent screen is configured
- [ ] No typos in environment variables
- [ ] Backend server restarted after adding `.env` variables

## Still Not Working?

1. **Clear browser cache and cookies**
2. **Check MongoDB connection** - make sure database is accessible
3. **Verify JWT_SECRET is set** - required for token generation
4. **Check backend/frontend URLs** - must match exactly (including protocol http/https)
5. **Review backend logs** - most errors will be logged there
6. **Test in incognito mode** - to rule out browser extension interference

## Getting More Help

If issues persist, provide:
1. Backend logs (with error messages)
2. Browser console errors
3. Network request details (from DevTools)
4. Environment variable configuration (without actual secrets)
5. Steps to reproduce the issue

