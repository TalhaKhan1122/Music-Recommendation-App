import axios from 'axios';

// Cache for access token
let accessToken: string | null = null;
let tokenExpiryTime: number = 0;

const shuffleArray = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const topPunjabiArtists = [
  'Karan Aujla',
  'Talha Anjum',
  'Talhah Yunus',
  'Young Stunners',
  'Sidhu Moose Wala',
  'AP Dhillon',
  'Diljit Dosanjh',
  'Shubh',
  'Arjan Dhillon',
  'Gurinder Gill',
  'Prabh Deep',
  'Raf Saperra'
];

const topEnglishArtists = [
  'Taylor Swift',
  'Drake',
  'The Weeknd',
  'Ed Sheeran',
  'Billie Eilish',
  'Dua Lipa',
  'Justin Bieber',
  'Ariana Grande',
  'Post Malone',
  'Imagine Dragons',
  'Travis Scott',
  'Olivia Rodrigo'
];

const topGlobalArtists = [
  'Bad Bunny',
  'BTS',
  'BLACKPINK',
  'Karol G',
  'J Balvin',
  'Calvin Harris',
  'Shakira',
  'David Guetta',
  'Rema',
  'Ayra Starr',
  'Martin Garrix',
  'Major Lazer'
];

type ArtistCategory = 'punjabi' | 'english' | 'global';

interface FormattedTrack {
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
}

export interface ArtistMetadata {
  id: string;
  name: string;
  image?: string;
  genres: string[];
  followers: number;
  popularity: number;
  spotifyUrl?: string;
  topTracks: FormattedTrack[];
  category: ArtistCategory;
}

