import React from 'react';
// TODO: Add your image file (person with headphones and tablet) to frontend/src/assets/ folder
// and update the import below. For now using a placeholder image.
// Replace this import with: import personHeadphonesTabletImage from '../assets/your-image-filename.png';
import personHeadphonesTabletImage from '../assets/user-listnening -music (3).png';

const AIFacialRecognitionSection: React.FC = () => {
  return (
    <section className="relative w-full bg-gradient-to-br from-[#1a0a2e] to-[#2d1b3d] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Illustration */}
          <div className="relative w-full flex items-center justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-full max-w-lg">
              {/* Person with headphones and tablet image */}
              <div>
                <img
                  src={personHeadphonesTabletImage}
                  alt="Person using AI facial recognition with headphones and tablet"
                  className="w-full h-auto rounded-lg object-contain"
                />
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

