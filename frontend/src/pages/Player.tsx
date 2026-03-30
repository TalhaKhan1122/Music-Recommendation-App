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

  // Map emotion moods to backend-supported moods for API calls
  // Backend supports: happy, sad, excited, relaxed, focused
  const mapEmotionToBackendMood = (emotionMood: string): string => {
    switch (emotionMood.toLowerCase()) {
      case 'happy':
        return 'happy';
      case 'sad':
        return 'sad';
      case 'excited':
      case 'surprised':
        return 'excited';
      case 'relaxed':
      case 'neutral':
        return 'relaxed';
      case 'focused':
      case 'angry':
      case 'fearful':
      case 'disgusted':
        return 'focused';
      default:
        return 'relaxed';
    }
  };

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
      
      // Map emotion mood to backend-supported mood for API call
      const backendMood = mapEmotionToBackendMood(mood);
      console.log(`🎵 Display mood: ${mood}, Backend mood: ${backendMood}`);
      
      const response = await getTracksByMood(backendMood, 7, 'recommendations', 'spotify');
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
      case 'surprised': return 'from-amber-500/20 via-orange-500/20 to-yellow-500/20';
      case 'relaxed': return 'from-purple-500/20 via-violet-500/20 to-fuchsia-500/20';
      case 'neutral': return 'from-gray-500/20 via-slate-500/20 to-zinc-500/20';
      case 'focused': return 'from-amber-500/20 via-orange-500/20 to-yellow-500/20';
      case 'angry': return 'from-red-500/20 via-rose-500/20 to-pink-500/20';
      case 'fearful': return 'from-purple-500/20 via-indigo-500/20 to-blue-500/20';
      case 'disgusted': return 'from-lime-500/20 via-green-500/20 to-emerald-500/20';
      default: return 'from-gray-500/20 via-slate-500/20 to-zinc-500/20';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return '#10B981'; // green
      case 'sad': return '#3B82F6'; // blue
      case 'excited': return '#EC4899'; // pink
      case 'surprised': return '#F59E0B'; // amber/orange
      case 'relaxed': return '#8B5CF6'; // purple
      case 'neutral': return '#6B7280'; // gray
      case 'focused': return '#F59E0B'; // amber
      case 'angry': return '#EF4444'; // red
      case 'fearful': return '#8B5CF6'; // purple (similar to relaxed)
      case 'disgusted': return '#84CC16'; // lime green
      default: return '#6B7280'; // gray
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'excited': return '🎉';
      case 'surprised': return '😲';
      case 'relaxed': return '😌';
      case 'neutral': return '😐';
      case 'focused': return '🤔';
      case 'angry': return '😠';
      case 'fearful': return '😨';
      case 'disgusted': return '🤢';
      default: return '😐';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background with mood-based gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${getMoodColor(mood)}20 0%, transparent 50%)`,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${getMoodColor(mood)}40 0%, transparent 70%)`,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                ></div>
                <div className="relative animate-spin rounded-full h-16 w-16 border-t-4 border-b-4"
                  style={{ 
                    borderColor: `${getMoodColor(mood)}`,
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                  }}
                ></div>
              </div>
              <p className="text-white text-xl font-semibold mb-2">
                Loading music for {mood} mood...
              </p>
              <p className="text-white/60 text-sm">Finding the perfect tracks for you</p>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Mood Emoji */}
                    <div 
                      className="text-5xl sm:text-6xl md:text-7xl"
                      style={{
                        filter: `drop-shadow(0 0 20px ${getMoodColor(mood)}50)`,
                      }}
                    >
                      {getMoodEmoji(mood)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide bg-white/20 backdrop-blur-sm rounded-full">
                          MOOD
                        </span>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            background: `${getMoodColor(mood)}30`,
                            border: `1px solid ${getMoodColor(mood)}50`,
                          }}
                        >
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 capitalize">
                        {mood} Mood
                      </h1>
                      <p className="text-white/70 text-sm sm:text-base">
                        {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} available
                      </p>
                    </div>
                  </div>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 text-white"
                    style={{ 
                      background: `${getMoodColor(mood)}`,
                      boxShadow: `0 4px 20px ${getMoodColor(mood)}40`,
                    }}
                    title="Refresh tracks"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-3 sm:space-y-4">
                {tracks.length === 0 ? (
                  <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-12 sm:p-16 text-center">
                    <div className="text-6xl mb-4">🎵</div>
                    <p className="text-white/70 text-lg font-medium mb-2">No tracks available</p>
                    <p className="text-white/50 text-sm">Try refreshing or selecting a different mood</p>
                  </div>
                ) : (
                  tracks.map((track, index) => {
                    const isActive = currentTrackIndex === index;
                    return (
                      <button
                        key={track.id || index}
                        type="button"
                        onClick={() => handleTrackSelect(index)}
                        className={`
                          w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 text-left
                          ${isActive 
                            ? 'border-2 shadow-lg backdrop-blur-sm' 
                            : 'border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                          }
                        `}
                        style={{
                          borderColor: isActive ? `${getMoodColor(mood)}50` : undefined,
                          boxShadow: isActive ? `0 8px 30px ${getMoodColor(mood)}30` : undefined,
                        }}
                      >
                        {/* Track Number / Play Icon */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-xl"
                          style={{
                            background: isActive 
                              ? `${getMoodColor(mood)}20` 
                              : 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {isActive && isPlaying ? (
                            <PauseIcon 
                              size={20} 
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              style={{ color: getMoodColor(mood) }}
                            />
                          ) : (
                            <span className="text-white/60 text-sm font-semibold">
                              {isActive ? (
                                <PlayIcon 
                                  size={18} 
                                  className="w-4 h-4 sm:w-5 sm:h-5"
                                  style={{ color: getMoodColor(mood) }}
                                />
                              ) : (
                                index + 1
                              )}
                            </span>
                          )}
                        </div>

                        {/* Album Art */}
                        <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden shadow-md relative group"
                          style={{
                            background: `linear-gradient(135deg, ${getMoodColor(mood)}20, ${getMoodColor(mood)}10)`,
                          }}
                        >
                          {track.albumImage ? (
                            <img 
                              src={track.albumImage} 
                              alt={track.album}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                              <img 
                                src={BeatifyLogo} 
                                alt="Beatify" 
                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-70"
                              />
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0"
                              style={{
                                boxShadow: `inset 0 0 15px ${getMoodColor(mood)}40`,
                              }}
                            ></div>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`font-semibold text-base sm:text-lg truncate mb-1 ${isActive ? 'text-white' : 'text-white'}`}
                          >
                            {track.name}
                          </div>
                          <div className="text-white/60 text-sm truncate mb-0.5">
                            {track.artists}
                          </div>
                          {track.album && (
                            <div className="text-white/40 text-xs truncate">
                              {track.album}
                            </div>
                          )}
                        </div>

                        {/* External Link */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {track.source === 'youtube' || track.externalUrl?.includes('youtube.com') ? (
                            <a
                              href={track.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                              title="Open in YouTube"
                            >
                              <YouTubeIcon size={18} className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                            </a>
                          ) : track.source === 'soundcloud' || track.externalUrl?.includes('soundcloud.com') ? (
                            <a
                              href={track.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                              title="Open in SoundCloud"
                            >
                              <SoundCloudIcon size={18} className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                            </a>
                          ) : (
                            <a
                              href={track.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                              title="Open in Spotify"
                            >
                              <img 
                                src={BeatifyLogo} 
                                alt="Beatify" 
                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                              />
                            </a>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

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

