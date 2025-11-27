# Environment Variables Setup

## Quick Start

1. **Create `.env` file** in the `backend/` directory:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   
   # Linux/Mac
   cp .env.example .env
   ```

2. **Open `.env` file** and fill in your actual values

3. **Never commit `.env`** - it's already in `.gitignore`

## Required Variables

See `.env.example` for the complete list of required environment variables.

### Minimum Required (to run the app):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong random string)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
- `BACKEND_URL` - Backend URL for OAuth callbacks

### Optional (for specific features):

- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `YOUTUBE_API_KEY` - For YouTube music integration
- `SOUNDCLOUD_CLIENT_ID` - For SoundCloud music integration
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` - For Spotify integration

## Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Detailed Documentation

See `ENV_SETUP.md` for comprehensive documentation on all environment variables.

