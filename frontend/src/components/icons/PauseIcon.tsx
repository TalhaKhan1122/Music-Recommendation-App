import React from 'react';

interface PauseIconProps {
  size?: number | string;
  className?: string;
}

export const PauseIcon: React.FC<PauseIconProps> = ({ 
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
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
};

