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
        <div className="container mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0618] to-[#1b0b2f] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/artists')}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            title="Back to artists"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{stationName || 'Station'}</h1>
            <p className="text-sm text-gray-400">
              {featuredArtists.map(a => a.name).join(' & ')} • {featuredTracks.length} tracks
            </p>
          </div>
        </div>

        {/* Featured Artists */}
        {featuredArtists.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Artists</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleArtistClick(artist.id, artist.name, artist.image)}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 text-center hover:bg-white/10 transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
                >
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {artist.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{artist.name}</h3>
                  <p className="text-sm text-white/60">Click to view details</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Tracks */}
        {featuredTracks.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">Recommended Tracks</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredTracks.map((track) => (
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
          </section>
        )}

        {featuredTracks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-white/60">No tracks available for this station</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationDetail;

