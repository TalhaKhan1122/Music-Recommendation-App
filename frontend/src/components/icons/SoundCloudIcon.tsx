import React from 'react';

interface SoundCloudIconProps {
  size?: number | string;
  className?: string;
}

export const SoundCloudIcon: React.FC<SoundCloudIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M1.175 13.5c0 5.19 3.675 9.5 8.4 10.5 2.1.6 4.2.525 6.075-.15 2.1-.75 3.75-2.1 4.875-3.825.975-1.425 1.425-2.85 1.425-4.35 0-2.55-1.5-4.875-3.825-6.075-.675-.3-1.425-.525-2.175-.675L12.775.975C12.775.45 12.35 0 11.8 0c-.525 0-.975.45-.975.975V13.5c0 .525-.45.975-.975.975s-1.025-.45-1.025-.975v-.45C7.15 11.625 4.825 12.3 3.25 13.65 1.825 14.85 1.175 16.575 1.175 18.3c0 2.25 1.725 4.05 3.9 4.05 2.325 0 4.2-1.95 4.2-4.35V13.5z"/>
    </svg>
  );
};

