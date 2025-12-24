import React from 'react';

interface MicIconProps {
  size?: number | string;
  className?: string;
}

export const MicIcon: React.FC<MicIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
};

