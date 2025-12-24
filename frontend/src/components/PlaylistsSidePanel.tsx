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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-900/98 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white text-xl font-bold">Your Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Close panel"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'playlists'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'liked'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Liked Songs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          ) : activeTab === 'playlists' ? (
            <div className="p-4 space-y-2">
              {isLoadingPlaylist ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : selectedPlaylist ? (
                <div>
                  {/* Playlist Header */}
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="text-gray-400 hover:text-white mb-3 flex items-center gap-2 text-sm transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Back to Playlists
                    </button>
                    <h3 className="text-white font-bold text-lg mb-1">{selectedPlaylist.name}</h3>
                    {selectedPlaylist.description && (
                      <p className="text-gray-400 text-sm mb-2">{selectedPlaylist.description}</p>
                    )}
                    <p className="text-gray-500 text-xs">
                      {selectedPlaylist.trackCount} {selectedPlaylist.trackCount === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>

                  {/* Playlist Tracks */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                      selectedPlaylist.tracks.map((track, index) => (
                        <div
                          key={track.trackId || index}
                          onClick={() => handlePlayPlaylistTrack(track, selectedPlaylist.tracks)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600">
                            {track.albumImage ? (
                              <img 
                                src={track.albumImage} 
                                alt={track.album}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                                  <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{track.name}</p>
                            <p className="text-gray-400 text-xs truncate">{track.artists || 'Unknown Artist'}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPlaylistTrack(track, selectedPlaylist.tracks);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-2"
                          >
                            <PlayIcon size={20} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">This playlist is empty</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No playlists yet</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist.id)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{playlist.name}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaylistClick(playlist.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-2"
                      title="Play playlist"
                    >
                      <PlayIcon size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {likedSongs.length === 0 ? (
                <div className="text-center py-12">
                  <HeartIcon size={48} className="mx-auto mb-4 text-gray-600" filled />
                  <p className="text-gray-400 text-sm">No liked songs yet</p>
                </div>
              ) : (
                likedSongs.map((track) => (
                  <div
                    key={track._id}
                    onClick={() => handlePlayTrack(track)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-pink-600 to-red-600">
                      {track.albumImage ? (
                        <img 
                          src={track.albumImage} 
                          alt={track.album}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HeartIcon size={24} className="text-white" filled />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{track.name}</p>
                      <p className="text-gray-400 text-xs truncate">{track.artists || 'Unknown Artist'}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-2"
                    >
                      <PlayIcon size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlaylistsSidePanel;

