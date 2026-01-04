"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder as FolderType } from "@/app/types/clothing";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

interface FolderCardProps {
  folder: FolderType;
  onClick: () => void;
  onRename?: (folder: FolderType) => void;
  onChangeImage?: (folder: FolderType) => void;
  onDelete?: (folder: FolderType) => void;
}

export default function FolderCard({ folder, onClick, onRename, onChangeImage, onDelete }: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get display items - use previewImages if available, otherwise use previewItems
  const getDisplayItems = () => {
    if (folder.previewImages && Array.isArray(folder.previewImages) && folder.previewImages.length > 0) {
      // Use custom preview images
      const previewImages = folder.previewImages as Array<{
        position: string;
        imageUrl?: string;
        clothingItemId?: string;
      }>;

      // Map positions to indices: main = 0, top-right = 1, bottom-right = 2
      const positionMap: { [key: string]: number } = {
        'main': 0,
        'top-right': 1,
        'bottom-right': 2
      };

      const displayArray: Array<{ url: string; name: string } | null> = [null, null, null];

      previewImages.forEach(img => {
        const index = positionMap[img.position];
        if (index !== undefined && img.imageUrl && img.imageUrl.trim() !== '') {
          displayArray[index] = { url: img.imageUrl, name: '' };
        } else if (index !== undefined && img.clothingItemId) {
          // Find the clothing item in previewItems
          const item = folder.previewItems.find(p => p.id === img.clothingItemId);
          if (item && item.url && item.url.trim() !== '') {
            displayArray[index] = { url: item.url, name: item.name };
          }
        }
      });

      return displayArray;
    }

    // Fallback to default preview items - filter out items with empty URLs
    const items = folder.previewItems
      .filter(item => item && item.url && item.url.trim() !== '')
      .slice(0, 3);
    return [items[0] || null, items[1] || null, items[2] || null];
  };

  const displayItems = getDisplayItems();

  // Debug logging to see what URLs we're getting
  if (displayItems.some(item => item === null || item?.url === '')) {
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <motion.div
      className="cursor-pointer group relative"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      style={{ zIndex: showMenu ? 50 : 1, maxWidth: '400px', margin: '0 auto' }}
    >
      <div className="overflow-visible">
        {/* Preview Grid - Pinterest style: Only outer container has rounded corners */}
        <div className="w-full h-48 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          {folder.imageLayout === "one-picture" ? (
            /* Single image layout */
            <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {displayItems[0] ? (
                <Image
                  src={displayItems[0].url}
                  alt={displayItems[0].name || "Clothing item"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              ) : null}
            </div>
          ) : (
            /* Three images layout */
            <div className="flex gap-[2px] h-full p-[2px]">
              {/* Left side - First item (takes 2/3 width, full height, NO rounded corners) */}
              <div className="relative w-2/3 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {displayItems[0] ? (
                  <Image
                    src={displayItems[0].url}
                    alt={displayItems[0].name || "Clothing item"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized
                  />
                ) : null}
              </div>

              {/* Right side - Two items stacked (each takes 1/3 width, NO rounded corners) */}
              <div className="flex flex-col gap-[2px] w-1/3">
                {/* Top right - Second item */}
                <div className="relative flex-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {displayItems[1] ? (
                    <Image
                      src={displayItems[1].url}
                      alt={displayItems[1].name || "Clothing item"}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 25vw, 15vw"
                      unoptimized
                    />
                  ) : null}
                </div>

                {/* Bottom right - Third item */}
                <div className="relative flex-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {displayItems[2] ? (
                    <Image
                      src={displayItems[2].url}
                      alt={displayItems[2].name || "Clothing item"}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 25vw, 15vw"
                      unoptimized
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Folder Info */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate flex-1">
            {folder.name}
          </h3>

          {/* Three Dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`p-1 rounded-full transition-colors ${
                showMenu
                  ? "bg-gray-200 dark:bg-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Folder options"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onRename?.(folder);
                      }}
                      className="px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap w-full"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onChangeImage?.(folder);
                      }}
                      className="px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap w-full"
                    >
                      Change Image
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete?.(folder);
                      }}
                      className="px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap w-full"
                    >
                      Delete
                    </button>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
