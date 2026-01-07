import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type {
  ArtistMetadata,
  ArtistShowcaseSection,
  TopArtistsPayload,
  SpotifyCatalogSearchResult,
  Track,
} from '../api/music.api';
import { getTopArtistsShowcase, searchSpotifyCatalog, getTracksByMood, getRecommendationsByArtists, getArtistById } from '../api/music.api';
import { useSpotifyPlayer, useFollowedArtists } from '../context';
import CreateStationModal from '../components/CreateStationModal';
import BeatifyLogo from '../assets/beatify-logo.png';

const INITIAL_LIMIT = 6;
const LIMIT_STEP = 6;
const DEFAULT_TOP_TRACK_LIMIT = 6;
const SEARCH_ARTIST_LIMIT = 12;
const SEARCH_TRACK_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 2000;

const emptySearchResult = (): SpotifyCatalogSearchResult => ({
  artists: [],
  tracks: [],
});

const deriveMaxLimit = (map: Record<string, number>): number => {
  const values = Object.values(map);
  if (!values.length) {
    return INITIAL_LIMIT;
  }
  return Math.max(...values);
};

const formatFollowers = (value?: number): string => {
  if (!value || value <= 0) {
    return '--';
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return value.toLocaleString();
};

const formatGenres = (genres?: string[]): string => {
  if (!genres?.length) {
    return 'Genres not available';
  }
  return genres
    .slice(0, 4)
    .map((genre) =>
      genre
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' - ');
};

const getArtistInitials = (name?: string): string => {
  if (!name) {
    return 'AR';
  }
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || 'AR';
};

type LoaderCardProps = {
  eyebrow?: string;
  headline: string;
  description?: string;
  minHeightClass?: string;
};

const LoaderCard: React.FC<LoaderCardProps> = ({
  eyebrow = 'Please wait',
  headline,
  description,
  minHeightClass = 'min-h-[50vh]',
}) => (
  <div className={`flex ${minHeightClass} items-center justify-center`} aria-live="polite">
    <div
      role="status"
      className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 text-center shadow-xl shadow-purple-500/20 backdrop-blur"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/15" />
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/40 animate-pulse" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">{eyebrow}</p>
        <p className="text-lg font-semibold text-white">{headline}</p>
        {description && <p className="text-xs text-white/50 max-w-xs">{description}</p>}
      </div>
    </div>
  </div>
);

const ArtistCardSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-3 animate-pulse">
    {/* Circular Skeleton */}
    <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 rounded-full bg-white/10 border-2 border-white/20" />
    {/* Name Skeleton */}
    <div className="h-3 xs:h-3.5 sm:h-4 md:h-5 w-16 xs:w-20 sm:w-24 md:w-28 rounded bg-white/10" />
  </div>
);

