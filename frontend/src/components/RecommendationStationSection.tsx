import React from 'react';

const RecommendationStationSection: React.FC = () => {
  return (
    <section className="relative w-full bg-gradient-to-br from-[#0a0a1a] to-[#1a0a2e] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="text-white z-20">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
              </svg>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Recommendation Station
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Discover curated music stations tailored to your taste. Enjoy a perfect mix of your followed artists and global hits, including Punjabi, English, Global, and Pakistani music. Your personalized radio, always ready.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-700">
                <div className="text-orange-400 font-semibold mb-1">Punjabi</div>
                <div className="text-gray-400 text-sm">Vibrant beats</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-700">
                <div className="text-orange-400 font-semibold mb-1">English</div>
                <div className="text-gray-400 text-sm">Global hits</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-700">
                <div className="text-orange-400 font-semibold mb-1">Pakistani</div>
                <div className="text-gray-400 text-sm">Soulful melodies</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-700">
                <div className="text-orange-400 font-semibold mb-1">Global</div>
                <div className="text-gray-400 text-sm">Worldwide</div>
              </div>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Radio station illustration */}
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1b3d] rounded-2xl p-8 border border-gray-700">
                {/* Radio card mockup */}
                <div className="bg-[#0a0a1a] rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                  </div>
                </div>
                
                {/* Equalizer */}
                <div className="flex items-end justify-center gap-1 h-16">
                  {[30, 50, 70, 50, 30].map((height, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-orange-500 to-red-500 rounded-t"
                      style={{
                        width: '12px',
                        height: `${height}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendationStationSection;

