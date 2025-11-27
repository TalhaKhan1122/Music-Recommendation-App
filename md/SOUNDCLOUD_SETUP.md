# SoundCloud API Setup Guide

To enable SoundCloud integration for fetching music tracks based on mood, you need to configure SoundCloud API credentials.

## Important Note

⚠️ **SoundCloud's official API is limited and client IDs change frequently.** The SoundCloud API v2 is not publicly documented and client IDs are typically extracted from SoundCloud's web application.

## Method 1: Extract Client ID from SoundCloud Web App (Recommended)

1. **Open SoundCloud in your browser**
   - Visit: https://soundcloud.com
   - Open browser Developer Tools (F12)
   - Go to "Network" tab
   - Filter by "Fetch/XHR" or "XHR"
   - Interact with SoundCloud (search for a song, play something)
   - Look for API requests to `api-v2.soundcloud.com`
   - In the request URL, you'll see a `client_id` parameter
   - Copy that `client_id` value

2. **Add to .env file**
   
   In your `backend/` directory, open or create `.env` file and add:
   ```
   SOUNDCLOUD_CLIENT_ID=your_extracted_client_id_here
   ```

3. **Restart Your Backend Server**
   
   After adding the client ID, restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

## Method 2: Use SoundCloud App Credentials (If Available)

If you have a SoundCloud app registered:

1. **Get Client ID from SoundCloud App**
   - Log in to SoundCloud
   - Navigate to your app settings (if you have one registered)
   - Copy the Client ID

2. **Add to .env file**
   ```
   SOUNDCLOUD_CLIENT_ID=your_client_id_here
   ```

## Method 3: Dynamic Client ID (Fallback)

If you don't set `SOUNDCLOUD_CLIENT_ID` in your `.env`, the service will attempt to automatically extract a client ID from SoundCloud's web app. However, this method is less reliable and may fail if SoundCloud changes their structure.

## Troubleshooting

### "SoundCloud API credentials are not configured"
- Make sure you created a `.env` file in the `backend` directory
- Verify that `SOUNDCLOUD_CLIENT_ID` is set correctly
- Restart your backend server after adding credentials

### "SoundCloud API authentication failed"
- The client ID may be expired or invalid
- Extract a fresh client ID from SoundCloud's web app
- Client IDs can change, so you may need to update it periodically

### "SoundCloud API rate limit exceeded"
- SoundCloud has rate limits on their API
- Wait a few minutes before trying again
- Consider caching results to reduce API calls

### "Failed to search tracks on SoundCloud"
- Check your internet connection
- Verify the client ID is still valid
- SoundCloud may have changed their API structure
- Check browser console/network tab for the latest client ID format

## Important Limitations

1. **Client ID Expiry**: Client IDs extracted from SoundCloud's web app may expire or change
2. **Rate Limits**: SoundCloud enforces rate limits on API requests
3. **No Official API**: SoundCloud's API v2 is not officially documented
4. **Stream URLs**: Stream URLs require authentication and may expire

## Alternative: Using SoundCloud Scraper Libraries

If you prefer a more stable solution, consider using npm packages like:
- `soundcloud-scraper` - For scraping SoundCloud tracks
- `soundcloud-downloader` - Alternative downloader

These require additional setup but may be more reliable than direct API access.

## Testing the Connection

You can test your SoundCloud integration by checking the backend logs when making a music request. Look for:
- `🔍 Searching SoundCloud for: [query]`
- `✅ Found X SoundCloud tracks`

If you see errors, check that:
1. Your `SOUNDCLOUD_CLIENT_ID` is valid
2. The client ID hasn't expired
3. Your internet connection is stable

