# Spotify API Setup Guide

To enable Spotify integration for fetching music tracks based on mood, you need to configure Spotify API credentials.

## Steps to Get Spotify API Credentials

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create a New App**
   - Click "Create an App"
   - Fill in the app details:
     - **App name**: `Music Recommendation App` (or any name)
     - **App description**: `AI-powered music recommendation based on mood`
     - **Redirect URI**: `http://localhost:3000/callback` (or leave empty for now)
     - Accept the terms and click "Save"

3. **Get Your Credentials**
   - Once the app is created, you'll see:
     - **Client ID**
     - **Client Secret** (click "Show" to reveal it)

4. **Add Credentials to .env File**
   
   Create a `.env` file in the `backend` directory (if it doesn't exist) and add:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

5. **Test the Connection**
   
   Run the test script to verify everything works:
   ```bash
   cd backend
   node test-spotify.js
   ```
   
   You should see:
   - ✅ Credentials found
   - ✅ Access token obtained!
   - ✅ Found X tracks!
   - ✅ Spotify API is working correctly!

## Important Notes

- **Client Credentials Flow**: This app uses the Client Credentials flow, which is perfect for server-to-server communication.
- **Rate Limits**: Spotify API has rate limits. If you exceed them, you'll need to wait before making more requests.
- **Preview URLs**: Not all tracks have preview URLs. The app handles this gracefully.
- **Market Parameter**: The app uses 'US' as the default market. You can modify this in `spotify.service.ts` if needed.

## Troubleshooting

### "Spotify API credentials are not configured"
- Make sure you created a `.env` file in the `backend` directory
- Verify that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set
- Restart your backend server after adding credentials

### "Invalid Spotify credentials"
- Double-check that you copied the Client ID and Secret correctly
- Make sure there are no extra spaces or quotes in your `.env` file
- Verify your app is still active in the Spotify Developer Dashboard

### "Failed to authenticate with Spotify"
- Check your internet connection
- Verify Spotify's API is not experiencing issues
- Try regenerating your Client Secret in the Spotify Dashboard

### "Spotify API rate limit exceeded"
- You've made too many requests in a short time
- Wait a few minutes and try again
- Consider implementing request caching in production

