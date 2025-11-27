import React from 'react';

interface ArrowBackIconProps {
  size?: number | string;
  className?: string;
}

export const ArrowBackIcon: React.FC<ArrowBackIconProps> = ({ 
  size = 24, 
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
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
};

