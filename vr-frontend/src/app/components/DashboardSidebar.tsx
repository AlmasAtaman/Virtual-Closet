'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

interface DashboardSidebarProps {
  onThemeToggle?: () => void;
  onSettingsClick?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onThemeToggle,
  onSettingsClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on dashboard or folders
  const isHomeSelected = pathname === '/dashboard' || pathname?.startsWith('/folders/');

  // Check if we're on outfits or occasions
  const isOutfitsSelected = pathname === '/outfits' || pathname?.startsWith('/occasions/');

  return (
    <>
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex fixed left-0 top-0 h-screen w-[70px] bg-sidebar border-r border-sidebar-border flex-col items-center py-6 z-40"
    >
      {/* Logo Section */}
      <div className="mb-8">
        <Image
          src="/vestkoLogo.PNG"
          alt="Vestko Logo"
          width={60}
          height={60}
          className="object-contain"
        />
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => router.push('/dashboard')}
          className="w-[56px] h-[56px] flex items-center justify-center rounded-2xl hover:bg-sidebar-accent transition-colors"
          aria-label="Home"
        >
          <Image
            src={isHomeSelected ? '/homeSelect.PNG' : '/home.PNG'}
            alt="Home"
            width={52}
            height={52}
            className="object-contain"
          />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => router.push('/outfits')}
          className="w-[56px] h-[56px] flex items-center justify-center rounded-2xl hover:bg-sidebar-accent transition-colors"
          aria-label="Clothing"
        >
          <Image
            src={isOutfitsSelected ? '/outfitSelect.PNG' : '/outfit.PNG'}
            alt="Outfits"
            width={56}
            height={56}
            className="object-contain"
          />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-[56px] h-[56px] flex items-center justify-center rounded-2xl hover:bg-sidebar-accent transition-colors"
          aria-label="Tags"
        >
          <Image
            src={pathname === '/shop' ? '/shopSelect.PNG' : '/shop.PNG'}
            alt="Shop"
            width={48}
            height={48}
            className="object-contain"
          />
        </motion.button>
      </nav>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-4 mb-2">
        <ThemeToggle />

        {onSettingsClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onSettingsClick}
            className="w-[56px] h-[56px] flex items-center justify-center rounded-2xl text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </motion.button>
        )}
      </div>
    </motion.aside>
    </>
  );
};
