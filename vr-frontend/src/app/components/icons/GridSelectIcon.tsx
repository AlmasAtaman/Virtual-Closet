import React from 'react';

interface GridSelectIconProps {
  className?: string;
  size?: number;
}

export const GridSelectIcon: React.FC<GridSelectIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="5.5"
        y="5.75928"
        width="25"
        height="25"
        rx="2.5"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M33.4502 9.25928C34.6623 9.94653 35.4805 11.2478 35.4805 12.7407V31.7407C35.4805 33.9499 33.6896 35.7407 31.4805 35.7407H12.4805C10.9877 35.7407 9.68732 34.9223 9 33.7104C9.15759 33.7293 9.31779 33.7407 9.48047 33.7407H29.4805C31.6896 33.7407 33.4805 31.9499 33.4805 29.7407V9.74072C33.4805 9.57772 33.4691 9.41718 33.4502 9.25928Z"
        fill="currentColor"
      />
    </svg>
  );
};
