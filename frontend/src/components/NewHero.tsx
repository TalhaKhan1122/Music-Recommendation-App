import React from 'react';
import heroPersonImage from '../assets/user-listnening -music (1).png';

interface NewHeroProps {
  onGetStarted?: () => void;
}

const NewHero: React.FC<NewHeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative w-full min-h-screen flex items-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#2d1b3d]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="text-white z-20 text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Experience The Best Quality Music
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Discover millions of songs, create playlists, and enjoy high-quality audio streaming. Your music journey starts here.
            </p>
            
            {/* Get Started Button */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/50 font-semibold text-lg"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <span>Get Started</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Person with tablet and headphones */}
              <img
                src={heroPersonImage}
                alt="Person enjoying music with tablet and headphones"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewHero;

