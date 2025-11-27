import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getTracksByMood,
} from '../api/music.api';
import type { Track } from '../api/music.api';
import SpotifyEmbed from '../components/SpotifyEmbed';
import { 
  ArrowBackIcon, 
  LightningIcon, 
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  NextIcon,
  PreviousIcon,
  YouTubeIcon,
  SoundCloudIcon,
  SpotifyIcon,
  HeartIcon,
} from '../components/icons';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mood = searchParams.get('mood') || 'relaxed';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isProcessingPlaylistAction, setIsProcessingPlaylistAction] = useState(false);
  const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);

  // Stub functions for playlist and favorite track management
  const openPlaylistModal = () => {
    toast.info('Playlist management feature coming soon!', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  const handleToggleLiked = async () => {
    if (!currentTrack) return;
    
    setIsProcessingPlaylistAction(true);
    try {
      // TODO: Implement favorite track API call
      setIsCurrentTrackLiked(!isCurrentTrackLiked);
      toast.success(isCurrentTrackLiked ? 'Removed from favorites' : 'Added to favorites', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      toast.error('Failed to update favorite status', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsProcessingPlaylistAction(false);
    }
  };

  // Fetch tracks based on mood
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        console.log('🎵 Fetching tracks for mood:', mood);
        setIsLoading(true);
        
        const response = await getTracksByMood(mood, 20, 'recommendations', 'spotify');
        console.log('✅ Tracks fetched successfully:', response.data.tracks.length);
        
        setTracks(response.data.tracks);
        
        if (response.data.tracks.length > 0) {
          const firstTrack = response.data.tracks[0];
          console.log('🎵 ========== SETTING FIRST TRACK ==========');
          console.log('🎵 Track name:', firstTrack.name);
          console.log('🎵 Track source:', firstTrack.source);
          console.log('🎵 Track ID:', firstTrack.id);
          console.log('🎵 Track externalUrl:', firstTrack.externalUrl);
          console.log('🎵 Full track object:', JSON.stringify(firstTrack, null, 2));
          console.log('🎵 Is Spotify?', firstTrack.source === 'spotify' || firstTrack.externalUrl?.includes('spotify.com'));
          setCurrentTrack(firstTrack);
          setCurrentTrackIndex(0);
          
          console.log('🎵 First track set, SpotifyEmbed component will auto-load if it\'s a Spotify track');
          
          toast.success(`Found ${response.data.tracks.length} tracks! Starting playback... 🎵`, {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          toast.warning('No tracks found. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } catch (error: any) {
        console.error('❌ Error fetching tracks:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          stack: error.stack
        });
        
        const errorMessage = error.message || 'Failed to fetch music tracks';
        
        // Check for specific error messages
        if (errorMessage.includes('Spotify API credentials')) {
          toast.error('Spotify API not configured. Please add credentials to backend .env file.', {
            position: 'top-right',
            autoClose: 5000,
          });
        } else if (errorMessage.includes('Invalid Spotify')) {
          toast.error('Invalid Spotify credentials. Please check backend configuration.', {
            position: 'top-right',
            autoClose: 5000,
          });
        } else {
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 4000,
          });
        }
        
        // Set empty tracks array on error
        setTracks([]);
        setCurrentTrack(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (mood) {
      fetchTracks();
    }
  }, [mood]);

  // Initialize audio/video when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsPlaying(false);
      
      console.log('🎵 ========== TRACK CHANGED ==========');
      console.log('🎵 Track name:', currentTrack.name);
      console.log('🎵 Track source:', currentTrack.source);
      console.log('🎵 Track ID:', currentTrack.id);
      console.log('🎵 Track externalUrl:', currentTrack.externalUrl);
      
      // Check if it's a YouTube track
      if (currentTrack.source === 'youtube' || currentTrack.externalUrl?.includes('youtube.com')) {
        console.log('🎵 ✅ YOUTUBE TRACK DETECTED');
        console.log('🎵 YouTube URL:', currentTrack.externalUrl);
      } 
      // Check if it's a Spotify track - SpotifyEmbed component handles it automatically
      else if (currentTrack.source === 'spotify' || currentTrack.externalUrl?.includes('spotify.com')) {
        console.log('🎵 ✅ SPOTIFY TRACK DETECTED!');
        console.log('🎵 Spotify track ID:', currentTrack.id);
        console.log('🎵 SpotifyEmbed component will auto-load the player');
      }
      // Check if it's a SoundCloud track
      else if (currentTrack.source === 'soundcloud' || currentTrack.externalUrl?.includes('soundcloud.com')) {
        console.log('🎵 SoundCloud track selected:', currentTrack.name);
        // SoundCloud tracks - open in new tab or use iframe
      }
      // Other audio sources (preview URLs)
      else {
        if (audioRef.current && currentTrack.previewUrl) {
          if (audioRef.current.src) {
            audioRef.current.pause();
          }
          
          console.log('🎵 Loading audio preview:', currentTrack.previewUrl);
          audioRef.current.src = currentTrack.previewUrl;
          audioRef.current.volume = volume / 100;
          audioRef.current.load();
        } else if (!currentTrack.previewUrl) {
          toast.info(`Preview not available for "${currentTrack.name}". Click to open in external player!`, {
            position: 'top-right',
            autoClose: 4000,
          });
        }
      }
    }
  }, [currentTrack, volume]);

  // Audio event handlers - for future use if needed
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        // Timer is updated but not displayed in current UI
        // Can be added to player controls if needed
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [currentTrack]);

  // Handle play/pause
  const togglePlay = async () => {
    if (!currentTrack) {
      return;
    }

    // Check if it's a YouTube track
    if (currentTrack.source === 'youtube' || currentTrack.externalUrl?.includes('youtube.com')) {
      // For YouTube, open in new tab or show iframe
      if (currentTrack.externalUrl) {
        window.open(currentTrack.externalUrl, '_blank');
        toast.info('Opening YouTube video in new tab...', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
      return;
    }

    // Check if it's a SoundCloud track
    if (currentTrack.source === 'soundcloud' || currentTrack.externalUrl?.includes('soundcloud.com')) {
      // For SoundCloud, open in new tab
      if (currentTrack.externalUrl) {
        window.open(currentTrack.externalUrl, '_blank');
        toast.info('Opening SoundCloud track in new tab...', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
      return;
    }

    // Check if it's a Spotify track - embed player handles play/pause
    if (currentTrack.source === 'spotify' || currentTrack.externalUrl?.includes('spotify.com')) {
      // Spotify Embed player has its own controls - just show info
      toast.info('Use the Spotify player below to control playback', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }

    // Other audio sources (preview URLs)
    if (!currentTrack.previewUrl) {
      toast.info('Preview not available. Click to open the link!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
          console.log('⏸️ Audio paused');
        } else {
          // Ensure audio is loaded before playing
          if (!audioRef.current.src || audioRef.current.src !== currentTrack.previewUrl) {
            console.log('🔄 Loading audio source:', currentTrack.previewUrl);
            audioRef.current.src = currentTrack.previewUrl;
            audioRef.current.volume = volume / 100;
            await audioRef.current.load();
          }
          
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('▶️ Audio playing:', currentTrack.name);
        }
      } catch (error: any) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        
        if (error.name === 'NotAllowedError') {
          toast.error('Please interact with the page first to play audio (browser autoplay policy)', {
            position: 'top-right',
            autoClose: 4000,
          });
        } else {
          toast.error('Failed to play audio preview. Try clicking play again.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    }
  };

  // Handle track selection from list
  const handleTrackSelect = (index: number) => {
    if (tracks.length > 0 && index >= 0 && index < tracks.length) {
      console.log('🎵 User selected track:', tracks[index].name);
      setCurrentTrackIndex(index);
      setCurrentTrack(tracks[index]);
      setIsPlaying(false);
    }
  };

  // Handle next track
  const handleNext = () => {
    if (tracks.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(tracks[nextIndex]);
      setIsPlaying(false);
    }
  };

  // Handle previous track
  const handlePrevious = () => {
    if (tracks.length > 0) {
      const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(tracks[prevIndex]);
      setIsPlaying(false);
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"></div>
        
        {/* Light Rays Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent" 
                 style={{ clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)' }}>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 transition-colors "
            >
              <ArrowBackIcon size={24} />
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-white text-sm hover:bg-gray-700/80 transition-colors">
              <LightningIcon size={16} />
              <span>Recharge</span>
              <ChevronDownIcon size={12} />
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={openPlaylistModal}
              disabled={isProcessingPlaylistAction}
              className={`px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-white text-sm transition-colors ${
                isProcessingPlaylistAction ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-700/80'
              }`}
            >
              Manage Playlists
            </button>
            <button className="text-white hover:text-gray-300 transition-colors p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"/>
                <circle cx="6" cy="18" r="2"/>
              </svg>
            </button>
            <button className="text-white hover:text-gray-300 transition-colors p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM9 12l12-2"/>
              </svg>
            </button>
            <button className="text-white hover:text-gray-300 transition-colors p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Center Content - Track List */}
        <div className="flex-1 flex flex-col px-6 py-8 overflow-hidden">
          {currentTrack && (() => {
            const isSpotify = currentTrack.source === 'spotify' || currentTrack.externalUrl?.includes('spotify.com');
            const trackId = currentTrack.id || currentTrack.externalUrl || '';

            if (!isSpotify) {
              return null;
            }

            return (
              <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800/60 rounded-2xl shadow-lg">
                <div className="container mx-auto">
                  <SpotifyEmbed 
                    urlOrId={trackId}
                  />
                </div>
              </div>
            );
          })()}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
              <p className="text-white text-lg">Loading music for {mood} mood...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {mood === 'sad' ? 'Happy & Upbeat Songs' : 
                   mood === 'happy' ? 'Energetic Songs' :
                   mood === 'excited' ? 'Dance & Energetic Music' :
                   mood === 'relaxed' ? 'Calm & Peaceful Music' :
                   mood === 'focused' ? 'Instrumental & Ambient Music' : 'Chill Music'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {tracks.length} tracks available • Click any track to play
                </p>
              </div>

              {/* Track List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {tracks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No tracks available</p>
                  </div>
                ) : (
                  tracks.map((track, index) => {
                    return (
                      <div
                        key={track.id || index}
                        onClick={() => handleTrackSelect(index)}
                        className={`
                        flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all
                        ${currentTrackIndex === index 
                          ? 'bg-purple-600/30 border-2 border-purple-500/50' 
                          : 'bg-gray-800/50 hover:bg-gray-700/70 border-2 border-transparent'
                        }
                      `}
                      >
                        {/* Track Number / Play Icon */}
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                          {currentTrackIndex === index && isPlaying ? (
                            <PauseIcon size={24} className="w-6 h-6 text-purple-400 animate-pulse" />
                          ) : (
                            <span className="text-gray-400 text-sm font-mono">
                              {currentTrackIndex === index ? (
                                <PlayIcon size={20} className="w-5 h-5 text-purple-400" />
                              ) : (
                                index + 1
                              )}
                            </span>
                          )}
                        </div>

                        {/* Album Art */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-green-400/20 to-blue-500/20">
                          <img 
                            src={track.albumImage || 'https://via.placeholder.com/200'} 
                            alt={track.album}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                            }}
                          />
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate ${currentTrackIndex === index ? 'text-white' : 'text-gray-200'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {track.name}
                          </div>
                          <div className="text-gray-400 text-sm truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {track.artists}
                          </div>
                          <div className="text-gray-500 text-xs truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {track.album}
                          </div>
                        </div>

                        {/* Preview Indicator / External Link */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {track.source === 'youtube' || track.externalUrl?.includes('youtube.com') ? (
                            <div className="text-red-500 text-xs" title="YouTube Video">
                              <YouTubeIcon size={16} className="w-4 h-4" />
                            </div>
                          ) : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com') ? (
                            <div className="text-orange-500 text-xs" title="SoundCloud Track">
                              <SoundCloudIcon size={16} className="w-4 h-4" />
                            </div>
                          ) : track.previewUrl ? (
                            <div className="text-green-400 text-xs" title="Audio Preview Available">
                              <PlayIcon size={16} className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs" title="No Preview">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                              </svg>
                            </div>
                          )}
                          <a
                            href={track.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-white transition-colors"
                            title={
                              track.source === 'youtube' || track.externalUrl?.includes('youtube.com') 
                                ? 'Open in YouTube' 
                                : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com')
                                ? 'Open in SoundCloud'
                                : 'Open in Spotify'
                            }
                          >
                            {track.source === 'youtube' || track.externalUrl?.includes('youtube.com') ? (
                              <YouTubeIcon size={20} className="w-5 h-5" />
                            ) : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com') ? (
                              <SoundCloudIcon size={20} className="w-5 h-5" />
                            ) : (
                              <SpotifyIcon size={20} className="w-5 h-5" />
                            )}
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Player Controls Bar */}
        <div className="bg-gray-900/90 backdrop-blur-md border-t border-gray-800/50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Song Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Album Art */}
                {currentTrack ? (
                  <>
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-green-400/20 to-blue-500/20">
                      <img 
                        src={currentTrack.albumImage || 'https://via.placeholder.com/200'} 
                        alt={currentTrack.album}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                        }}
                      />
                    </div>
                    
                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm sm:text-base truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {currentTrack.name}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {currentTrack.artists}
                      </div>
                      <div className="text-gray-500 text-xs truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {currentTrack.album}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-800/60 rounded-full text-gray-300 text-xs uppercase">{mood}</span>
                        <a 
                          href={currentTrack.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-gray-800/60 rounded-full text-gray-300 text-xs hover:bg-gray-700/60 transition-colors"
                        >
                          {currentTrack.source === 'youtube' || currentTrack.externalUrl?.includes('youtube.com') 
                            ? 'Open in YouTube' 
                            : currentTrack.source === 'soundcloud' || currentTrack.externalUrl?.includes('soundcloud.com')
                            ? 'Open in SoundCloud'
                            : 'Open in Spotify'}
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLiked();
                          }}
                          disabled={isProcessingPlaylistAction}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isCurrentTrackLiked
                              ? 'bg-pink-600/80 text-white hover:bg-pink-500/80 disabled:bg-pink-600/50'
                              : 'bg-purple-600/70 text-white hover:bg-purple-600 disabled:bg-purple-600/40'
                          }`}
                        >
                          <HeartIcon
                            size={16}
                            className="w-4 h-4"
                            filled={isCurrentTrackLiked}
                          />
                          <span>{isCurrentTrackLiked ? 'Liked' : 'Like Song'}</span>
                        </button>
                      </div>
                      
                      {/* Interaction Icons */}
                      <div className="flex items-center gap-4 mt-2">
                        <button className="text-gray-400 hover:text-white transition-colors p-1">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                          </svg>
                        </button>
                        <a 
                          href={currentTrack.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-green-400/20 to-blue-500/20">
                      <div className="w-full h-full flex items-center justify-center text-gray-500">🎵</div>
                    </div>
                    
                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm sm:text-base truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        No track selected
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        Loading...
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Center - Playback Controls */}
              <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                <button className="text-white hover:text-gray-300 transition-colors p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="18 2 18 22 2 12 18 2"/>
                    <line x1="4" y1="12" x2="12" y2="12"/>
                  </svg>
                </button>
                <button 
                  onClick={handlePrevious}
                  disabled={tracks.length === 0}
                  className="text-white hover:text-gray-300 transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PreviousIcon size={20} />
                </button>
                <button 
                  onClick={togglePlay}
                  disabled={!currentTrack}
                  className="text-white hover:text-gray-300 transition-colors p-3 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    currentTrack?.source === 'youtube' || currentTrack?.externalUrl?.includes('youtube.com') 
                      ? 'Open in YouTube' 
                      : currentTrack?.source === 'soundcloud' || currentTrack?.externalUrl?.includes('soundcloud.com')
                      ? 'Open in SoundCloud'
                      : currentTrack?.source === 'spotify' || currentTrack?.externalUrl?.includes('spotify.com')
                      ? 'Use Spotify player below'
                      : 'Play/Pause'
                  }
                >
                  {isPlaying ? (
                    <PauseIcon size={24} />
                  ) : (
                    <PlayIcon size={24} />
                  )}
                </button>
                <button 
                  onClick={handleNext}
                  disabled={tracks.length === 0}
                  className="text-white hover:text-gray-300 transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <NextIcon size={20} />
                </button>
                <button className="text-white hover:text-gray-300 transition-colors p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </button>
              </div>

              {/* Right Side - Streak and Volume */}
              <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                {/* Streak */}
                <div className="flex items-center gap-2 text-white text-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>3 week streak</span>
                </div>
                
                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <button className="text-white hover:text-gray-300 transition-colors p-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  </button>
                  <div className="w-24">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          handleNext(); // Auto-play next track
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          toast.error('Failed to load audio preview', {
            position: 'top-right',
            autoClose: 3000,
          });
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

export default Player;

