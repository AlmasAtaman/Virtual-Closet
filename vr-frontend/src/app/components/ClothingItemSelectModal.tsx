"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const [filterText, setFilterText] = useState("")
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([])
  const [currentModalViewMode, setCurrentModalViewMode] = useState<"closet" | "wishlist">(viewMode)
  const [viewType, setViewType] = useState<"grid" | "list">("grid")

  useEffect(() => {
    if (!clothingItems) return

    console.log("→ Current View Mode:", currentModalViewMode)
    console.log(
      "→ Items passed to modal:",
      clothingItems.map((i) => `${i.name} (${i.mode})`),
    )
    console.log(
      "→ Mode values of passed items:",
      clothingItems.map((i) => i.mode),
    )

    // Filter by category first, then by mode
    const itemsFilteredByCategory = selectedCategory
      ? clothingItems.filter((item) => {
          const category = getItemCategory(item)
          // Explicitly include "Select None" item if its ID is "none"
          if (item.id?.startsWith("__none")) {
            return true
          }
          console.log(
            `  Checking item: ${item.name} (Type: ${item.type}, Category: ${category}, Mode: ${item.mode}). Matches selectedCategory (${selectedCategory})? ${category === selectedCategory}`,
          )
          return category === selectedCategory
        })
      : clothingItems // If no category selected, use all items

    console.log(
      "→ Filtered items after category match:",
      itemsFilteredByCategory.map((i) => `${i.name} (${i.mode})`),
    )

    const itemsToFilter = itemsFilteredByCategory.filter((item) => item.mode?.toLowerCase() === currentModalViewMode)

    console.log(
      "→ Filtered items after mode match:",
      itemsToFilter.map((i) => i.name),
    )

    const noneOption = clothingItems.find((item) => item.id === "none")
    const itemsWithoutNone = itemsToFilter.filter(
      (item) =>
        !item.id?.startsWith("__none") &&
        (item.name?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.type?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.brand?.toLowerCase().includes(filterText.toLowerCase()) ||
          "".includes(filterText.toLowerCase())),
    )

    setFilteredItems(
      noneOption && (noneOption.name?.toLowerCase().includes(filterText.toLowerCase()) || filterText === "")
        ? [noneOption, ...itemsWithoutNone]
        : itemsWithoutNone,
    )
  }, [filterText, clothingItems, currentModalViewMode, selectedCategory])

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
        <motion.div
          key="clothing-select-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onCloseAction}
        >
          <motion.div
            key="clothing-select-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Select Clothing Item</h2>
                <p className="text-muted-foreground mt-1">
                  Choose from your {selectedCategory || "clothing"} collection
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onCloseAction} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-col h-[calc(95vh-96px)] px-6 pb-6 pt-0">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* View Mode Tabs */}
                <Tabs
                  value={currentModalViewMode}
                  onValueChange={(value) => setCurrentModalViewMode(value as "closet" | "wishlist")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="closet">Closet</TabsTrigger>
                    <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by name, type, or brand..."
                    className="pl-10"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>

                {/* View Type Toggle */}
                <div className="flex rounded-lg border border-border">
                  <Button
                    variant={viewType === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("list")}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Items Grid/List */}
              <div className="flex-1 overflow-y-auto">
                {viewType === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map((item, index) => {
                      console.log(`Rendering item: ${item.name} with ID: ${item.id}`)
                      return (
                        <motion.div
                          key={item.id || `grid-item-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg transition-all duration-200"
                            onClick={() => handleItemClick(item)}
                          >
                            <CardContent className="p-3">
                              {item.id?.startsWith("__none") ? (
                                <>
                                  <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                    <X className="w-10 h-10 text-muted-foreground" />
                                  </div>
                                  <p className="text-sm font-medium text-center">Select None</p>
                                  <p className="text-xs text-center opacity-0">Type</p>
                                </>
                              ) : (
                                <>
                                  <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-muted">
                                    <img
                                      src={item.url || "/placeholder.svg"}
                                      alt={item.name || "Clothing Item"}
                                      className="w-full h-full object-cover"
                                    />
                                    {item.mode === "wishlist" && (
                                      <Badge className="absolute top-1 right-1 text-xs bg-amber-500">Wishlist</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {item.name || "Unnamed"}
                                  </p>
                                  {item.type && <p className="text-xs text-muted-foreground truncate">{item.type}</p>}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item, index) => {
                      console.log(`Rendering item: ${item.name} with ID: ${item.id}`)
                      return (
                        <motion.div
                          key={item.id || `list-item-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-md transition-all duration-200"
                            onClick={() => handleItemClick(item)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                {item.id?.startsWith("__none") ? (
                                  <div className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg">
                                    <X className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                      src={item.url || "/placeholder.svg"}
                                      alt={item.name || "Clothing Item"}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-foreground truncate">
                                    {item.name || (item.id === "none" ? "Select None" : "Unnamed")}
                                  </h3>
                                  {item.type && <p className="text-sm text-muted-foreground">{item.type}</p>}
                                  {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                                </div>
                                {item.mode === "wishlist" && !item.id?.startsWith("__none") && (
                                  <Badge className="bg-amber-500">Wishlist</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {filteredItems.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No items found</h3>
                      <p className="text-sm">Try adjusting your search or switching between Closet and Wishlist</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ClothingItemSelectModal
