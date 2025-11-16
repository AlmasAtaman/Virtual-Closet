import React from 'react';

interface ColorSwatchProps {
  className?: string;
  size?: number;
}

// Beige swatch - 3 circles
export const BeigeSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#F5F3EE" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#EDE1CD" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#E3D2B8" stroke="#787373"/>
  </svg>
);

// Black swatch - 3 circles
export const BlackSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#9F9B9B" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#4C4C4C" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#2B2B2B" stroke="#787373"/>
  </svg>
);

// Blue swatch - 3 circles
export const BlueSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#9BB3C9" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#5F7BA0" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#3D5E86" stroke="#787373"/>
  </svg>
);

// Brown swatch - 3 circles
export const BrownSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#C2AE96" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#8A6A54" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#6B4A36" stroke="#787373"/>
  </svg>
);

// Green swatch - 3 circles
export const GreenSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#9DBCA6" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#4C7E59" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#2E5A3A" stroke="#787373"/>
  </svg>
);

// Grey swatch - 3 circles
export const GreySwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#E6E6E6" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#B0B0B0" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#8A8A8A" stroke="#787373"/>
  </svg>
);

// Orange swatch - 3 circles
export const OrangeSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#F4D3B7" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#E6A877" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#D0844C" stroke="#787373"/>
  </svg>
);

// Pink swatch - 3 circles
export const PinkSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#F7E3E5" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#EDC3C8" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#E3A6AD" stroke="#787373"/>
  </svg>
);

// Purple swatch - 3 circles
export const PurpleSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#E0D2EE" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#B89ED8" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#9B76C7" stroke="#787373"/>
  </svg>
);

// Red swatch - 3 circles
export const RedSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#E6B7BB" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#C56A71" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#A33B42" stroke="#787373"/>
  </svg>
);

// Silver swatch - 3 circles
export const SilverSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#E5E7EB" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#BFC4C9" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#8D9399" stroke="#787373"/>
  </svg>
);

// Tan swatch - 3 circles
export const TanSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#E2D2C2" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#C7A78E" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#B18E6F" stroke="#787373"/>
  </svg>
);

// White swatch - 3 circles
export const WhiteSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="white" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#F3F3F3" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#EDEDED" stroke="#787373"/>
  </svg>
);

// Yellow swatch - 3 circles
export const YellowSwatch: React.FC<ColorSwatchProps> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size * (20/44)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="9.5" fill="#F3E5AC" stroke="#787373"/>
    <circle cx="22" cy="10" r="9.5" fill="#E2C467" stroke="#787373"/>
    <circle cx="34" cy="10" r="9.5" fill="#D4A528" stroke="#787373"/>
  </svg>
);

// Export all swatches in a map for easy access
export const ColorSwatches = {
  Beige: BeigeSwatch,
  Black: BlackSwatch,
  Blue: BlueSwatch,
  Brown: BrownSwatch,
  Green: GreenSwatch,
  Grey: GreySwatch,
  Orange: OrangeSwatch,
  Pink: PinkSwatch,
  Purple: PurpleSwatch,
  Red: RedSwatch,
  Silver: SilverSwatch,
  Tan: TanSwatch,
  White: WhiteSwatch,
  Yellow: YellowSwatch,
};
