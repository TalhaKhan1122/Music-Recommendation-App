import React from 'react';
import personHeadphonesProfileImage from '../assets/user-listnening -music (2).png';

const SearchPlayerSection: React.FC = () => {

  return (
    <section className="relative w-full bg-gradient-to-br from-[#1a0a2e] to-[#2d1b3d] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Person with headphones illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-start">
            <div className="relative w-full max-w-md">
              {/* Person in profile with headphones */}
              <img
                src={personHeadphonesProfileImage}
                alt="Person enjoying music with headphones"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right side - Search Interface */}
          <div className="text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Search Music by Name or Direct URL
            </h2>
            
            {/* Search Input - Display Only */}
            <div className="mb-8">
              <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-xl p-4 border border-gray-700">
                <input
                  type="text"
                  placeholder="Enter song/artist URL"
                  disabled
                  readOnly
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none cursor-not-allowed opacity-60"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                />
                <button 
                  disabled
                  className="bg-purple-500 text-white p-3 rounded-lg cursor-not-allowed opacity-60"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Music Player Visualization */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700">
              <div className="flex items-end justify-center gap-2 h-32">
                {/* Equalizer bars */}
                {[30, 50, 70, 50, 30, 60, 40, 50, 35, 45].map((height, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                    style={{
                      width: '8px',
                      height: `${height}%`,
                      transition: 'height 0.3s ease',
                    }}
                  />
                ))}
              </div>
              {/* Slider */}
              <div className="mt-6">
                <div className="relative h-1 bg-gray-700 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '45%' }} />
                  <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchPlayerSection;

