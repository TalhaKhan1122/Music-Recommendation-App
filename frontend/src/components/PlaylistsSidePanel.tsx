import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  getPlaylists, 
  getFavoriteTracks, 
  deletePlaylist,
  getPlaylistById,
  type PlaylistSummary,
  type FavoriteTrack,
  type PlaylistDetail
} from '../api/music.api';
import { useSpotifyPlayer } from '../context';
import { PlayIcon, HeartIcon } from './icons';

interface PlaylistsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlaylistsSidePanel: React.FC<PlaylistsSidePanelProps> = ({ isOpen, onClose }) => {
  const { playTrack } = useSpotifyPlayer();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [likedSongs, setLikedSongs] = useState<FavoriteTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked'>('playlists');
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistDetail | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch playlists and liked songs
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [playlistsData, favoritesData] = await Promise.all([
        getPlaylists(),
        getFavoriteTracks()
      ]);
      setPlaylists(playlistsData);
      setLikedSongs(favoritesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load playlists and liked songs', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaylistClick = async (playlistId: string) => {
    setIsLoadingPlaylist(true);
    try {
      const playlist = await getPlaylistById(playlistId);
      setSelectedPlaylist(playlist);
      
      // Show playlist tracks - user can click to play
      if (playlist.tracks && playlist.tracks.length > 0) {
        toast.success(`Loaded ${playlist.tracks.length} tracks from "${playlist.name}"`, {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        toast.info('This playlist is empty', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } catch (error: any) {
      console.error('Error fetching playlist:', error);
      toast.error(error.message || 'Failed to load playlist', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const handlePlayPlaylistTrack = (track: any, allTracks: any[] = []) => {
    const trackData = {
      id: track.trackId || track.id,
      name: track.name,
      artists: track.artists || '',
      album: track.album || '',
      albumImage: track.albumImage,
      externalUrl: track.externalUrl,
      previewUrl: track.previewUrl,
      source: track.source || 'spotify',
    };
    
    // Get the Spotify reference (track ID or external URL)
    let reference = '';
    if (track.externalUrl) {
      // Extract track ID from Spotify URL if it's a full URL
      const spotifyUrlMatch = track.externalUrl.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (spotifyUrlMatch) {
        reference = spotifyUrlMatch[1];
      } else {
        reference = track.externalUrl;
      }
    } else if (track.trackId) {
      reference = track.trackId;
    }
    
    if (!reference) {
      toast.error('Unable to play this track - missing track reference', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    
    playTrack(trackData, reference);
    toast.success(`Playing ${track.name} from playlist`, {
      position: 'top-right',
      autoClose: 2000,
    });
    
    // Store playlist tracks in context or localStorage for queue functionality
    if (allTracks.length > 0) {
      // You can extend the context to store playlist queue if needed
      console.log('🎵 Playlist tracks available:', allTracks.length);
    }
    
    onClose(); // Close the panel after selecting a track
  };

  const handlePlayTrack = (track: FavoriteTrack) => {
    const trackData = {
      id: track.trackId || track._id,
      name: track.name,
      artists: track.artists || '',
      album: track.album || '',
      albumImage: track.albumImage,
      externalUrl: track.externalUrl,
      previewUrl: track.previewUrl,
      source: track.source || 'spotify',
    };
    
    // Get the Spotify reference (track ID or external URL)
    let reference = '';
    if (track.externalUrl) {
      // Extract track ID from Spotify URL if it's a full URL
      const spotifyUrlMatch = track.externalUrl.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (spotifyUrlMatch) {
        reference = spotifyUrlMatch[1];
      } else {
        reference = track.externalUrl;
      }
    } else if (track.trackId) {
      reference = track.trackId;
    }
    
    if (!reference) {
      toast.error('Unable to play this track - missing track reference', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    
    playTrack(trackData, reference);
    toast.success(`Playing ${track.name}`, {
      position: 'top-right',
      autoClose: 2000,
    });
    onClose(); // Close the panel after selecting a track
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/20 backdrop-blur-sm z-50 transition-opacity min-h-screen h-full"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-black border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-white text-xl sm:text-2xl font-bold">Your Library</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label="Close panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'playlists'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'liked'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Liked Songs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          ) : activeTab === 'playlists' ? (
            <div className="p-4 sm:p-6 space-y-3">
              {isLoadingPlaylist ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : selectedPlaylist ? (
                <div>
                  {/* Playlist Header */}
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="text-white/60 hover:text-white mb-4 flex items-center gap-2 text-sm transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Back to Playlists
                    </button>
                    <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{selectedPlaylist.name}</h3>
                    {selectedPlaylist.description && (
                      <p className="text-white/60 text-sm mb-2">{selectedPlaylist.description}</p>
                    )}
                    <p className="text-white/40 text-xs">
                      {selectedPlaylist.trackCount} {selectedPlaylist.trackCount === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>

                  {/* Playlist Tracks */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                      selectedPlaylist.tracks.map((track, index) => (
                        <button
                          key={track.trackId || index}
                          type="button"
                          onClick={() => handlePlayPlaylistTrack(track, selectedPlaylist.tracks)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group text-left"
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/40 text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/40 to-indigo-500/40">
                            {track.albumImage ? (
                              <img 
                                src={track.albumImage} 
                                alt={track.album}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                                  <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{track.name}</p>
                            <p className="text-white/60 text-xs truncate">{track.artists || 'Unknown Artist'}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPlaylistTrack(track, selectedPlaylist.tracks);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-2 rounded-lg hover:bg-white/10"
                          >
                            <PlayIcon size={18} />
                          </button>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-12 rounded-xl border border-white/10 bg-white/5">
                        <p className="text-white/60 text-sm">This playlist is empty</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-white/60 text-sm">No playlists yet</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handlePlaylistClick(playlist.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group text-left"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center border border-white/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                        <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{playlist.name}</p>
                      <p className="text-white/60 text-xs truncate">
                        {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaylistClick(playlist.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-2 rounded-lg hover:bg-white/10"
                      title="View playlist"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-3">
              {likedSongs.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-white/10 bg-white/5">
                  <HeartIcon size={48} className="mx-auto mb-4 text-white/40" filled />
                  <p className="text-white/60 text-sm">No liked songs yet</p>
                </div>
              ) : (
                likedSongs.map((track) => (
                  <button
                    key={track._id}
                    type="button"
                    onClick={() => handlePlayTrack(track)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group text-left"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-pink-500/40 to-red-500/40 border border-white/10">
                      {track.albumImage ? (
                        <img 
                          src={track.albumImage} 
                          alt={track.album}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HeartIcon size={20} className="text-white/70" filled />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{track.name}</p>
                      <p className="text-white/60 text-xs truncate">{track.artists || 'Unknown Artist'}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-2 rounded-lg hover:bg-white/10"
                    >
                      <PlayIcon size={18} />
                    </button>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
};

export default PlaylistsSidePanel;