export interface ArtistShowcaseSection {
  category: ArtistCategory;
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

export interface TopArtistsOptions {
  limitPerCategory?: number;
  topTrackLimit?: number;
}

export interface SpotifyCatalogSearchOptions {
  artistLimit?: number;
  trackLimit?: number;
}

export interface SpotifyCatalogSearchResult {
  artists: ArtistMetadata[];
  tracks: FormattedTrack[];
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const ARTIST_MARKET: Record<ArtistCategory, string> = {
  punjabi: 'IN',
  english: 'US',
  global: 'US',
};

const artistIdCache = new Map<string, { id: string; expires: number }>();
const artistTopTracksCache = new Map<string, { tracks: any[]; expires: number }>();
const artistMetadataCache = new Map<string, { artist: ArtistMetadata; expires: number }>();

const SECTION_CONFIG: Array<{
  key: ArtistCategory;
  title: string;
  description: string;
  artistPool: string[];
}> = [
  {
    key: 'punjabi',
    title: 'Punjabi Powerhouses',
    description: 'High-energy voices and heartfelt ballads from Punjabi superstars.',
    artistPool: topPunjabiArtists,
  },
  {
    key: 'english',
    title: 'Global Chart Leaders',
    description: 'International chart-toppers shaping the sound of pop and hip-hop.',
    artistPool: topEnglishArtists,
  },
  {
    key: 'global',
    title: 'Worldwide Vibes',
    description: 'Genre-bending icons bringing fresh sounds from every corner of the globe.',
    artistPool: topGlobalArtists,
  },
];

const formatSpotifyTrack = (track: any) => ({
  id: track.id,
  name: track.name,
  artists: track.artists?.map((artist: any) => artist.name).join(', ') || '',
  album: track.album?.name || '',
  albumImage: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
  previewUrl: track.preview_url,
  externalUrl: track.external_urls?.spotify || '',
  duration: track.duration_ms,
  popularity: track.popularity,
  source: 'spotify' as const,
});

const selectArtistImage = (artist: any): string | undefined => {
  if (!artist?.images?.length) {
    return undefined;
  }
  return artist.images[0]?.url || artist.images[1]?.url || artist.images[2]?.url;
};

const formatSpotifyArtist = (
  artist: any,
  category: ArtistCategory,
  topTracks: FormattedTrack[]
): ArtistMetadata => ({
  id: artist.id,
  name: artist.name,
  image: selectArtistImage(artist),
  genres: Array.isArray(artist.genres) ? artist.genres : [],
  followers: artist.followers?.total ?? 0,
  popularity: artist.popularity ?? 0,
  spotifyUrl: artist.external_urls?.spotify,
  topTracks,
  category,
});

const fetchArtistMetadata = async (
  artistName: string,
  category: ArtistCategory,
  topTrackLimit: number
): Promise<ArtistMetadata | null> => {
  const normalizedName = artistName.trim();
  if (!normalizedName) {
    return null;
  }

  const cacheKey = `${category}::${normalizedName.toLowerCase()}::${topTrackLimit}`;
  const cached = artistMetadataCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.artist;
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: `artist:"${normalizedName}"`,
        type: 'artist',
        limit: 1,
        market: ARTIST_MARKET[category] || 'US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const artist = response.data?.artists?.items?.[0];
    if (!artist) {
      console.warn(`⚠️ No Spotify metadata found for artist "${normalizedName}" (${category})`);
      return null;
    }

    const topTracksRaw = await getArtistTopTracks(artist.name, Math.max(1, topTrackLimit), category);
    const topTracks = topTracksRaw.map(formatSpotifyTrack);

    const formatted = formatSpotifyArtist(artist, category, topTracks);
    artistMetadataCache.set(cacheKey, {
      artist: formatted,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return formatted;
  } catch (error: any) {
    console.error(
      `❌ Error fetching Spotify metadata for artist "${normalizedName}":`,
      error.response?.data || error.message
    );
    return null;
  }
};

const getArtistsForMood = (mood: string): Record<ArtistCategory, string[]> => {
  const moodKey = mood.toLowerCase();
  const punjabiCandidates = shuffleArray(topPunjabiArtists);
  const englishCandidates = shuffleArray(topEnglishArtists);
  const globalCandidates = shuffleArray(topGlobalArtists);

  const selections: Record<ArtistCategory, string[]> = {
    punjabi: [],
    english: [],
    global: [],
  };

  switch (moodKey) {
    case 'happy':
    case 'excited':
      selections.punjabi = punjabiCandidates.slice(0, 3);
      selections.english = englishCandidates.slice(0, 3);
      selections.global = globalCandidates.slice(0, 2);
      break;
    case 'sad':
      selections.punjabi = punjabiCandidates.slice(0, 2);
      selections.english = englishCandidates.slice(0, 3);
      selections.global = globalCandidates.slice(0, 1);
      break;
    case 'relaxed':
      selections.punjabi = punjabiCandidates.slice(0, 2);
      selections.english = englishCandidates.slice(0, 2);
      selections.global = globalCandidates.slice(0, 2);
      break;
    case 'focused':
      selections.punjabi = punjabiCandidates.slice(0, 1);
      selections.english = englishCandidates.slice(0, 3);
      selections.global = globalCandidates.slice(0, 2);
      break;
    default:
      selections.punjabi = punjabiCandidates.slice(0, 2);
      selections.english = englishCandidates.slice(0, 2);
      selections.global = globalCandidates.slice(0, 2);
  }

  // Ensure at least one artist per group when possible
  if (!selections.punjabi.length) {
    selections.punjabi = punjabiCandidates.slice(0, 2);
  }
  if (!selections.english.length) {
    selections.english = englishCandidates.slice(0, 2);
  }
  if (!selections.global.length) {
    selections.global = globalCandidates.slice(0, 1);
  }

  return selections;
};

const dedupeTracks = (tracks: any[]): any[] => {
  const seen = new Set<string>();
  const unique: any[] = [];

  tracks.forEach(track => {
    if (track && track.id && !seen.has(track.id)) {
      seen.add(track.id);
      unique.push(track);
    }
  });

  return unique;
};

/**
 * Check if Spotify credentials are configured
 */
const getSpotifyCredentials = (): { clientId: string; clientSecret: string } => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials are not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file.');
  }

  return { clientId, clientSecret };
};

/**
 * Get Spotify access token using Client Credentials flow
 */
const getAccessToken = async (): Promise<string> => {
  // Check credentials first
  const { clientId, clientSecret } = getSpotifyCredentials();

  // Check if we have a valid cached token
  if (accessToken && Date.now() < tokenExpiryTime) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );
    accessToken = response.data.access_token;
    // Set expiry time (subtract 60 seconds for safety)
    tokenExpiryTime = Date.now() + (response.data.expires_in - 60) * 1000;

    if (!accessToken) {
      throw new Error('Failed to get access token from Spotify');
    }

    return accessToken;
  } catch (error: any) {
    console.error('Error getting Spotify access token:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Spotify credentials. Please check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.');
    } else if (error.response?.status === 400) {
      throw new Error('Spotify authentication failed. Please verify your credentials.');
    }
    
    throw new Error(`Failed to authenticate with Spotify: ${error.message || 'Unknown error'}`);
  }
};

