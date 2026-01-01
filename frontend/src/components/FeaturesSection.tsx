import React from 'react';
import personHeadphonesHandsImage from '../assets/user-listnening -music (3).png';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
        </svg>
      ),
      title: "Search the Music",
      description: "Find your favorite songs, artists, and albums instantly. Search by name, URL, or browse through millions of tracks from around the world.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
          <path d="M9 11c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1zm4 0c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" fill="currentColor"/>
        </svg>
      ),
      title: "AI Facial Recognition",
      description: "Get personalized music recommendations powered by AI. Our facial recognition technology analyzes your mood and suggests the perfect tracks to match how you feel.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
        </svg>
      ),
      title: "Recommendation Station",
      description: "Discover curated music stations tailored to your taste. Mix of your followed artists and global hits, including Punjabi, English, Global, and Pakistani music.",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section id="features" className="relative w-full bg-[#0a0a1a] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Powerful Features for Your Music Journey
          </h2>
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Discover, search, and enjoy music like never before with AI-powered recommendations and personalized stations
          </p>
          {/* Person with headphones illustration */}
          <div className="flex justify-center mb-12">
            <img
              src={personHeadphonesHandsImage}
              alt="Person enjoying music"
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1b3d] rounded-2xl p-8 hover:scale-105 transition-transform duration-300 border border-gray-800"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6`}>
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {feature.description}
              </p>

              {/* Read More Button */}
              <button className="text-purple-400 hover:text-purple-300 font-medium transition-colors flex items-center gap-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Read More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

