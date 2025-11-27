# PowerShell script to create .env file with Google credentials
# Run this script: .\create-env.ps1

$envContent = @"
# ============================================
# MR APP Backend Environment Variables
# ============================================

# ============================================
# Server Configuration
# ============================================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# ============================================
# Database Configuration
# ============================================
MONGODB_URI=mongodb+srv://tk42100678_db_user:dzGuoZjJJot7qRFX@cluster0.bet9lh6.mongodb.net/mr_app?retryWrites=true&w=majority

# ============================================
# JWT Authentication
# ============================================
# Generate a strong random string for JWT_SECRET
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d

# ============================================
# Google OAuth Configuration
# ============================================
GOOGLE_CLIENT_ID=913024830948-h555rh9gci1jsqog4fttcq5jkgjtuea4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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ss

# ============================================
# Music Service APIs
# ============================================

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here

# SoundCloud API
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here

# Spotify API
SPOTIFY_CLIENT_ID=2abe26361a7d415a9dd3a4939f2dfea5
SPOTIFY_CLIENT_SECRET=1cf272348f0b4cb4835c2b2ebc58bfb2

# Default music service
DEFAULT_MUSIC_SERVICE=youtube
"@

$envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "⚠️  Please update JWT_SECRET with a secure random string" -ForegroundColor Yellow
Write-Host "   Run: node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor Cyan

