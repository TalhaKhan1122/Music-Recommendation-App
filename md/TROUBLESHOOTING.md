# Troubleshooting: API Not Running After Mood Detection

## Quick Checklist

1. ✅ **Is the backend server running?**
   - Open a terminal in the `backend` folder
   - Run: `npm run dev`
   - You should see: `🚀 Server is running on http://localhost:5000`

2. ✅ **Is the frontend running?**
   - Open a terminal in the `frontend` folder
   - Run: `npm run dev`
   - You should see the frontend running (usually on port 5173 or 3000)

3. ✅ **Check browser console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for logs starting with:
     - 🎵 Fetching tracks for mood
     - 📡 Making API request to
     - 📥 API Response status

4. ✅ **Check backend console**
   - Look for logs starting with:
     - 🎵 Music API Request received
     - 🔄 Fetching tracks for mood
     - ✅ Successfully fetched X tracks

## Common Issues and Solutions

### Issue 1: "Cannot connect to server"
**Symptoms:**
- Browser console shows: "Cannot connect to server"
- Network tab shows failed requests

**Solution:**
1. Make sure backend is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Verify server is accessible:
   - Open browser: http://localhost:5000/health
   - Should see: `{"status":"OK","message":"Server is running",...}`

### Issue 2: "No authentication token found"
**Symptoms:**
- Browser console shows: "No authentication token found"
- API returns 401 Unauthorized

**Solution:**
1. Make sure you're logged in
2. Check browser localStorage:
   - Open Developer Tools (F12)
   - Go to Application/Storage tab
   - Check if `token` exists in localStorage
3. If no token, log out and log in again

### Issue 3: "Spotify API credentials are not configured"
**Symptoms:**
- Backend console shows: "Spotify API credentials are not configured"
- API returns 503 Service Unavailable

**Solution:**
1. Create `.env` file in `backend` folder
2. Add Spotify credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
3. Restart backend server
4. See `backend/SPOTIFY_SETUP.md` for detailed instructions

### Issue 4: Backend server not starting
**Symptoms:**
- `npm run dev` fails
- MongoDB connection errors

**Solution:**
1. Check MongoDB connection:
   ```bash
   cd backend
   node test-connection.js
   ```
2. Verify `.env` file has MongoDB URI
3. Check internet connection
4. Verify MongoDB Atlas cluster is running

### Issue 5: CORS Errors
**Symptoms:**
- Browser console shows: "CORS policy" errors
- Network tab shows CORS-related errors

**Solution:**
1. Check `backend/src/index.ts` has:
   ```typescript
   app.use(cors());
   ```
2. Verify frontend API URL matches backend URL
3. Check `frontend/.env` has:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

## Debugging Steps

### Step 1: Check Backend Server
```bash
cd backend
npm run dev
```
Expected output:
```
🔄 Connecting to MongoDB...
✅ MongoDB connected successfully
🚀 Server is running on http://localhost:5000
```

### Step 2: Check Frontend Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to AI Mode → Detect Mood → Start Music
4. Look for these logs:
   - `🎵 Fetching tracks for mood: happy`
   - `📡 Making API request to: http://localhost:5000/api/music/tracks?...`
   - `📥 API Response status: 200 OK`

### Step 3: Check Backend Console
When API request is made, you should see:
```
🎵 Music API Request received: { mood: 'happy', limit: '20', type: 'recommendations' }
🔄 Fetching recommendations tracks for mood: happy
✅ Successfully fetched 20 tracks for happy mood
```

### Step 4: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for request to `/api/music/tracks`
5. Check:
   - Status code (should be 200)
   - Request headers (should include `Authorization: Bearer ...`)
   - Response (should have tracks array)

## Testing the API Directly

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"OK",...}`

### Test 2: Music API (requires auth token)
1. Get token from browser localStorage
2. Run:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/music/tracks?mood=happy&limit=5"
```

## Need More Help?

1. Check browser console for detailed error messages
2. Check backend console for server logs
3. Check Network tab for failed requests
4. Verify all environment variables are set correctly

