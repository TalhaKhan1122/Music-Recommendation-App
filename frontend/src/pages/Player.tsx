import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);
  const [timer, setTimer] = useState('0:00');

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
              className="text-white hover:text-gray-300 transition-colors p-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-white text-sm hover:bg-gray-700/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>Recharge</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
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

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-gray-400 uppercase text-sm tracking-wider mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            RELAXING...
          </div>
          
          <div className="text-white text-7xl sm:text-8xl font-bold mb-8 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {timer}
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full text-white text-sm hover:bg-gray-700/80 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12c0 1.66-1.35 3-3 3H6c-1.66 0-3-1.34-3-3s1.34-3 3-3h12c1.65 0 3 1.34 3 3z"/>
              <path d="M12 12l-3-3M12 12l-3 3M12 12l3-3M12 12l3 3"/>
            </svg>
            <span>Infinite Play</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Bottom Player Controls Bar */}
        <div className="bg-gray-900/90 backdrop-blur-md border-t border-gray-800/50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Song Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Album Art */}
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-green-400/20 to-blue-500/20">
                  <img 
                    src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                    alt="Album Art"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Song Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm sm:text-base truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Higher Plane
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm truncate" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Medium Neural Effect
                  </div>
                  
                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-800/60 rounded-full text-gray-300 text-xs">ELECTRONIC</span>
                    <span className="px-2 py-1 bg-gray-800/60 rounded-full text-gray-300 text-xs">+ DETAILS</span>
                  </div>
                  
                  {/* Interaction Icons */}
                  <div className="flex items-center gap-4 mt-2">
                    <button className="text-gray-400 hover:text-white transition-colors p-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors p-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Center - Playback Controls */}
              <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                <button className="text-white hover:text-gray-300 transition-colors p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="18 2 18 22 2 12 18 2"/>
                    <line x1="4" y1="12" x2="12" y2="12"/>
                  </svg>
                </button>
                <button className="text-white hover:text-gray-300 transition-colors p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="19 20 9 12 19 4 19 20"/>
                    <line x1="5" y1="19" x2="5" y2="5"/>
                  </svg>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:text-gray-300 transition-colors p-3 bg-white/10 hover:bg-white/20 rounded-full"
                >
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </button>
                <button className="text-white hover:text-gray-300 transition-colors p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 4 15 12 5 20 5 4"/>
                    <line x1="19" y1="5" x2="19" y2="19"/>
                  </svg>
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
    </div>
  );
};

export default Player;

