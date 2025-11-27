import { Router } from 'express';
import {
  getTracks,
  getSpotifyEmbed,
  addFavoriteTrack,
  getFavoriteTracks,
  removeFavoriteTrack,
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  getTopArtistsShowcaseController,
  searchSpotifyCatalogController,
  getFollowedArtistsController,
  followArtistController,
  unfollowArtistController,
  getArtistByIdController,
} from '../controllers/music.controller';
import { authenticate } from '../middleware';

const router = Router();

/**
 * @route   GET /api/music/tracks
 * @desc    Get music tracks based on mood
 * @access  Private
 */
router.get('/tracks', authenticate, getTracks);

/**
 * @route   GET /api/music/artists/showcase
 * @desc    Get curated Spotify artist showcase
 * @access  Private
 */
router.get('/artists/showcase', authenticate, getTopArtistsShowcaseController);

/**
 * @route   GET /api/music/artists/followed
 * @desc    Get artists followed by the user
 * @access  Private
 */
router.get('/artists/followed', authenticate, getFollowedArtistsController);

/**
 * @route   POST /api/music/artists/followed
 * @desc    Follow an artist
 * @access  Private
 */
router.post('/artists/followed', authenticate, followArtistController);

/**
 * @route   DELETE /api/music/artists/followed/:artistId
 * @desc    Unfollow an artist
 * @access  Private
 */
router.delete('/artists/followed/:artistId', authenticate, unfollowArtistController);

/**
 * @route   GET /api/music/artists/:artistId
 * @desc    Get artist details with top tracks by artist ID
 * @access  Private
 */
router.get('/artists/:artistId', authenticate, getArtistByIdController);

/**
 * @route   GET /api/music/spotify/search
 * @desc    Search Spotify catalog for artists and tracks
 * @access  Private
 */
router.get('/spotify/search', authenticate, searchSpotifyCatalogController);

/**
 * @route   POST /api/music/spotify/embed
 * @desc    Get Spotify embed URL and HTML for a track/album/playlist
 * @access  Private
 */
router.post('/spotify/embed', authenticate, getSpotifyEmbed);

/**
 * @route   POST /api/music/favorites
 * @desc    Add a track to user playlist/favorites
 * @access  Private
 */
router.post('/favorites', authenticate, addFavoriteTrack);

/**
 * @route   GET /api/music/favorites
 * @desc    Get user playlist/favorites
 * @access  Private
 */
router.get('/favorites', authenticate, getFavoriteTracks);

/**
 * @route   DELETE /api/music/favorites
 * @desc    Remove a track from user playlist/favorites
 * @access  Private
 */
router.delete('/favorites', authenticate, removeFavoriteTrack);

/**
 * Playlist routes
 */
router.post('/playlists', authenticate, createPlaylist);
router.get('/playlists', authenticate, getUserPlaylists);
router.get('/playlists/:playlistId', authenticate, getPlaylistById);
router.post('/playlists/:playlistId/tracks', authenticate, addTrackToPlaylist);
router.delete('/playlists/:playlistId/tracks', authenticate, removeTrackFromPlaylist);
router.delete('/playlists/:playlistId', authenticate, deletePlaylist);

export default router;

