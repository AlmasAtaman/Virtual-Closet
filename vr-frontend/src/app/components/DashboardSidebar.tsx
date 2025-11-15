'use client';

import React from 'react';
import { Home, Sun, Settings } from 'lucide-react';
import { HangerIcon } from './icons/HangerIcon';
import { TagIcon } from './icons/TagIcon';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface DashboardSidebarProps {
  onThemeToggle?: () => void;
  onSettingsClick?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onThemeToggle,
  onSettingsClick,
}) => {
  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex fixed left-0 top-0 h-screen w-[60px] bg-[#F5F5F5] flex-col items-center py-6 z-40"
    >
      {/* Logo Section */}
      <div className="mb-8">
        <Image
          src="/VestkoBlack.png"
          alt="Vestko Logo"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-6 flex-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
          aria-label="Home"
        >
          <Home size={24} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
          aria-label="Clothing"
        >
          <HangerIcon size={24} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
          aria-label="Tags"
        >
          <TagIcon size={24} />
        </motion.button>
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-4">
        {onThemeToggle && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
            aria-label="Toggle Theme"
          >
            <Sun size={24} />
          </motion.button>
        )}

        {onSettingsClick && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onSettingsClick}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
            aria-label="Settings"
          >
            <Settings size={24} />
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
};
