import React from 'react';

interface ChevronDownIconProps {
  size?: number | string;
  className?: string;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ 
  size = 12, 
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
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
};

