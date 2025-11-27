import React from 'react';

interface PlayIconProps {
  size?: number | string;
  className?: string;
}

export const PlayIcon: React.FC<PlayIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
};

