import React from 'react';

interface PreviousIconProps {
  size?: number | string;
  className?: string;
}

export const PreviousIcon: React.FC<PreviousIconProps> = ({ 
  size = 20, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      className={className}
    >
      <polygon points="19 20 9 12 19 4 19 20"/>
      <line x1="5" y1="19" x2="5" y2="5"/>
    </svg>
  );
};

