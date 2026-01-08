"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { ClothingItem } from "../types/clothing"
import { Heart, Check, ExternalLink } from "lucide-react"
import { CompactLoadingPlaceholder } from "./LoadingImagePlaceholder"
import AddToFolderDropdown from "./AddToFolderDropdown"

interface ClothingCardProps {
  item: ClothingItem
  onClick: (item: ClothingItem, rect: DOMRect) => void
  isSelected?: boolean
  isMultiSelecting?: boolean
  onToggleSelect?: (id: string) => void
  toggleFavorite: (id: string, newState: boolean) => void
  viewMode?: "closet" | "wishlist"
  showAsSaved?: boolean
  isPendingRemoval?: boolean
  onTogglePendingRemoval?: (id: string) => void
}

// Images are now standardized on the backend with category-specific canvas sizes
// No need for frontend scaling - just use consistent object-contain
const getImageScaleClass = () => {
  return "scale-100" // No scaling - backend standardization handles consistent sizing
}

export default function ClothingCard({
  item,
  onClick,
  isSelected = false,
  isMultiSelecting = false,
  onToggleSelect,
  toggleFavorite,
  viewMode,
  showAsSaved = false,
  isPendingRemoval = false,
  onTogglePendingRemoval,
}: ClothingCardProps) {
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);

  // Helper function to ensure URL has proper protocol
  const ensureProtocol = (url: string) => {
    if (!url) return url
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  return (
    <motion.div
      whileHover={{
        scale: isMultiSelecting ? (isSelected ? 1.05 : 1) : 1.03,
        y: isMultiSelecting ? 0 : -5,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isPendingRemoval ? 0.5 : 1,
        y: 0,
        scale: isSelected && isMultiSelecting ? 1.05 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative overflow-hidden ${isPendingRemoval ? 'opacity-50' : ''}`}
      style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
    >
      <Card
        className={`group h-full transition-all duration-200 rounded-xl bg-card shadow-lg ${
          isSelected
            ? "border-2 border-black dark:border-white"
            : "border border-gray-200 dark:border-gray-700"
        } ${
          !isMultiSelecting ? "hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600" : ""
        }`}
      >
        <div
          className="relative w-full h-[320px] flex items-center justify-center bg-card cursor-pointer overflow-hidden clothing-image rounded-xl"
          onClick={(e) => {
            // Don't trigger if clicking on a button or link inside the card
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a')) {
              return;
            }

            if (isMultiSelecting && onToggleSelect) {
              onToggleSelect(item.id)
            } else {
              onClick(item, e.currentTarget.getBoundingClientRect())
            }
          }}
        >
          {item.url ? (
            <>
              {/* Only show image if processing is completed */}
              {item.processingStatus === 'completed' && (
                <Image
                  src={item.url || "/placeholder.svg"}
                  alt={item.name || "Clothing item"}
                  fill
                  className={`object-contain p-4 transition-transform duration-300 ${getImageScaleClass()}`}
                  style={{ objectPosition: 'center' }}
                  unoptimized
                />
              )}
              {/* Show skeleton/shimmer loader while processing */}
              {item.processingStatus && item.processingStatus !== 'completed' && (
                <CompactLoadingPlaceholder status={item.processingStatus} />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-3xl">👕</span>
            </div>
          )}

          {/* Mode badge: Only show if item is wishlist and not in wishlist view */}
          {item.mode === "wishlist" && viewMode !== "wishlist" && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-500/90 text-white backdrop-blur-sm">
              Wishlist
            </Badge>
          )}

          {/* Top Left - Add to Folder / Saved button */}
          {!isMultiSelecting && !showAsSaved && (
            <div className={`absolute top-2 left-2 z-50 pointer-events-auto transition-all duration-200 ${isFolderDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'}`}>
              <AddToFolderDropdown
                clothingItemId={item.id}
                icon="plus"
                onOpenChange={setIsFolderDropdownOpen}
              />
            </div>
          )}

          {/* Saved/Save button for folder view */}
          {!isMultiSelecting && showAsSaved && onTogglePendingRemoval && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePendingRemoval(item.id);
              }}
              className="absolute top-2 left-2 z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1 rounded-full text-xs font-medium bg-white text-black hover:bg-gray-100"
            >
              {isPendingRemoval ? "Save" : "Saved"}
            </button>
          )}

          {/* Multi-select checkmark overlay - consistent with background selection */}
          {isMultiSelecting && isSelected && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
              <Check className="w-8 h-8 text-white" />
            </div>
          )}

          {/* Top Right - Favorite Heart Icon (on hover, unless multi-selecting) */}
          {!isMultiSelecting && (
            <button
              className="absolute top-2 right-2 z-20 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(item.id, !item.isFavorite)
              }}
              aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
            >
              {item.isFavorite ? (
                <Heart className="fill-red-500 text-red-500 w-6 h-6" />
              ) : (
                <Heart className="text-gray-500 dark:text-gray-300 chrome:text-muted-foreground w-6 h-6" />
              )}
            </button>
          )}

          {/* Bottom Left - Visit Site Link (on hover) */}
          {!isMultiSelecting && item.sourceUrl && (
            <a
              href={ensureProtocol(item.sourceUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-3 py-1.5 bg-white/80 dark:bg-slate-700/80 chrome:bg-card/80 backdrop-blur-sm rounded-full text-xs font-medium hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