const Artists: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sections, setSections] = useState<ArtistShowcaseSection[]>([]);
  const [meta, setMeta] = useState<Pick<TopArtistsPayload, 'fetchedAt' | 'limitPerCategory' | 'totalArtists'>>({
    fetchedAt: '',
    limitPerCategory: 0,
    totalArtists: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SpotifyCatalogSearchResult>(() => emptySearchResult());
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearchResults, setHasSearchResults] = useState<boolean>(false);
  const [popularTracks, setPopularTracks] = useState<Record<string, Track[]>>({
    punjabi: [],
    english: [],
    global: [],
    pakistani: [],
  });
  const [isLoadingPopularTracks, setIsLoadingPopularTracks] = useState<Record<string, boolean>>({
    punjabi: false,
    english: false,
    global: false,
    pakistani: false,
  });
  const [recommendedStations, setRecommendedStations] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ id: string; name: string; image?: string }>;
    color: string;
  }>>([]);
  const [customStations, setCustomStations] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ id: string; name: string; image?: string }>;
    color: string;
  }>>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [showCreateStationModal, setShowCreateStationModal] = useState(false);
  // Featured artists/tracks moved to StationDetail page
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const stationsScrollRef = useRef<HTMLDivElement>(null);
  const { playTrack, spotifyReference: activeSpotifyReference } = useSpotifyPlayer();
  const { isFollowed, toggleFollow, followedArtists } = useFollowedArtists();

  const requestedLimitRef = useRef<Record<string, number>>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedSearchRef = useRef<string>('');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const autoFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchArtists = useCallback(
    async (limitOverride?: number) => {
      const limit = limitOverride ?? Math.max(deriveMaxLimit(requestedLimitRef.current), INITIAL_LIMIT);
      setIsLoading(true);
      setError(null);

      try {
        const payload = await getTopArtistsShowcase({
          limitPerCategory: limit,
          topTrackLimit: DEFAULT_TOP_TRACK_LIMIT,
        });

        const nextHasMore: Record<string, boolean> = {};
        payload.sections.forEach((section) => {
          const requested = requestedLimitRef.current[section.category] ?? INITIAL_LIMIT;
          const hasUnrevealed = section.artists.length > requested;
          nextHasMore[section.category] = Boolean(section.hasMore) || hasUnrevealed;
        });

        setSections(payload.sections);
        setMeta({
          fetchedAt: payload.fetchedAt,
          limitPerCategory: payload.limitPerCategory,
          totalArtists: payload.totalArtists,
        });
        setHasMoreMap(nextHasMore);
      } catch (err: any) {
        const message = err?.message || 'Failed to load artists from Spotify.';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Calculate viewport size and cards that fit
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Calculate cards per row based on screen width
  const getCardsPerRow = useCallback((width: number): number => {
    if (width >= 1920) return 10; // 3xl
    if (width >= 1536) return 9;  // 2xl
    if (width >= 1280) return 8;  // xl
    if (width >= 1024) return 7;  // lg
    if (width >= 768) return 6;   // md
    if (width >= 640) return 5;    // sm
    if (width >= 475) return 4;    // xs
    return 3; // default
  }, []);

  // Calculate total cards needed - only one row
  const calculateCardsNeeded = useCallback((width: number): number => {
    const cardsPerRow = getCardsPerRow(width);
    // Only return cards per row (one row)
    return cardsPerRow;
  }, [getCardsPerRow]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const fetchPopularTracks = useCallback(async (category: 'punjabi' | 'english' | 'global' | 'pakistani') => {
    setIsLoadingPopularTracks((prev) => ({ ...prev, [category]: true }));
    try {
      // For Pakistani category, fetch tracks from Pakistani artists specifically
      if (category === 'pakistani') {
        const payload = await getTopArtistsShowcase({
          limitPerCategory: 12,
          topTrackLimit: 3,
        });
        
        // Find Pakistani section and collect tracks
        const pakistaniSection = payload.sections.find(s => s.category === 'pakistani');
        if (pakistaniSection) {
          const pakistaniTracks: Track[] = [];
          pakistaniSection.artists.forEach(artist => {
            if (artist.topTracks && Array.isArray(artist.topTracks)) {
              pakistaniTracks.push(...artist.topTracks);
            }
          });
          // Remove duplicates by track ID
          const uniqueTracks = pakistaniTracks.filter((track, index, self) =>
            index === self.findIndex(t => t.id === track.id)
          );
          setPopularTracks((prev) => ({ ...prev, [category]: uniqueTracks.slice(0, 12) }));
        } else {
          setPopularTracks((prev) => ({ ...prev, [category]: [] }));
        }
      } else {
        // Use different moods for other categories
        const moodMap: Record<string, string> = {
          punjabi: 'excited', // High energy for Punjabi
          english: 'happy', // Popular English tracks
          global: 'excited', // Trending global hits
        };
        
        const mood = moodMap[category] || 'excited';
        const response = await getTracksByMood(mood, 12, 'recommendations', 'spotify');
        setPopularTracks((prev) => ({ ...prev, [category]: response.data.tracks }));
      }
    } catch (err: any) {
      console.error(`Error fetching popular tracks for ${category}:`, err);
      // Don't show error toast, just log it
    } finally {
      setIsLoadingPopularTracks((prev) => ({ ...prev, [category]: false }));
    }
  }, []);

  // Check scroll position and update button visibility
  const checkScrollButtons = useCallback(() => {
    const container = stationsScrollRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);

  // Generate recommended stations/mixes from followed artists and global famous artists
  const generateRecommendedStations = useCallback(async () => {
    setIsLoadingStations(true);
    const followedList = Object.values(followedArtists);

    // Group artists into mixes (collaborations)
    const stations: Array<{
      id: string;
      name: string;
      artists: Array<{ id: string; name: string; image?: string }>;
      color: string;
    }> = [];

    // Solid vibrant colors matching the image style (red-orange primary)
    const colors = [
      '#FF6B35', // Red-orange (primary from image)
      '#FF4757', // Red
      '#FF6348', // Tomato red
      '#FF8C42', // Orange
      '#E74C3C', // Bright red
      '#FF6B9D', // Pink-red
      '#FF8E53', // Orange
      '#FF5252', // Red
    ];

    // Helper function to create a station from artists
    const createStation = (artists: Array<{ id: string; name: string; image?: string }>, baseId: string): void => {
      if (artists.length < 2) return;
      
      const mixName = artists.map(a => a.name || 'Artist').join(' & ');
      const stationId = `mix-${baseId}`;
      
      stations.push({
        id: stationId,
        name: mixName,
        artists: artists,
        color: colors[(stations.length) % colors.length],
      });
    };

    // 1. Create stations from followed artists (if any)
    if (followedList.length >= 2) {
      // Create pairs of 2 artists from followed list
      const maxFollowedPairs = Math.min(3, Math.floor(followedList.length / 2));
      for (let i = 0; i < maxFollowedPairs; i++) {
        const idx1 = i * 2;
        const idx2 = idx1 + 1;
        if (idx2 < followedList.length) {
          const artist1 = followedList[idx1];
          const artist2 = followedList[idx2];
          
          if (artist1 && artist2) {
            const spotifyId1 = artist1.artistId || artist1.id || '';
            const spotifyId2 = artist2.artistId || artist2.id || '';
            
            if (spotifyId1 && spotifyId2) {
              createStation(
                [
                  {
                    id: spotifyId1,
                    name: artist1.name || 'Unknown',
                    image: artist1.image,
                  },
                  {
                    id: spotifyId2,
                    name: artist2.name || 'Unknown',
                    image: artist2.image,
                  },
                ],
                `${spotifyId1}-${spotifyId2}`
              );
            }
          }
        }
      }
    }

    // 2. Fetch and create stations from global famous artists (all categories)
    try {
      const payload = await getTopArtistsShowcase({
        limitPerCategory: 8, // Get more artists to create good mixes
        topTrackLimit: DEFAULT_TOP_TRACK_LIMIT,
      });

      // Collect artists from all categories
      const allTopArtists: Array<{ id: string; name: string; image?: string }> = [];
      payload.sections.forEach((section) => {
        section.artists.forEach((artist) => {
          if (artist.id && artist.name) {
            allTopArtists.push({
              id: artist.id,
              name: artist.name,
              image: artist.image,
            });
          }
        });
      });

      // Shuffle to mix categories
      const shuffled = [...allTopArtists].sort(() => Math.random() - 0.5);

      // Create stations from global artists (mix different categories)
      // Only create 4 default stations
      const maxGlobalStations = 4 - stations.length; // Ensure total is 4
      for (let i = 0; i < Math.min(maxGlobalStations, Math.floor(shuffled.length / 2)); i++) {
        const idx1 = i * 2;
        const idx2 = idx1 + 1;
        if (idx2 < shuffled.length) {
          const artist1 = shuffled[idx1];
          const artist2 = shuffled[idx2];
          
          if (artist1 && artist2 && artist1.id && artist2.id) {
            createStation(
              [artist1, artist2],
              `global-${artist1.id}-${artist2.id}`
            );
          }
        }
      }

      // Also create some 3-artist mixes from global artists
      if (shuffled.length >= 3) {
        const maxTripleMixes = 2;
        for (let i = 0; i < Math.min(maxTripleMixes, Math.floor(shuffled.length / 3)); i++) {
          const idx1 = i * 3;
          const idx2 = idx1 + 1;
          const idx3 = idx1 + 2;
          if (idx3 < shuffled.length) {
            const artist1 = shuffled[idx1];
            const artist2 = shuffled[idx2];
            const artist3 = shuffled[idx3];
            
            if (artist1 && artist2 && artist3 && artist1.id && artist2.id && artist3.id) {
              createStation(
                [artist1, artist2, artist3],
                `global-${artist1.id}-${artist2.id}-${artist3.id}`
              );
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching top artists for stations:', err);
      // Continue with just followed artists if this fails
    }

    // Only show first 4 stations as default
    const finalStations = stations.slice(0, 4);
    setRecommendedStations(finalStations);
    
    // Check scroll buttons after stations are set
    setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    setIsLoadingStations(false);
  }, [followedArtists, checkScrollButtons]);

  // Load custom stations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customStations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomStations(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading custom stations:', error);
    }
  }, []);

  // Handle creating custom station
  const handleCreateCustomStation = useCallback((artists: Array<{ id: string; name: string; image?: string }>) => {
    if (artists.length < 2 || artists.length > 5) {
      toast.error('Please select 2-5 artists');
      return;
    }

    const stationName = artists.map(a => a.name).join(' & ');
    const stationId = `custom-${Date.now()}-${artists.map(a => a.id).join('-')}`;
    
    const colors = [
      '#FF6B35', '#FF4757', '#FF6348', '#FF8C42',
      '#E74C3C', '#FF6B9D', '#FF8E53', '#FF5252',
    ];
    
    const newStation = {
      id: stationId,
      name: stationName,
      artists: artists,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    const updated = [...customStations, newStation];
    setCustomStations(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem('customStations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving custom station:', error);
    }

    toast.success(`Created station: ${stationName}`);
  }, [customStations]);

  // Scroll functions
  const scrollStations = useCallback((direction: 'left' | 'right') => {
    const container = stationsScrollRef.current;
    if (!container) return;

    const scrollAmount = 400; // Scroll by 400px
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }, []);

  // Handle station click - navigate to StationDetail page
  const handleStationClick = useCallback((station: {
    id: string;
    name: string;
    artists: Array<{ id: string; name: string; image?: string }>;
  }) => {
    const artistIds = station.artists.map(a => a.id).filter(Boolean);
    
    if (artistIds.length === 0) {
      toast.error('No valid artist IDs found for this station', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // Navigate to station detail page
    const params = new URLSearchParams();
    params.set('artists', artistIds.join(','));
    params.set('name', encodeURIComponent(station.name));
    
    navigate(`/station/${station.id}?${params.toString()}`);
  }, [navigate]);

  // Redirect to station page if someone navigates here with station params (backward compatibility)
  useEffect(() => {
    const stationId = searchParams.get('station');
    const artistIdsParam = searchParams.get('artists');
    const stationName = searchParams.get('name');

    if (stationId && artistIdsParam) {
      const params = new URLSearchParams();
      params.set('artists', artistIdsParam);
      if (stationName) params.set('name', stationName);
      navigate(`/station/${stationId}?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!hasSearchResults) {
      // Fetch popular tracks for each category
      fetchPopularTracks('punjabi');
      fetchPopularTracks('english');
      fetchPopularTracks('global');
      fetchPopularTracks('pakistani');
      // Generate recommended stations from followed artists and global artists
      generateRecommendedStations();
    }
  }, [fetchPopularTracks, hasSearchResults, generateRecommendedStations]);

  // Check scroll buttons on mount and resize
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [checkScrollButtons, recommendedStations]);

  const handleRefresh = useCallback(() => {
    requestedLimitRef.current = {};
    setHasMoreMap({});
    setSearchQuery('');
    setSearchResults(emptySearchResult());
    setHasSearchResults(false);
    setSearchError(null);
    setIsSearching(false);
    lastExecutedSearchRef.current = '';
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    fetchArtists();
  }, [fetchArtists]);

  const handleLoadMore = useCallback(
    async (category: string, limitOverride?: number) => {
      const current = requestedLimitRef.current[category] ?? INITIAL_LIMIT;
      const newLimit = limitOverride ?? (current + LIMIT_STEP);
      
      // Don't fetch if limit hasn't increased
      if (newLimit <= current) return;
      
      // Set loading state for this category
      setLoadingCategories((prev) => new Set(prev).add(category));
      
      requestedLimitRef.current = {
        ...requestedLimitRef.current,
        [category]: newLimit,
      };
      
      try {
        await fetchArtists();
      } finally {
        // Clear loading state for this category
        setLoadingCategories((prev) => {
          const next = new Set(prev);
          next.delete(category);
          return next;
        });
      }
    },
    [fetchArtists]
  );

  // Auto-fetch more artists if needed to fill one row
  useEffect(() => {
    if (viewportSize.width === 0 || isLoading || hasSearchResults) {
      return;
    }

    const cardsNeeded = calculateCardsNeeded(viewportSize.width);
    
    // Clear any existing timeout
    if (autoFetchTimeoutRef.current) {
      clearTimeout(autoFetchTimeoutRef.current);
    }

    // Debounce the auto-fetch
    autoFetchTimeoutRef.current = setTimeout(() => {
      sections.forEach((section) => {
        const categoryLimit = requestedLimitRef.current[section.category] ?? INITIAL_LIMIT;
        const sortedArtists = [...section.artists].sort(
          (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
        );
        const visibleArtists = sortedArtists.slice(0, categoryLimit);
        
        // If we don't have enough artists to fill one row, fetch more
        if (visibleArtists.length < cardsNeeded && hasMoreMap[section.category]) {
          const newLimit = Math.max(cardsNeeded, categoryLimit + LIMIT_STEP);
          if (newLimit > categoryLimit && !loadingCategories.has(section.category)) {
            handleLoadMore(section.category, newLimit);
          }
        }
      });
    }, 500);

    return () => {
      if (autoFetchTimeoutRef.current) {
        clearTimeout(autoFetchTimeoutRef.current);
      }
    };
  }, [viewportSize.width, sections, isLoading, hasSearchResults, hasMoreMap, loadingCategories, calculateCardsNeeded, handleLoadMore]);

  const executeSearch = useCallback(
    async (query: string, { force } = { force: false }) => {
      const normalized = query.trim();

      if (!normalized) {
        setSearchResults(emptySearchResult());
        setHasSearchResults(false);
        setSearchError(null);
        setIsSearching(false);
        lastExecutedSearchRef.current = '';
        return;
      }

      if (!force && normalized === lastExecutedSearchRef.current) {
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const result = await searchSpotifyCatalog(normalized, {
          artistLimit: SEARCH_ARTIST_LIMIT,
          trackLimit: SEARCH_TRACK_LIMIT,
        });

        if (searchQuery.trim() !== normalized) {
          return;
        }

        setSearchResults(result);
        setHasSearchResults(true);
        lastExecutedSearchRef.current = normalized;
      } catch (err: any) {
        const message = err?.message || 'Failed to search Spotify.';
        setSearchError(message);
        setHasSearchResults(false);
        toast.error(message);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!searchQuery.trim()) {
      executeSearch('');
      return;
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(searchQuery);
      debounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [searchQuery, executeSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };


  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeSearch(searchQuery, { force: true });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    executeSearch('', { force: true });
  };

  const deriveSpotifyReference = (track: Track): string | null => {
    // Prefer full Spotify URL
    if (track.externalUrl && track.externalUrl.trim() !== '') {
      return track.externalUrl;
    }
    // If we only have an ID, construct the full Spotify URL
    if (track.id && track.id.trim() !== '') {
      // Check if it's already a URL
      if (track.id.includes('spotify.com') || track.id.includes('http')) {
        return track.id;
      }
      // Construct full URL from track ID
      return `https://open.spotify.com/track/${track.id}`;
    }
    return null;
  };

  const handlePlayFromSearch = (track: Track) => {
    const reference = deriveSpotifyReference(track);

    if (!reference) {
      toast.error('Unable to load Spotify player for this track right now.');
      return;
    }

    playTrack(track, reference);
    toast.info(`Playing ${track.name} on Spotify`);
  };

  const handlePlayTrack = (track: Track) => {
    const reference = deriveSpotifyReference(track);
    if (reference) {
      playTrack(track, reference);
      toast.info(`Playing ${track.name}`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } else {
      toast.error('Unable to load Spotify player for this track. Missing track URL.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const hasActivePlayer = Boolean(activeSpotifyReference);
  const followedArtistList = useMemo(
    () =>
      Object.values(followedArtists).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      ),
    [followedArtists]
  );
  const hasFollowedArtists = followedArtistList.length > 0;

  const handleFollowedArtistSelect = useCallback(
    (artist: (typeof followedArtistList)[number]) => {
      if (!artist?.id) {
        return;
      }
      navigate(`/artists/${artist.id}`, { state: { artist, category: 'Followed Artists' } });
    },
    [navigate]
  );

  const renderArtistCard = (artist: ArtistMetadata, categoryTitle: string) => {
    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(`/artists/${artist.id}`, { state: { artist, category: categoryTitle } });
      }
    };

    return (
      <div
        key={`${categoryTitle}-${artist.id}`}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/artists/${artist.id}`, { state: { artist, category: categoryTitle } })}
        onKeyDown={handleCardKeyDown}
        className="group flex flex-col items-center gap-3 cursor-pointer transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 focus-visible:outline-offset-2 rounded-lg"
      >
        {/* Circular Artist Image */}
        <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900">
              <span className="text-white/70 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                {getArtistInitials(artist.name)}
              </span>
            </div>
          )}
        </div>
        
        {/* Artist Name */}
        <h3 className="text-white text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center w-full max-w-[100px] xs:max-w-[120px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[180px] xl:max-w-[200px] truncate px-1">
          {artist.name}
        </h3>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!hasSearchResults) {
      return null;
    }

    return (
      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Search Results</p>
            <h2 className="text-2xl font-semibold">Discovered on Spotify</h2>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition-colors hover:bg-white/10"
          >
            Clear results
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-[0.35em] text-white/40">Tracks</h3>
          {searchResults.tracks.length === 0 ? (
            <p className="text-sm text-white/60">No matching tracks found.</p>
          ) : (
            <div className="space-y-1.5">
              {searchResults.tracks.map((track: Track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handlePlayFromSearch(track)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md hover:bg-white/5 transition-colors group"
                >
                  {/* Artist/Album Image - Circular */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full overflow-hidden bg-white/10">
                    {track.albumImage ? (
                      <img
                        src={track.albumImage}
                        alt={track.artists || track.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm sm:text-base font-medium truncate group-hover:text-[#1DB954] transition-colors">
                      {track.name}
                    </p>
                    <p className="text-xs sm:text-sm text-white/50 truncate">
                      {track.artists}
                      {track.album ? ` • ${track.album}` : ''}
                    </p>
                  </div>

                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayFromSearch(track);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all flex-shrink-0 group/play"
                  >
                    <img 
                      src={BeatifyLogo} 
                      alt="Beatify" 
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                    />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/70 group-hover/play:text-white hidden sm:inline">
                      Play in Beatify
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/70 group-hover/play:text-white sm:hidden">
                      Play
                    </span>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-black via-[#080512] to-[#1a0f2a] text-white transition-all ${
        hasActivePlayer ? 'pb-44 md:pb-52' : ''
      }`}
    >
      <div className="w-full py-6 sm:py-8 md:py-12">
        <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6 md:gap-8 lg:gap-10 lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:items-start px-3 xs:px-4 sm:px-5 md:px-6">
          <aside className="order-first mb-4 sm:mb-6 md:mb-8 lg:order-first lg:mb-0 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24">
            <div className="flex h-full flex-col items-center rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/10 bg-[#09060f]/95 px-1.5 xs:px-2 sm:px-2.5 md:px-2 py-2 xs:py-2.5 sm:py-3 md:py-4 shadow-[0_25px_70px_rgba(20,0,40,0.45)] backdrop-blur-xl">
              {hasFollowedArtists ? (
                <>
                  {/* Mobile/Tablet: Horizontal Scrollable */}
                  <ul className="flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide w-full lg:hidden">
                    {followedArtistList.map((artist) => (
                      <li key={artist.id} className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFollowedArtistSelect(artist)}
                          className="group relative flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                          title={artist.name}
                        >
                          <span className="relative inline-flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40 shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition group-hover:scale-110 group-hover:border-purple-400/60">
                            {artist.image ? (
                              <img
                                src={artist.image}
                                alt={artist.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[10px] xs:text-xs font-semibold uppercase text-white/80">
                                {getArtistInitials(artist.name)}
                              </span>
                            )}
                          </span>
                          <span className="sr-only">{artist.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Desktop: Vertical Scrollable */}
                  <ul className="hidden lg:flex lg:flex-1 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:overflow-x-visible custom-scroll lg:items-center w-full">
                    {followedArtistList.map((artist) => (
                      <li key={artist.id} className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFollowedArtistSelect(artist)}
                          className="group relative flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                          title={artist.name}
                        >
                          <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40 shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition group-hover:scale-110 group-hover:border-purple-400/60">
                            {artist.image ? (
                              <img
                                src={artist.image}
                                alt={artist.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs font-semibold uppercase text-white/80">
                                {getArtistInitials(artist.name)}
                              </span>
                            )}
                          </span>
                          <span className="sr-only">{artist.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-1.5 xs:px-2 text-center py-4 lg:py-0">
                  <p className="text-[0.4rem] xs:text-[0.5rem] font-semibold uppercase tracking-[0.7em] text-white/35 mb-1 xs:mb-2">
                    Your Library
                  </p>
                  <p className="text-[10px] xs:text-xs text-white/50 leading-tight">Follow artists to see them here</p>
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Centered Search Bar */}
            <div className="flex justify-center items-center w-full px-4">
              <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl">
                <div className="relative flex items-center rounded-full bg-[#1a1a1a] border border-white/10 transition-all duration-200 focus-within:border-white/20 hover:border-white/15">
                  {/* Search Icon */}
                  <div className="absolute left-4 sm:left-5 flex items-center justify-center pointer-events-none">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/70"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="What do you want to play?"
                    className={`flex-1 bg-transparent text-base sm:text-lg text-white placeholder:text-white/60 focus:outline-none pl-12 sm:pl-14 py-4 sm:py-5 ${
                      searchQuery ? 'pr-20 sm:pr-24' : 'pr-16 sm:pr-20'
                    }`}
                    aria-label="Search Spotify"
                  />
                  
                  {/* Clear Button (when there's text) */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-14 sm:right-16 flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10 transition-colors group"
                      aria-label="Clear search"
                    >
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/50 group-hover:text-white transition-colors"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                  
                  {/* Separator */}
                  <div className="absolute right-12 sm:right-14 h-6 w-px bg-white/20"></div>
                  
                  {/* Right Icon (Folder/Queue) */}
                  <button
                    type="button"
                    className="absolute right-4 sm:right-5 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors group"
                    aria-label="Queue"
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/70 group-hover:text-white transition-colors"
                    >
                      <path d="M4 7h16M4 12h16M4 17h16"></path>
                    </svg>
                  </button>
                </div>
              </form>
            </div>


            {searchError && (
              <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
                {searchError}
              </div>
            )}
            {isSearching && (
              <LoaderCard
                eyebrow="Searching Spotify"
                headline="Finding matching artists & tracks..."
                description="Hang tight while we fetch the freshest results for your query."
                minHeightClass="min-h-[40vh]"
              />
            )}

            {renderSearchResults()}

            {/* Recommended Stations Section - Based on Followed Artists */}
            {!hasSearchResults && (isLoadingStations || recommendedStations.length > 0) && (
              <section className="space-y-6 mb-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/40 mb-1">For You</p>
                    <h2 className="text-3xl font-semibold">Recommended Stations</h2>
                    <p className="text-sm text-white/60 mt-2">
                      Non-stop music based on your favorite songs and artists
                    </p>
                  </div>
                </div>

                <div className="relative">
                  {/* Left Scroll Button */}
                  {!isLoadingStations && canScrollLeft && (
                    <button
                      onClick={() => scrollStations('left')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all hover:scale-110 shadow-xl"
                      aria-label="Scroll left"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                  )}

                  {/* Right Scroll Button */}
                  {!isLoadingStations && canScrollRight && (
                    <button
                      onClick={() => scrollStations('right')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all hover:scale-110 shadow-xl"
                      aria-label="Scroll right"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  )}

                  {/* Horizontal Scrollable Container */}
                  <div
                    ref={stationsScrollRef}
                    onScroll={checkScrollButtons}
                    className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 px-14 scrollbar-hide"
                    style={{
                      scrollbarWidth: 'none', // Firefox
                      msOverflowStyle: 'none', // IE and Edge
                    }}
                  >
                    {isLoadingStations ? (
                      // Skeleton Loaders
                      Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`station-skeleton-${index}`}
                          className="group relative overflow-hidden rounded-lg aspect-[4/5] min-h-[200px] min-w-[160px] flex-shrink-0 animate-pulse"
                          style={{
                            backgroundColor: '#FF6B35',
                          }}
                        >
                          {/* Spotify Logo Skeleton */}
                          <div className="absolute top-2.5 left-2.5 z-10 w-3.5 h-3.5 rounded bg-white/20"></div>
                          
                          {/* RADIO Badge Skeleton */}
                          <div className="absolute top-2.5 right-2.5 z-10 w-12 h-4 rounded-full bg-white/20"></div>

                          {/* Artist Images Skeleton */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                            <div className="relative flex items-center justify-center" style={{ width: '140px', height: '65px' }}>
                              <div className="absolute rounded-full bg-white/20" style={{ width: '50px', height: '50px', left: 'calc(50% - 28px)', transform: 'translateX(-50%)' }}></div>
                              <div className="absolute rounded-full bg-white/25" style={{ width: '60px', height: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}></div>
                              <div className="absolute rounded-full bg-white/20" style={{ width: '50px', height: '50px', left: 'calc(50% + 28px)', transform: 'translateX(-50%)' }}></div>
                            </div>
                          </div>

                          {/* Station Name Skeleton */}
                          <div className="absolute bottom-3 left-3 right-3 z-10">
                            <div className="h-4 w-3/4 rounded bg-white/20 mb-2"></div>
                            <div className="h-3 w-1/2 rounded bg-white/15"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      recommendedStations.map((station) => (
                        <button
                        key={station.id}
                        onClick={() => handleStationClick(station)}
                        className="group relative overflow-hidden rounded-lg aspect-[4/5] min-h-[200px] min-w-[160px] flex-shrink-0 text-left transition-all hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                        style={{
                          backgroundColor: station.color,
                        }}
                      >
                        {/* Beatify Logo - Top Left */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <img 
                            src={BeatifyLogo} 
                            alt="Beatify" 
                            className="w-5 h-5 object-contain drop-shadow-md"
                          />
                        </div>
                        
                        {/* RADIO Badge - Top Right */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            RADIO
                          </span>
                        </div>

                        {/* Overlapping Artist Images - Center (matching image style) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="relative flex items-center justify-center" style={{ width: '140px', height: '65px' }}>
                            {station.artists.slice(0, 3).map((artist, index) => {
                              // Center image is larger, side images are smaller (matching image proportions)
                              const size = index === 1 ? 60 : 50;
                              const offset = index === 0 ? -28 : index === 1 ? 0 : 28;
                              
                              return (
                                <div
                                  key={artist.id}
                                  className="absolute rounded-full overflow-hidden bg-gray-300 flex items-center justify-center"
                                  style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    left: `calc(50% + ${offset}px)`,
                                    transform: 'translateX(-50%)',
                                    zIndex: index === 1 ? 10 : 10 - Math.abs(index - 1),
                                    border: '2px solid rgba(255, 255, 255, 0.25)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                  }}
                                >
                                  {artist.image ? (
                                    <img
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-600 text-sm font-bold">
                                      {artist.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {station.artists.length > 3 && (
                              <div
                                className="absolute rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  left: 'calc(50% + 45px)',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1,
                                  border: '2px solid rgba(255, 255, 255, 0.25)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                +{station.artists.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Station Name - Bottom Left (matching image style) */}
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                          <h3 
                            className="text-sm font-bold text-white line-clamp-2 leading-tight" 
                            style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {station.name}
                          </h3>
                        </div>
                      </button>
                      ))
                    )}
                    
                    {/* Create Station Button */}
                    <button
                      onClick={() => setShowCreateStationModal(true)}
                      className="group relative overflow-hidden rounded-lg aspect-[4/5] min-h-[200px] min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-white/50 bg-white/5 hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors text-center px-4">
                          Create Station
                        </p>
                      </div>
                    </button>

                    {/* Custom Stations */}
                    {customStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleStationClick(station)}
                        className="group relative overflow-hidden rounded-lg aspect-[4/5] min-h-[200px] min-w-[160px] flex-shrink-0 text-left transition-all hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                        style={{
                          backgroundColor: station.color,
                        }}
                      >
                        {/* Beatify Logo - Top Left */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <img 
                            src={BeatifyLogo} 
                            alt="Beatify" 
                            className="w-5 h-5 object-contain drop-shadow-md"
                          />
                        </div>
                        
                        {/* RADIO Badge - Top Right */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            RADIO
                          </span>
                        </div>

                        {/* Overlapping Artist Images - Center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="relative flex items-center justify-center" style={{ width: '140px', height: '65px' }}>
                            {station.artists.slice(0, 3).map((artist, index) => {
                              const size = index === 1 ? 60 : 50;
                              const offset = index === 0 ? -28 : index === 1 ? 0 : 28;
                              
                              return (
                                <div
                                  key={artist.id}
                                  className="absolute rounded-full overflow-hidden bg-gray-300 flex items-center justify-center"
                                  style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    left: `calc(50% + ${offset}px)`,
                                    transform: 'translateX(-50%)',
                                    zIndex: index === 1 ? 10 : 10 - Math.abs(index - 1),
                                    border: '2px solid rgba(255, 255, 255, 0.25)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                  }}
                                >
                                  {artist.image ? (
                                    <img
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-600 text-sm font-bold">
                                      {artist.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {station.artists.length > 3 && (
                              <div
                                className="absolute rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  left: 'calc(50% + 45px)',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1,
                                  border: '2px solid rgba(255, 255, 255, 0.25)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                +{station.artists.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Station Name - Bottom Left */}
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                          <h3 
                            className="text-sm font-bold text-white line-clamp-2 leading-tight" 
                            style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {station.name}
                          </h3>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Create Station Modal */}
            <CreateStationModal
              isOpen={showCreateStationModal}
              onClose={() => setShowCreateStationModal(false)}
              onCreateStation={handleCreateCustomStation}
            />

            {/* Popular Songs Sections for Each Category */}
            {!hasSearchResults && (
              <>
                {/* Punjabi Popular Songs - Recommendations */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Punjabi</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI Recommended
                        </span>
                    </div>
                      <h2 className="text-2xl font-semibold">Recommended Punjabi Songs</h2>
                    </div>
                    <div className="flex items-center gap-3">
                    <p className="text-sm text-white/50 sm:max-w-xl">
                        Personalized Punjabi tracks recommended by Spotify AI.
                      </p>
                      <button
                        onClick={() => fetchPopularTracks('punjabi')}
                        disabled={isLoadingPopularTracks.punjabi}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh recommendations"
                      >
                        {isLoadingPopularTracks.punjabi ? '...' : '↻'}
                      </button>
                    </div>
                  </div>

                  {isLoadingPopularTracks.punjabi ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`punjabi-track-skeleton-${index}`}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 rounded bg-white/10" />
                              <div className="h-3 w-1/2 rounded bg-white/5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : popularTracks.punjabi.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {popularTracks.punjabi.slice(0, 12).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handlePlayTrack(track)}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                        >
                          <div className="flex items-center gap-3">
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.album}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={BeatifyLogo} 
                                  alt="Beatify" 
                                  className="w-8 h-8 object-contain opacity-70"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>

                {/* English Popular Songs - Recommendations */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">English</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI Recommended
                        </span>
                    </div>
                      <h2 className="text-2xl font-semibold">Recommended English Songs</h2>
                    </div>
                    <div className="flex items-center gap-3">
                    <p className="text-sm text-white/50 sm:max-w-xl">
                        Personalized English tracks recommended by Spotify AI.
                      </p>
                      <button
                        onClick={() => fetchPopularTracks('english')}
                        disabled={isLoadingPopularTracks.english}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh recommendations"
                      >
                        {isLoadingPopularTracks.english ? '...' : '↻'}
                      </button>
                    </div>
                  </div>

                  {isLoadingPopularTracks.english ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`english-track-skeleton-${index}`}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 rounded bg-white/10" />
                              <div className="h-3 w-1/2 rounded bg-white/5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : popularTracks.english.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {popularTracks.english.slice(0, 12).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handlePlayTrack(track)}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                        >
                          <div className="flex items-center gap-3">
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.album}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={BeatifyLogo} 
                                  alt="Beatify" 
                                  className="w-8 h-8 object-contain opacity-70"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>

                {/* Global Popular Songs - Recommendations */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Global</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI Recommended
                        </span>
                    </div>
                      <h2 className="text-2xl font-semibold">Recommended Global Songs</h2>
                    </div>
                    <div className="flex items-center gap-3">
                    <p className="text-sm text-white/50 sm:max-w-xl">
                        Personalized global tracks recommended by Spotify AI.
                      </p>
                      <button
                        onClick={() => fetchPopularTracks('global')}
                        disabled={isLoadingPopularTracks.global}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh recommendations"
                      >
                        {isLoadingPopularTracks.global ? '...' : '↻'}
                      </button>
                    </div>
                  </div>

                  {isLoadingPopularTracks.global ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`global-track-skeleton-${index}`}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 rounded bg-white/10" />
                              <div className="h-3 w-1/2 rounded bg-white/5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : popularTracks.global.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {popularTracks.global.slice(0, 12).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handlePlayTrack(track)}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                        >
                          <div className="flex items-center gap-3">
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.album}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                                <img 
                                  src={BeatifyLogo} 
                                  alt="Beatify" 
                                  className="w-8 h-8 object-contain opacity-70"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>

                {/* Pakistani Popular Songs - Recommendations */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Pakistani</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI Recommended
                        </span>
                    </div>
                      <h2 className="text-2xl font-semibold">Recommended Pakistani Songs</h2>
                    </div>
                    <div className="flex items-center gap-3">
                    <p className="text-sm text-white/50 sm:max-w-xl">
                        Personalized Pakistani tracks recommended by Spotify AI.
                      </p>
                      <button
                        onClick={() => fetchPopularTracks('pakistani')}
                        disabled={isLoadingPopularTracks.pakistani}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh recommendations"
                      >
                        {isLoadingPopularTracks.pakistani ? '...' : '↻'}
                      </button>
                    </div>
                  </div>

                  {isLoadingPopularTracks.pakistani ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`pakistani-track-skeleton-${index}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-2.5 animate-pulse"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3.5 w-3/4 rounded bg-white/10" />
                              <div className="h-2.5 w-1/2 rounded bg-white/5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : popularTracks.pakistani.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {popularTracks.pakistani.slice(0, 12).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handlePlayTrack(track)}
                          className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2.5 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                        >
                          <div className="flex items-center gap-2">
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.album}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-[10px] text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              </>
            )}

            {error && (
              <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
                <div className="flex items-center justify-between gap-4">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="rounded-full border border-red-400/40 px-4 py-1 text-xs uppercase tracking-wide hover:bg-red-500/20 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {isLoading && sections.length === 0 && (
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 3xl:grid-cols-10 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 justify-items-center">
                {Array.from({ length: INITIAL_LIMIT }).map((_, index) => (
                  <ArtistCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            )}

            {sections.map((section) => {
              const sortedArtists = [...section.artists].sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              );
              // Only show one row of artists based on screen size
              const cardsPerRow = getCardsPerRow(viewportSize.width || (typeof window !== 'undefined' ? window.innerWidth : 1024));
              // Limit to exactly one row
              const visibleArtists = sortedArtists.slice(0, cardsPerRow);
              const remainingArtists = sortedArtists.length - visibleArtists.length;
              const hasMoreFromServer = hasMoreMap[section.category] ?? false;
              const hasMore = remainingArtists > 0 || hasMoreFromServer;

              return (
                <section key={section.category} className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] xs:text-xs uppercase tracking-[0.35em] text-white/40">{section.category}</p>
                      <h2 className="text-xl xs:text-2xl font-semibold">{section.title}</h2>
                    </div>
                    <p className="text-xs xs:text-sm text-white/50 sm:max-w-xl">{section.description}</p>
                  </div>

                  <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 3xl:grid-cols-10 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 justify-items-center">
                    {visibleArtists.map((artist) => renderArtistCard(artist, section.title))}
                  </div>

                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore(section.category)}
                      disabled={!hasMore || loadingCategories.has(section.category)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingCategories.has(section.category) ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : hasMore ? (
                        'Load more'
                      ) : (
                        'No more artists'
                      )}
                    </button>
                  </div>
                </section>
              );
            })}

            {!isLoading && sections.length === 0 && !error && (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/70">
                <p className="text-lg font-medium mb-2">No artist data yet</p>
                <p className="text-sm">Try refreshing or come back later while we gather Spotify highlights.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Artists;

