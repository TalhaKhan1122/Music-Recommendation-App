const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SpotifyEmbedResponse {
  success: boolean;
  data: {
    embedUrl: string;
    html: string;
    type: string;
    id: string;
  };
  error?: string;
}

/**
 * Get Spotify embed HTML for a track/album/playlist
 * @param input - Spotify URL (e.g., "https://open.spotify.com/track/...") or track ID
 * @returns Embed HTML and URL
 */
export const getSpotifyEmbed = async (input: string): Promise<SpotifyEmbedResponse> => {
  console.log('🎵 getSpotifyEmbed called with input:', input);
  
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('❌ No authentication token found in localStorage');
    throw new Error('No authentication token found. Please log in again.');
  }

  const url = `${API_BASE_URL}/music/spotify/embed`;
  console.log('🎵 Making request to:', url);
  console.log('🎵 Request body:', { input });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ input }),
    });

    console.log('🎵 Response status:', response.status, response.statusText);
    const result = await response.json();
    console.log('🎵 Response data:', result);

    if (!response.ok) {
      console.error('❌ API Error Response:', result);
      const error = new Error(result.error || `Failed to get Spotify embed (Status: ${response.status})`);
      (error as any).status = response.status;
      throw error;
    }

    console.log('✅ Spotify embed fetched successfully');
    return result;
  } catch (error: any) {
    console.error('❌ Error in getSpotifyEmbed:', error);
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

