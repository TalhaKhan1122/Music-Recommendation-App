import React from 'react';

const AIFacialRecognitionSection: React.FC = () => {
  return (
    <section className="relative w-full bg-gradient-to-br from-[#1a0a2e] to-[#2d1b3d] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-full max-w-lg">
              {/* AI Face Recognition illustration */}
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1b3d] rounded-2xl p-8 border border-gray-700">
                <div className="relative">
                  {/* Face outline */}
                  <div className="w-64 h-64 mx-auto rounded-full border-4 border-purple-500/50 flex items-center justify-center relative">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      {/* Eyes */}
                      <div className="absolute top-16 left-12 w-8 h-8 bg-purple-400 rounded-full"></div>
                      <div className="absolute top-16 right-12 w-8 h-8 bg-purple-400 rounded-full"></div>
                      {/* Smile */}
                      <svg className="absolute bottom-16 left-1/2 -translate-x-1/2" width="64" height="32" viewBox="0 0 64 32">
                        <path d="M8 16 Q32 32 56 16" stroke="#A855F7" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* AI indicators */}
                  <div className="absolute top-4 right-4 bg-purple-500/20 rounded-lg px-3 py-1 border border-purple-500/50">
                    <span className="text-purple-300 text-xs font-medium">AI Analyzing</span>
                  </div>
                  
                  {/* Mood indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-pink-500/20 rounded-lg px-4 py-2 border border-pink-500/50">
                    <span className="text-pink-300 text-sm font-medium">Mood: Happy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="text-white z-20 order-1 lg:order-2">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
                <path d="M9 11c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1zm4 0c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" fill="currentColor"/>
              </svg>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              AI Facial Recognition
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Get personalized music recommendations powered by AI. Our facial recognition technology analyzes your mood and suggests the perfect tracks to match how you feel. Experience music that understands you.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Real-time mood detection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Personalized music suggestions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Adaptive playlist generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFacialRecognitionSection;

