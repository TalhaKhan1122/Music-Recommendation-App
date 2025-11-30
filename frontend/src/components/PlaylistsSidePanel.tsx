import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  getPlaylists, 
  getFavoriteTracks, 
  deletePlaylist,
  type PlaylistSummary,
  type FavoriteTrack 
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

  const handlePlaylistClick = (playlistId: string) => {
    // TODO: Show playlist details in a modal or expand in side panel
    toast.info('Playlist details coming soon!', {
      position: 'top-right',
      autoClose: 2000,
    });
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
              {playlists.length === 0 ? (
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
                        // Handle playlist options
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
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

