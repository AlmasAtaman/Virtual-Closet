import React from 'react';

interface ClosetIconProps {
  className?: string;
  size?: number;
}

export const ClosetIcon: React.FC<ClosetIconProps> = ({ className = '', size = 31 }) => {
  const aspectRatio = 37 / 31;
  const height = size * aspectRatio;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 31 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M29 37H27V35H4V37H2V35H0V4C0 1.85996 1.68056 0.112115 3.79395 0.00488281L4 0H27C29.2091 0 31 1.79086 31 4V35H29V37ZM4 1C2.34315 1 1 2.34315 1 4V34H30V4C30 2.39489 28.7394 1.08421 27.1543 1.00391L27 1H4ZM25 2C27.2091 2 29 3.79086 29 6V33H2V6C2 3.79086 3.79086 2 6 2H25ZM6 3C4.39489 3 3.08421 4.26055 3.00391 5.8457L3 6V32H15V3H6ZM16 32H28V6C28 4.34315 26.6569 3 25 3H16V32ZM12.5 15C12.7761 15 13 15.2239 13 15.5V18.5C13 18.7761 12.7761 19 12.5 19C12.2239 19 12 18.7761 12 18.5V15.5C12 15.2239 12.2239 15 12.5 15ZM18.5 15C18.7761 15 19 15.2239 19 15.5V18.5C19 18.7761 18.7761 19 18.5 19C18.2239 19 18 18.7761 18 18.5V15.5C18 15.2239 18.2239 15 18.5 15Z"
        fill="currentColor"
      />
    </svg>
  );
};
