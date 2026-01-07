"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Occasion } from "./OccasionsView";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import OutfitPreviewHorizontal from "./OutfitPreviewHorizontal";

interface OccasionCardProps {
  occasion: Occasion;
  onClick: () => void;
  onRename?: (occasion: Occasion) => void;
  onChangeImage?: (occasion: Occasion) => void;
  onDelete?: (occasion: Occasion) => void;
}

export default function OccasionCard({ occasion, onClick, onRename, onChangeImage, onDelete }: OccasionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get display data - either an image URL or an outfit object for horizontal rendering
  const getDisplayData = () => {
    if (occasion.previewImages && Array.isArray(occasion.previewImages) && occasion.previewImages.length > 0) {
      // Use custom preview image (only the main one)
      const previewImages = occasion.previewImages as Array<{
        position: string;
        imageUrl?: string;
        outfitId?: string;
      }>;

      const mainImage = previewImages.find(img => img.position === 'main');

      if (mainImage?.imageUrl && mainImage.imageUrl.trim() !== '') {
        return { type: 'image' as const, url: mainImage.imageUrl };
      } else if (mainImage?.outfitId) {
        // Find the outfit in either outfits or previewOutfits (API returns outfits)
        const outfitsArray = occasion.outfits || occasion.previewOutfits || [];
        const outfit = outfitsArray.find(p => p.id === mainImage.outfitId);
        if (outfit && outfit.clothingItems && outfit.clothingItems.length > 0) {
          // Only use horizontal rendering if outfit has clothingItems
          return { type: 'outfit' as const, outfit };
        } else if (outfit && outfit.imageUrl) {
          // Fallback to image URL if no clothingItems
          return { type: 'image' as const, url: outfit.imageUrl };
        }
      }
    }

    // Fallback to first outfit (check outfits first, then previewOutfits)
    const outfitsArray = occasion.outfits || occasion.previewOutfits || [];
    if (outfitsArray && Array.isArray(outfitsArray) && outfitsArray.length > 0) {
      const firstOutfit = outfitsArray[0];
      if (firstOutfit) {
        // Check if outfit has clothingItems for horizontal rendering
        if (firstOutfit.clothingItems && firstOutfit.clothingItems.length > 0) {
          return { type: 'outfit' as const, outfit: firstOutfit };
        } else if (firstOutfit.imageUrl && firstOutfit.imageUrl.trim() !== '') {
          // Use imageUrl directly if no clothingItems
          return { type: 'image' as const, url: firstOutfit.imageUrl };
        }
      }
    }

    return null;
  };

  const displayData = getDisplayData();

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
        {/* Preview - Single image layout */}
        <div className="w-full h-48 rounded-2xl overflow-hidden bg-background dark:bg-gray-900">
          <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {displayData?.type === 'image' ? (
              <Image
                src={displayData.url}
                alt="Outfit preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            ) : displayData?.type === 'outfit' ? (
              <OutfitPreviewHorizontal
                outfit={displayData.outfit}
                containerWidth={400}
                containerHeight={192}
              />
            ) : null}
          </div>
        </div>

        {/* Occasion Info */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate flex-1">
            {occasion.name}
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
              aria-label="Occasion options"
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
                  className="absolute right-0 mt-1 bg-background dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onRename?.(occasion);
                      }}
                      className="px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap w-full"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onChangeImage?.(occasion);
                      }}
                      className="px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap w-full"
                    >
                      Change Image
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete?.(occasion);
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
