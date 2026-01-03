const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumImage: string;
  previewUrl: string | null;
  externalUrl: string;
  duration: number;
  popularity: number;
  source?: 'spotify' | 'youtube' | 'soundcloud'; // Track source
}

export interface ArtistMetadata {
  id: string;
  name: string;
  image?: string;
  genres?: string[];
  followers?: number;
  popularity?: number;
  spotifyUrl?: string;
  topTracks?: Track[];
  category?: string;
}

export interface FollowedArtistSummary {
  id: string;
  artistId?: string;
  name: string;
  image?: string;
  genres?: string[];
  followers?: number;
  popularity?: number;
  spotifyUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtistShowcaseSection {
  category: string;
  title: string;
  description: string;
  artists: ArtistMetadata[];
  hasMore: boolean;
}

export interface TopArtistsPayload {
  fetchedAt: string;
  limitPerCategory: number;
  totalArtists: number;
  sections: ArtistShowcaseSection[];
}

export interface SpotifyCatalogSearchResult {
  artists: ArtistMetadata[];
  tracks: Track[];
}

interface TopArtistsRequestParams {
  limitPerCategory?: number;
  topTrackLimit?: number;
}

interface SpotifyCatalogSearchParams {
  artistLimit?: number;
  trackLimit?: number;
}

export interface MusicResponse {
  success: boolean;
  data: {
    mood: string;
    tracks: Track[];
    count: number;
  };
  message?: string;
}

export interface FavoriteTrack {
  _id: string;
  user: string;
  trackId: string;
  name: string;
  artists?: string;
  album?: string;
  albumImage?: string;
  externalUrl?: string;
  previewUrl?: string | null;
  source?: string;
  mood?: string;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface BaseApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  [key: string]: unknown;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  trackId: string;
  name: string;
  artists?: string;
  album?: string;
  albumImage?: string;
  externalUrl?: string;
  previewUrl?: string | null;
  source?: string;
  mood?: string;
  addedAt: string;
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: PlaylistTrack[];
}

export interface LyricsSearchResult {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumImage: string;
  previewUrl: string | null;
  externalUrl: string;
  duration: number;
  popularity: number;
  source: 'spotify';
  similarity: number;
  lyricsSnippet?: string;
}

export interface LyricsSearchResponse {
  success: boolean;
  data: {
    tracks: LyricsSearchResult[];
    totalResults: number;
  };
}

const normalizePlaylistDetail = (playlist: any): PlaylistDetail => ({
  id: playlist.id || playlist._id,
  name: playlist.name,
  description: playlist.description,
  trackCount: playlist.trackCount ?? (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0),
  createdAt: playlist.createdAt,
  updatedAt: playlist.updatedAt,
  tracks: Array.isArray(playlist.tracks)
    ? playlist.tracks.map((track: any) => ({
        trackId: track.trackId,
        name: track.name,
        artists: track.artists,
        album: track.album,
        albumImage: track.albumImage,
        externalUrl: track.externalUrl,
        previewUrl: track.previewUrl,
        source: track.source,
        mood: track.mood,
        addedAt: track.addedAt,
      }))
    : [],
});

const ensureAuthToken = (): string => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  return token;
};

const normalizeFollowedArtist = (artist: any): FollowedArtistSummary => ({
  id: artist?.id || artist?.artistId || '',
  artistId: artist?.artistId ?? artist?.id,
  name: artist?.name ?? '',
  image: artist?.image,
  genres: Array.isArray(artist?.genres) ? artist.genres : [],
  followers: artist?.followers,
  popularity: artist?.popularity,
  spotifyUrl: artist?.spotifyUrl,
  createdAt: artist?.createdAt,
  updatedAt: artist?.updatedAt,
});

