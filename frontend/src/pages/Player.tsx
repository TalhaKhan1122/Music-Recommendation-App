import React, { useState, useEffect, useRef } from 'react';
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
  SpotifyIcon,
  HeartIcon,
} from '../components/icons';

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

  // Fetch tracks based on mood - only once per mood
  useEffect(() => {
    // Skip if we've already fetched for this mood
    if (fetchedMoodRef.current === mood) {
      console.log('🎵 Already fetched tracks for mood:', mood, '- skipping');
      return;
    }

    const fetchTracks = async () => {
      try {
        console.log('🎵 Fetching tracks for mood:', mood);
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
    };

    if (mood) {
      fetchTracks();
    }
  }, [mood, playTrack]);

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
        {/* Center Content - Track List */}
        <div className="flex-1 flex flex-col px-6 py-8 overflow-hidden">
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

