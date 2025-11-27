# Music Fetching Flow After Mood Detection

## Complete Flow Diagram

```
1. User detects mood in AI Mode
   └─> AIMode.tsx detects mood (happy, sad, excited, relaxed, focused)
   
2. User clicks "Start Music Based on Mood"
   └─> navigate(`/player?mood=${mood}`)
   
3. Player Component Loads
   └─> useEffect detects mood parameter from URL
   └─> Calls: getTracksByMood(mood, 20, 'recommendations')
   
4. Frontend API Call
   └─> GET /api/music/tracks?mood=happy&limit=20&type=recommendations
   └─> Includes: Authorization: Bearer {token}
   
5. Backend Receives Request
   └─> auth.middleware.ts validates token
   └─> music.controller.ts processes request
   
6. Spotify Service Processing
   ├─> Type: 'recommendations'
   │   └─> getRecommendationsByMood()
   │       ├─> Search for seed tracks based on mood
   │       ├─> Map mood to Spotify audio features:
   │       │   ├─> happy: {valence: 0.8, energy: 0.7, danceability: 0.6}
   │       │   ├─> sad: {valence: 0.8, energy: 0.7} (opposite - uplifting!)
   │       │   ├─> excited: {energy: 0.8, danceability: 0.8}
   │       │   ├─> relaxed: {valence: 0.6, energy: 0.3}
   │       │   └─> focused: {energy: 0.3, instrumentalness: 0.7}
   │       └─> Get recommendations from Spotify API
   │
   └─> Type: 'search'
       └─> getTracksByMood()
           └─> Search tracks using mood keywords:
               ├─> happy: "happy energetic upbeat"
               ├─> sad: "happy upbeat energetic" (opposite!)
               ├─> excited: "energetic upbeat dance"
               ├─> relaxed: "calm peaceful chill"
               └─> focused: "instrumental ambient study"

7. Format Tracks
   └─> Map Spotify track data to frontend format:
       ├─> id, name, artists, album
       ├─> albumImage, previewUrl, externalUrl
       └─> duration, popularity

8. Return to Frontend
   └─> JSON response: { success: true, data: { mood, tracks, count } }
   
9. Player Displays Tracks
   └─> Shows track list
   └─> Auto-selects first track
   └─> User can play preview (if available)
   └─> User can open full track in Spotify
```

## Mood Mapping

### For Recommendations API:
- **Happy** → High valence (0.8), high energy (0.7), danceable (0.6)
- **Sad** → High valence (0.8), high energy (0.7) - **Opposite mood!**
- **Excited** → Very high energy (0.8), very danceable (0.8)
- **Relaxed** → Moderate valence (0.6), low energy (0.3)
- **Focused** → Low energy (0.3), high instrumentalness (0.7)

### For Search API:
- **Happy** → "happy energetic upbeat"
- **Sad** → "happy upbeat energetic" (to lift mood!)
- **Excited** → "energetic upbeat dance"
- **Relaxed** → "calm peaceful chill"
- **Focused** → "instrumental ambient study"

## Data Flow Example

**Request:**
```
GET http://localhost:5000/api/music/tracks?mood=happy&limit=20&type=recommendations
Headers: { Authorization: "Bearer eyJhbGc..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mood": "happy",
    "tracks": [
      {
        "id": "4uLU6hMCjMI75M1A2tKUQC",
        "name": "Happy",
        "artists": "Pharrell Williams",
        "album": "G I R L",
        "albumImage": "https://i.scdn.co/image/...",
        "previewUrl": "https://p.scdn.co/mp3-preview/...",
        "externalUrl": "https://open.spotify.com/track/...",
        "duration": 231333,
        "popularity": 85
      },
      ...
    ],
    "count": 20
  }
}
```