const getArtistId = async (artistName: string): Promise<string | null> => {
  const cacheKey = artistName.toLowerCase();
  const cached = artistIdCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.id;
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: `artist:"${artistName}"`,
        type: 'artist',
        limit: 1,
        market: 'US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const artist = response.data?.artists?.items?.[0];
    if (!artist) {
      console.warn(`⚠️ No Spotify artist found for name "${artistName}"`);
      return null;
    }

    const id = artist.id;
    artistIdCache.set(cacheKey, { id, expires: Date.now() + CACHE_TTL_MS });
    return id;
  } catch (error: any) {
    console.error(`❌ Error searching artist "${artistName}":`, error.response?.data || error.message);
    return null;
  }
};

const getArtistTopTracks = async (artistName: string, limit: number, category: ArtistCategory): Promise<any[]> => {
  const cacheKey = `${artistName.toLowerCase()}::${category}`;
  const cached = artistTopTracksCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.tracks.slice(0, limit);
  }

  const artistId = await getArtistId(artistName);
  if (!artistId) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const market = ARTIST_MARKET[category] || 'US';

    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      params: {
        market,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const tracks: any[] = response.data?.tracks || [];
    const sortedTracks = [...tracks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    artistTopTracksCache.set(cacheKey, { tracks: sortedTracks, expires: Date.now() + CACHE_TTL_MS });
    return sortedTracks.slice(0, limit);
  } catch (error: any) {
    console.error(`❌ Error fetching top tracks for artist "${artistName}":`, error.response?.data || error.message);
    return [];
  }
};

const collectTopTracksForMood = async (mood: string, limit: number): Promise<any[]> => {
  const selections = getArtistsForMood(mood);
  const selectedArtists: Array<{ name: string; category: ArtistCategory }> = [
    ...selections.punjabi.map(name => ({ name, category: 'punjabi' as const })),
    ...selections.english.map(name => ({ name, category: 'english' as const })),
    ...selections.global.map(name => ({ name, category: 'global' as const })),
  ];

  const uniqueSelected = selectedArtists.filter(
    (entry, index, arr) => arr.findIndex(e => e.name.toLowerCase() === entry.name.toLowerCase()) === index
  );

  const totalArtists = uniqueSelected.length || 1;
  const perArtistLimit = Math.max(2, Math.ceil(limit / totalArtists));
  const usedArtists = new Set<string>();

  const initialResults = await Promise.all(
    uniqueSelected.map(async (entry) => {
      usedArtists.add(entry.name.toLowerCase());
      const tracks = await getArtistTopTracks(entry.name, perArtistLimit, entry.category);
      if (!tracks.length) {
        console.warn(`⚠️ No top tracks returned for artist "${entry.name}" (${entry.category})`);
      }
      return tracks;
    })
  );

  let combined = dedupeTracks(initialResults.flat());

  if (combined.length < limit) {
    const remainingArtists = shuffleArray([
      ...topPunjabiArtists,
      ...topEnglishArtists,
      ...topGlobalArtists,
    ]).filter(name => !usedArtists.has(name.toLowerCase()));

    for (const name of remainingArtists) {
      if (combined.length >= limit) {
        break;
      }

      const category: ArtistCategory = topPunjabiArtists.includes(name)
        ? 'punjabi'
        : topEnglishArtists.includes(name)
          ? 'english'
          : 'global';

      const extraTracks = await getArtistTopTracks(name, perArtistLimit, category);
      usedArtists.add(name.toLowerCase());
      combined = dedupeTracks([...combined, ...extraTracks]);
    }
  }

  combined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return combined.slice(0, limit);
};

/**
 * Search for tracks on Spotify
 */
