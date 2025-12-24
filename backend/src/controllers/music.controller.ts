import { Request, Response } from 'express';
// Import all music services
import {
  getTracksByMood as getSpotifyTracks,
  getRecommendationsByMood as getSpotifyRecommendations,
  getTopArtistsShowcase as fetchTopArtistsShowcase,
  searchSpotifyCatalog as fetchSpotifyCatalog,
  getArtistByIdWithTracks,
  getRecommendationsByArtists,
} from '../services/spotify.service';
import { getTracksByMood as getYouTubeTracks, getRecommendationsByMood as getYouTubeRecommendations } from '../services/youtube.service';
import { getTracksByMood as getSoundCloudTracks, getRecommendationsByMood as getSoundCloudRecommendations } from '../services/soundcloud.service';
import FavoriteTrack from '../models/favoriteTrack.model';
import Playlist from '../models/playlist.model';
import FollowedArtist from '../models/followedArtist.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Default service to use (can be changed via environment variable or config)
const DEFAULT_MUSIC_SERVICE = process.env.DEFAULT_MUSIC_SERVICE || 'spotify'; // 'spotify', 'youtube', or 'soundcloud'

interface MusicRequest extends Request {
  query: {
    mood?: string;
    limit?: string;
    type?: 'search' | 'recommendations';
    service?: 'youtube' | 'soundcloud' | 'spotify'; // Music service to use
  };
}

/**
 * @route   GET /api/music/tracks
 * @desc    Get music tracks based on mood
 * @access  Private (requires authentication)
 */
