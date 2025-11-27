import axios from 'axios';

const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID || '';
const SOUNDCLOUD_API_URL = 'https://api-v2.soundcloud.com';

// Cache for rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // SoundCloud may need slower requests

/**
 * Check if SoundCloud credentials are configured
 * Note: SoundCloud's official API is limited. Client ID can be obtained from SoundCloud's web app.
 */
const checkCredentials = (): void => {
  if (!SOUNDCLOUD_CLIENT_ID || SOUNDCLOUD_CLIENT_ID === '') {
    throw new Error('SoundCloud API credentials are not configured. Please add SOUNDCLOUD_CLIENT_ID to your .env file.');
  }
};

/**
 * Map mood to SoundCloud search query
 */
const getMoodBasedQuery = (mood: string): string => {
  // Mood mapping - for sad, recommend happy/upbeat music (opposite)
  const moodMap: { [key: string]: string } = {
    sad: 'happy upbeat', // Opposite mood
    happy: 'happy energetic',
    excited: 'energetic dance',
    relaxed: 'calm peaceful',
    focused: 'instrumental ambient',
  };

  return moodMap[mood.toLowerCase()] || 'chill';
};

/**
 * Get SoundCloud client ID from the web (fallback method)
 * This tries to extract a client ID from SoundCloud's web app
 */
const getSoundCloudClientId = async (): Promise<string> => {
  try {
    // Try to get client ID from SoundCloud's web app
    // This is a workaround since SoundCloud API requires client ID
    const response = await axios.get('https://soundcloud.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Extract client ID from script tags (common pattern)
    const clientIdMatch = response.data.match(/"client_id":"([^"]+)"/);
    if (clientIdMatch && clientIdMatch[1]) {
      return clientIdMatch[1];
    }

    throw new Error('Could not extract SoundCloud client ID');
  } catch (error) {
    throw new Error('SoundCloud client ID is required. Please set SOUNDCLOUD_CLIENT_ID in .env or obtain it from SoundCloud.');
  }
};

/**
 * Search for tracks on SoundCloud
 */
export const searchTracks = async (query: string, limit: number = 20): Promise<any[]> => {
  try {
    // Use provided client ID or try to get it dynamically
    let clientId = SOUNDCLOUD_CLIENT_ID;
    
    if (!clientId || clientId === '') {
      console.log('⚠️ No SOUNDCLOUD_CLIENT_ID provided, attempting to fetch dynamically...');
      try {
        clientId = await getSoundCloudClientId();
      } catch (error) {
        throw new Error('SoundCloud API requires a client ID. Please add SOUNDCLOUD_CLIENT_ID to your .env file. You can find client IDs in SoundCloud web app requests.');
      }
    }

    // Simple rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - (now - lastRequestTime)));
    }
    lastRequestTime = Date.now();

    console.log('🔍 Searching SoundCloud for:', query);

    // SoundCloud v2 API endpoint for search
    const response = await axios.get(`${SOUNDCLOUD_API_URL}/search/tracks`, {
      params: {
        q: query,
        client_id: clientId,
        limit: limit,
        linked_partitioning: 1,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.data.collection || response.data.collection.length === 0) {
      console.warn('SoundCloud search returned no results');
      return [];
    }

    // Format SoundCloud tracks
    const tracks = response.data.collection.map((track: any) => {
      return {
        id: track.id.toString(),
        title: track.title,
        artist: track.user?.username || track.user?.full_name || 'Unknown Artist',
        description: track.description || '',
        artwork: track.artwork_url || track.user?.avatar_url || '',
        duration: track.duration || 0,
        playCount: track.playback_count || 0,
        likeCount: track.likes_count || 0,
        permalink: track.permalink_url || `https://soundcloud.com/${track.user?.permalink}/${track.permalink}`,
        streamUrl: track.stream_url ? `${track.stream_url}?client_id=${clientId}` : null,
        downloadable: track.downloadable || false,
        genre: track.genre || '',
        createdAt: track.created_at,
      };
    });

    console.log(`✅ Found ${tracks.length} SoundCloud tracks`);
    return tracks;
  } catch (error: any) {
    console.error('Error searching SoundCloud tracks:', error.response?.data || error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('SoundCloud API authentication failed. Please check your SOUNDCLOUD_CLIENT_ID or obtain a valid client ID.');
    } else if (error.response?.status === 429) {
      throw new Error('SoundCloud API rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to search tracks on SoundCloud: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get music tracks based on mood using SoundCloud
 */
export const getTracksByMood = async (mood: string, limit: number = 20): Promise<any[]> => {
  try {
    const query = getMoodBasedQuery(mood);
    const tracks = await searchTracks(query, limit);

    // Format tracks to match frontend Track interface
    return tracks.map((track: any) => {
      return {
        id: track.id,
        name: track.title,
        artists: track.artist,
        album: track.genre || 'SoundCloud',
        albumImage: track.artwork || '',
        previewUrl: track.streamUrl, // SoundCloud stream URL (requires client ID)
        externalUrl: track.permalink,
        duration: track.duration,
        popularity: track.playCount || 0,
        source: 'soundcloud', // Track source
      };
    });
  } catch (error: any) {
    console.error('Error getting tracks by mood from SoundCloud:', error);
    throw error;
  }
};

/**
 * Get track recommendations based on mood (same as getTracksByMood for SoundCloud)
 */
export const getRecommendationsByMood = async (
  mood: string,
  limit: number = 20
): Promise<any[]> => {
  // SoundCloud doesn't have a recommendations API like Spotify
  // So we use search with mood-based queries
  return await getTracksByMood(mood, limit);
};

