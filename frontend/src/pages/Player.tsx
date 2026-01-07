import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getTracksByMood,
} from '../api/music.api';
import type { Track } from '../api/music.api';
import { useSpotifyPlayer } from '../context';
import { 
  PlayIcon,
  PauseIcon,
  NextIcon,
  PreviousIcon,
  YouTubeIcon,
  SoundCloudIcon,
  HeartIcon,
} from '../components/icons';
import BeatifyLogo from '../assets/beatify-logo.png';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mood = searchParams.get('mood') || 'relaxed';
  const { playTrack } = useSpotifyPlayer();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isProcessingPlaylistAction, setIsProcessingPlaylistAction] = useState(false);
  const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const fetchedMoodRef = useRef<string | null>(null); // Track which mood we've already fetched

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

  // Fetch tracks function - can be called from refresh button
  const fetchTracks = useCallback(async (forceRefresh: boolean = false) => {
    // Skip if we've already fetched for this mood (unless force refresh)
    if (!forceRefresh && fetchedMoodRef.current === mood) {
      console.log('🎵 Already fetched tracks for mood:', mood, '- skipping');
      return;
    }

    try {
      console.log('🎵 Fetching tracks for mood:', mood, forceRefresh ? '(forced refresh)' : '');
      if (forceRefresh) {
        // Reset the ref to allow fetching again
        fetchedMoodRef.current = null;
      }
      fetchedMoodRef.current = mood; // Mark this mood as fetched
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
        // Set track in global player
        const trackId = firstTrack.id || firstTrack.externalUrl || '';
        playTrack(firstTrack, trackId);
        
        console.log('🎵 First track set, global player will handle playback');
        
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
      fetchedMoodRef.current = null; // Reset on error so we can retry
    } finally {
      setIsLoading(false);
    }
  }, [mood, playTrack]);

  // Fetch tracks based on mood - only once per mood
  useEffect(() => {
    if (mood) {
      fetchTracks(false);
    }
  }, [mood, fetchTracks]);

  // Handle refresh button click
  const handleRefresh = () => {
    console.log('🔄 Refresh button clicked - fetching new tracks with all categories');
    toast.info('Refreshing tracks... Including Punjabi, English, and Global songs! 🎵', {
      position: 'top-right',
      autoClose: 2000,
    });
    fetchTracks(true); // Force refresh
  };

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
      const selectedTrack = tracks[index];
      setCurrentTrackIndex(index);
      setCurrentTrack(selectedTrack);
      setIsPlaying(false);
      // Set track in global player
      const trackId = selectedTrack.id || selectedTrack.externalUrl || '';
      playTrack(selectedTrack, trackId);
    }
  };

  // Handle next track
  const handleNext = () => {
    if (tracks.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      const nextTrack = tracks[nextIndex];
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(nextTrack);
      setIsPlaying(false);
      // Set track in global player
      const trackId = nextTrack.id || nextTrack.externalUrl || '';
      playTrack(nextTrack, trackId);
    }
  };

  // Handle previous track
  const handlePrevious = () => {
    if (tracks.length > 0) {
      const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
      const prevTrack = tracks[prevIndex];
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(prevTrack);
      setIsPlaying(false);
      // Set track in global player
      const trackId = prevTrack.id || prevTrack.externalUrl || '';
      playTrack(prevTrack, trackId);
    }
  };

  // Handle action menu - click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionMenu]);

  const handleViewArtist = () => {
    if (!currentTrack) return;
    // Navigate to artists page - user can search for the artist
    // For Spotify tracks, we could extract artist ID from external URL in the future
    navigate('/artists');
    toast.info(`Search for "${currentTrack.artists}" on the Artists page`, {
      position: 'top-right',
      autoClose: 3000,
    });
    setShowActionMenu(false);
  };

  const handleShareTrack = async () => {
    if (!currentTrack) return;
    
    if (navigator.share && currentTrack.externalUrl) {
      try {
        await navigator.share({
          title: currentTrack.name,
          text: `Check out "${currentTrack.name}" by ${currentTrack.artists}`,
          url: currentTrack.externalUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else if (currentTrack.externalUrl) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(currentTrack.externalUrl);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    } else {
      toast.info('Share link not available for this track');
    }
    setShowActionMenu(false);
  };

  const getMoodGradient = (mood: string) => {
    switch (mood) {
      case 'happy': return 'from-green-500/20 via-emerald-500/20 to-teal-500/20';
      case 'sad': return 'from-blue-500/20 via-indigo-500/20 to-purple-500/20';
      case 'excited': return 'from-pink-500/20 via-rose-500/20 to-red-500/20';
      case 'relaxed': return 'from-purple-500/20 via-violet-500/20 to-fuchsia-500/20';
      case 'focused': return 'from-amber-500/20 via-orange-500/20 to-yellow-500/20';
      default: return 'from-gray-500/20 via-slate-500/20 to-zinc-500/20';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return '#10B981';
      case 'sad': return '#3B82F6';
      case 'excited': return '#EC4899';
      case 'relaxed': return '#8B5CF6';
      case 'focused': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 25%, #0f0f1a 50%, #1a0a1a 75%, #0a0a0a 100%)'
    }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 60 + 270}, 70%, 70%)`,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Mood-based gradient overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${getMoodGradient(mood)} opacity-40`}
        style={{
          animation: 'pulse-glow 4s ease-in-out infinite',
        }}
      ></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Center Content - Track List */}
        <div className="flex-1 flex flex-col px-6 py-8 overflow-hidden max-w-6xl mx-auto w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${getMoodColor(mood)}40 0%, transparent 70%)`,
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                ></div>
                <div className="relative animate-spin rounded-full h-20 w-20 border-t-4 border-b-4"
                  style={{ 
                    borderColor: `${getMoodColor(mood)}`,
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                  }}
                ></div>
              </div>
              <p className="text-white text-xl font-semibold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Loading music for {mood} mood...
              </p>
              <p className="text-gray-400 text-sm">Finding the perfect tracks for you</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-1 h-12 rounded-full"
                      style={{
                        background: `linear-gradient(to bottom, ${getMoodColor(mood)}, ${getMoodColor(mood)}80)`,
                        boxShadow: `0 0 20px ${getMoodColor(mood)}50`,
                      }}
                    ></div>
                    <div className="flex-1">
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        textShadow: `0 0 20px ${getMoodColor(mood)}30`,
                      }}>
                        {mood === 'sad' ? 'Happy & Upbeat Songs' : 
                         mood === 'happy' ? 'Energetic Songs' :
                         mood === 'excited' ? 'Dance & Energetic Music' :
                         mood === 'relaxed' ? 'Calm & Peaceful Music' :
                         mood === 'focused' ? 'Instrumental & Ambient Music' : 'Chill Music'}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            background: `${getMoodColor(mood)}30`,
                            border: `1px solid ${getMoodColor(mood)}50`,
                          }}
                        >
                          {mood.charAt(0).toUpperCase() + mood.slice(1)} Mood
                        </div>
                        <p className="text-gray-400 text-sm">
                          {tracks.length} tracks available
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      background: `linear-gradient(135deg, ${getMoodColor(mood)}, ${getMoodColor(mood)}80)`,
                      boxShadow: `0 10px 30px ${getMoodColor(mood)}40`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.boxShadow = `0 15px 40px ${getMoodColor(mood)}60`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.boxShadow = `0 10px 30px ${getMoodColor(mood)}40`;
                      }
                    }}
                    title="Refresh tracks - Get new songs from all categories (Punjabi, English, Global)"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Track List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {tracks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎵</div>
                    <p className="text-gray-400 text-lg">No tracks available</p>
                    <p className="text-gray-500 text-sm mt-2">Try selecting a different mood</p>
                  </div>
                ) : (
                  tracks.map((track, index) => {
                    const isActive = currentTrackIndex === index;
                    return (
                      <div
                        key={track.id || index}
                        onClick={() => handleTrackSelect(index)}
                        className={`
                          flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300
                          ${isActive 
                            ? 'backdrop-blur-sm border-2 shadow-lg transform scale-[1.02]' 
                            : 'bg-gray-800/30 hover:bg-gray-700/50 border-2 border-transparent hover:border-gray-600/50'
                          }
                        `}
                        style={{
                          background: isActive 
                            ? `rgba(20, 20, 30, 0.8)` 
                            : undefined,
                          borderColor: isActive 
                            ? `${getMoodColor(mood)}50` 
                            : undefined,
                          boxShadow: isActive 
                            ? `0 10px 40px ${getMoodColor(mood)}30` 
                            : undefined,
                          animation: isActive ? 'slide-in 0.3s ease-out' : undefined,
                        }}
                      >
                        {/* Track Number / Play Icon */}
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl"
                          style={{
                            background: isActive 
                              ? `${getMoodColor(mood)}20` 
                              : 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {isActive && isPlaying ? (
                            <PauseIcon 
                              size={24} 
                              className="w-6 h-6"
                              style={{ color: getMoodColor(mood) }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm font-semibold">
                              {isActive ? (
                                <PlayIcon 
                                  size={20} 
                                  className="w-5 h-5"
                                  style={{ color: getMoodColor(mood) }}
                                />
                              ) : (
                                index + 1
                              )}
                            </span>
                          )}
                        </div>

                        {/* Album Art */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-lg relative group"
                          style={{
                            background: `linear-gradient(135deg, ${getMoodColor(mood)}20, ${getMoodColor(mood)}10)`,
                          }}
                        >
                          <img 
                            src={track.albumImage || 'https://via.placeholder.com/200'} 
                            alt={track.album}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                            }}
                          />
                          {isActive && (
                            <div className="absolute inset-0"
                              style={{
                                boxShadow: `inset 0 0 20px ${getMoodColor(mood)}40`,
                              }}
                            ></div>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`font-semibold truncate mb-1 ${isActive ? 'text-white' : 'text-gray-200'}`} 
                            style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              textShadow: isActive ? `0 0 10px ${getMoodColor(mood)}30` : undefined,
                            }}
                          >
                            {track.name}
                          </div>
                          <div className="text-gray-400 text-sm truncate mb-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {track.artists}
                          </div>
                          <div className="text-gray-500 text-xs truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {track.album}
                          </div>
                        </div>

                        {/* Preview Indicator / External Link */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {track.source === 'youtube' || track.externalUrl?.includes('youtube.com') ? (
                            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30" title="YouTube Video">
                              <YouTubeIcon size={18} className="w-4 h-4 text-red-400" />
                            </div>
                          ) : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com') ? (
                            <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30" title="SoundCloud Track">
                              <SoundCloudIcon size={18} className="w-4 h-4 text-orange-400" />
                            </div>
                          ) : track.previewUrl ? (
                            <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30" title="Audio Preview Available">
                              <PlayIcon size={18} className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-gray-500/20 border border-gray-500/30" title="No Preview">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                              </svg>
                            </div>
                          )}
                          <a
                            href={track.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600/30 hover:border-gray-500/50 transition-all"
                            title={
                              track.source === 'youtube' || track.externalUrl?.includes('youtube.com') 
                                ? 'Open in YouTube' 
                                : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com')
                                ? 'Open in SoundCloud'
                                : 'Open in Spotify'
                            }
                          >
                            {track.source === 'youtube' || track.externalUrl?.includes('youtube.com') ? (
                              <YouTubeIcon size={20} className="w-5 h-5 text-red-400" />
                            ) : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com') ? (
                              <SoundCloudIcon size={20} className="w-5 h-5 text-orange-400" />
                            ) : (
                              <img 
                                src={BeatifyLogo} 
                                alt="Beatify" 
                                className="w-6 h-6 object-contain"
                              />
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
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

