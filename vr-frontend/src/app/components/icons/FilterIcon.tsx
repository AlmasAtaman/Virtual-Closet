import React from 'react';

interface FilterIconProps {
  className?: string;
  size?: number;
}

export const FilterIcon: React.FC<FilterIconProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="9" width="34" height="2" rx="1" fill="currentColor"/>
      <rect width="34" height="2" rx="1" transform="matrix(-1 0 0 1 37 19)" fill="currentColor"/>
      <rect x="3" y="29" width="34" height="2" rx="1" fill="currentColor"/>
      <circle cx="29" cy="10" r="3.5" fill="white" stroke="currentColor"/>
      <circle cx="4" cy="4" r="3.5" transform="matrix(-1 0 0 1 15 16)" fill="white" stroke="currentColor"/>
      <circle cx="29" cy="30" r="3.5" fill="white" stroke="currentColor"/>
    </svg>
  );
};