export const getTracks = async (req: MusicRequest, res: Response): Promise<void> => {
  try {
    console.log('🎵 Music API Request received:', {
      mood: req.query.mood,
      limit: req.query.limit,
      type: req.query.type,
      user: (req as any).user?.email || 'Unknown'
    });

    const { mood, limit = '20', type = 'recommendations' } = req.query;

    if (!mood) {
      console.warn('⚠️ Mood parameter missing');
      res.status(400).json({
        success: false,
        message: 'Mood parameter is required',
      });
      return;
    }

    console.log(`🔄 Fetching ${type} tracks for mood: ${mood}`);
    const limitNum = parseInt(limit, 10) || 20;
    
    // Determine which service to use based on query parameter or default
    const service = (req.query.service as string) || DEFAULT_MUSIC_SERVICE;
    console.log(`🎵 Using music service: ${service}`);
    
    let tracks: any[];
    
    try {
      if (service.toLowerCase() === 'spotify') {
        tracks = type === 'recommendations'
          ? await getSpotifyRecommendations(mood, limitNum)
          : await getSpotifyTracks(mood, limitNum);
      } else if (service.toLowerCase() === 'soundcloud') {
        tracks = type === 'recommendations'
          ? await getSoundCloudRecommendations(mood, limitNum)
          : await getSoundCloudTracks(mood, limitNum);
      } else if (service.toLowerCase() === 'youtube') {
        tracks = type === 'recommendations'
          ? await getYouTubeRecommendations(mood, limitNum)
          : await getYouTubeTracks(mood, limitNum);
      } else {
        // Default to Spotify if service not specified or invalid
        console.warn(`⚠️ Unknown service "${service}", defaulting to Spotify`);
        tracks = type === 'recommendations'
          ? await getSpotifyRecommendations(mood, limitNum)
          : await getSpotifyTracks(mood, limitNum);
      }
    } catch (serviceError: any) {
      // If primary service fails, try fallback
      console.warn(`⚠️ ${service} service failed, trying fallback...`, serviceError.message);
      if (service.toLowerCase() !== 'spotify') {
        console.log('🔄 Falling back to Spotify service');
        try {
          tracks = type === 'recommendations'
            ? await getSpotifyRecommendations(mood, limitNum)
            : await getSpotifyTracks(mood, limitNum);
        } catch (spotifyError) {
          // If Spotify also fails, try YouTube
          console.log('🔄 Spotify failed, trying YouTube service');
          tracks = type === 'recommendations'
            ? await getYouTubeRecommendations(mood, limitNum)
            : await getYouTubeTracks(mood, limitNum);
        }
      } else {
        // If Spotify fails, try YouTube as fallback
        console.log('🔄 Falling back to YouTube service');
        tracks = type === 'recommendations'
          ? await getYouTubeRecommendations(mood, limitNum)
          : await getYouTubeTracks(mood, limitNum);
      }
    }

    console.log(`✅ Successfully fetched ${tracks.length} tracks for ${mood} mood`);

    res.status(200).json({
      success: true,
      data: {
        mood,
        tracks,
        count: tracks.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting tracks:', error);
    
    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = error.message || 'Failed to fetch music tracks';
    
    if (error.message?.includes('SoundCloud API credentials') || error.message?.includes('SOUNDCLOUD_CLIENT_ID')) {
      statusCode = 503; // Service unavailable
      errorMessage = 'SoundCloud API is not configured. Please add SOUNDCLOUD_CLIENT_ID to your .env file. See SOUNDCLOUD_SETUP.md for instructions.';
    } else if (error.message?.includes('SoundCloud API authentication failed')) {
      statusCode = 401;
      errorMessage = 'SoundCloud API authentication failed. Please check your SOUNDCLOUD_CLIENT_ID. Client IDs may expire - extract a fresh one from SoundCloud web app.';
    } else if (error.message?.includes('YouTube API credentials') || error.message?.includes('YOUTUBE_API_KEY')) {
      statusCode = 503; // Service unavailable
      errorMessage = 'YouTube API is not configured. Please add YOUTUBE_API_KEY to your .env file.';
    } else if (error.message?.includes('quota exceeded') || error.message?.includes('invalid API key')) {
      statusCode = 403;
      errorMessage = 'YouTube API quota exceeded or invalid API key. Please check your YOUTUBE_API_KEY.';
    } else if (error.message?.includes('Spotify API credentials')) {
      statusCode = 503; // Service unavailable
      errorMessage = 'Spotify API is not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file.';
    } else if (error.message?.includes('Invalid Spotify')) {
      statusCode = 401;
      errorMessage = 'Invalid Spotify credentials. Please verify your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

const parsePositiveInteger = (value: unknown): number | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

export const getTopArtistsShowcaseController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { limitPerCategory, topTrackLimit } = req.query || {};
    const limit = parsePositiveInteger(limitPerCategory);
    const trackLimit = parsePositiveInteger(topTrackLimit);

    const payload = await fetchTopArtistsShowcase({
      limitPerCategory: limit,
      topTrackLimit: trackLimit,
    });

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    console.error('Error fetching Spotify artist showcase:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Spotify artists.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const searchSpotifyCatalogController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const queryParam = typeof req.query?.query === 'string' ? req.query.query : '';
    const artistLimit = parsePositiveInteger(req.query?.artistLimit);
    const trackLimit = parsePositiveInteger(req.query?.trackLimit);

    const results = await fetchSpotifyCatalog(queryParam, {
      artistLimit,
      trackLimit,
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error searching Spotify catalog:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search Spotify catalog.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Utility: Extract Spotify ID and type from a URL or raw ID
 */
const parseSpotifyInput = (input: string): { type: string; id: string } => {
  const regex = /spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/;
  const match = input.match(regex);
  
  if (match) {
    return { type: match[1], id: match[2] };
  }
  
  // Fallback: assume it's just a track ID if no URL given
  return { type: 'track', id: input };
};

/**
 * @route   POST /api/music/spotify/embed
 * @desc    Get Spotify embed URL and HTML for a track/album/playlist
 * @access  Private (requires authentication)
 */
export const getSpotifyEmbed = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🎵 Spotify Embed API called');
    console.log('🎵 Request body:', req.body);
    
    const { input } = req.body; // input can be Spotify URL or ID
    
    if (!input) {
      console.warn('⚠️ Missing input parameter');
      res.status(400).json({
        success: false,
        error: 'Missing input (Spotify URL or ID)',
      });
      return;
    }
    
    console.log('🎵 Parsing Spotify input:', input);
    const { type, id } = parseSpotifyInput(input);
    console.log('🎵 Parsed - Type:', type, 'ID:', id);
    
    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    console.log('🎵 Generated embed URL:', embedUrl);
    
    // Use Spotify's exact embed iframe format
    const html = `<iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="380" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
    
    console.log('✅ Spotify embed generated successfully');
    res.status(200).json({
      success: true,
      data: {
        embedUrl,
        html,
        type,
        id,
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating Spotify embed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Spotify embed',
    });
  }
};

interface TrackPayload {
  trackId?: string;
  id?: string;
  name?: string;
  artists?: string;
  album?: string;
  albumImage?: string;
  externalUrl?: string;
  previewUrl?: string;
  source?: string;
}

interface FavoriteTrackRequestBody {
  track?: TrackPayload;
  mood?: string;
}

const deriveTrackId = (track: TrackPayload | undefined): string | null => {
  if (!track) {
    return null;
  }

  if (track.trackId && typeof track.trackId === 'string' && track.trackId.trim() !== '') {
    return track.trackId.trim();
  }

  if (track.id && typeof track.id === 'string' && track.id.trim() !== '') {
    return track.id.trim();
  }

  if (track.externalUrl && typeof track.externalUrl === 'string' && track.externalUrl.trim() !== '') {
    return track.externalUrl.trim();
  }

  return null;
};

const buildPlaylistSummary = (playlist: any) => ({
  id: playlist._id?.toString() || '',
  name: playlist.name,
  description: playlist.description || '',
  trackCount: Array.isArray(playlist.tracks) ? playlist.tracks.length : 0,
  createdAt: playlist.createdAt,
  updatedAt: playlist.updatedAt,
});

const buildPlaylistDetail = (playlist: any) => ({
  ...buildPlaylistSummary(playlist),
  tracks: (playlist.tracks || []).map((track: any) => ({
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
  })),
});

/**
 * @route   POST /api/music/favorites
 * @desc    Add or update a favorite track for the authenticated user
 * @access  Private
 */
export const addFavoriteTrack = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { track, mood }: FavoriteTrackRequestBody = req.body || {};

    if (!track) {
      res.status(400).json({
        success: false,
        message: 'Track data is required.',
      });
      return;
    }

    if (!track.name || typeof track.name !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Track name is required.',
      });
      return;
    }

    const trackId = deriveTrackId(track);

    if (!trackId) {
      res.status(400).json({
        success: false,
        message: 'A valid track identifier is required.',
      });
      return;
    }

    const updatePayload = {
      name: track.name,
      artists: track.artists || '',
      album: track.album || '',
      albumImage: track.albumImage || '',
      externalUrl: track.externalUrl || '',
      previewUrl: track.previewUrl || '',
      source: track.source || 'spotify',
      mood: mood || '',
      addedAt: new Date(),
    };

    const existing = await FavoriteTrack.findOne({
      user: req.user.id,
      trackId,
    });

    if (existing) {
      existing.name = updatePayload.name;
      existing.artists = updatePayload.artists;
      existing.album = updatePayload.album;
      existing.albumImage = updatePayload.albumImage;
      existing.externalUrl = updatePayload.externalUrl;
      existing.previewUrl = updatePayload.previewUrl;
      existing.source = updatePayload.source;
      existing.mood = updatePayload.mood || existing.mood;
      existing.addedAt = updatePayload.addedAt;

      await existing.save();

      res.status(200).json({
        success: true,
        data: existing,
        message: 'Track is already in your playlist. Details updated.',
      });
      return;
    }

    const favorite = await FavoriteTrack.create({
      user: req.user.id,
      trackId,
      ...updatePayload,
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Track added to your playlist.',
    });
  } catch (error: any) {
    console.error('Error adding favorite track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add track to playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/music/favorites
 * @desc    Get favorite tracks for the authenticated user
 * @access  Private
 */
export const getFavoriteTracks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const favorites = await FavoriteTrack.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      data: favorites,
      count: favorites.length,
    });
  } catch (error: any) {
    console.error('Error fetching favorite tracks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite tracks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   DELETE /api/music/favorites
 * @desc    Remove a track from the user playlist
 * @access  Private
 */
export const removeFavoriteTrack = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { trackId } = req.body || {};

    if (!trackId || typeof trackId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'trackId is required to remove a track from the playlist.',
      });
      return;
    }

    const deleted = await FavoriteTrack.findOneAndDelete({
      user: req.user.id,
      trackId,
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Track not found in your playlist.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: deleted,
      message: 'Track removed from your playlist.',
    });
  } catch (error: any) {
    console.error('Error removing favorite track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove track from playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   POST /api/music/playlists
 * @desc    Create a new playlist for the authenticated user
 * @access  Private
 */
export const createPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { name, description } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Playlist name is required.',
      });
      return;
    }

    const trimmedName = name.trim();

    const existing = await Playlist.findOne({
      user: req.user.id,
      name: trimmedName,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'You already have a playlist with that name.',
      });
      return;
    }

    const playlist = await Playlist.create({
      user: req.user.id,
      name: trimmedName,
      description: typeof description === 'string' ? description.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      data: buildPlaylistSummary(playlist),
      message: 'Playlist created successfully.',
    });
  } catch (error: any) {
    console.error('Error creating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/music/playlists
 * @desc    Get playlists for the authenticated user
 * @access  Private
 */
export const getUserPlaylists = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const playlists = await Playlist.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      data: playlists.map(buildPlaylistSummary),
      count: playlists.length,
    });
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch playlists',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/music/playlists/:playlistId
 * @desc    Get a specific playlist (with tracks)
 * @access  Private
 */
export const getPlaylistById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { playlistId } = req.params;

    const playlist = await Playlist.findOne({
      _id: playlistId,
      user: req.user.id,
    })
      .lean()
      .exec();

    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: buildPlaylistDetail(playlist),
    });
  } catch (error: any) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   POST /api/music/playlists/:playlistId/tracks
 * @desc    Add a track to the specified playlist
 * @access  Private
 */
export const addTrackToPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { playlistId } = req.params;
    const { track, mood }: FavoriteTrackRequestBody = req.body || {};

    if (!track) {
      res.status(400).json({
        success: false,
        message: 'Track data is required.',
      });
      return;
    }

    if (!track.name || typeof track.name !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Track name is required.',
      });
      return;
    }

    const trackId = deriveTrackId(track);

    if (!trackId) {
      res.status(400).json({
        success: false,
        message: 'A valid track identifier is required.',
      });
      return;
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      user: req.user.id,
    });

    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
      return;
    }

    const alreadyExists = playlist.tracks.some((item) => item.trackId === trackId);

    if (alreadyExists) {
      res.status(200).json({
        success: true,
        data: buildPlaylistDetail(playlist),
        message: 'Track is already in this playlist.',
      });
      return;
    }

    playlist.tracks.push({
      trackId,
      name: track.name,
      artists: track.artists || '',
      album: track.album || '',
      albumImage: track.albumImage || '',
      externalUrl: track.externalUrl || '',
      previewUrl: track.previewUrl || '',
      source: track.source || 'spotify',
      mood: mood || '',
      addedAt: new Date(),
    });

    await playlist.save();

    res.status(200).json({
      success: true,
      data: buildPlaylistDetail(playlist),
      message: 'Track added to playlist.',
    });
  } catch (error: any) {
    console.error('Error adding track to playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add track to playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   DELETE /api/music/playlists/:playlistId/tracks
 * @desc    Remove a track from the specified playlist
 * @access  Private
 */
export const removeTrackFromPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { playlistId } = req.params;
    const { trackId } = req.body || {};

    if (!trackId || typeof trackId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'trackId is required to remove a track from the playlist.',
      });
      return;
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      user: req.user.id,
    });

    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
      return;
    }

    const originalLength = playlist.tracks.length;
    playlist.tracks = playlist.tracks.filter((track) => track.trackId !== trackId);

    if (playlist.tracks.length === originalLength) {
      res.status(404).json({
        success: false,
        message: 'Track not found in this playlist.',
      });
      return;
    }

    await playlist.save();

    res.status(200).json({
      success: true,
      data: buildPlaylistDetail(playlist),
      message: 'Track removed from playlist.',
    });
  } catch (error: any) {
    console.error('Error removing track from playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove track from playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   DELETE /api/music/playlists/:playlistId
 * @desc    Delete a playlist
 * @access  Private
 */
export const deletePlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { playlistId } = req.params;

    const deleted = await Playlist.findOneAndDelete({
      _id: playlistId,
      user: req.user.id,
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete playlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

interface FollowArtistPayload {
  id?: string;
  name?: string;
  image?: string;
  genres?: string[];
  followers?: number;
  popularity?: number;
  spotifyUrl?: string;
}

const mapFollowedArtist = (artist: any) => ({
  id: artist.artistId,
  artistId: artist.artistId,
  name: artist.name,
  image: artist.image,
  genres: Array.isArray(artist.genres) ? artist.genres : [],
  followers: artist.followers,
  popularity: artist.popularity,
  spotifyUrl: artist.spotifyUrl,
  createdAt: artist.createdAt,
  updatedAt: artist.updatedAt,
});

export const getFollowedArtistsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const artists = await FollowedArtist.find({ user: req.user.id }).sort({ name: 1 }).lean().exec();

    res.status(200).json({
      success: true,
      data: artists.map(mapFollowedArtist),
      count: artists.length,
    });
  } catch (error: any) {
    console.error('Error fetching followed artists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followed artists',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const followArtistController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { artist }: { artist?: FollowArtistPayload } = req.body || {};

    if (!artist?.id || !artist.name) {
      res.status(400).json({
        success: false,
        message: 'Artist id and name are required to follow an artist.',
      });
      return;
    }

    const normalizedGenres = Array.isArray(artist.genres) ? artist.genres.filter(Boolean) : undefined;

    const existing = await FollowedArtist.findOne({
      user: req.user.id,
      artistId: artist.id,
    });

    if (existing) {
      existing.name = artist.name;
      existing.image = artist.image;
      existing.genres = normalizedGenres;
      existing.followers = typeof artist.followers === 'number' ? artist.followers : existing.followers;
      existing.popularity = typeof artist.popularity === 'number' ? artist.popularity : existing.popularity;
      existing.spotifyUrl = artist.spotifyUrl || existing.spotifyUrl;

      await existing.save();

      res.status(200).json({
        success: true,
        data: mapFollowedArtist(existing),
        message: 'Artist already followed. Details updated.',
      });
      return;
    }

    const followed = await FollowedArtist.create({
      user: req.user.id,
      artistId: artist.id,
      name: artist.name,
      image: artist.image,
      genres: normalizedGenres,
      followers: artist.followers,
      popularity: artist.popularity,
      spotifyUrl: artist.spotifyUrl,
    });

    res.status(201).json({
      success: true,
      data: mapFollowedArtist(followed),
      message: 'Artist followed successfully.',
    });
  } catch (error: any) {
    console.error('Error following artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow artist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const unfollowArtistController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { artistId } = req.params;

    if (!artistId) {
      res.status(400).json({
        success: false,
        message: 'artistId parameter is required.',
      });
      return;
    }

    const deleted = await FollowedArtist.findOneAndDelete({
      user: req.user.id,
      artistId,
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Artist was not found in your followed list.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: mapFollowedArtist(deleted),
      message: 'Artist unfollowed successfully.',
    });
  } catch (error: any) {
    console.error('Error unfollowing artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow artist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getArtistByIdController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { artistId } = req.params;
    const topTrackLimit = parsePositiveInteger(req.query?.topTrackLimit) || 10;

    if (!artistId) {
      res.status(400).json({
        success: false,
        message: 'Artist ID is required.',
      });
      return;
    }

    const artist = await getArtistByIdWithTracks(artistId, topTrackLimit);

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: artist,
    });
  } catch (error: any) {
    console.error('Error fetching artist by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch artist',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * @route   GET /api/music/recommendations/artists
 * @desc    Get track recommendations based on seed artist IDs (for mix stations)
 * @access  Private
 */
export const getRecommendationsByArtistsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login and try again.',
      });
      return;
    }

    const { artistIds, limit, target_energy, target_danceability, target_valence } = req.query;

    if (!artistIds) {
      res.status(400).json({
        success: false,
        message: 'artistIds parameter is required (comma-separated list of Spotify artist IDs).',
      });
      return;
    }

    const artistIdArray = (artistIds as string).split(',').map(id => id.trim()).filter(Boolean);
    
    if (artistIdArray.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one artist ID is required.',
      });
      return;
    }

    const limitNum = parsePositiveInteger(limit) || 20;
    const options: {
      target_energy?: number;
      target_danceability?: number;
      target_valence?: number;
    } = {};

    if (target_energy) {
      const energy = parseFloat(target_energy as string);
      if (!isNaN(energy) && energy >= 0 && energy <= 1) {
        options.target_energy = energy;
      }
    }
    if (target_danceability) {
      const danceability = parseFloat(target_danceability as string);
      if (!isNaN(danceability) && danceability >= 0 && danceability <= 1) {
        options.target_danceability = danceability;
      }
    }
    if (target_valence) {
      const valence = parseFloat(target_valence as string);
      if (!isNaN(valence) && valence >= 0 && valence <= 1) {
        options.target_valence = valence;
      }
    }

    const tracks = await getRecommendationsByArtists(artistIdArray, limitNum, options);

    res.status(200).json({
      success: true,
      data: {
        tracks,
        count: tracks.length,
        seedArtists: artistIdArray,
      },
    });
  } catch (error: any) {
    console.error('Error getting recommendations by artists:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


