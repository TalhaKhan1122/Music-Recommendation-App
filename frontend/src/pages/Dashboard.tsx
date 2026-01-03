import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6">
            Welcome to Your Music Hub
          </h1>
          <p className="text-base sm:text-lg text-white/60">Choose your experience</p>
        </div>

        {/* Main Content Grid - Two Equal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto">
          {/* AI Mode Card */}
          <div 
            onClick={() => navigate('/ai-mode')}
            className="group relative rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 overflow-hidden cursor-pointer border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Top Section - Icon and Title */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-pink-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4">
                  AI Mode
                </h2>
                <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                  Let artificial intelligence curate the perfect playlist for your mood and preferences
                </p>
              </div>

              {/* Middle Section - Simple Icon */}
              <div className="flex-1 flex items-center justify-center my-6 sm:my-8">
                <div className="relative w-full max-w-xs">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - CTA */}
              <div className="flex items-center justify-between mt-6 sm:mt-8">
                <span className="text-white/50 text-sm font-medium">Click to explore</span>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
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
            className="group relative rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 overflow-hidden cursor-pointer border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Top Section - Icon and Title */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-cyan-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4">
                  Search & Enjoy
                </h2>
                <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                  Discover artists, explore tracks, and create your perfect music experience
                </p>
              </div>

              {/* Middle Section - Simple Icon */}
              <div className="flex-1 flex items-center justify-center my-6 sm:my-8">
                <div className="relative w-full max-w-xs">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - CTA */}
              <div className="flex items-center justify-between mt-6 sm:mt-8">
                <span className="text-white/50 text-sm font-medium">Click to explore</span>
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

