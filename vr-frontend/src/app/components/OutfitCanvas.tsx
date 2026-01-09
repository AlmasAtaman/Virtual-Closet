"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  price?: number
  mode?: "closet" | "wishlist"
  x?: number
  y?: number
  scale?: number
  left?: number
  bottom?: number
  width?: number
  aspectRatio?: number
}

interface OutfitCanvasProps {
  items: ClothingItem[]
  outerwearOnTop?: boolean
  draggedItemId?: string | null
  selectedItemForResize?: string | null
  enableDragDrop?: boolean
  enableResize?: boolean
  onMouseDown?: (e: React.MouseEvent, itemId: string) => void
  onTouchStart?: (e: React.TouchEvent, itemId: string) => void
  onClick?: (e: React.MouseEvent, itemId: string) => void
  onImageLoad?: (itemId: string, aspectRatio: number) => void
  className?: string
}

const DEFAULTS = {
  x: 50,
  y: 50,
  scale: 1,
  left: 50,
  bottom: 0,
  width: 10,
  aspectRatio: 1.25, // Default aspect ratio closer to actual clothing items
}

export default function OutfitCanvas({
  items,
  outerwearOnTop = false,
  draggedItemId = null,
  selectedItemForResize = null,
  enableDragDrop = false,
  enableResize = false,
  onMouseDown,
  onTouchStart,
  onClick,
  onImageLoad,
  className = "",
}: OutfitCanvasProps) {
  return (
    <div className={`relative w-[280px] h-[32rem] ${className}`}>
      {items.map((item, index) => {
        // Calculate z-index based on layer order preference
        let zIndex = index
        if (draggedItemId === item.id) {
          zIndex = 50
        } else if (selectedItemForResize === item.id) {
          zIndex = 40
        } else {
          // Apply custom layer ordering
          const itemType = item.type?.toLowerCase() || ""
          const isOuterwear = ["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(itemType)
          const isTop = ["t-shirt", "dress", "shirt", "blouse"].includes(itemType)

          if (outerwearOnTop && isOuterwear) {
            zIndex = 30 // Outerwear on top
          } else if (!outerwearOnTop && isTop) {
            zIndex = 30 // Top on top
          } else {
            zIndex = index
          }
        }

        // Calculate positioning using x, y coordinates
        const itemWidth = item.width ?? DEFAULTS.width
        const aspectRatio = item.aspectRatio ?? DEFAULTS.aspectRatio

        const leftPosition = `calc(${item.x ?? DEFAULTS.x}% - ${itemWidth / 2}rem)`
        const topPosition = `calc(${item.y ?? DEFAULTS.y}% - ${(itemWidth * aspectRatio) / 2}rem)`

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: leftPosition,
              top: topPosition,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.3 },
              left: { duration: 0.4, ease: "easeInOut" },
              top: { duration: 0.4, ease: "easeInOut" },
            }}
            className={`absolute ${
              enableDragDrop ? "cursor-move hover:shadow-lg transition-shadow" : ""
            } ${draggedItemId === item.id ? "z-50 shadow-2xl" : ""} ${
              selectedItemForResize === item.id ? "ring-2 ring-foreground" : ""
            }`}
            style={{
              width: `${itemWidth}rem`,
              transform: item.scale && item.scale !== 1 ? `scale(${item.scale})` : undefined,
              zIndex: zIndex,
            }}
            onMouseDown={(e) => enableDragDrop && onMouseDown && onMouseDown(e, item.id)}
            onTouchStart={(e) => enableDragDrop && onTouchStart && onTouchStart(e, item.id)}
            onClick={(e) => {
              e.stopPropagation()
              if (enableResize && onClick) {
                onClick(e, item.id)
              }
            }}
          >
            <Image
              src={item.url || "/placeholder.svg"}
              alt={item.name || ""}
              width={100}
              height={120}
              className="w-full h-auto object-contain rounded-lg"
              draggable={false}
              unoptimized
              onLoad={(e) => {
                // Only calculate aspect ratio if not already provided
                if (!item.aspectRatio && onImageLoad) {
                  const img = e.currentTarget
                  const aspectRatio = img.naturalHeight / img.naturalWidth
                  onImageLoad(item.id, aspectRatio)
                }
              }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
