import React, { useState } from 'react';

// Logo image path - place beatify-logo.png in the public folder
// This is the white headphones with equalizer bars logo
const LOGO_IMAGE_PATH = '/beatify-logo.png';

interface BeatifyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textColor?: 'dark' | 'light';
}

const BeatifyLogo: React.FC<BeatifyLogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '',
  textColor = 'dark'
}) => {
  const [imageError, setImageError] = useState(false);

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const iconSize = iconSizes[size];
  const textSize = textSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image - White Headphones with Equalizer Bars */}
      <div className="relative flex-shrink-0" style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
        {!imageError ? (
          <img
            src={LOGO_IMAGE_PATH}
            alt="Beatify Logo"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          // SVG Fallback - White headphones with 5 equalizer bars
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Headphones - White */}
            <path
              d="M12 2C8.13 2 5 5.13 5 9v7c0 1.1.9 2 2 2h1v-4H7V9c0-2.76 2.24-5 5-5s5 2.24 5 5v7h-1v4h1c1.1 0 2-.9 2-2V9c0-3.87-3.13-7-7-7z"
              fill="white"
            />
            {/* Equalizer Bars - 5 bars, varying heights (medium, tall, short, tall, medium) */}
            <g transform="translate(9, 10)">
              {/* Bar 1 - Medium */}
              <rect x="0" y="2" width="1.2" height="4" fill="white" rx="0.6" />
              {/* Bar 2 - Tall */}
              <rect x="1.8" y="0" width="1.2" height="8" fill="white" rx="0.6" />
              {/* Bar 3 - Short */}
              <rect x="3.6" y="4" width="1.2" height="2" fill="white" rx="0.6" />
              {/* Bar 4 - Tall */}
              <rect x="5.4" y="0" width="1.2" height="8" fill="white" rx="0.6" />
              {/* Bar 5 - Medium */}
              <rect x="7.2" y="2" width="1.2" height="4" fill="white" rx="0.6" />
            </g>
          </svg>
        )}
      </div>

      {/* Beatify Text */}
      {showText && (
        <span 
          className={`${textSize} font-semibold ${textColor === 'light' ? 'text-white' : 'text-gray-900'}`}
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Beatify
        </span>
      )}
    </div>
  );
};

export default BeatifyLogo;

