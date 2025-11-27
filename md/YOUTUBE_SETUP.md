# YouTube API Setup Guide

To enable YouTube integration for fetching music videos based on mood, you need to configure YouTube API credentials.

## Steps to Get YouTube API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: `MR App Music` (or any name)
   - Click "Create"

3. **Enable YouTube Data API v3**
   - In the project, go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key (it will look like: `AIzaSy...`)

5. **Restrict API Key (Optional but Recommended)**
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Click "Save"

6. **Add Credentials to .env File**
   
   In your `backend/` directory, open or create `.env` file and add:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

7. **Restart Your Backend Server**
   
   After adding the API key, restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

## Important Notes

- **Free Quota**: YouTube Data API v3 provides 10,000 units per day for free
- **Rate Limits**: Each search request costs 100 units
- **Video Category**: The app searches in the "Music" category (ID: 10) by default
- **No Audio Preview**: YouTube videos need to be opened in a new tab or embedded. The app opens them in a new tab for playback.

## Troubleshooting

### "YouTube API credentials are not configured"
- Make sure you created a `.env` file in the `backend` directory
- Verify that `YOUTUBE_API_KEY` is set correctly
- Restart your backend server after adding credentials

### "YouTube API quota exceeded"
- You've exceeded your daily quota (10,000 units/day)
- Wait until the next day or request a quota increase in Google Cloud Console
- Each search costs 100 units, so you can make ~100 searches per day for free

### "Invalid YouTube API key"
- Double-check that you copied the API key correctly
- Verify the API key is enabled in Google Cloud Console
- Make sure YouTube Data API v3 is enabled for your project

### "Failed to search videos on YouTube"
- Check your internet connection
- Verify the YouTube Data API v3 is enabled in your Google Cloud project
- Check if your API key has proper restrictions/permissions

## Testing the Connection

You can test your YouTube API key by making a direct API call:

```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=happy+music&type=video&videoCategoryId=10&maxResults=5&key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual API key. You should receive a JSON response with video data.

