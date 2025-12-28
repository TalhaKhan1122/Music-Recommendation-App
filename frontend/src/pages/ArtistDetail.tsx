import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { ArtistMetadata, Track } from '../api/music.api';
import { getArtistById } from '../api/music.api';
import { SpotifyIcon } from '../components/icons';
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

const ArtistDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { artistId } = useParams<{ artistId: string }>();

  const { artist: locationArtist, category } = (location.state as ArtistDetailLocationState) || {};

  const [artist, setArtist] = useState<ArtistMetadata | null>(locationArtist ?? null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [trackLimit, setTrackLimit] = useState(10);
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

  const topTracks = useMemo(() => artist?.topTracks ?? [], [artist]);

  const handlePlayTrack = (track: Track) => {
    const reference = deriveSpotifyReference(track);
    if (!reference) {
      toast.error('Unable to load Spotify player for this track right now.');
      return;
    }
    playTrack(track, reference);
    toast.info(`Playing ${track.name} on Spotify`);
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
      console.log('Fetched tracks:', fullArtist.topTracks.length);
      
      // Use functional update to ensure we're working with the latest state
      setArtist(prevArtist => {
        if (!prevArtist) return fullArtist;
        
        // Get existing track IDs from current state
        const existingTrackIds = new Set(prevArtist.topTracks.map(t => t.id));
        console.log('Existing track IDs:', Array.from(existingTrackIds));
        
        // Filter out tracks we already have - only keep truly new ones
        const newTracks = fullArtist.topTracks.filter(t => {
          if (!t.id) return false;
          const isNew = !existingTrackIds.has(t.id);
          if (isNew) console.log('New track found:', t.name);
          return isNew;
        });
        
        console.log('New tracks to add:', newTracks.length);
        
        if (newTracks.length > 0) {
          // Append ONLY new tracks to the existing list (preserve existing tracks in order)
          const updatedTracks = [...prevArtist.topTracks, ...newTracks];
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

  // Check if more tracks might be available
  // If we got exactly the limit we requested, there might be more
  const hasMoreTracks = topTracks.length >= trackLimit;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-black via-[#0b0618] to-[#1b0b2f] text-white transition-all ${
        hasActivePlayer ? 'pb-44 md:pb-52' : ''
      }`}
    >
      <div className="w-full py-10 space-y-8 border border-white/10 bg-white/5">

        <section className="grid gap-8 lg:grid-cols-[320px,1fr] px-6">
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-square">
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/40 via-indigo-500/40 to-slate-900 text-white/70">
                  No Image
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFollowToggle}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] transition-colors ${
                  isArtistFollowed
                    ? 'border-purple-400 bg-purple-500/40 text-purple-100 hover:bg-purple-500/50'
                    : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                aria-pressed={isArtistFollowed}
              >
                {isArtistFollowed ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <header className="space-y-3">
              <h1 className="text-4xl font-semibold">{artist.name}</h1>
              <p className="text-sm text-white/60">{formatGenres(artist.genres)}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/60">
                <span>{formatFollowers(artist.followers)} followers</span>
                <span>Popularity {artist.popularity ?? '--'}</span>
                {artistId && <span>ID: {artistId.slice(0, 8)}...</span>}
              </div>
            </header>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold uppercase tracking-[0.35em] text-white/50">
                  Top Tracks
                </h2>
                <span className="text-xs text-white/40">
                  Powered by Spotify
                </span>
              </div>

              {isLoadingTracks ? (
                <p className="text-sm text-white/60">Loading top tracks...</p>
              ) : topTracks.length === 0 ? (
                <p className="text-sm text-white/60">No top tracks available for this artist.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {topTracks.map((track, index) => (
                      <button
                        key={track.id || index}
                        type="button"
                        onClick={() => handlePlayTrack(track)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className="text-xs text-white/40 w-6 text-right flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold truncate">{track.name}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs text-white/50 truncate">
                                  {track.artists}
                                  {track.album ? ` • ${track.album}` : ''}
                                </p>
                                {track.popularity !== undefined && (
                                  <span className="text-xs text-white/40 flex-shrink-0">
                                    • {formatListeners(track.popularity)} listeners
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 flex-shrink-0">
                            <SpotifyIcon size={16} />
                            Play
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {topTracks.length > 0 && hasMoreTracks && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={handleLoadMoreTracks}
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistDetail;


