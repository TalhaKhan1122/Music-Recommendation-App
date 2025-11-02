import React from 'react';

const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-full">
        {/* Person Illustration */}
        <svg 
          width="500" 
          height="600" 
          viewBox="0 0 500 600" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto max-w-full"
          style={{ filter: 'grayscale(10%)' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Head with purple face */}
          <circle cx="250" cy="150" r="70" fill="#8B5CF6" />
          
          {/* Beard - multiple strokes for texture */}
          <path 
            d="M220 170 Q250 200 280 170" 
            stroke="#1F2937" 
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M230 180 Q250 205 270 180" 
            stroke="#1F2937" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M235 185 Q250 207 265 185" 
            stroke="#1F2937" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Large White Headphones */}
          <ellipse cx="200" cy="150" rx="55" ry="65" fill="#FFFFFF" />
          <ellipse cx="300" cy="150" rx="55" ry="65" fill="#FFFFFF" />
          <rect x="165" y="145" width="170" height="25" fill="#FFFFFF" rx="12" />
          
          {/* Headphone details */}
          <circle cx="200" cy="150" r="25" fill="#E5E7EB" />
          <circle cx="300" cy="150" r="25" fill="#E5E7EB" />
          
          {/* Body - Blue shirt with gradient */}
          <rect x="200" y="220" width="100" height="250" fill="url(#shirtGradient)" rx="15" />
          <defs>
            <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
          
          {/* Left Arm */}
          <rect x="160" y="240" width="45" height="200" fill="url(#shirtGradient)" rx="22" />
          
          {/* Right Arm with hand holding stylus */}
          <rect x="295" y="240" width="45" height="220" fill="url(#shirtGradient)" rx="22" />
          
          {/* Right Hand */}
          <ellipse cx="317" cy="460" rx="28" ry="32" fill="#8B5CF6" />
          
          {/* Stylus */}
          <line 
            x1="330" 
            y1="470" 
            x2="380" 
            y2="530" 
            stroke="#1F2937" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />
          <circle cx="330" cy="470" r="4" fill="#1F2937" />
          
          {/* Tablet/Drawing Pad */}
          <rect x="350" y="500" width="120" height="90" fill="#374151" rx="6" />
          <rect x="365" y="515" width="90" height="60" fill="#4B5563" rx="3" />
          
          {/* Tablet Glow Effect */}
          <ellipse 
            cx="410" 
            cy="545" 
            rx="50" 
            ry="20" 
            fill="#6B7280" 
            opacity="0.4"
            style={{ filter: 'blur(8px)' }}
          />
          
          {/* Subtle texture overlay */}
          <rect x="0" y="0" width="500" height="600" fill="url(#noise)" opacity="0.1" />
          <defs>
            <filter id="noise">
              <feTurbulence baseFrequency="0.9" numOctaves="4" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default HeroIllustration;
