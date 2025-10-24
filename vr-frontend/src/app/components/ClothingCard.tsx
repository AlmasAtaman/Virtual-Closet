"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ClothingItem } from "../types/clothing"
import { Heart, Check } from "lucide-react"
import { CompactLoadingPlaceholder } from "./LoadingImagePlaceholder"

interface ClothingCardProps {
  item: ClothingItem
  onClick: (item: ClothingItem, rect: DOMRect) => void
  isSelected?: boolean
  isMultiSelecting?: boolean
  onToggleSelect?: (id: string) => void
  toggleFavorite: (id: string, newState: boolean) => void
  viewMode?: "closet" | "wishlist"
}

// Images are now standardized on the backend with category-specific canvas sizes
// No need for frontend scaling - just use consistent object-contain
const getImageScaleClass = (type?: string) => {
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
}: ClothingCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Helper function to safely format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return ""
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    if (isNaN(numPrice) || numPrice === 0) return ""
    return `$${numPrice.toFixed(2)}`
  }

  return (
    <motion.div
      whileHover={{
        scale: isMultiSelecting ? 1 : 1.03,
        y: isMultiSelecting ? 0 : -5,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`relative overflow-hidden`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Card
        className={`group h-full transition-all duration-300 border-0 ring-1 rounded-xl ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900 scale-[1.02]"
            : isHovering && !isMultiSelecting
            ? "shadow-lg ring-border"
            : "shadow-sm ring-border"
        }`}
      >
        <div
          className="relative w-full h-[320px] flex items-start justify-center bg-white dark:bg-slate-800 chrome:bg-card cursor-pointer overflow-hidden clothing-image"
          onClick={(e) => {
            if (isMultiSelecting && onToggleSelect) {
              onToggleSelect(item.id)
            } else {
              onClick(item, e.currentTarget.getBoundingClientRect())
            }
          }}
        >
          {item.url ? (
            <>
              <Image
                src={item.url || "/placeholder.svg"}
                alt={item.name || "Clothing item"}
                fill
                className={`object-contain p-4 transition-transform duration-300 ${getImageScaleClass(item.type)}`}
                style={{ objectPosition: 'top' }}
                unoptimized
              />
              {/* Show loading overlay if image is still processing */}
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

          {/* Multi-select checkmark - top left corner */}
          {isMultiSelecting && isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2 left-2 z-20"
            >
              <button
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 bg-blue-600 border-blue-600 text-white shadow-lg"
              >
                <Check className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Favorite Heart Icon - top right, always visible, styled */}
          <motion.button
            className="absolute top-2 right-2 z-20 p-1 rounded-full bg-white/80 dark:bg-slate-700/80 chrome:bg-card/80 backdrop-blur-sm"
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
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
          </motion.button>
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-1 mb-1 text-base">{item.name}</h3>
          <div className="mb-2 flex flex-wrap gap-1">
            {item.type && (
              <Badge variant="secondary" className="text-xs font-normal">
                {item.type}
              </Badge>
            )}
            {item.brand && item.brand !== "No brand" && item.brand.trim() !== "" && (
              <Badge variant="secondary" className="text-xs font-normal">
                {item.brand}
              </Badge>
            )}
          </div>
          {viewMode !== "closet" && formatPrice(item.price) && (
            <p className="text-sm font-medium text-primary">{formatPrice(item.price)}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
