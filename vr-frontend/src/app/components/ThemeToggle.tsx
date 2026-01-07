'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PRESET_COLORS = [
  "#3b82f6", // Blue (default)
  "#e9d5ff", // Lavender
  "#98FF98", // Mint
  "#FFDAB9", // Peach
  "#87CEEB", // Sky Blue
  "#FFE4E1", // Rose
  "#C1E1C1", // Sage
  "#FFFACD", // Lemon
  "#CCCCFF", // Periwinkle
  "#FFB6C1", // Light Pink
  "#B0E0E6", // Powder Blue
  "#F0E68C", // Khaki
  "#DDA0DD", // Plum
  "#F5DEB3", // Wheat
  "#E0BBE4", // Mauve
  "#FFDEAD", // Navajo White
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme, customColor, applyCustomTheme, resetCustomTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(customColor || "#3b82f6");
  const [hexInput, setHexInput] = useState(selectedColor.replace('#', ''));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (customColor) {
      setSelectedColor(customColor);
      setHexInput(customColor.replace('#', ''));
    }
  }, [customColor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowColorPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />;
      case 'dark':
        return <Moon size={20} />;
      default:
        return <Sun size={20} />;
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // When switching themes, reset custom colors
    if (customColor) {
      resetCustomTheme();
      setSelectedColor("#3b82f6");
      setHexInput("3b82f6");
    }
    setTheme(newTheme);
  };

  const handleColorSelect = (color: string) => {
    // CRITICAL: Selecting ANY color automatically switches theme to "light"
    setTheme('light');
    setSelectedColor(color);
    setHexInput(color.replace('#', ''));
    applyCustomTheme(color);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);

    // Auto-add # if missing and validate
    const hexValue = value.startsWith('#') ? value : `#${value}`;

    // Validate hex color (exactly 6 digits)
    if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
      setSelectedColor(hexValue);
      handleColorSelect(hexValue);
    }
  };

  const handleReset = () => {
    setSelectedColor("#3b82f6");
    setHexInput("3b82f6");
    resetCustomTheme();
  };

  const getSubtitle = () => {
    switch (resolvedTheme) {
      case 'light':
        return 'Light theme with custom color tint';
      case 'dark':
        return 'Dark theme with custom color tint';
      default:
        return 'Light theme with custom color tint';
    }
  };

  const getPreviewBackground = () => {
    // Extract hue from selected color
    const hex = selectedColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    const hue = h * 360;

    switch (resolvedTheme) {
      case 'light':
        return `oklch(0.96 0.04 ${hue})`;
      case 'dark':
        return `oklch(0.08 0.01 ${hue})`;
      default:
        return `oklch(0.96 0.04 ${hue})`;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowColorPicker(false);
        }}
        className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {getThemeIcon()}
          </motion.div>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`fixed left-[80px] bottom-[80px] ${showColorPicker ? 'w-80' : 'w-40'} border border-border bg-card shadow-lg rounded-md overflow-hidden z-50`}
          >
            {!showColorPicker ? (
              <>
                {/* Theme Options */}
                <div className="p-1">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                      theme === 'light' && !customColor ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun size={16} />
                      <span>Light</span>
                    </div>
                    {theme === 'light' && !customColor && <span>•</span>}
                  </button>

                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                      theme === 'dark' && !customColor ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon size={16} />
                      <span>Dark</span>
                    </div>
                    {theme === 'dark' && !customColor && <span>•</span>}
                  </button>
                </div>

                {/* Separator */}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={16} />
                      <span>Colors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customColor && (
                        <div
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: customColor }}
                        />
                      )}
                      {customColor && <span>•</span>}
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">Choose Theme Color</h3>
                  </div>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {/* Preset Colors */}
                <div>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className="w-6 h-6 rounded-md border-2 border-border hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor.toLowerCase() === color.toLowerCase() && (
                          <Check size={12} className="text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
