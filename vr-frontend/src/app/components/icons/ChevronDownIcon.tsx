import React from 'react';

interface ChevronDownIconProps {
  className?: string;
  size?: number;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ className = '', size = 29 }) => {
  return (
    <svg
      width={size}
      height={size * (19 / 29)}
      viewBox="0 0 29 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M1.13398 0.981995L14.1244 15.982L27.1147 0.981995" stroke="currentColor" strokeWidth="3"/>
    </svg>
  );
};
