# Environment Variables Setup Guide

This guide will help you set up all the required environment variables for the MR App backend.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values** in the `.env` file

3. **Never commit `.env`** to version control - it's already in `.gitignore`

## Required Environment Variables

### 1. Server Configuration

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

- `PORT`: Port number for the backend server (default: 5000)
- `NODE_ENV`: Environment mode - `development` or `production`
- `FRONTEND_URL`: Your frontend application URL (for CORS and OAuth redirects)
- `BACKEND_URL`: Your backend server URL (for OAuth callbacks)

### 2. Database Configuration

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mr_app?retryWrites=true&w=majority
```

- Get this from your MongoDB Atlas dashboard
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- Replace `username`, `password`, and `cluster` with your actual values

### 3. JWT Authentication

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
```

- `JWT_SECRET`: A strong random string (minimum 32 characters)
  - Generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Or use an online generator: https://www.grc.com/passwords.htm
- `JWT_EXPIRE`: Token expiration time (e.g., `7d`, `24h`, `1h`)

### 4. Google OAuth (Required for Google Sign-in)

```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

- See `GOOGLE_OAUTH_SETUP.md` for detailed instructions
- Get these from: https://console.cloud.google.com/

### 5. Music Service APIs

#### YouTube Data API v3

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

- See `YOUTUBE_SETUP.md` for detailed instructions
- Get API key from: https://console.cloud.google.com/

#### SoundCloud API

```env
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here
```

- See `SOUNDCLOUD_SETUP.md` for detailed instructions
- Extract client ID from SoundCloud website network requests

#### Spotify API

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

- See `SPOTIFY_SETUP.md` for detailed instructions
- Get these from: https://developer.spotify.com/dashboard

### 6. Music Service Configuration

```env
DEFAULT_MUSIC_SERVICE=youtube
```

- Options: `youtube`, `soundcloud`, or `spotify`
- This is the default service used when no service parameter is specified

## Generating Secure Secrets

### Generate JWT Secret

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Online Generator:**
Visit: https://www.grc.com/passwords.htm

## Production Checklist

When deploying to production:

- [ ] Change `NODE_ENV` to `production`
- [ ] Use strong, unique secrets (especially `JWT_SECRET`)
- [ ] Update `FRONTEND_URL` and `BACKEND_URL` to production URLs
- [ ] Use production MongoDB URI
- [ ] Ensure all API keys are production-ready
- [ ] Enable HTTPS in production
- [ ] Review and restrict API key permissions
- [ ] Set up proper CORS configuration
- [ ] Never expose `.env` file publicly
- [ ] Use a secrets management service (AWS Secrets Manager, Azure Key Vault, etc.) for production

## Security Best Practices

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Use different secrets** for development and production
3. **Rotate secrets regularly**, especially if exposed
4. **Use environment-specific files**: `.env.development`, `.env.production`
5. **Restrict API key permissions** in service dashboards
6. **Monitor API usage** for unexpected activity
7. **Use HTTPS** in production for all API calls
8. **Keep `.env.example`** updated but without real secrets

## Troubleshooting

### Error: "MONGODB_URI is not defined"
- Make sure `.env` file exists in the `backend/` directory
- Check that `MONGODB_URI` is set in `.env`
- Restart your server after adding variables

### Error: "JWT_SECRET is not defined"
- Add `JWT_SECRET` to your `.env` file
- Generate a strong secret (see above)
- Restart your server

### OAuth not working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that redirect URIs match in Google Console
- Ensure `FRONTEND_URL` and `BACKEND_URL` are correct

### Music APIs not working
- Verify API keys are correct
- Check API quotas/limits
- Ensure API keys have proper permissions
- See individual setup guides for each service

## File Structure

```
backend/
├── .env              # Your actual environment variables (DO NOT COMMIT)
├── .env.example      # Template file (safe to commit)
├── ENV_SETUP.md      # This file
└── ...
```

## Need Help?

- Check individual setup guides:
  - `GOOGLE_OAUTH_SETUP.md`
  - `YOUTUBE_SETUP.md`
  - `SOUNDCLOUD_SETUP.md`
  - `SPOTIFY_SETUP.md`
- Review error messages in server logs
- Ensure all required variables are set
- Verify API credentials in service dashboards