export const searchTracks = async (query: string, limit: number = 20, offset?: number): Promise<any[]> => {
  try {
    const token = await getAccessToken();
    const params: Record<string, string | number> = {
      q: query,
      type: 'track',
      limit: Math.min(limit, 50),
      market: 'US',
    };

    if (typeof offset === 'number') {
      params.offset = Math.max(0, Math.min(offset, 1000));
    }

    const response = await axios.get('https://api.spotify.com/v1/search', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.tracks || !response.data.tracks.items) {
      console.warn('Spotify search returned unexpected format');
      return [];
    }

    return response.data.tracks.items;
  } catch (error: any) {
    console.error('Error searching Spotify tracks:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Spotify authentication failed. Token may have expired.');
    } else if (error.response?.status === 429) {
      throw new Error('Spotify API rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to search tracks on Spotify: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get tracks based on mood
 */
export const getTracksByMood = async (mood: string, limit: number = 20): Promise<any[]> => {
  try {
    const tracks = await collectTopTracksForMood(mood, limit);
    if (!tracks.length) {
      console.warn(`⚠️ No curated tracks found for mood "${mood}", returning empty array`);
      return [];
    }

    return tracks.map(formatSpotifyTrack);
  } catch (error: any) {
    console.error('Error getting tracks by mood:', error);
    throw error;
  }
};

/**
 * Get track recommendations based on mood
 */
export const getRecommendationsByMood = async (
  mood: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    const targetCount = Math.max(limit, 20);
    const curatedTracks = await collectTopTracksForMood(mood, targetCount);

    if (!curatedTracks.length) {
      console.warn(`⚠️ No curated recommendations found for mood "${mood}", returning empty array`);
      return [];
    }

    return curatedTracks.slice(0, limit).map(formatSpotifyTrack);
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return await getTracksByMood(mood, limit);
  }
};

export const getTopArtistsShowcase = async (
  options: TopArtistsOptions = {}
): Promise<TopArtistsPayload> => {
  const limit = Math.max(1, Math.min(options.limitPerCategory ?? 6, 30));
  const topTrackLimit = Math.max(1, Math.min(options.topTrackLimit ?? 6, 10));

  const sections = [];

  for (const sectionConfig of SECTION_CONFIG) {
    const collected: ArtistMetadata[] = [];
    let attempted = 0;

    for (const name of sectionConfig.artistPool) {
      if (collected.length >= limit) {
        break;
      }

      attempted += 1;
      const metadata = await fetchArtistMetadata(name, sectionConfig.key, topTrackLimit);
      if (metadata) {
        collected.push(metadata);
      }
    }

    sections.push({
      category: sectionConfig.key,
      title: sectionConfig.title,
      description: sectionConfig.description,
      artists: collected,
      hasMore: attempted < sectionConfig.artistPool.length,
    });
  }

  const totalArtists = sections.reduce((sum, section) => sum + section.artists.length, 0);

  return {
    fetchedAt: new Date().toISOString(),
    limitPerCategory: limit,
    totalArtists,
    sections,
  };
};

export const searchSpotifyCatalog = async (
  query: string,
  options: SpotifyCatalogSearchOptions = {}
): Promise<SpotifyCatalogSearchResult> => {
  const normalized = query.trim();
  if (!normalized) {
    return {
      artists: [],
      tracks: [],
    };
  }

  const artistLimit = Math.max(1, Math.min(options.artistLimit ?? 12, 50));
  const trackLimit = Math.max(1, Math.min(options.trackLimit ?? 12, 50));
  const searchLimit = Math.max(artistLimit, trackLimit);

  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: normalized,
        type: 'artist,track',
        limit: searchLimit,
        market: 'US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const artistItems: any[] = Array.isArray(response.data?.artists?.items)
      ? response.data.artists.items
      : [];
    const trackItems: any[] = Array.isArray(response.data?.tracks?.items)
      ? response.data.tracks.items
      : [];

    const artists = artistItems.slice(0, artistLimit).map((artist) =>
      formatSpotifyArtist(artist, 'global', [])
    );
    const tracks = trackItems.slice(0, trackLimit).map(formatSpotifyTrack);

    return {
      artists,
      tracks,
    };
  } catch (error: any) {
    console.error('Error searching Spotify catalog:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Spotify authentication failed. Token may have expired.');
    }
    if (error.response?.status === 429) {
      throw new Error('Spotify API rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to search Spotify catalog: ${error.message || 'Unknown error'}`);
  }
};

export const getArtistByIdWithTracks = async (
  artistId: string,
  topTrackLimit: number = 10
): Promise<ArtistMetadata | null> => {
  try {
    const token = await getAccessToken();
    
    // Fetch artist details
    const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const artist = artistResponse.data;
    if (!artist) return null;
    
    // Determine category from artist genres or default to 'english'
    let category: ArtistCategory = 'english';
    const genres = Array.isArray(artist.genres) ? artist.genres.map((g: string) => g.toLowerCase()) : [];
    if (genres.some((g: string) => g.includes('punjabi') || g.includes('bhangra'))) {
      category = 'punjabi';
    }
    
    // Fetch top tracks
    const market = ARTIST_MARKET[category] || 'US';
    const tracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      params: { market },
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const tracks: any[] = tracksResponse.data?.tracks || [];
    const sortedTracks = [...tracks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const topTracks = sortedTracks.slice(0, topTrackLimit).map(formatSpotifyTrack);
    
    return formatSpotifyArtist(artist, category, topTracks);
  } catch (error: any) {
    console.error(`❌ Error fetching artist by ID "${artistId}":`, error.response?.data || error.message);
    return null;
  }
};

