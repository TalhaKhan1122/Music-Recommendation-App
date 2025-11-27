import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type {
  ArtistMetadata,
  ArtistShowcaseSection,
  TopArtistsPayload,
  SpotifyCatalogSearchResult,
  Track,
} from '../api/music.api';
import { getTopArtistsShowcase, searchSpotifyCatalog } from '../api/music.api';
import { SpotifyIcon } from '../components/icons';
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
  <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 animate-pulse">
    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-slate-900/40" />
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-20 rounded-full bg-white/10" />
          <div className="space-y-1">
            <div className="h-3 w-24 rounded bg-white/5" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="space-y-1">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
          <div className="h-4 w-4/6 rounded bg-white/5" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-32 rounded bg-white/5" />
        <div className="h-4 w-24 rounded bg-white/5" />
      </div>
    </div>
  </div>
);

const Artists: React.FC = () => {
  const navigate = useNavigate();

  const [sections, setSections] = useState<ArtistShowcaseSection[]>([]);
  const [meta, setMeta] = useState<Pick<TopArtistsPayload, 'fetchedAt' | 'limitPerCategory' | 'totalArtists'>>({
    fetchedAt: '',
    limitPerCategory: 0,
    totalArtists: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SpotifyCatalogSearchResult>(() => emptySearchResult());
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearchResults, setHasSearchResults] = useState<boolean>(false);
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
    (category: string) => {
      const current = requestedLimitRef.current[category] ?? INITIAL_LIMIT;
      requestedLimitRef.current = {
        ...requestedLimitRef.current,
        [category]: current + LIMIT_STEP,
      };
      fetchArtists();
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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeSearch(searchQuery, { force: true });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    executeSearch('', { force: true });
  };

  const deriveSpotifyReference = (track: Track): string | null => {
    if (track.externalUrl) {
      return track.externalUrl;
    }
    if (track.id) {
      return track.id;
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
        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
      >
        <div className="relative h-52 overflow-hidden">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900 text-white/70">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{artist.name}</h3>
              <p className="text-xs text-white/60">{formatGenres(artist.genres)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleFollowClick}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] transition-colors ${
                  isArtistFollowed
                    ? 'border-purple-400 bg-purple-500/30 text-purple-100 hover:bg-purple-500/40'
                    : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                aria-pressed={isArtistFollowed}
              >
                {isArtistFollowed ? 'Following' : 'Follow'}
              </button>
              <div className="text-right text-xs text-white/50">
                <p>{formatFollowers(artist.followers)} followers</p>
                <p>Popularity {artist.popularity ?? '--'}</p>
              </div>
            </div>
          </div>

          {artist.topTracks?.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Top Tracks</p>
              <ul className="space-y-1 text-sm text-white/80">
                {artist.topTracks.slice(0, 3).map((track: Track, index: number) => (
                  <li key={track.id || `${artist.id}-${index}`}>- {track.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-white/40">Top tracks loading...</p>
          )}

          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
            <span className="inline-flex items-center gap-2">
              <SpotifyIcon size={16} />
              Spotify Artist
            </span>
            <span className="text-purple-300">{'View Details ->'}</span>
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
              <div className="grid gap-3">
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
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[140px_minmax(0,1fr)] lg:items-start">
          <aside className="order-last mt-8 lg:order-first lg:mt-0 lg:h-[80vh] lg:sticky lg:top-24">
            <div className="flex h-full flex-col items-center rounded-[32px] border border-white/10 bg-[#09060f]/95 px-4 py-6 shadow-[0_25px_70px_rgba(20,0,40,0.45)] backdrop-blur-xl">
              <div className="flex flex-col items-center gap-2 pb-6 text-center">
                <p className="text-[0.5rem] font-semibold uppercase tracking-[0.7em] text-white/35">
                  Your Library
                </p>
                <h2 className="text-lg font-semibold text-white">Followed Artists</h2>
                {hasFollowedArtists && (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[0.55rem] uppercase tracking-[0.4em] text-white/70 shadow-inner shadow-purple-500/30">
                    {followedArtistList.length}
                  </span>
                )}
              </div>
              {hasFollowedArtists ? (
                <ul className="flex gap-6 overflow-x-auto pb-2 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:overflow-x-visible custom-scroll">
                  {followedArtistList.map((artist) => (
                    <li key={artist.id}>
                      <button
                        type="button"
                        onClick={() => handleFollowedArtistSelect(artist)}
                        className="group relative flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                        title={artist.name}
                      >
                        <span className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40 shadow-[0_12px_25px_rgba(0,0,0,0.55)] ring-1 ring-white/10 transition group-hover:-translate-y-1 group-hover:ring-purple-400/40">
                          {artist.image ? (
                            <img
                              src={artist.image}
                              alt={artist.name}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-sm font-semibold uppercase text-white/80">
                              {getArtistInitials(artist.name)}
                            </span>
                          )}
                          <span className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-transparent to-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="sr-only">{artist.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-xs text-white/50">
                  Follow artists from the showcase to pin them here for quick access.
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-10">
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
                <div className="relative flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 transition-colors focus-within:border-purple-400/70 focus-within:bg-white/10">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for artists or songs"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    aria-label="Search Spotify"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white/70 transition-colors"
                      aria-label="Clear search"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="inline-flex items-center rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-colors hover:bg-purple-400 disabled:bg-purple-500/50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <p className="text-xs text-white/40">Try artist names like "Karan Aujla" or songs like "Cruel Summer".</p>
              </form>
            </header>

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
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleArtists.map((artist) => renderArtistCard(artist, section.title))}
                  </div>

                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore(section.category)}
                      disabled={!hasMore}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      {hasMore ? 'Load more' : 'No more artists'}
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

