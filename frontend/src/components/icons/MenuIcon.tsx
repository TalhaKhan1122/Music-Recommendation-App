import React from 'react';

interface MenuIconProps {
  size?: number | string;
  className?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor"/>
      <rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor"/>
      <line x1="3" y1="13" x2="21" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

