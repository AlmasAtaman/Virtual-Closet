"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt } from "lucide-react"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
  x?: number
  y?: number
  scale?: number
  left?: number
  bottom?: number
  width?: number
}

interface Outfit {
  id: string
  name?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  totalPrice?: number
  clothingItems: ClothingItem[]
  isFavorite?: boolean
}

interface OutfitCardProps {
  outfit: Outfit
  onDelete?: (outfitId: string) => void
  onUpdate?: () => void
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit }) => {
  // Categorize clothing items
  const categorizedItems: {
    tops: ClothingItem[]
    bottoms: ClothingItem[]
    outerwear: ClothingItem[]
    others: ClothingItem[]
  } = {
    tops: outfit.clothingItems.filter((item) =>
      ["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(item.type?.toLowerCase() || ""),
    ),
    bottoms: outfit.clothingItems.filter((item) =>
      ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || ""),
    ),
    outerwear: outfit.clothingItems.filter((item) =>
      ["jacket", "coat", "blazer", "vest"].includes(item.type?.toLowerCase() || ""),
    ),
    others: outfit.clothingItems.filter(
      (item) =>
        ![
          "t-shirt",
          "dress",
          "shirt",
          "blouse",
          "sweater",
          "hoodie",
          "cardigan",
          "pants",
          "skirt",
          "shorts",
          "jeans",
          "leggings",
          "jacket",
          "coat",
          "blazer",
          "vest",
        ].includes(item.type?.toLowerCase() || ""),
    ),
  }

  const topItems = categorizedItems.tops

  const DEFAULTS = {
    x: 0,
    y: 0,
    scale: 1,
    left: 50,
    bottom: 0,
    width: 10,
  }

  // Helper to check if any item has custom layout
  const hasCustomLayout = outfit.clothingItems.some(
    (item) =>
      (item.x !== undefined && item.x !== DEFAULTS.x) ||
      (item.y !== undefined && item.y !== DEFAULTS.y) ||
      (item.scale !== undefined && item.scale !== DEFAULTS.scale) ||
      (item.left !== undefined && item.left !== DEFAULTS.left) ||
      (item.bottom !== undefined && item.bottom !== DEFAULTS.bottom) ||
      (item.width !== undefined && item.width !== DEFAULTS.width),
  )

  const handleCardClick = () => {
    window.location.href = `/outfits/${outfit.id}`
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="h-[32rem] cursor-pointer overflow-hidden bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600"
        onClick={handleCardClick}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Outfit Visual Area */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 flex items-center justify-center">
            {/* Outfit Image Collage */}
            <div className="relative w-44 h-80 mx-auto">
              {hasCustomLayout ? (
                outfit.clothingItems.map((item, index) => (
                  <motion.img
                    key={item.id || index}
                    src={item.url}
                    alt={item.name || ""}
                    style={{
                      left: `${item.left ?? item.x ?? DEFAULTS.left}%`,
                      bottom: `${item.bottom ?? item.y ?? DEFAULTS.bottom}rem`,
                      width: `${item.width ?? DEFAULTS.width}rem`,
                      position: "absolute",
                      transform: `translateX(-50%) scale(${item.scale ?? DEFAULTS.scale})`,
                      zIndex: index,
                      borderRadius: "0.5rem",
                      objectFit: "contain",
                    }}
                    className="object-contain"
                  />
                ))
              ) : (
                <>
                  {/* Bottom (pants) - Standardized size */}
                  {categorizedItems.bottoms[0] && (
                    <img
                      src={categorizedItems.bottoms[0].url || "/placeholder.svg"}
                      alt="Bottom"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 z-10"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  {/* Top (shirt) - Standardized size */}
                  {topItems[0] && (
                    <img
                      src={topItems[0].url || "/placeholder.svg"}
                      alt="Top"
                      className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-32 z-20"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  {/* Outerwear - Standardized size */}
                  {categorizedItems.outerwear[0] && (
                    <img
                      src={categorizedItems.outerwear[0].url || "/placeholder.svg"}
                      alt="Outerwear"
                      className="absolute bottom-[8.8rem] left-1/2 -translate-x-1/2 w-32 z-30"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Fallback if no images */}
            {topItems.length === 0 && categorizedItems.bottoms.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items</p>
                </div>
              </div>
            )}
          </div>

          {/* Outfit Info */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {outfit.name || `Outfit ${outfit.id.substring(0, 6)}`}
              </h3>
              <div className="flex items-center space-x-1">
                <Shirt className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">{outfit.clothingItems.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {outfit.occasion && (
                  <Badge variant="secondary" className="text-xs">
                    {outfit.occasion}
                  </Badge>
                )}
                {outfit.season && (
                  <Badge variant="outline" className="text-xs">
                    {outfit.season}
                  </Badge>
                )}
              </div>
              {outfit.totalPrice && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ${outfit.totalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default OutfitCard
