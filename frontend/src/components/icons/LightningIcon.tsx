import React from 'react';

interface LightningIconProps {
  size?: number | string;
  className?: string;
}

export const LightningIcon: React.FC<LightningIconProps> = ({ 
  size = 16, 
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
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
};

