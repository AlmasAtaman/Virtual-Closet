"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  mode: "closet" | "wishlist"
}

// Helper function to determine the broad category of an item based on its type
const getItemCategory = (item: ClothingItem): "top" | "bottom" | "outerwear" | "others" => {
  const type = item.type?.toLowerCase() || ""
  if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
    return "top"
  } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
    return "bottom"
  } else if (["jacket", "sweater", "coat", "hoodie", "cardigan"].includes(type)) {
    return "outerwear"
  } else {
    return "others"
  }
}

interface ClothingItemSelectModalProps {
  isOpen: boolean
  onCloseAction: () => void
  clothingItems: ClothingItem[]
  onSelectItem: (selectedItem: ClothingItem) => void
  viewMode: "closet" | "wishlist"
  selectedCategory: "outerwear" | "top" | "bottom" | "shoe" | null
}

const ClothingItemSelectModal: React.FC<ClothingItemSelectModalProps> = ({
  isOpen,
  onCloseAction,
  clothingItems,
  onSelectItem,
  viewMode,
  selectedCategory,
}) => {
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([])
  const [currentModalViewMode, setCurrentModalViewMode] = useState<"closet" | "wishlist">(viewMode)
  const [loading] = useState(false)

  useEffect(() => {
    if (!clothingItems) return

    // Filter by category first, then by mode
    const itemsFilteredByCategory = selectedCategory
      ? clothingItems.filter((item) => {
          const category = getItemCategory(item)
          // Explicitly include "Select None" item if its ID is "none"
          if (item.id?.startsWith("__none")) {
            return true
          }
          return category === selectedCategory
        })
      : clothingItems

    const itemsToFilter = itemsFilteredByCategory.filter((item) => item.mode?.toLowerCase() === currentModalViewMode)

    setFilteredItems(itemsToFilter)
  }, [clothingItems, currentModalViewMode, selectedCategory])

  if (!isOpen) {
    return null
  }

  const handleItemClick = (item: ClothingItem) => {
    onSelectItem(item)
    onCloseAction()
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onCloseAction}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Select Clothing Item
              </h2>
              <div className="flex items-center gap-3">
                {/* Closet/Wishlist Toggle */}
                <Tabs
                  value={currentModalViewMode}
                  onValueChange={(value) => setCurrentModalViewMode(value as "closet" | "wishlist")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="closet">Closet</TabsTrigger>
                    <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCloseAction}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <X className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No Items Found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Try switching between Closet and Wishlist
                  </p>
                  <Button
                    onClick={onCloseAction}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredItems.map((item) => {
                    const isNoneOption = item.id?.startsWith("__none")
                    return (
                      <Card
                        key={item.id}
                        className="cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => handleItemClick(item)}
                      >
                        <CardContent className="p-2">
                          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            {isNoneOption ? (
                              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                                <X className="w-8 h-8 text-slate-400" />
                              </div>
                            ) : (
                              <Image
                                src={item.url}
                                alt={item.name || "Clothing item"}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                unoptimized
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ClothingItemSelectModal
