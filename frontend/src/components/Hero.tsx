import React from 'react';
import HeroIllustration from './HeroIllustration';

const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen flex items-center">
      {/* Dark gradient background - black to purple/pink */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #000000 0%, #000000 30%, #6B21A8 70%, #EC4899 100%)' }}>
        {/* Isometric grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'rotate(-45deg) scale(1.5)',
            transformOrigin: 'center'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 py-16 sm:py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative">
          {/* Left side - Content */}
          <div className="hero-content text-white z-20 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Music made<br className="hidden sm:block" />
              <span className="relative inline-block mt-1 sm:mt-0">
                for Deep Work
                <span className="absolute -bottom-2 left-0 right-0 h-3 sm:h-4 bg-blue-500" style={{ zIndex: -1, opacity: 0.9 }}></span>
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-10 leading-relaxed px-2 sm:px-0" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              The only music app made with modes for different<br className="hidden sm:block" />
              <span className="sm:hidden"> </span>activities in your life.
            </p>
            
            <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors inline-flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <span className="text-sm sm:text-base">TRY BEATIFY FOR FREE</span>
              <span className="text-lg sm:text-xl">→</span>
            </button>
          </div>

          {/* Right side - Illustration overlapping gradient */}
          <div className="hero-illustration relative w-full lg:w-1/2 flex items-center justify-center lg:justify-end lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 mt-8 lg:mt-0">
            <div className="relative w-full max-w-md sm:max-w-lg">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
