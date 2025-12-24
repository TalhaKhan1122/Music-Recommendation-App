import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>

      <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Welcome to Your Music Hub
          </h1>
          <p className="text-gray-400 text-sm">Choose your experience</p>
        </div>

        {/* Main Content Grid - Two Equal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* AI Mode Card */}
          <div 
            onClick={() => navigate('/ai-mode')}
            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            style={{ 
              background: 'rgba(20, 20, 30, 0.7)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(236, 72, 153, 0.3)',
              minHeight: '380px',
              boxShadow: '0 20px 60px rgba(236, 72, 153, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.6)';
              e.currentTarget.style.boxShadow = '0 25px 80px rgba(236, 72, 153, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(236, 72, 153, 0.2)';
            }}
          >
            {/* Animated Gradient Background */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 30% 40%, #EC4899 0%, #A855F7 40%, #7C3AED 70%, transparent 85%)',
                animation: 'pulse-glow 4s ease-in-out infinite',
              }}
            ></div>
            
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite',
              }}
            ></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Top Section - Icon and Title */}
              <div>
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
                      boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    AI Mode
              </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Let artificial intelligence curate the perfect playlist for your mood and preferences
                  </p>
            </div>
          </div>

              {/* Middle Section - Illustration */}
              <div className="flex-1 flex items-center justify-center my-4">
                <div className="relative w-full max-w-xs">
                  <svg width="100%" height="180" viewBox="0 0 400 300" className="relative z-10">
                    <defs>
                      <radialGradient id="aiGradient1">
                        <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="aiGradient2">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Glow circles */}
                    <circle cx="200" cy="150" r="120" fill="url(#aiGradient1)" opacity="0.5">
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="150" r="80" fill="url(#aiGradient2)" opacity="0.4">
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* AI Brain/Neural Network */}
                    <circle cx="200" cy="120" r="25" fill="#EC4899" opacity="0.9">
                      <animate attributeName="r" values="25;28;25" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="150" cy="150" r="15" fill="#A855F7" opacity="0.8">
                      <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="250" cy="150" r="15" fill="#A855F7" opacity="0.8">
                      <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="180" r="15" fill="#7C3AED" opacity="0.8">
                      <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* Connection lines */}
                    <line x1="200" y1="120" x2="150" y2="150" stroke="#EC4899" strokeWidth="2" opacity="0.5" />
                    <line x1="200" y1="120" x2="250" y2="150" stroke="#EC4899" strokeWidth="2" opacity="0.5" />
                    <line x1="200" y1="120" x2="200" y2="180" stroke="#EC4899" strokeWidth="2" opacity="0.5" />
                    <line x1="150" y1="150" x2="200" y2="180" stroke="#A855F7" strokeWidth="2" opacity="0.4" />
                    <line x1="250" y1="150" x2="200" y2="180" stroke="#A855F7" strokeWidth="2" opacity="0.4" />
                    
                    {/* Music notes */}
                    <path d="M120 200 Q130 190 140 200 T160 200" stroke="#EC4899" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
                    </path>
                    <path d="M240 200 Q250 190 260 200 T280 200" stroke="#A855F7" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite" />
                    </path>
                  </svg>
                </div>
              </div>

              {/* Bottom Section - CTA */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-white/60 text-xs font-medium">Click to explore</span>
                <div className="flex items-center text-pink-400 group-hover:text-pink-300 transition-colors">
                  <span className="mr-2 text-sm font-semibold">Get Started</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Enjoy Music Card */}
          <div 
            onClick={() => navigate('/artists')}
            className="group relative rounded-2xl p-6 overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            style={{ 
              background: 'rgba(20, 20, 30, 0.7)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              minHeight: '380px',
              boxShadow: '0 20px 60px rgba(59, 130, 246, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
              e.currentTarget.style.boxShadow = '0 25px 80px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
            }}
          >
            {/* Animated Gradient Background */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 70% 40%, #3B82F6 0%, #2563EB 40%, #1D4ED8 70%, transparent 85%)',
                animation: 'pulse-glow 4s ease-in-out infinite',
              }}
            ></div>
            
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 opacity-10"
                 style={{ 
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite',
              }}
            ></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Top Section - Icon and Title */}
              <div>
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Search & Enjoy
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Discover artists, explore tracks, and create your perfect music experience
                  </p>
                </div>
              </div>

              {/* Middle Section - Illustration */}
              <div className="flex-1 flex items-center justify-center my-4">
                <div className="relative w-full max-w-xs">
                  <svg width="100%" height="180" viewBox="0 0 400 300" className="relative z-10">
                    <defs>
                      <radialGradient id="searchGradient1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="searchGradient2">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Glow circles */}
                    <circle cx="200" cy="150" r="120" fill="url(#searchGradient1)" opacity="0.5">
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="150" r="80" fill="url(#searchGradient2)" opacity="0.4">
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* Search icon */}
                    <circle cx="200" cy="150" r="40" stroke="#3B82F6" strokeWidth="4" fill="none" opacity="0.8">
                      <animate attributeName="r" values="40;45;40" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <line x1="230" y1="180" x2="250" y2="200" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                    
                    {/* Music notes around search */}
                    <path d="M120 100 Q130 90 140 100 T160 100" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
                    </path>
                    <path d="M280 100 Q290 90 300 100 T320 100" stroke="#2563EB" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite" />
                    </path>
                    <path d="M120 200 Q130 190 140 200 T160 200" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" repeatCount="indefinite" />
                    </path>
                    <path d="M280 200 Q290 190 300 200 T320 200" stroke="#2563EB" strokeWidth="3" fill="none" opacity="0.7">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.7s" repeatCount="indefinite" />
                    </path>
                    
                    {/* Floating particles */}
                    <circle cx="100" cy="120" r="4" fill="#3B82F6" opacity="0.6">
                      <animate attributeName="cy" values="120;110;120" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="300" cy="180" r="4" fill="#2563EB" opacity="0.6">
                      <animate attributeName="cy" values="180;170;180" dur="3.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="150" cy="220" r="3" fill="#1D4ED8" opacity="0.6">
                      <animate attributeName="cy" values="220;210;220" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="250" cy="90" r="3" fill="#3B82F6" opacity="0.6">
                      <animate attributeName="cy" values="90;80;90" dur="3.2s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              </div>

              {/* Bottom Section - CTA */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-white/60 text-xs font-medium">Click to explore</span>
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="mr-2 text-sm font-semibold">Get Started</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

