import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Track } from '../api/music.api';
import { getArtistById, getRecommendationsByArtists } from '../api/music.api';
import { SpotifyIcon } from '../components/icons';
import { useSpotifyPlayer } from '../context';

const StationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { stationId } = useParams<{ stationId: string }>();
  const [searchParams] = useSearchParams();
  
  const [featuredArtists, setFeaturedArtists] = useState<Array<{
    id: string;
    name: string;
    image?: string;
  }>>([]);
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stationName, setStationName] = useState<string>('');
  
  const { playTrack } = useSpotifyPlayer();

  // Fetch featured artists and tracks
  useEffect(() => {
    const artistIdsParam = searchParams.get('artists');
    const nameParam = searchParams.get('name');

    if (nameParam) {
      setStationName(decodeURIComponent(nameParam));
    }

    if (artistIdsParam) {
      const artistIds = artistIdsParam.split(',').filter(Boolean);
      
      if (artistIds.length > 0) {
        setIsLoading(true);
        
        // Fetch artist details with their top tracks, plus recommendations
        Promise.allSettled([
          // Fetch artist details with their top tracks (10 tracks per artist)
          Promise.all(artistIds.map(id => getArtistById(id, 10))),
          // Fetch recommended tracks based on these artists (may fail)
          getRecommendationsByArtists(artistIds, 20).catch(err => {
            console.warn('Recommendations failed, will use only top tracks:', err);
            return { tracks: [], count: 0, seedArtists: artistIds };
          }),
        ])
          .then((results) => {
            const artistsResult = results[0];
            const recommendationsResult = results[1];
            
            if (artistsResult.status === 'rejected') {
              throw new Error(artistsResult.reason?.message || 'Failed to fetch artists');
            }
            
            const artists = artistsResult.value;
            const recommendations = recommendationsResult.status === 'fulfilled' 
              ? recommendationsResult.value 
              : { tracks: [], count: 0, seedArtists: artistIds };
            
            // Set featured artists
            const featuredArtistsData = artists.map(artist => ({
              id: artist.id,
              name: artist.name,
              image: artist.image,
            }));
            setFeaturedArtists(featuredArtistsData);
            
            // Combine top tracks from all artists and recommendations
            const allTopTracks: Track[] = [];
            artists.forEach(artist => {
              if (artist.topTracks && Array.isArray(artist.topTracks)) {
                allTopTracks.push(...artist.topTracks);
              }
            });
            
            // Combine with recommendations (remove duplicates by track ID)
            const trackMap = new Map<string, Track>();
            allTopTracks.forEach(track => {
              if (track.id) trackMap.set(track.id, track);
            });
            if (recommendations.tracks && Array.isArray(recommendations.tracks)) {
              recommendations.tracks.forEach(track => {
                if (track.id && !trackMap.has(track.id)) {
                  trackMap.set(track.id, track);
                }
              });
            }
            
            const finalTracks = Array.from(trackMap.values());
            setFeaturedTracks(finalTracks);
            
            toast.success(`Loaded ${artists.length} artists and ${finalTracks.length} tracks`, {
              position: 'top-right',
              autoClose: 2000,
            });
          })
          .catch((error: any) => {
            console.error('Error fetching featured artists:', error);
            toast.error(error.message || 'Failed to load featured artists', {
              position: 'top-right',
              autoClose: 3000,
            });
            // Clear on error
            setFeaturedArtists([]);
            setFeaturedTracks([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      // No artist IDs, redirect back
      toast.error('Invalid station - missing artist information');
      navigate('/artists', { replace: true });
    }
  }, [searchParams, navigate]);

  const handlePlayTrack = useCallback((track: Track) => {
    const reference = track.externalUrl || track.id;
    if (!reference) {
      toast.error('Unable to play this track');
      return;
    }
    playTrack(track, reference);
    toast.info(`Playing ${track.name}`);
  }, [playTrack]);

  const handleArtistClick = useCallback(async (artistId: string, artistName: string, artistImage?: string) => {
    try {
      // Fetch full artist data before navigating
      const fullArtist = await getArtistById(artistId, 10);
      // Navigate to artist detail page with full data
      navigate(`/artists/${artistId}`, { 
        state: { 
          artist: fullArtist,
          category: 'Station'
        } 
      });
    } catch (error: any) {
      console.error('Error fetching artist:', error);
      // Still navigate even if fetch fails - ArtistDetail will fetch it
      navigate(`/artists/${artistId}`, { 
        state: { 
          artist: {
            id: artistId,
            name: artistName,
            image: artistImage,
          },
          category: 'Station'
        } 
      });
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0618] to-[#1b0b2f] text-white">
        <div className="w-full">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-lg text-white/60">Loading station...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate a color for the station based on artist names
  const getStationColor = (): string => {
    const colors = [
      '#FF6B35', // Red-orange
      '#FF4757', // Red
      '#FF6348', // Tomato red
      '#FF8C42', // Orange
      '#E74C3C', // Bright red
      '#FF6B9D', // Pink-red
      '#FF8E53', // Orange
      '#FF5252', // Red
    ];
    // Use a hash of the station name to pick a consistent color
    const hash = stationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const stationColor = getStationColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0618] to-[#1b0b2f] text-white">
      <div className="w-full">
        {/* Hero Section - Similar to Radio Cards */}
        <div 
          className="relative w-full min-h-[280px] md:min-h-[320px] flex items-center justify-center overflow-hidden px-6 md:px-12"
          style={{ backgroundColor: stationColor }}
        >
          {/* Top Bar with Back Button, Logo, and Badge */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/artists')}
                className="text-white/90 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 backdrop-blur-sm"
                title="Back to artists"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <SpotifyIcon size={14} className="text-white drop-shadow-md" />
            </div>
            
            <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide bg-white/20 backdrop-blur-sm rounded-full" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              RADIO
            </span>
          </div>

          {/* Centered Content - Artist Images and Text Side by Side */}
          <div className="flex items-center justify-center gap-8 md:gap-12 z-10">
            {/* Left Side - Overlapping Artist Images */}
            {featuredArtists.length > 0 && (
              <div className="relative flex items-center justify-center flex-shrink-0">
                <div className="relative flex items-center justify-center" style={{ width: '340px', height: '160px' }}>
                  {featuredArtists.slice(0, 3).map((artist, index) => {
                    // Center image is larger, side images are smaller
                    const size = index === 1 ? 150 : 120;
                    const offset = index === 0 ? -70 : index === 1 ? 0 : 70;
                    
                    return (
                      <div
                        key={artist.id}
                        className="absolute rounded-full overflow-hidden bg-gray-300 flex items-center justify-center cursor-pointer hover:scale-115 transition-all duration-300 group"
                        onClick={() => handleArtistClick(artist.id, artist.name, artist.image)}
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          left: `calc(50% + ${offset}px)`,
                          transform: 'translateX(-50%)',
                          zIndex: index === 1 ? 10 : 10 - Math.abs(index - 1),
                          border: '3px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        }}
                      >
                        {artist.image ? (
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-gray-600 text-3xl font-bold">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-full"></div>
                      </div>
                    );
                  })}
                  {featuredArtists.length > 3 && (
                    <div
                      className="absolute rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-115 transition-all duration-300"
                      style={{
                        width: '90px',
                        height: '90px',
                        left: 'calc(50% + 105px)',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                        border: '3px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                      }}
                    >
                      +{featuredArtists.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Side - Station Name and Info */}
            <div className="flex-shrink-0 text-left">
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 line-clamp-2 leading-tight" 
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                }}
              >
                {stationName || 'Station'}
              </h1>
              <p className="text-sm md:text-base text-white/95 font-medium mb-2" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)' }}>
                {featuredArtists.map(a => a.name).join(' & ')}
              </p>
              <p className="text-xs md:text-sm text-white/80" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)' }}>
                {featuredTracks.length} tracks
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full px-6 md:px-12 py-12 max-w-7xl mx-auto">
          {/* Featured Tracks */}
        {featuredTracks.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-bold text-white">Recommended Tracks</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handlePlayTrack(track)}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
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
          </section>
        )}

        {featuredTracks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-white/60">No tracks available for this station</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default StationDetail;

