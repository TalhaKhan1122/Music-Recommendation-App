# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your MR App.

## Steps to Configure Google OAuth

### 1. Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### 2. Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "People API"
3. Click on it and click **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: `MR App`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip scopes (we'll add them in the client ID)
   - Add test users if needed (for development)
   - Click **Save**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `MR App Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:5000` (backend, for callback)
     - Add your production URLs when deploying
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (backend callback)
     - `http://localhost:5173/auth/callback` (frontend callback, optional)
   - Click **Create**
   - **Copy your Client ID and Client Secret** (you'll need these)

### 4. Add Credentials to Backend `.env` File

In your `backend/` directory, open or create `.env` file and add:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### 5. Add Client ID to Frontend (Optional)

If you want to use Google Sign-In button on the frontend (alternative method), add to `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 6. Restart Your Servers

After adding credentials, restart both backend and frontend servers:

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## How It Works

### OAuth Flow

1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User grants permission
5. Google redirects back to `/api/auth/google/callback` with authorization code
6. Backend exchanges code for user info and creates/updates user
7. Backend generates JWT token
8. Backend redirects to frontend `/auth/callback?token=...&success=true`
9. Frontend stores token and redirects to dashboard

### User Account Linking

- If a user signs up with email/password first, then logs in with Google using the same email, the accounts are automatically linked
- The Google account will be linked to the existing account
- Users can login with either email/password or Google OAuth after linking

## Testing

1. Start your backend server: `cd backend && npm run dev`
2. Start your frontend server: `cd frontend && npm run dev`
3. Go to `http://localhost:5173`
4. Click "Sign in" or "Sign up"
5. Click "Sign in with Google" or "Sign up with Google"
6. You should be redirected to Google's consent screen
7. After granting permission, you should be redirected back and logged in

## Troubleshooting

### "Google OAuth is not configured"
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `backend/.env`
- Restart your backend server after adding credentials

### "redirect_uri_mismatch" Error
- Check that your redirect URI in Google Cloud Console matches exactly:
  - `http://localhost:5000/api/auth/google/callback`
- Make sure there are no trailing slashes or typos
- The redirect URI must be added in Google Cloud Console → Credentials → Your OAuth Client

### "access_denied" Error
- User may have denied permission on the consent screen
- Check OAuth consent screen configuration
- Make sure test users are added if in testing mode

### "invalid_client" Error
- Check that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure they match the OAuth client ID in Google Cloud Console
- Verify there are no extra spaces in the `.env` file

### Frontend Redirect Issues
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that the `/auth/callback` route exists in your frontend router

## Production Deployment

When deploying to production:

1. Update Authorized JavaScript origins and redirect URIs in Google Cloud Console:
   - Add your production frontend URL
   - Add your production backend URL
2. Update `.env` files:
   ```env
   FRONTEND_URL=https://your-production-frontend.com
   BACKEND_URL=https://your-production-backend.com
   ```
3. Make sure OAuth consent screen is published (not in testing mode) if you want public access

## Security Notes

- Never commit `.env` files to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure
- Use HTTPS in production
- Regularly rotate OAuth credentials if compromised

