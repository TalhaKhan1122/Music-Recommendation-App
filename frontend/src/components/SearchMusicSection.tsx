import React from 'react';

const SearchMusicSection: React.FC = () => {
  return (
    <section id="search-music" className="relative w-full bg-gradient-to-br from-[#0a0a1a] to-[#1a0a2e] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="text-white z-20">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Search the Music
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Find your favorite songs, artists, and albums instantly. Search by name, URL, or browse through millions of tracks from around the world. Discover new music and create your perfect playlist.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="bg-[#1a1a2e] rounded-lg px-4 py-2 border border-gray-700">
                <span className="text-gray-300 text-sm">Search by Name</span>
              </div>
              <div className="bg-[#1a1a2e] rounded-lg px-4 py-2 border border-gray-700">
                <span className="text-gray-300 text-sm">Search by URL</span>
              </div>
              <div className="bg-[#1a1a2e] rounded-lg px-4 py-2 border border-gray-700">
                <span className="text-gray-300 text-sm">Browse Catalog</span>
              </div>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Search interface illustration */}
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1b3d] rounded-2xl p-8 border border-gray-700">
                <div className="flex items-center gap-3 bg-[#0a0a1a] rounded-xl p-4 mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <span className="text-gray-500 text-sm">Search for songs, artists...</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#0a0a1a] rounded-lg p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-[#0a0a1a] rounded-lg p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-purple-400">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchMusicSection;

