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
import { SpotifyIcon, MicIcon } from '../components/icons';
import VoiceSearchModal from '../components/VoiceSearchModal';
import { useSpotifyPlayer, useFollowedArtists } from '../context';

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
  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 animate-pulse">
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-slate-900/40" />
    <div className="space-y-2.5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-2.5 w-full rounded bg-white/5" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="h-5 w-16 rounded-full bg-white/10" />
          <div className="space-y-0.5">
            <div className="h-2.5 w-20 rounded bg-white/5" />
            <div className="h-2.5 w-16 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-white/5" />
        <div className="space-y-0.5">
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-5/6 rounded bg-white/5" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="h-3 w-16 rounded bg-white/5" />
      </div>
    </div>
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
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState<boolean>(false);
  const [popularTracks, setPopularTracks] = useState<Record<string, Track[]>>({
    punjabi: [],
    english: [],
    global: [],
  });
  const [isLoadingPopularTracks, setIsLoadingPopularTracks] = useState<Record<string, boolean>>({
    punjabi: false,
    english: false,
    global: false,
  });
  const [recommendedStations, setRecommendedStations] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ id: string; name: string; image?: string }>;
    color: string;
  }>>([]);
  // Featured artists/tracks moved to StationDetail page
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const stationsScrollRef = useRef<HTMLDivElement>(null);
  const { playTrack, spotifyReference: activeSpotifyReference } = useSpotifyPlayer();
  const { isFollowed, toggleFollow, followedArtists } = useFollowedArtists();

  const requestedLimitRef = useRef<Record<string, number>>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedSearchRef = useRef<string>('');

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

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const fetchPopularTracks = useCallback(async (category: 'punjabi' | 'english' | 'global') => {
    setIsLoadingPopularTracks((prev) => ({ ...prev, [category]: true }));
    try {
      // Use different moods for different categories to get relevant popular tracks
      const moodMap: Record<string, string> = {
        punjabi: 'excited', // High energy for Punjabi
        english: 'happy', // Popular English tracks
        global: 'excited', // Trending global hits
      };
      
      const mood = moodMap[category] || 'excited';
      const response = await getTracksByMood(mood, 12, 'recommendations', 'spotify');
      setPopularTracks((prev) => ({ ...prev, [category]: response.data.tracks }));
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

  // Generate recommended stations/mixes from followed artists
  const generateRecommendedStations = useCallback(() => {
    const followedList = Object.values(followedArtists);
    
    if (followedList.length === 0) {
      setRecommendedStations([]);
      return;
    }

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

    // Only create collaboration mixes (2+ artists) - no single artist stations
    if (followedList.length >= 2) {
      // Create pairs of 2 artists
      for (let i = 0; i < followedList.length - 1; i++) {
        for (let j = i + 1; j < Math.min(followedList.length, i + 4); j++) {
          const artist1 = followedList[i];
          const artist2 = followedList[j];
          
          if (artist1 && artist2) {
            const spotifyId1 = artist1.artistId || artist1.id || '';
            const spotifyId2 = artist2.artistId || artist2.id || '';
            
            if (!spotifyId1 || !spotifyId2) continue; // Skip if no Spotify IDs
            
            // Create mix name
            const mixName = `${artist1.name || 'Artist'} & ${artist2.name || 'Artist'}`;
            
            stations.push({
              id: `mix-${spotifyId1}-${spotifyId2}`,
              name: mixName,
              artists: [
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
              color: colors[(stations.length) % colors.length],
            });
          }
        }
      }
      
      // Also create mixes with 3+ artists if available
      if (followedList.length >= 3) {
        for (let i = 0; i < Math.min(followedList.length - 2, 3); i++) {
          const artist1 = followedList[i];
          const artist2 = followedList[i + 1];
          const artist3 = followedList[i + 2];
          
          if (artist1 && artist2 && artist3) {
            const spotifyId1 = artist1.artistId || artist1.id || '';
            const spotifyId2 = artist2.artistId || artist2.id || '';
            const spotifyId3 = artist3.artistId || artist3.id || '';
            
            if (!spotifyId1 || !spotifyId2 || !spotifyId3) continue;
            
            const mixName = `${artist1.name || 'Artist'}, ${artist2.name || 'Artist'} & ${artist3.name || 'Artist'}`;
            
            stations.push({
              id: `mix-${spotifyId1}-${spotifyId2}-${spotifyId3}`,
              name: mixName,
              artists: [
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
                {
                  id: spotifyId3,
                  name: artist3.name || 'Unknown',
                  image: artist3.image,
                },
              ],
              color: colors[(stations.length) % colors.length],
            });
          }
        }
      }
    }

    setRecommendedStations(stations);
    
    // Check scroll buttons after stations are set
    setTimeout(() => {
      checkScrollButtons();
    }, 100);
  }, [followedArtists, checkScrollButtons]);

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
      // Generate recommended stations from followed artists
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
    async (category: string) => {
      const current = requestedLimitRef.current[category] ?? INITIAL_LIMIT;
      const newLimit = current + LIMIT_STEP;
      
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

  const handleVoiceTranscript = (transcript: string) => {
    // Final transcript - update search query and trigger search
    setSearchQuery(transcript);
    // Automatically trigger search
    setTimeout(() => {
      executeSearch(transcript);
    }, 300);
    toast.info(`Searching for: "${transcript}"`, {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  const handleVoiceError = (error: string) => {
    toast.error(error, {
      position: 'top-right',
      autoClose: 4000,
    });
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
    const isArtistFollowed = artist.id ? isFollowed(artist.id) : false;

    const handleFollowClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      try {
        const action = await toggleFollow(artist);
        toast.info(
          `${action === 'followed' ? 'Following' : 'Unfollowed'} ${artist.name}`,
          { toastId: `follow-${artist.id}` }
        );
      } catch (err: any) {
        const message = err?.message || 'Unable to update follow status right now.';
        toast.error(message);
      }
    };

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
        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
      >
        <div className="relative h-36 overflow-hidden">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900 text-white/70 text-xs">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{artist.name}</h3>
              <p className="text-[0.65rem] text-white/60 mt-0.5 line-clamp-1">{formatGenres(artist.genres)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleFollowClick}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-[0.25em] transition-colors ${
                  isArtistFollowed
                    ? 'border-purple-400 bg-purple-500/30 text-purple-100 hover:bg-purple-500/40'
                    : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                aria-pressed={isArtistFollowed}
              >
                {isArtistFollowed ? 'Following' : 'Follow'}
              </button>
              <div className="text-right text-[0.65rem] text-white/50">
                <p className="leading-tight">{formatFollowers(artist.followers)}</p>
                <p className="leading-tight">Pop. {artist.popularity ?? '--'}</p>
              </div>
            </div>
          </div>

          {artist.topTracks?.length ? (
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.25em] text-white/40 mb-1.5">Top Tracks</p>
              <ul className="space-y-0.5 text-[0.75rem] text-white/80">
                {artist.topTracks.slice(0, 2).map((track: Track, index: number) => (
                  <li key={track.id || `${artist.id}-${index}`} className="truncate">• {track.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[0.65rem] text-white/40">Loading tracks...</p>
          )}

          <div className="flex items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.25em] text-white/60 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <SpotifyIcon size={12} />
              <span>Spotify</span>
            </span>
            <span className="text-purple-300 text-[0.65rem]">{'View ->'}</span>
          </div>
        </div>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.35em] text-white/40">Artists</h3>
            {searchResults.artists.length === 0 ? (
              <p className="text-sm text-white/60">No matching artists found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.artists.map((artist: ArtistMetadata) =>
                  renderArtistCard(artist, 'Search Results'),
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.35em] text-white/40">Tracks</h3>
            {searchResults.tracks.length === 0 ? (
              <p className="text-sm text-white/60">No matching tracks found.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.tracks.map((track: Track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handlePlayFromSearch(track)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold">{track.name}</p>
                        <p className="text-xs text-white/50">
                          {track.artists}
                          {track.album ? ` - ${track.album}` : ''}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
                        <SpotifyIcon size={16} />
                        Play in MR
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:items-start">
          <aside className="order-last mt-8 lg:order-first lg:mt-0 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24">
            <div className="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-[#09060f]/95 px-2 py-4 shadow-[0_25px_70px_rgba(20,0,40,0.45)] backdrop-blur-xl">
              {hasFollowedArtists ? (
                <ul className="flex gap-4 overflow-x-auto pb-2 lg:flex-1 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:overflow-x-visible custom-scroll lg:items-center">
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
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-2 text-center">
                  <p className="text-[0.5rem] font-semibold uppercase tracking-[0.7em] text-white/35 mb-2">
                    Your Library
                  </p>
                  <p className="text-xs text-white/50">Follow artists to see them here</p>
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-10">
            {/* Voice Search Button at Top */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsVoiceSearchOpen(true)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                title="Voice Search"
              >
                <MicIcon size={20} />
                <span>Voice Search</span>
              </button>
            </div>

            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Spotify Artist Showcase</p>
                <h1 className="text-4xl font-semibold">Search &amp; Explore Top Artists</h1>
                <p className="text-sm text-white/60 max-w-2xl">
                  Dive into curated Punjabi, English and global stars, or jump straight to the songs you love. Tap an artist to view their top tracks and queue them in the MR player.
                </p>
                <p className="text-xs text-white/40">
                  Showing up to {meta.limitPerCategory || INITIAL_LIMIT} artists per category · Last synced{' '}
                  {meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleString() : 'just now'}
                </p>
              </div>
              <form onSubmit={handleSearchSubmit} className="w-full max-w-xl space-y-3">
                <div className="relative flex items-center rounded-full border border-white/15 bg-white/5 transition-colors focus-within:border-purple-400/70 focus-within:bg-white/10">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for artists or songs, or use voice search"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none px-5 py-3 pr-20"
                    aria-label="Search Spotify"
                  />
                  {searchQuery && (
                    <div className="absolute right-2 flex items-center">
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white/70 transition-colors px-2 py-1"
                        aria-label="Clear search"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center rounded-r-full bg-purple-500 px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-colors hover:bg-purple-400 disabled:bg-purple-500/50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <p className="text-xs text-white/40">
                  Try artist names like "Karan Aujla" or songs like "Cruel Summer". Use voice search button at the top.
                </p>
              </form>
            </header>

            {/* Voice Search Modal */}
            <VoiceSearchModal
              isOpen={isVoiceSearchOpen}
              onClose={() => setIsVoiceSearchOpen(false)}
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
            />

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
            {!hasSearchResults && recommendedStations.length > 0 && (
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
                  {canScrollLeft && (
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
                  {canScrollRight && (
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
                    className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 px-14 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                    }}
                  >
                    {recommendedStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleStationClick(station)}
                        className="group relative overflow-hidden rounded-xl aspect-[4/5] min-h-[300px] min-w-[240px] flex-shrink-0 text-left transition-all hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                        style={{
                          backgroundColor: station.color,
                        }}
                      >
                        {/* Spotify Logo - Top Left */}
                        <div className="absolute top-4 left-4 z-10">
                          <SpotifyIcon size={20} className="text-white drop-shadow-md" />
                        </div>
                        
                        {/* RADIO Badge - Top Right */}
                        <div className="absolute top-4 right-4 z-10">
                          <span className="px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            RADIO
                          </span>
                        </div>

                        {/* Overlapping Artist Images - Center (matching image style) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="relative flex items-center justify-center" style={{ width: '220px', height: '100px' }}>
                            {station.artists.slice(0, 3).map((artist, index) => {
                              // Center image is larger, side images are smaller (matching image proportions)
                              const size = index === 1 ? 95 : 80;
                              const offset = index === 0 ? -45 : index === 1 ? 0 : 45;
                              
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
                                    border: '3px solid rgba(255, 255, 255, 0.25)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  }}
                                >
                                  {artist.image ? (
                                    <img
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-600 text-xl font-bold">
                                      {artist.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {station.artists.length > 3 && (
                              <div
                                className="absolute rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold"
                                style={{
                                  width: '65px',
                                  height: '65px',
                                  left: 'calc(50% + 70px)',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1,
                                  border: '3px solid rgba(255, 255, 255, 0.25)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                +{station.artists.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Station Name - Bottom Left (matching image style) */}
                        <div className="absolute bottom-5 left-5 right-5 z-10">
                          <h3 
                            className="text-2xl font-bold text-white line-clamp-2 leading-tight" 
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
                                <SpotifyIcon size={20} className="text-white/60" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <SpotifyIcon size={16} className="text-white/60" />
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
                                <SpotifyIcon size={20} className="text-white/60" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <SpotifyIcon size={16} className="text-white/60" />
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
                                <SpotifyIcon size={20} className="text-white/60" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/60 truncate mt-0.5">{track.artists}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <SpotifyIcon size={16} className="text-white/60" />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: INITIAL_LIMIT }).map((_, index) => (
                  <ArtistCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            )}

            {sections.map((section) => {
              const categoryLimit = requestedLimitRef.current[section.category] ?? INITIAL_LIMIT;
              const sortedArtists = [...section.artists].sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
              );
              const visibleArtists = sortedArtists.slice(0, categoryLimit);
              const remainingArtists = sortedArtists.length - visibleArtists.length;
              const hasMoreFromServer = hasMoreMap[section.category] ?? false;
              const hasMore = remainingArtists > 0 || hasMoreFromServer;

              return (
                <section key={section.category} className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">{section.category}</p>
                      <h2 className="text-2xl font-semibold">{section.title}</h2>
                    </div>
                    <p className="text-sm text-white/50 sm:max-w-xl">{section.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

