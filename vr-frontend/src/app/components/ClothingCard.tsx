"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ClothingItem } from "../types/clothing"

interface ClothingCardProps {
  item: ClothingItem
  onClick: (item: ClothingItem, rect: DOMRect) => void
  isSelected?: boolean
  isMultiSelecting?: boolean
  onToggleSelect?: (id: string) => void
}

export default function ClothingCard({
  item,
  onClick,
  isSelected = false,
  isMultiSelecting = false,
  onToggleSelect,
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
        className={`group h-full transition-all duration-300 ${
          isHovering && !isMultiSelecting ? "shadow-lg" : "shadow-sm"
        }`}
      >
        <div
          className="relative aspect-square cursor-pointer overflow-hidden"
          onClick={(e) => {
            if (isMultiSelecting && onToggleSelect) {
              onToggleSelect(item.id)
            } else {
              onClick(item, e.currentTarget.getBoundingClientRect())
            }
          }}
        >
          {item.url ? (
            <motion.img
              src={item.url}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500"
              style={{
                objectFit: "cover",
                scale: isHovering && !isMultiSelecting ? 1.05 : 1,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-3xl">👕</span>
            </div>
          )}

          {/* Mode badge */}
          {item.mode === "wishlist" && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-500/90 text-white backdrop-blur-sm">
              Wishlist
            </Badge>
          )}

          {/* Multi-select overlay */}
          {isMultiSelecting && isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-primary/30 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="rounded-full bg-white w-8 h-8 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </motion.div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-1 mb-1 text-base">{item.name}</h3>
          <div className="mb-2 flex flex-wrap gap-1">
            {[item.type, item.brand].filter(Boolean).map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
          {formatPrice(item.price) && <p className="text-sm font-medium text-primary">{formatPrice(item.price)}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
} 