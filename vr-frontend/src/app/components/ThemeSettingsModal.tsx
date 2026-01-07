'use client';

import React, { useState } from 'react';
import { X, Sun, Moon, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({ isOpen, onClose }) => {
  const { setTheme, customColor, applyCustomTheme } = useTheme();
  const [selectedColor, setSelectedColor] = useState(customColor || "#3b82f6");

  const handleColorSelect = (color: string) => {
    setTheme('light');
    setSelectedColor(color);
    applyCustomTheme(color);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Choose Theme Color</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                    selectedColor.toLowerCase() === color.toLowerCase()
                      ? 'border-foreground ring-2 ring-offset-2 ring-foreground'
                      : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
