import React from 'react';

interface TagIconProps {
  className?: string;
  size?: number;
}

export const TagIcon: React.FC<TagIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.6668 11.6667H11.6835M34.3168 22.35L22.3668 34.3C22.0573 34.6099 21.6896 34.8558 21.285 35.0235C20.8803 35.1913 20.4465 35.2776 20.0085 35.2776C19.5704 35.2776 19.1367 35.1913 18.732 35.0235C18.3274 34.8558 17.9597 34.6099 17.6502 34.3L3.3335 20V3.33334H20.0002L34.3168 17.65C34.9377 18.2745 35.2861 19.1194 35.2861 20C35.2861 20.8806 34.9377 21.7255 34.3168 22.35Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
