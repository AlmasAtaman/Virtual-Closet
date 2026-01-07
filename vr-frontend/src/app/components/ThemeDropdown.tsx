'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const COLOR_PALETTES = [
  { name: 'Default', color: null },
  { name: 'Lavender', color: '#E6E6FA' },
  { name: 'Mint', color: '#98FF98' },
  { name: 'Peach', color: '#FFDAB9' },
  { name: 'Sky', color: '#87CEEB' },
  { name: 'Rose', color: '#FFE4E1' },
  { name: 'Sage', color: '#C1E1C1' },
];

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({ isOpen, onClose, buttonRef }) => {
  const { theme, setTheme, customColor, applyCustomTheme, resetCustomTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(
    theme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  const handlePaletteChange = (color: string | null) => {
    if (color) {
      applyCustomTheme(color);
    } else {
      resetCustomTheme();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed left-[80px] bottom-[80px] w-56 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50"
      >
        {/* Theme Mode Section */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Theme Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTheme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <Sun size={16} />
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTheme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </div>

        {/* Color Palette Section - Only for Light Mode */}
        {selectedTheme === 'light' && (
          <div className="p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Color Palette</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => handlePaletteChange(palette.color)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    customColor === palette.color
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-foreground'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                    style={{
                      background: palette.color
                        ? `linear-gradient(135deg, ${palette.color} 0%, ${adjustBrightness(palette.color, -20)} 100%)`
                        : '#f5f5f5',
                    }}
                  />
                  <span className="flex-1 text-left">{palette.name}</span>
                  {customColor === palette.color && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTheme === 'dark' && (
          <div className="p-3">
            <p className="text-xs text-muted-foreground text-center">
              Color palettes not available in dark mode
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
