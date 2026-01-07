import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { ArtistMetadata, Track } from '../api/music.api';
import { getArtistById, getTopArtistsShowcase } from '../api/music.api';
import { PlayIcon, PauseIcon } from '../components/icons';
import { useSpotifyPlayer, useFollowedArtists } from '../context';

interface ArtistDetailLocationState {
  artist?: ArtistMetadata;
  category?: string;
}

const deriveSpotifyReference = (track: Track): string | null => {
  if (track.externalUrl) {
    return track.externalUrl;
  }
  if (track.id) {
    return track.id;
  }
  return null;
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
    .join(' • ');
};

const formatListeners = (popularity?: number): string => {
  if (popularity === undefined || popularity === null) {
    return '--';
  }
  // Convert popularity (0-100) to a listener-like format
  // Higher popularity = more listeners
  // We'll estimate listeners based on popularity score
  // Popularity 100 = ~50M, 75 = ~10M, 50 = ~2M, 25 = ~500K, 0 = ~100K (conservative estimates)
  const baseListeners = 100_000; // Minimum for popularity 0
  const maxListeners = 50_000_000; // Maximum for popularity 100
  const estimatedListeners = Math.round(
    baseListeners + (popularity / 100) * (maxListeners - baseListeners)
  );
  
  if (estimatedListeners >= 1_000_000_000) {
    return `${(estimatedListeners / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (estimatedListeners >= 1_000_000) {
    return `${(estimatedListeners / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (estimatedListeners >= 1_000) {
    return `${(estimatedListeners / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return estimatedListeners.toLocaleString();
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatPlayCount = (popularity?: number): string => {
  if (popularity === undefined || popularity === null) {
    return '--';
  }
  // Estimate play count from popularity (similar to listeners but scaled differently)
  const basePlays = 50_000;
  const maxPlays = 100_000_000;
  const estimatedPlays = Math.round(
    basePlays + (popularity / 100) * (maxPlays - basePlays)
  );
  
  if (estimatedPlays >= 1_000_000_000) {
    return `${(estimatedPlays / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (estimatedPlays >= 1_000_000) {
    const millions = (estimatedPlays / 1_000_000).toFixed(0);
    return `${millions.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}M`;
  }
  if (estimatedPlays >= 1_000) {
    return `${(estimatedPlays / 1_000).toFixed(0)}K`;
  }
  return estimatedPlays.toLocaleString();
};

const ArtistDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { artistId } = useParams<{ artistId: string }>();

  const { artist: locationArtist, category } = (location.state as ArtistDetailLocationState) || {};

  const [artist, setArtist] = useState<ArtistMetadata | null>(locationArtist ?? null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [trackLimit, setTrackLimit] = useState(10);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<ArtistMetadata[]>([]);
  const [isLoadingRelatedArtists, setIsLoadingRelatedArtists] = useState(false);
  const { playTrack, spotifyReference } = useSpotifyPlayer();
  const { isFollowed, toggleFollow } = useFollowedArtists();

  // Fetch full artist data if topTracks are missing
  useEffect(() => {
    if (artistId && artist && (!artist.topTracks || artist.topTracks.length === 0)) {
      setIsLoadingTracks(true);
      getArtistById(artistId, trackLimit)
        .then((fullArtist) => {
          setArtist(fullArtist);
        })
        .catch((error) => {
          console.error('Failed to fetch artist tracks:', error);
          toast.error('Failed to load top tracks');
        })
        .finally(() => {
          setIsLoadingTracks(false);
        });
    }
  }, [artistId, artist, trackLimit]);

  useEffect(() => {
    if (!locationArtist && !artistId) {
      toast.error('Artist info is unavailable. Loading showcase instead.');
      navigate('/artists', { replace: true });
    } else if (!locationArtist && artistId) {
      // If we have artistId but no locationArtist, fetch it
      setIsLoadingTracks(true);
      getArtistById(artistId, trackLimit)
        .then((fullArtist) => {
          setArtist(fullArtist);
        })
        .catch((error) => {
          console.error('Failed to fetch artist:', error);
          toast.error('Failed to load artist details');
          navigate('/artists', { replace: true });
        })
        .finally(() => {
          setIsLoadingTracks(false);
        });
    } else {
      setArtist(locationArtist ?? null);
    }
  }, [locationArtist, artistId, navigate, trackLimit]);

  // Fetch recommended artists from the same category
  useEffect(() => {
    if (!artist || !artist.category) return;

    setIsLoadingRelatedArtists(true);
    getTopArtistsShowcase({
      limitPerCategory: 20, // Get more artists to filter out current one
      topTrackLimit: 0, // We don't need tracks for recommended artists
    })
      .then((payload) => {
        // Find the section matching the current artist's category
        const categorySection = payload.sections.find(
          (section) => section.category.toLowerCase() === artist?.category?.toLowerCase()
        );
        
        if (categorySection) {
          // Filter out the current artist and limit to 10-12 artists
          const filteredArtists = categorySection.artists
            .filter((a) => a.id !== artist.id)
            .slice(0, 12);
          setRelatedArtists(filteredArtists);
        } else {
          setRelatedArtists([]);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch recommended artists:', error);
        // Don't show error toast, just log it
        setRelatedArtists([]);
      })
      .finally(() => {
        setIsLoadingRelatedArtists(false);
      });
  }, [artist]);

  const topTracks = useMemo(() => artist?.topTracks ?? [], [artist]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const handlePlayTrack = (track: Track) => {
    const reference = deriveSpotifyReference(track);
    if (!reference) {
      toast.error('Unable to load Spotify player for this track right now.');
      return;
    }
    playTrack(track, reference);
    setIsPlaying(true);
    setPlayingTrackId(track.id);
    toast.info(`Playing ${track.name} on Spotify`);
  };

  const handlePlayAll = () => {
    if (topTracks.length === 0) return;
    const firstTrack = topTracks[0];
    handlePlayTrack(firstTrack);
  };

  const handleShuffle = () => {
    if (topTracks.length === 0) return;
    const randomTrack = topTracks[Math.floor(Math.random() * topTracks.length)];
    handlePlayTrack(randomTrack);
  };

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0618] to-[#1b0b2f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading artist details...</p>
        </div>
      </div>
    );
  }

  const hasActivePlayer = Boolean(spotifyReference);
  const isArtistFollowed = artist?.id ? isFollowed(artist.id) : false;

  const handleFollowToggle = async () => {
    if (!artist) {
      return;
    }
    try {
      const action = await toggleFollow(artist);
      toast.info(`${action === 'followed' ? 'Following' : 'Unfollowed'} ${artist.name}`, {
        toastId: `follow-detail-${artist.id}`,
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to update follow status right now.';
      toast.error(message);
    }
  };

  const handleLoadMoreTracks = async () => {
    if (!artistId || !artist || isLoadingMore) return;

    const currentTrackCount = topTracks.length;
    const newLimit = trackLimit + 10;
    setIsLoadingMore(true);
    
    try {
      console.log('Loading more tracks. Current:', currentTrackCount, 'New limit:', newLimit);
      const fullArtist = await getArtistById(artistId, newLimit);
      const fetchedTracks = fullArtist?.topTracks || [];
      console.log('Fetched tracks:', fetchedTracks.length);
      
      // Use functional update to ensure we're working with the latest state
      setArtist(prevArtist => {
        if (!prevArtist) return fullArtist;
        
        // Get existing track IDs from current state
        const existingTracks = prevArtist.topTracks || [];
        const existingTrackIds = new Set(existingTracks.map(t => t.id));
        console.log('Existing track IDs:', Array.from(existingTrackIds));
        
        // Filter out tracks we already have - only keep truly new ones
        const newTracks = fetchedTracks.filter(t => {
          if (!t.id) return false;
          const isNew = !existingTrackIds.has(t.id);
          if (isNew) console.log('New track found:', t.name);
          return isNew;
        });
        
        console.log('New tracks to add:', newTracks.length);
        
        if (newTracks.length > 0) {
          // Append ONLY new tracks to the existing list (preserve existing tracks in order)
          const updatedTracks = [...existingTracks, ...newTracks];
          console.log('Total tracks after append:', updatedTracks.length);
          return {
            ...prevArtist,
            topTracks: updatedTracks
          };
        }
        
        // No new tracks, return previous artist unchanged
        console.log('No new tracks to add');
        return prevArtist;
      });
      
      // Update limit
      setTrackLimit(newLimit);
      
      // Check if we got new tracks
      setTimeout(() => {
        if (topTracks.length === currentTrackCount) {
          toast.info('No more tracks available for this artist');
        }
      }, 100);
    } catch (error: any) {
      console.error('Failed to load more tracks:', error);
      toast.error('Failed to load more tracks');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleShowAllTracks = async () => {
    if (!artistId || !artist || isLoadingMore) return;

    if (showAllTracks) {
      // Collapse back to showing only first 5 tracks
      setShowAllTracks(false);
      return;
    }

    // Fetch all tracks
    setIsLoadingMore(true);
    
    try {
      // Fetch a large number of tracks (Spotify typically returns up to 10 top tracks, but we'll request 50 to get all available)
      const fullArtist = await getArtistById(artistId, 50);
      
      if (fullArtist && fullArtist.topTracks && fullArtist.topTracks.length > 0) {
        setAllTracks(fullArtist.topTracks);
        setShowAllTracks(true);
        toast.success(`Loaded ${fullArtist.topTracks.length} tracks`);
      } else {
        toast.info('No additional tracks available');
      }
    } catch (error: any) {
      console.error('Failed to load all tracks:', error);
      toast.error('Failed to load all tracks');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Check if more tracks might be available
  // If we got exactly the limit we requested, there might be more
  const hasMoreTracks = topTracks.length >= trackLimit;
  
  // Determine which tracks to display
  const displayedTracks = showAllTracks ? allTracks : topTracks.slice(0, 5);

  return (
    <div
      className={`min-h-screen bg-black text-white transition-all ${
        hasActivePlayer ? 'pb-44 md:pb-52' : ''
      }`}
    >
      <div className="w-full">
        {/* Hero Section - Spotify Style */}
        <section className="px-4 sm:px-6 md:px-8 lg:px-12 pt-6 sm:pt-8 md:pt-12 pb-6 sm:pb-8 md:pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 md:gap-8">
            {/* Artist Image - Circular */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-2xl mx-auto sm:mx-0">
                {artist.image ? (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900 text-white/70">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      {artist.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info and Controls */}
            <div className="flex-1 min-w-0 w-full sm:w-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Verified Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-blue-400">Verified Artist</span>
                </span>
              </div>

              {/* Artist Name */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                {artist.name}
              </h1>

              {/* Monthly Listeners */}
              <p className="text-sm sm:text-base text-white/70 font-normal">
                {(() => {
                  const listeners = formatListeners(artist.popularity);
                  // Add comma formatting: 1096768 -> 1,096,768
                  return listeners.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                })()} monthly listeners
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap pt-2">
                {/* Play Button - Large Green */}
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#1DB954] hover:bg-[#1ed760] rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex-shrink-0"
                  aria-label="Play"
                >
                  {isPlaying && playingTrackId ? (
                    <PauseIcon size={28} className="text-black" />
                  ) : (
                    <PlayIcon size={28} className="text-black ml-1" />
                  )}
                </button>

                {/* Shuffle Button with Album Art */}
                {topTracks.length > 0 && topTracks[0].albumImage && (
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden border border-white/20 hover:border-white/40 transition-all hover:scale-105 flex-shrink-0 group"
                    aria-label="Shuffle"
                    title="Shuffle"
                  >
                    <img
                      src={topTracks[0].albumImage}
                      alt="Shuffle"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80"
                    />
                    <svg className="relative w-5 h-5 sm:w-6 sm:h-6 text-white z-10" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0zm-4 2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}

                {/* Follow Button */}
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full border-2 text-sm sm:text-base font-bold transition-all hover:scale-105 ${
                    isArtistFollowed
                      ? 'border-white/30 bg-transparent text-white hover:border-white/50'
                      : 'border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10'
                  }`}
                  aria-pressed={isArtistFollowed}
                >
                  {isArtistFollowed ? 'Following' : 'Follow'}
                </button>

                {/* More Options Button */}
                <button
                  type="button"
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-white/10 transition-all flex-shrink-0"
                  aria-label="More options"
                >
                  <svg className="w-6 h-6 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tracks Section */}
        <section className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8">Popular</h2>

          {isLoadingTracks ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p className="text-sm text-white/60">Loading top tracks...</p>
              </div>
            </div>
          ) : topTracks.length === 0 ? (
            <p className="text-sm text-white/60 py-8">No top tracks available for this artist.</p>
          ) : (
            <>
              <div className="space-y-0">
                {displayedTracks.map((track, index) => (
                  <button
                    key={track.id || index}
                    type="button"
                    onClick={() => handlePlayTrack(track)}
                    className="w-full flex items-center gap-3 sm:gap-4 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 rounded-md hover:bg-white/10 transition-colors group"
                  >
                    {/* Rank Number */}
                    <span className="text-base sm:text-lg text-white/40 w-6 sm:w-8 text-right flex-shrink-0 font-medium group-hover:text-white transition-colors">
                      {index + 1}
                    </span>

                    {/* Album Art */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 flex-shrink-0 rounded overflow-hidden bg-white/5">
                      {track.albumImage ? (
                        <img
                          src={track.albumImage}
                          alt={track.album || track.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                          <svg className="w-7 h-7 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-base sm:text-lg md:text-xl font-medium truncate group-hover:text-[#1DB954] transition-colors">
                        {track.name}
                      </p>
                    </div>

                    {/* Play Count */}
                    <span className="hidden md:inline text-sm text-white/50 flex-shrink-0">
                      {formatPlayCount(track.popularity)}
                    </span>

                    {/* Duration */}
                    <span className="text-sm sm:text-base text-white/50 w-12 sm:w-16 text-right flex-shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Show More / Show Less Button */}
              {topTracks.length > 5 && (
                <div className="flex justify-center pt-6">
                  <button
                    type="button"
                    onClick={handleShowAllTracks}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-white/70 transition-all hover:bg-white/10 hover:border-white/30 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : showAllTracks ? (
                      <>
                        Show Less
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show More
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Recommended Artists Section - Same Category */}
        {(relatedArtists.length > 0 || isLoadingRelatedArtists) && (
          <section className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8">
              {artist?.category ? `More ${artist.category.charAt(0).toUpperCase() + artist.category.slice(1)} Artists` : 'Recommended Artists'}
            </h2>
            
            {isLoadingRelatedArtists ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                  <p className="text-sm text-white/60">Loading recommended artists...</p>
                </div>
              </div>
            ) : relatedArtists.length > 0 ? (
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 3xl:grid-cols-10 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 justify-items-center">
                {relatedArtists.map((relatedArtist) => (
                  <button
                    key={relatedArtist.id}
                    type="button"
                    onClick={() => navigate(`/artists/${relatedArtist.id}`, { 
                      state: { artist: relatedArtist, category: artist?.category || 'global' } 
                    })}
                    className="flex flex-col items-center gap-3 group"
                  >
                    {/* Circular Artist Image */}
                    <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 group-hover:border-white/40 transition-all group-hover:scale-105">
                      {relatedArtist.image ? (
                        <img
                          src={relatedArtist.image}
                          alt={relatedArtist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900 text-white/70">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            {relatedArtist.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Artist Name */}
                    <p className="text-xs xs:text-sm sm:text-base text-white text-center max-w-[100px] xs:max-w-[120px] sm:max-w-[140px] truncate group-hover:text-[#1DB954] transition-colors">
                      {relatedArtist.name}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
};

export default ArtistDetail;