export const getTopArtistsShowcase = async (
  params: TopArtistsRequestParams = {}
): Promise<TopArtistsPayload> => {
  const token = ensureAuthToken();

  const searchParams = new URLSearchParams();
  if (typeof params.limitPerCategory === 'number') {
    searchParams.set('limitPerCategory', String(params.limitPerCategory));
  }
  if (typeof params.topTrackLimit === 'number') {
    searchParams.set('topTrackLimit', String(params.topTrackLimit));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/music/artists/showcase${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result: BaseApiResponse<TopArtistsPayload> = await response.json();

    if (!response.ok || result.success === false) {
      const message = (result && result.message) || `Failed to fetch Spotify artists (Status: ${response.status})`;
      throw new Error(message);
    }

    return result.data;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

export const searchSpotifyCatalog = async (
  query: string,
  params: SpotifyCatalogSearchParams = {}
): Promise<SpotifyCatalogSearchResult> => {
  const normalized = query.trim();
  if (!normalized) {
    return {
      artists: [],
      tracks: [],
    };
  }

  const token = ensureAuthToken();

  const searchParams = new URLSearchParams({ query: normalized });
  if (typeof params.artistLimit === 'number') {
    searchParams.set('artistLimit', String(params.artistLimit));
  }
  if (typeof params.trackLimit === 'number') {
    searchParams.set('trackLimit', String(params.trackLimit));
  }

  const url = `${API_BASE_URL}/music/spotify/search?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result: BaseApiResponse<SpotifyCatalogSearchResult> = await response.json();

    if (!response.ok || result.success === false) {
      const message = (result && result.message) || `Failed to search Spotify catalog (Status: ${response.status})`;
      throw new Error(message);
    }

    return result.data;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

/**
 * Get music tracks based on mood
 * @param mood - The detected mood (happy, sad, excited, relaxed, focused)
 * @param limit - Maximum number of tracks to fetch (default: 20)
 * @param type - Type of fetch: 'search' or 'recommendations' (default: 'recommendations')
 * @param service - Music service to use: 'spotify', 'youtube', or 'soundcloud' (default: 'spotify')
 */
export const getTracksByMood = async (
  mood: string,
  limit: number = 20,
  type: 'search' | 'recommendations' = 'recommendations',
  service: 'youtube' | 'soundcloud' | 'spotify' = 'spotify'
): Promise<MusicResponse> => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('❌ No authentication token found in localStorage');
    throw new Error('No authentication token found. Please log in again.');
  }

  const url = `${API_BASE_URL}/music/tracks?mood=${encodeURIComponent(mood)}&limit=${limit}&type=${type}&service=${service}`;
  console.log('📡 Making API request to:', url);
  console.log('🔑 Using token:', token.substring(0, 20) + '...');
  console.log('🎵 Music service:', service);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📥 API Response status:', response.status, response.statusText);

    const result = await response.json();
    console.log('📥 API Response data:', result);

    if (!response.ok) {
      // Provide more detailed error message
      console.error('❌ API Error Response:', result);
      const errorMessage = result.message || `Failed to fetch music tracks (Status: ${response.status})`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return result;
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

export const getFavoriteTracks = async (): Promise<FavoriteTrack[]> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const url = `${API_BASE_URL}/music/favorites`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: (BaseApiResponse<FavoriteTrack[]> & { count?: number }) = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch favorite tracks (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return result.data || [];
};

export const addTrackToFavorites = async (track: Track, mood?: string): Promise<FavoriteTrack> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const trackId = track.id || track.externalUrl;

  if (!trackId) {
    throw new Error('Track identifier not found.');
  }

  const payload = {
    track: {
      trackId,
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      albumImage: track.albumImage,
      externalUrl: track.externalUrl,
      previewUrl: track.previewUrl,
      source: track.source || 'spotify',
    },
    mood,
  };

  const response = await fetch(`${API_BASE_URL}/music/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result: BaseApiResponse<FavoriteTrack> = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to add track to playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return result.data;
};

export const removeTrackFromFavorites = async (trackId: string): Promise<void> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/favorites`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ trackId }),
  });

  if (response.status === 204) {
    return;
  }

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to remove track from playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }
};

export const getPlaylists = async (): Promise<PlaylistSummary[]> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch playlists (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const playlists = Array.isArray(result?.data) ? result.data : [];

  return playlists.map((item: any) => ({
    id: item.id || item._id,
    name: item.name,
    description: item.description,
    trackCount: item.trackCount ?? (Array.isArray(item.tracks) ? item.tracks.length : 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

export const getPlaylistById = async (playlistId: string): Promise<PlaylistDetail> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const playlist = result?.data;

  if (!playlist) {
    throw new Error('Playlist data missing from response.');
  }

  return normalizePlaylistDetail(playlist);
};

export const createPlaylist = async (name: string, description?: string): Promise<PlaylistSummary> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to create playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const playlist = result?.data;

  if (!playlist) {
    throw new Error('Playlist data missing from response.');
  }

  return {
    id: playlist.id || playlist._id,
    name: playlist.name,
    description: playlist.description,
    trackCount: playlist.trackCount ?? (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json();
    const errorMessage = result?.message || `Failed to delete playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }
};

export const addTrackToPlaylist = async (
  playlistId: string,
  track: Track,
  mood?: string
): Promise<PlaylistDetail> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      track: {
        trackId: track.id || track.externalUrl,
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        albumImage: track.albumImage,
        externalUrl: track.externalUrl,
        previewUrl: track.previewUrl,
        source: track.source || 'spotify',
      },
      mood,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to add track to playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  if (!result?.data) {
    throw new Error('Playlist data missing from response.');
  }

  return normalizePlaylistDetail(result.data);
};

