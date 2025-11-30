import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPlaylists, createPlaylist, deletePlaylist, type PlaylistSummary } from '../api/music.api';
import { useSpotifyPlayer } from '../context';

const Playlists: React.FC = () => {
  const navigate = useNavigate();
  const { spotifyReference: activeSpotifyReference } = useSpotifyPlayer();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load playlists';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      toast.error('Playlist name is required');
      return;
    }

    setIsCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim() || undefined);
      setPlaylists([newPlaylist, ...playlists]);
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast.success('Playlist created successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return;
    }

    try {
      await deletePlaylist(playlistId);
      setPlaylists(playlists.filter((p) => p.id !== playlistId));
      toast.success('Playlist deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete playlist');
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  const hasActivePlayer = Boolean(activeSpotifyReference);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-black via-[#080512] to-[#1a0f2a] text-white transition-all ${
        hasActivePlayer ? 'pb-44 md:pb-52' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Playlists</h1>
              <p className="text-gray-400">Manage and organize your favorite tracks</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/50"
            >
              + Create Playlist
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading playlists...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200 mb-6">
            {error}
          </div>
        )}

        {/* Playlists Grid */}
        {!isLoading && !error && (
          <>
            {playlists.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                <p className="text-gray-400 mb-6">Create your first playlist to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-medium transition-all"
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    {/* Playlist Card */}
                    <div className="p-6">
                      <div className="mb-4 aspect-square rounded-xl bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-pink-500/20 flex items-center justify-center">
                        <svg
                          className="h-16 w-16 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 truncate">{playlist.name}</h3>
                      {playlist.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{playlist.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}</span>
                        <span className="text-xs">
                          {new Date(playlist.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id, playlist.name);
                      }}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete playlist"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;

