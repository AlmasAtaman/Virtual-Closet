"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Check } from "lucide-react"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
}

interface ScrollableClothingRowProps {
  items: ClothingItem[]
  selectedItemId?: string
  onSelectItem: (item: ClothingItem) => void
  label: string
  isAnimating?: boolean
  animatingItemId?: string
}

export default function ScrollableClothingRow({
  items,
  selectedItemId,
  onSelectItem,
  label,
  isAnimating = false,
  animatingItemId,
}: ScrollableClothingRowProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3 px-4">{label}</h3>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No items in this category</p>
        </div>
      ) : (
        <div className="relative">
          {/* Scrollable container */}
          <div className="overflow-x-auto scrollbar-hide px-4">
            <div className="flex gap-4 pb-2">
              {items.map((item, index) => {
                const isSelected = selectedItemId === item.id
                const isCurrentlyAnimating = isAnimating && animatingItemId === item.id

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isCurrentlyAnimating ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      opacity: { delay: index * 0.05 },
                      y: { delay: index * 0.05 },
                      scale: isCurrentlyAnimating
                        ? { duration: 0.3, repeat: Infinity }
                        : { duration: 0.2 },
                    }}
                    onClick={() => onSelectItem(item)}
                    className={`flex-shrink-0 w-32 cursor-pointer group relative ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
                        : ""
                    }`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}

                    {/* Item card */}
                    <div
                      className={`bg-card border-2 rounded-lg p-2 transition-all ${
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      }`}
                    >
                      <div className="relative aspect-square mb-2 bg-muted/30 rounded-md overflow-hidden">
                        <Image
                          src={item.url}
                          alt={item.name || "Clothing item"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-foreground truncate">
                          {item.name || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                          {item.type}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Gradient overlays for scroll indication */}
          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  )
}
