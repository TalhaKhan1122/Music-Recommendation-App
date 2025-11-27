# Quick Start - Fix Google Login

## ⚠️ IMPORTANT: Restart Backend Server!

The `.env` file has been created, but **you MUST restart your backend server** for it to work!

### Steps:

1. **Stop the backend server** (if running):
   - Press `Ctrl+C` in the terminal running `npm run dev`

2. **Start it again**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Check the console output** - You should see:
   ```
   🔍 Environment Variables Status:
      GOOGLE_CLIENT_ID: ✅ Set
      GOOGLE_CLIENT_SECRET: ✅ Set
      ...
   ✅ Google OAuth credentials loaded
   🔧 OAuth2Client initialized
   ```

4. **If you see "❌ Missing"**:
   - The `.env` file might not be in the right location
   - Make sure it's in `backend/.env` (not `backend/src/.env`)

5. **Test Google Login**:
   - Go to frontend: `http://localhost:5173`
   - Click "Sign in"
   - Click "Sign in with Google"
   - Should redirect to Google

## 🔍 Still Not Working?

Run this test:
```bash
cd backend
node test-google-oauth.js
```

This will tell you if the configuration is correct.

## 📋 Check These:

- [ ] Backend server is running (`npm run dev` in backend directory)
- [ ] `.env` file exists in `backend/` directory
- [ ] Backend console shows "✅ Google OAuth credentials loaded"
- [ ] Google Cloud Console has redirect URI: `http://localhost:5000/api/auth/google/callback`
- [ ] No errors in backend console when clicking button
- [ ] Browser console shows no errors

If all checked and still not working, share the backend console output!

