import React, { useState } from 'react';

const AIModeSection: React.FC = () => {
  const [aiModeEnabled, setAiModeEnabled] = useState(true);

  return (
    <section className="relative w-full bg-[#121212] py-16 sm:py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Top Section - Headline */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <span className="text-white">Music for </span>
            <span className="relative inline-block">
              <span className="text-blue-500 relative z-10">Mode</span>
              <span className="absolute -bottom-2 left-0 right-0 h-3 sm:h-4 bg-blue-500 opacity-40 blur-sm"></span>
            </span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Intelligent music powered by AI mode recognition
          </p>
        </div>

        {/* Bottom Section - Feature Card */}
        <div className="relative max-w-6xl mx-auto">
          <div 
            className="rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #1a1a1a 50%, #2d1b3d 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Grainy texture overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-center">
              {/* Left Side - Text */}
              <div className="text-white">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  The first music app powered by AI mode recognition
                </h3>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Smart, adaptive, and personalized to your activity.
                </p>
              </div>

              {/* Right Side - Illustration */}
              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  {/* Person with headphones illustration */}
                  <svg 
                    width="400" 
                    height="400" 
                    viewBox="0 0 400 400" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                  >
                    {/* Sound waves background */}
                    <g opacity="0.8">
                      {/* Wave 1 */}
                      <path 
                        d="M200 100 Q220 80 240 100 T280 100 Q300 120 280 140 T240 140 Q220 160 200 140" 
                        stroke="url(#waveGradient1)" 
                        strokeWidth="3" 
                        fill="none"
                        style={{ filter: 'blur(2px)' }}
                      />
                      <path 
                        d="M200 120 Q215 110 230 120 T260 120 Q275 130 260 140 T230 140 Q215 150 200 140" 
                        stroke="url(#waveGradient1)" 
                        strokeWidth="2" 
                        fill="none"
                      />
                      {/* Wave 2 */}
                      <path 
                        d="M200 160 Q220 140 240 160 T280 160 Q300 180 280 200 T240 200 Q220 220 200 200" 
                        stroke="url(#waveGradient2)" 
                        strokeWidth="3" 
                        fill="none"
                        style={{ filter: 'blur(2px)' }}
                      />
                      <path 
                        d="M200 180 Q215 170 230 180 T260 180 Q275 190 260 200 T230 200 Q215 210 200 200" 
                        stroke="url(#waveGradient2)" 
                        strokeWidth="2" 
                        fill="none"
                      />
                      {/* Wave 3 */}
                      <path 
                        d="M200 240 Q220 220 240 240 T280 240 Q300 260 280 280 T240 280 Q220 300 200 280" 
                        stroke="url(#waveGradient3)" 
                        strokeWidth="3" 
                        fill="none"
                        style={{ filter: 'blur(2px)' }}
                      />
                      <path 
                        d="M200 260 Q215 250 230 260 T260 260 Q275 270 260 280 T230 280 Q215 290 200 280" 
                        stroke="url(#waveGradient3)" 
                        strokeWidth="2" 
                        fill="none"
                      />
                    </g>

                    {/* Laptop with blue glow */}
                    <rect x="120" y="250" width="160" height="100" rx="8" fill="#1a1a1a" />
                    <rect x="135" y="265" width="130" height="70" rx="4" fill="#1e3a8a" style={{ filter: 'drop-shadow(0 0 20px #3b82f6)' }} />
                    <rect x="140" y="270" width="120" height="60" rx="2" fill="#2563eb" opacity="0.8" />

                    {/* Person - Head */}
                    <circle cx="200" cy="140" r="40" fill="#8B5CF6" />
                    
                    {/* Person - Hair */}
                    <path 
                      d="M170 120 Q200 100 230 120 Q225 115 200 110 Q175 115 170 120" 
                      fill="#1F2937" 
                    />

                    {/* Person - Body (Purple/Magenta shirt) */}
                    <rect x="175" y="180" width="50" height="80" rx="8" fill="url(#shirtGradient)" />
                    
                    {/* Person - Arms */}
                    <rect x="150" y="190" width="30" height="70" rx="15" fill="url(#shirtGradient)" />
                    <rect x="220" y="190" width="30" height="70" rx="15" fill="url(#shirtGradient)" />

                    {/* Large White Headphones */}
                    <ellipse cx="165" cy="140" rx="35" ry="45" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                    <ellipse cx="235" cy="140" rx="35" ry="45" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                    <rect x="130" y="135" width="140" height="20" fill="#FFFFFF" rx="10" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                    
                    {/* Headphone details */}
                    <circle cx="165" cy="140" r="18" fill="#E5E7EB" />
                    <circle cx="235" cy="140" r="18" fill="#E5E7EB" />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                      <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#FB923C" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* AI Mode Toggle - Bottom Right */}
            <div className="mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <h4 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    AI Mode
                  </h4>
                </div>
                <p className="text-sm sm:text-base text-gray-300" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Turn this on for music designed by AI mode recognition to match your activity.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setAiModeEnabled(!aiModeEnabled)}
                  className={`relative w-16 h-8 sm:w-20 sm:h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    aiModeEnabled ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                  aria-label="Toggle AI Mode"
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white transition-all duration-300 flex items-center justify-center ${
                      aiModeEnabled ? 'translate-x-8 sm:translate-x-10' : 'translate-x-0'
                    }`}
                  >
                    {aiModeEnabled && (
                      <svg width="14" height="14" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIModeSection;

