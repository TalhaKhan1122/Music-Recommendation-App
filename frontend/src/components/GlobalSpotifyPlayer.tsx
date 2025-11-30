import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SpotifyEmbed } from '.';
import { useAuth, useSpotifyPlayer } from '../context';
import { HeartIcon, SpotifyIcon, YouTubeIcon, SoundCloudIcon } from './icons';
import { 
  getFavoriteTracks, 
  addTrackToFavorites, 
  removeTrackFromFavorites,
  getPlaylists,
  addTrackToPlaylist,
  type PlaylistSummary 
} from '../api/music.api';

const GlobalSpotifyPlayer: React.FC = () => {
  const { spotifyReference, stopPlayer, currentTrack } = useSpotifyPlayer();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
  const [isProcessingPlaylistAction, setIsProcessingPlaylistAction] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated && spotifyReference) {
      stopPlayer();
    }
  }, [isAuthenticated, spotifyReference, stopPlayer]);

  // Check if current track is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentTrack || !isAuthenticated) {
        setIsCurrentTrackLiked(false);
        return;
      }

      try {
        const favorites = await getFavoriteTracks();
        const trackId = currentTrack.id || currentTrack.externalUrl || '';
        const isFavorite = favorites.some(
          (fav) => fav.trackId === trackId || fav.externalUrl === currentTrack.externalUrl
        );
        setIsCurrentTrackLiked(isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsCurrentTrackLiked(false);
      }
    };

    checkFavoriteStatus();
  }, [currentTrack, isAuthenticated]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionMenu]);

  const openPlaylistModal = async () => {
    if (!currentTrack) return;
    
    setShowPlaylistModal(true);
    setIsLoadingPlaylists(true);
    
    try {
      const userPlaylists = await getPlaylists();
      setPlaylists(userPlaylists);
    } catch (error: any) {
      console.error('Error loading playlists:', error);
      toast.error('Failed to load playlists', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    
    setIsProcessingPlaylistAction(true);
    try {
      await addTrackToPlaylist(playlistId, currentTrack);
      toast.success('Track added to playlist!', {
        position: 'top-right',
        autoClose: 2000,
      });
      setShowPlaylistModal(false);
      setShowActionMenu(false);
    } catch (error: any) {
      console.error('Error adding track to playlist:', error);
      toast.error(error.message || 'Failed to add track to playlist', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsProcessingPlaylistAction(false);
    }
  };

  const handleToggleLiked = async () => {
    if (!currentTrack) return;
    
    setIsProcessingPlaylistAction(true);
    try {
      if (isCurrentTrackLiked) {
        // Find the favorite track ID to remove
        const favorites = await getFavoriteTracks();
        const trackId = currentTrack.id || currentTrack.externalUrl || '';
        const favoriteTrack = favorites.find(
          (fav) => fav.trackId === trackId || fav.externalUrl === currentTrack.externalUrl
        );
        
        if (favoriteTrack) {
          await removeTrackFromFavorites(favoriteTrack.trackId);
          setIsCurrentTrackLiked(false);
          toast.success('Removed from favorites', {
            position: 'top-right',
            autoClose: 2000,
          });
        }
      } else {
        await addTrackToFavorites(currentTrack);
        setIsCurrentTrackLiked(true);
        toast.success('Added to favorites', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || 'Failed to update favorite status', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsProcessingPlaylistAction(false);
    }
  };

  const handleViewArtist = () => {
    if (!currentTrack) return;
    navigate('/artists');
    toast.info(`Search for "${currentTrack.artists}" on the Artists page`, {
      position: 'top-right',
      autoClose: 3000,
    });
    setShowActionMenu(false);
  };

  const handleShareTrack = async () => {
    if (!currentTrack) return;
    
    if (navigator.share && currentTrack.externalUrl) {
      try {
        await navigator.share({
          title: currentTrack.name,
          text: `Check out "${currentTrack.name}" by ${currentTrack.artists}`,
          url: currentTrack.externalUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else if (currentTrack.externalUrl) {
      try {
        await navigator.clipboard.writeText(currentTrack.externalUrl);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    } else {
      toast.info('Share link not available for this track');
    }
    setShowActionMenu(false);
  };

  if (!spotifyReference || !currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-3 md:px-10">
      <div className="w-full max-w-5xl">
        <div className="">
          <div className="flex items-center gap-4">
            {/* Spotify Embed Player */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
              <SpotifyEmbed urlOrId={spotifyReference} autoPlay compact />
            </div>

            {/* + Button with Menu */}
            <div className="relative flex-shrink-0" ref={actionMenuRef}>
              <button
                type="button"
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-100 text-black transition-all shadow-md hover:shadow-lg"
                aria-label="More actions"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              {/* Action Menu Dropdown */}
              {showActionMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-64 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md shadow-2xl overflow-hidden z-50">
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        openPlaylistModal();
                        setShowActionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Add to playlist</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleLiked();
                        setShowActionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <HeartIcon
                        size={18}
                        className="w-[18px] h-[18px]"
                        filled={isCurrentTrackLiked}
                      />
                      <span>{isCurrentTrackLiked ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleViewArtist}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>View artist</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareTrack}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <span>Share track</span>
                    </button>

                    <div className="border-t border-white/10 my-1"></div>

                    <a
                      href={currentTrack.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowActionMenu(false)}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      {currentTrack.source === 'youtube' || currentTrack.externalUrl?.includes('youtube.com') ? (
                        <>
                          <YouTubeIcon size={18} className="w-[18px] h-[18px]" />
                          <span>Open in YouTube</span>
                        </>
                      ) : currentTrack.source === 'soundcloud' || currentTrack.externalUrl?.includes('soundcloud.com') ? (
                        <>
                          <SoundCloudIcon size={18} className="w-[18px] h-[18px]" />
                          <span>Open in SoundCloud</span>
                        </>
                      ) : (
                        <>
                          <SpotifyIcon size={18} className="w-[18px] h-[18px]" />
                          <span>Open in Spotify</span>
                        </>
                      )}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopPlayer();
                setShowActionMenu(false);
              }}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 hover:bg-gray-100 text-black transition-all shadow-md hover:shadow-lg flex-shrink-0"
              aria-label="Close player"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
          <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Add to Playlist</h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {isLoadingPlaylists ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't have any playlists yet.</p>
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    navigate('/dashboard');
                    toast.info('Create a playlist from your dashboard');
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white text-sm transition-colors"
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={isProcessingPlaylistAction}
                    className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-white">{playlist.name}</div>
                    <div className="text-sm text-gray-400">
                      {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSpotifyPlayer;


