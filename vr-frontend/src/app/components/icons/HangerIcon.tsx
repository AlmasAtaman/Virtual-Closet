import React from 'react';

interface HangerIconProps {
  className?: string;
  size?: number;
}

export const HangerIcon: React.FC<HangerIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 33 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.5 11.5V10L14.5 9L14 8V7L14.5 6L15 5.5L16 5H17L18 6M17 18H5.5L4.5 17.5L4 17L3.5 16L4 15L6 14L10.5 13L13 12.5L16 12H17L20 12.5L22.5 13L27 14L29 15L29.5 16L29 17L28.5 17.5L27.5 18H16"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
};
