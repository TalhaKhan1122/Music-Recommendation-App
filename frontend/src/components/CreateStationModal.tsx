import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { CloseIcon } from './icons';
import { getTopArtistsShowcase, searchSpotifyCatalog, type ArtistMetadata } from '../api/music.api';
import { useFollowedArtists } from '../context';

interface CreateStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStation: (artists: Array<{ id: string; name: string; image?: string }>) => void;
}

const CreateStationModal: React.FC<CreateStationModalProps> = ({ isOpen, onClose, onCreateStation }) => {
  const { followedArtists } = useFollowedArtists();
  const [selectedArtists, setSelectedArtists] = useState<Array<{ id: string; name: string; image?: string }>>([]);
  const [availableArtists, setAvailableArtists] = useState<Array<{ id: string; name: string; image?: string }>>([]);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; image?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20); // Initial number of artists to show
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentSearchLimit, setCurrentSearchLimit] = useState(20); // Current limit for search API calls
  const [currentPopularLimit, setCurrentPopularLimit] = useState(10); // Current limit per category for popular artists
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const SEARCH_DEBOUNCE_MS = 800;
  const INITIAL_DISPLAY_LIMIT = 20;
  const LOAD_MORE_INCREMENT = 20;
  const INITIAL_POPULAR_LIMIT = 10; // Initial artists per category
  const POPULAR_LIMIT_INCREMENT = 10; // How many more to fetch per category

  useEffect(() => {
    if (isOpen) {
      setCurrentPopularLimit(INITIAL_POPULAR_LIMIT);
      loadAvailableArtists();
      setSelectedArtists([]);
      setSearchQuery('');
      setSearchResults([]);
      setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }
  }, [isOpen]);

  const loadAvailableArtists = async (limitPerCategory?: number, showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      // Get followed artists (only on initial load)
      const followedList = limitPerCategory === undefined 
        ? Object.values(followedArtists).map(artist => ({
            id: artist.artistId || artist.id || '',
            name: artist.name || 'Unknown',
            image: artist.image,
          })).filter(a => a.id)
        : [];

      // Get popular artists from all categories
      const payload = await getTopArtistsShowcase({
        limitPerCategory: limitPerCategory || currentPopularLimit,
        topTrackLimit: 0,
      });

      const popularArtists: Array<{ id: string; name: string; image?: string }> = [];
      payload.sections.forEach((section) => {
        section.artists.forEach((artist) => {
          if (artist.id && artist.name) {
            popularArtists.push({
              id: artist.id,
              name: artist.name,
              image: artist.image,
            });
          }
        });
      });

      if (limitPerCategory === undefined) {
        // Initial load: Combine followed and popular artists, remove duplicates
        const allArtists = [...followedList];
        popularArtists.forEach(artist => {
          if (!allArtists.find(a => a.id === artist.id)) {
            allArtists.push(artist);
          }
        });
        setAvailableArtists(allArtists);
      } else {
        // Loading more: Append new popular artists to existing list, remove duplicates
        setAvailableArtists(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNewArtists = popularArtists.filter(a => !existingIds.has(a.id));
          return [...prev, ...uniqueNewArtists];
        });
      }
    } catch (error: any) {
      console.error('Error loading artists:', error);
      toast.error('Failed to load artists');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Debounced Spotify search
  useEffect(() => {
    // Reset display limit and search limit when search changes
    setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    setCurrentSearchLimit(INITIAL_DISPLAY_LIMIT);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // If search query is empty, clear search results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set loading state
    setIsSearching(true);

    // Debounce the search
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchSpotifyCatalog(searchQuery.trim(), {
          artistLimit: INITIAL_DISPLAY_LIMIT, // Start with initial limit
          trackLimit: 0, // We only need artists
        });

        // Convert search results to our format
        const artists = results.artists.map(artist => ({
          id: artist.id,
          name: artist.name || 'Unknown',
          image: artist.image,
        }));

        setSearchResults(artists);
      } catch (error: any) {
        console.error('Error searching Spotify:', error);
        toast.error('Failed to search artists. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        searchDebounceRef.current = null;
      }
    }, SEARCH_DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Combine available artists and search results
  // If there's a search query, prioritize search results, otherwise show available artists
  const displayArtists = searchQuery.trim() 
    ? searchResults // Show Spotify search results when searching
    : availableArtists; // Show available artists when not searching

  // Remove duplicates (in case an artist appears in both lists)
  const uniqueArtists = displayArtists.filter((artist, index, self) =>
    index === self.findIndex(a => a.id === artist.id)
  );
  
  // Get artists to display (limited by displayLimit)
  const displayedArtists = uniqueArtists.slice(0, displayLimit);
  
  // Determine if there are more artists to load
  // For search: check if we got the full amount requested (might be more available)
  // For available artists: always allow loading more from Spotify (we can always fetch more popular artists)
  const hasMoreArtists = searchQuery.trim() 
    ? (searchResults.length >= currentSearchLimit && searchResults.length > 0 && displayedArtists.length < searchResults.length) // If we got full limit and haven't shown all, there might be more
    : true; // For available artists, always allow fetching more popular artists from Spotify

  const toggleArtistSelection = (artist: { id: string; name: string; image?: string }) => {
    setSelectedArtists(prev => {
      const isSelected = prev.some(a => a.id === artist.id);
      if (isSelected) {
        return prev.filter(a => a.id !== artist.id);
      } else {
        if (prev.length >= 5) {
          toast.error('Maximum 5 artists allowed');
          return prev;
        }
        return [...prev, artist];
      }
    });
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      if (searchQuery.trim()) {
        // Fetch more search results from Spotify
        const newLimit = currentSearchLimit + LOAD_MORE_INCREMENT;
        setCurrentSearchLimit(newLimit);
        
        const results = await searchSpotifyCatalog(searchQuery.trim(), {
          artistLimit: newLimit,
          trackLimit: 0,
        });

        // Convert search results to our format
        const newArtists = results.artists.map(artist => ({
          id: artist.id,
          name: artist.name || 'Unknown',
          image: artist.image,
        }));

        // Update search results with all artists from the new fetch
        setSearchResults(newArtists);
        
        // Also increase display limit to show more
        setDisplayLimit(prev => Math.min(prev + LOAD_MORE_INCREMENT, newArtists.length));
      } else {
        // Fetch more popular artists from Spotify
        const newLimit = currentPopularLimit + POPULAR_LIMIT_INCREMENT;
        setCurrentPopularLimit(newLimit);
        
        // Fetch more popular artists from Spotify (don't show main loading spinner)
        await loadAvailableArtists(newLimit, false);
        
        // Increase display limit to show more
        setDisplayLimit(prev => prev + LOAD_MORE_INCREMENT);
      }
    } catch (error: any) {
      console.error('Error loading more artists:', error);
      toast.error('Failed to load more artists. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreate = () => {
    if (selectedArtists.length < 2) {
      toast.error('Please select at least 2 artists');
      return;
    }
    if (selectedArtists.length > 5) {
      toast.error('Maximum 5 artists allowed');
      return;
    }
    onCreateStation(selectedArtists);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      style={{ minHeight: '100vh', height: '100%' }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-white/20 backdrop-blur-sm" style={{ minHeight: '100vh', height: '100%' }} />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl p-5 sm:p-6 md:p-8 my-auto max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors p-1 z-10"
          aria-label="Close"
        >
          <CloseIcon size="20" className="sm:w-6 sm:h-6" />
        </button>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 pr-8 sm:pr-12">
          Create Radio Station
        </h2>

        {/* Selected Artists Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-400">
            Selected: {selectedArtists.length} / 5 (Minimum: 2)
          </p>
          {selectedArtists.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedArtists.map(artist => (
                <div
                  key={artist.id}
                  className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/50 rounded-lg px-3 py-1.5"
                >
                  <span className="text-sm text-white">{artist.name}</span>
                  <button
                    onClick={() => toggleArtistSelection(artist)}
                    className="text-purple-300 hover:text-white transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists from Spotify..."
            className="w-full px-4 py-2.5 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
          {searchQuery.trim() && !isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Artists List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {isLoading && !searchQuery.trim() ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : uniqueArtists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery.trim() 
                  ? isSearching 
                    ? 'Searching Spotify...' 
                    : 'No artists found. Try a different search term.'
                  : 'No artists available'}
              </p>
            </div>
          ) : (
            <>
              {searchQuery.trim() && uniqueArtists.length > 0 && !isSearching && (
                <div className="mb-3 pb-2 border-b border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Found {uniqueArtists.length} artist{uniqueArtists.length !== 1 ? 's' : ''} on Spotify
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
              {!searchQuery.trim() && availableArtists.length > 0 && (
                <div className="mb-3 pb-2 border-b border-gray-700">
                  <p className="text-xs text-gray-400">
                    Your followed artists and popular artists
                  </p>
                </div>
              )}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {displayedArtists.map((artist) => {
                  const isSelected = selectedArtists.some(a => a.id === artist.id);
                  return (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => toggleArtistSelection(artist)}
                      className={`relative overflow-hidden rounded-lg aspect-square p-1.5 text-left transition-all ${
                        isSelected
                          ? 'ring-2 ring-purple-500 bg-purple-500/20'
                          : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {artist.image ? (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover rounded-lg mb-1"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center mb-1">
                          <span className="text-sm font-bold text-white">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] xs:text-xs font-medium text-white truncate leading-tight">{artist.name}</p>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Load More Button */}
              {hasMoreArtists && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 hover:text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-300"></div>
                        <span>Loading from Spotify...</span>
                      </>
                    ) : (
                      <span>
                        {searchQuery.trim() 
                          ? `Load More Artists from Spotify` 
                          : `Load More Popular Artists from Spotify`}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedArtists.length < 2 || selectedArtists.length > 5}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            Create Station
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStationModal;

