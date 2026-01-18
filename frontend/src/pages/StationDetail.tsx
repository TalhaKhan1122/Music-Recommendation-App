import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Track } from '../api/music.api';
import { getArtistById, getRecommendationsByArtists } from '../api/music.api';
import { useSpotifyPlayer } from '../context';
import BeatifyLogo from '../assets/beatify-logo.png';

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
              <img 
                src={BeatifyLogo} 
                alt="Beatify" 
                className="w-5 h-5 object-contain drop-shadow-md"
              />
            </div>
            
            <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide bg-white/20 backdrop-blur-sm rounded-full" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              RADIO
            </span>
          </div>

          {/* Centered Content - Artist Images and Names */}
          <div className="flex flex-col items-center justify-center gap-6 md:gap-8 z-10 w-full max-w-4xl mx-auto">
            {/* Artist Images Section */}
            {featuredArtists.length > 0 && (() => {
              const artistCount = featuredArtists.length;
              
              // Calculate layout based on number of artists - INCREASED SIZES
              const getArtistLayout = (index: number, total: number) => {
                if (total === 1) {
                  return { size: 280, offset: 0 };
                } else if (total === 2) {
                  const offset = index === 0 ? -70 : 70;
                  return { size: 220, offset };
                } else if (total === 3) {
                  const size = index === 1 ? 240 : 180;
                  const offset = index === 0 ? -100 : index === 1 ? 0 : 100;
                  return { size, offset };
                } else if (total === 4) {
                  const size = index < 2 ? 170 : 160;
                  const offset = index === 0 ? -110 : index === 1 ? -35 : index === 2 ? 35 : 110;
                  return { size, offset };
                } else { // total === 5
                  const size = index === 2 ? 200 : 150; // Center is larger
                  const offset = index === 0 ? -120 : index === 1 ? -60 : index === 2 ? 0 : index === 3 ? 60 : 120;
                  return { size, offset };
                }
              };

              // Calculate container width based on number of artists - INCREASED
              const containerWidth = artistCount === 1 ? 300 : 
                                    artistCount === 2 ? 450 : 
                                    artistCount === 3 ? 500 : 
                                    artistCount === 4 ? 550 : 600;
              
              const containerHeight = artistCount === 1 ? 300 : 
                                      artistCount === 2 ? 250 : 
                                      artistCount === 3 ? 280 : 
                                      artistCount === 4 ? 250 : 280;

              return (
                <div className="relative flex flex-col items-center justify-center w-full">
                  {/* Artist Images - Made Bigger and More Prominent */}
                  <div className="relative flex items-center justify-center mb-4" style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}>
                    {featuredArtists.map((artist, index) => {
                      const { size, offset } = getArtistLayout(index, artistCount);
                      const zIndex = artistCount === 1 ? 10 : 
                                    artistCount === 2 ? (index === 0 ? 9 : 10) :
                                    artistCount === 3 ? (index === 1 ? 10 : 10 - Math.abs(index - 1)) :
                                    artistCount === 4 ? (10 - Math.abs(index - 1.5)) :
                                    (index === 2 ? 10 : 10 - Math.abs(index - 2));
                      
                      return (
                        <div
                          key={artist.id}
                          className="absolute rounded-full overflow-hidden bg-gray-300 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 group"
                          onClick={() => handleArtistClick(artist.id, artist.name, artist.image)}
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `calc(50% + ${offset}px)`,
                            transform: 'translateX(-50%)',
                            zIndex: zIndex,
                            border: '4px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
                          }}
                        >
                          {artist.image ? (
                            <img
                              src={artist.image}
                              alt={artist.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-gray-600 text-5xl font-bold">
                              {artist.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-full"></div>
                          
                          {/* Small artist name below image - subtle */}
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full px-2">
                            <span 
                              className="block text-[10px] text-white/60 text-center truncate max-w-full"
                              style={{ 
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
                                fontSize: size > 200 ? '11px' : size > 150 ? '10px' : '9px'
                              }}
                              title={artist.name}
                            >
                              {artist.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Station Name and Info */}
            <div className="flex-shrink-0 text-center px-4">
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 line-clamp-2 leading-tight" 
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                }}
                title={stationName || 'Station'}
              >
                {stationName || 'Station'}
              </h1>
              <p className="text-xs md:text-sm text-white/80" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)' }}>
                {featuredTracks.length} {featuredTracks.length === 1 ? 'track' : 'tracks'}
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