export const removeTrackFromPlaylist = async (
  playlistId: string,
  trackId: string
): Promise<PlaylistDetail> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}/tracks`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ trackId }),
  });

  if (response.status === 204) {
    return await getPlaylistById(playlistId);
  }

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to remove track from playlist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  if (!result?.data) {
    throw new Error('Playlist data missing from response.');
  }

  return normalizePlaylistDetail(result.data);
};

export const getFollowedArtistsFromApi = async (): Promise<FollowedArtistSummary[]> => {
  const token = ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/music/artists/followed`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: (BaseApiResponse<FollowedArtistSummary[]> & { count?: number }) = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch followed artists (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return Array.isArray(result?.data) ? result.data.map(normalizeFollowedArtist) : [];
};

export const followArtistRequest = async (artist: ArtistMetadata): Promise<FollowedArtistSummary> => {
  const token = ensureAuthToken();

  if (!artist?.id) {
    throw new Error('Artist id is required to follow an artist.');
  }

  const response = await fetch(`${API_BASE_URL}/music/artists/followed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.image,
        genres: artist.genres,
        followers: artist.followers,
        popularity: artist.popularity,
        spotifyUrl: artist.spotifyUrl,
      },
    }),
  });

  const result: BaseApiResponse<FollowedArtistSummary> = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to follow artist (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return normalizeFollowedArtist(result?.data);
};

export const unfollowArtistRequest = async (artistId: string): Promise<void> => {
  const token = ensureAuthToken();

  if (!artistId) {
    throw new Error('artistId is required to unfollow an artist.');
  }

  const response = await fetch(`${API_BASE_URL}/music/artists/followed/${artistId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return;
  }

  if (!response.ok) {
    let message = `Failed to unfollow artist (Status: ${response.status})`;
    try {
      const result = await response.json();
      message = result?.message || message;
    } catch (error) {
      // ignore body parse errors
    }
    const err = new Error(message);
    (err as any).status = response.status;
    throw err;
  }
};

export const getArtistById = async (artistId: string, topTrackLimit?: number): Promise<ArtistMetadata> => {
  const token = ensureAuthToken();

  const searchParams = new URLSearchParams();
  if (typeof topTrackLimit === 'number') {
    searchParams.set('topTrackLimit', String(topTrackLimit));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/music/artists/${artistId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: BaseApiResponse<ArtistMetadata> = await response.json();

  if (!response.ok || result.success === false) {
    const message = result?.message || `Failed to fetch artist (Status: ${response.status})`;
    throw new Error(message);
  }

  return result.data;
};

/**
 * Get related artists for a given artist ID
 * @param artistId - Spotify artist ID
 */
export const getRelatedArtists = async (artistId: string): Promise<ArtistMetadata[]> => {
  const token = ensureAuthToken();

  const url = `${API_BASE_URL}/music/artists/${artistId}/related`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: BaseApiResponse<ArtistMetadata[]> = await response.json();

  if (!response.ok || result.success === false) {
    const message = result?.message || `Failed to fetch related artists (Status: ${response.status})`;
    throw new Error(message);
  }

  return result.data;
};


/**
 * Search for tracks by lyrics/words
 * @param query - The lyrics/words the user remembers
 * @param limit - Maximum number of results (default: 10)
 */
export const searchTracksByLyrics = async (
  query: string,
  limit: number = 10
): Promise<LyricsSearchResponse> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const url = new URL(`${API_BASE_URL}/music/lyrics/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('limit', limit.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result?.message || `Failed to search tracks by lyrics (Status: ${response.status})`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return result;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

/**
 * Get track recommendations based on seed artist IDs (for mix stations)
 * @param artistIds - Array of Spotify artist IDs
 * @param limit - Maximum number of tracks to fetch (default: 20)
 * @param options - Optional audio feature targets
 */
export const getRecommendationsByArtists = async (
  artistIds: string[],
  limit: number = 20,
  options?: {
    target_energy?: number;
    target_danceability?: number;
    target_valence?: number;
  }
): Promise<{ tracks: Track[]; count: number; seedArtists: string[] }> => {
  const token = ensureAuthToken();

  const searchParams = new URLSearchParams({
    artistIds: artistIds.join(','),
    limit: String(limit),
  });

  if (options?.target_energy !== undefined) {
    searchParams.set('target_energy', String(options.target_energy));
  }
  if (options?.target_danceability !== undefined) {
    searchParams.set('target_danceability', String(options.target_danceability));
  }
  if (options?.target_valence !== undefined) {
    searchParams.set('target_valence', String(options.target_valence));
  }

  const url = `${API_BASE_URL}/music/recommendations/artists?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result?.message || `Failed to get recommendations (Status: ${response.status})`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return result.data;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

