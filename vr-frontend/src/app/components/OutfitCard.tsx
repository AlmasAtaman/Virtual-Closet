"use client"

import type React from "react"
import Image from "next/image"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { X, Shirt, Check, Settings } from "lucide-react"
import OutfitCanvas from "./OutfitCanvas"

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
  aspectRatio?: number
}

interface Outfit {
  id: string
  name?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  totalPrice?: number
  outerwearOnTop?: boolean // Layer order preference
  clothingItems: ClothingItem[]
  isFavorite?: boolean
  createdAt?: string
}

interface CategorizedOutfitItems {
  outerwear?: ClothingItem
  top?: ClothingItem
  bottom?: ClothingItem
  shoe?: ClothingItem
  others: ClothingItem[]
}

interface OutfitCardProps {
  outfit: Outfit
  onDelete?: (outfitId: string) => void
  onUpdate?: () => void
  isSelected?: boolean
  isMultiSelecting?: boolean
  onToggleSelect?: (outfitId: string) => void
  // NEW: Select mode props (as requested by user)
  selectMode?: boolean
  onSelectToggle?: (checked: boolean) => void
  // NEW: Detail view props
  isDetailView?: boolean
  isEditing?: boolean
  onItemSelect?: (category: "outerwear" | "top" | "bottom" | "shoe") => void
  allClothingItems?: ClothingItem[]
  enableDragDrop?: boolean
  enableResize?: boolean
  editedCategorizedItems?: CategorizedOutfitItems | null
  setEditedCategorizedItems?: (items: CategorizedOutfitItems) => void
  // NEW: Hide footer prop
  hideFooter?: boolean
  // NEW: Hide item selection section
  hideItemSelection?: boolean
  // NEW: Hide header/title section for clean preview
  hideHeader?: boolean
  // NEW: Hide resize controls (to be moved to parent component)
  hideResizeControls?: boolean
  // NEW: External control of selected item for resize
  selectedItemForResize?: string | null
  setSelectedItemForResize?: (id: string | null) => void
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  isSelected = false,
  isMultiSelecting = false,
  onToggleSelect,
  // NEW: Select mode props
  selectMode = false,
  onSelectToggle,
  // Detail view props
  isDetailView = false,
  isEditing = false,
  onItemSelect,
  enableDragDrop = false,
  enableResize = false,
  editedCategorizedItems,
  setEditedCategorizedItems,
  // NEW: Hide footer prop
  hideFooter = false,
  // NEW: Hide item selection section
  hideItemSelection = false,
  // NEW: Hide header/title section for clean preview
  hideHeader = false,
  // NEW: Hide resize controls (to be moved to parent component)
  hideResizeControls = false,
  // NEW: External control of selected item for resize
  selectedItemForResize: externalSelectedItemForResize,
  setSelectedItemForResize: externalSetSelectedItemForResize,
}) => {
  // Drag state for detail view
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [internalSelectedItemForResize, setInternalSelectedItemForResize] = useState<string | null>(null)

  // Use external state if provided, otherwise use internal state
  const selectedItemForResize = externalSelectedItemForResize !== undefined ? externalSelectedItemForResize : internalSelectedItemForResize
  const setSelectedItemForResize = externalSetSelectedItemForResize || setInternalSelectedItemForResize
  const dragStartPos = useRef<{ x: number; y: number; itemX: number; itemY: number }>({
    x: 0,
    y: 0,
    itemX: 50,
    itemY: 50,
  })
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isEditing) {
      setSelectedItemForResize(null)
      setDraggedItemId(null)
    }
  }, [isEditing, setSelectedItemForResize])

  const DEFAULTS = {
    x: 50,
    y: 50,
    width: 10,
  }

  // Categorize clothing items
  const categorizedItems: {
    tops: ClothingItem[]
    bottoms: ClothingItem[]
    outerwear: ClothingItem[]
    others: ClothingItem[]
  } = {
    tops: (outfit.clothingItems || []).filter((item) =>
      ["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(item.type?.toLowerCase() || ""),
    ),
    bottoms: (outfit.clothingItems || []).filter((item) =>
      ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || ""),
    ),
    outerwear: (outfit.clothingItems || []).filter((item) =>
      ["jacket", "coat", "blazer", "vest"].includes(item.type?.toLowerCase() || ""),
    ),
    others: (outfit.clothingItems || []).filter(
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

  // Get current items for display (detail view logic)
  const getCurrentCategorizedItems = (): CategorizedOutfitItems => {
    if (isDetailView && isEditing && editedCategorizedItems) {
      return editedCategorizedItems
    }

    // Convert regular categorized items to detail view format
    return {
      top: topItems[0] || undefined,
      bottom: categorizedItems.bottoms[0] || undefined,
      outerwear: categorizedItems.outerwear[0] || undefined,
      others: categorizedItems.others,
    }
  }

  const currentCategorizedItems = getCurrentCategorizedItems()
  const allCurrentItems = [
    currentCategorizedItems.outerwear,
    currentCategorizedItems.top,
    currentCategorizedItems.bottom,
    currentCategorizedItems.shoe,
    ...currentCategorizedItems.others,
  ].filter(Boolean) as ClothingItem[]

  // DRAG AND DROP SYSTEM
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!isDetailView || !isEditing || !enableDragDrop || !setEditedCategorizedItems) return

    e.preventDefault()
    setIsDragging(true)
    setDraggedItemId(itemId)

    const currentItem = allCurrentItems.find((item) => item.id === itemId)
    if (currentItem) {
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        itemX: currentItem.x ?? DEFAULTS.x,
        itemY: currentItem.y ?? DEFAULTS.y,
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedItemId || !editedCategorizedItems || !setEditedCategorizedItems) return

      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      // Container size: w-[280px] = 280px, h-[32rem] = 512px
      const containerWidth = 280
      const containerHeight = 512

      // Calculate percentage delta
      const xDelta = (deltaX / containerWidth) * 100
      const yDelta = (deltaY / containerHeight) * 100

      // Get the current item to check its dimensions for boundary calculations
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      if (!currentItem) return

      // Calculate item dimensions in pixels
      const itemWidthPx = (currentItem.width ?? DEFAULTS.width) * 16
      const aspectRatio = currentItem.aspectRatio || 1.25
      const itemHeightPx = itemWidthPx * aspectRatio

      // Convert to percentages of canvas
      const itemWidthPercent = (itemWidthPx / containerWidth) * 100
      const itemHeightPercent = (itemHeightPx / containerHeight) * 100

      // Calculate boundaries (center must stay within canvas)
      const halfItemWidth = itemWidthPercent / 2
      const halfItemHeight = itemHeightPercent / 2

      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      // Calculate new position
      let newX = dragStartPos.current.itemX + xDelta
      let newY = dragStartPos.current.itemY + yDelta

      // Clamp to boundaries
      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))

      // Update item position
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            x: newX,
            y: newY,
          }
        }
        return item
      }

      updatedItems.outerwear = updateItemPosition(updatedItems.outerwear)
      updatedItems.top = updateItemPosition(updatedItems.top)
      updatedItems.bottom = updateItemPosition(updatedItems.bottom)
      updatedItems.shoe = updateItemPosition(updatedItems.shoe)
      updatedItems.others = updatedItems.others.map(updateItemPosition).filter(Boolean) as ClothingItem[]

      setEditedCategorizedItems(updatedItems)
    },
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    if (!isDetailView || !isEditing || !enableDragDrop || !setEditedCategorizedItems) return

    const touch = e.touches[0]
    setIsDragging(true)
    setDraggedItemId(itemId)

    const currentItem = allCurrentItems.find((item) => item.id === itemId)
    if (currentItem) {
      dragStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        itemX: currentItem.x ?? DEFAULTS.x,
        itemY: currentItem.y ?? DEFAULTS.y,
      }
    }
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !draggedItemId || !editedCategorizedItems || !setEditedCategorizedItems) return

      e.preventDefault()
      const touch = e.touches[0]

      const deltaX = touch.clientX - dragStartPos.current.x
      const deltaY = touch.clientY - dragStartPos.current.y

      // Container size: w-[280px] = 280px, h-[32rem] = 512px
      const containerWidth = 280
      const containerHeight = 512

      // Calculate percentage delta
      const xDelta = (deltaX / containerWidth) * 100
      const yDelta = (deltaY / containerHeight) * 100

      // Get the current item to check its dimensions for boundary calculations
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      if (!currentItem) return

      // Calculate item dimensions in pixels
      const itemWidthPx = (currentItem.width ?? DEFAULTS.width) * 16
      const aspectRatio = currentItem.aspectRatio || 1.25
      const itemHeightPx = itemWidthPx * aspectRatio

      // Convert to percentages of canvas
      const itemWidthPercent = (itemWidthPx / containerWidth) * 100
      const itemHeightPercent = (itemHeightPx / containerHeight) * 100

      // Calculate boundaries (center must stay within canvas)
      const halfItemWidth = itemWidthPercent / 2
      const halfItemHeight = itemHeightPercent / 2

      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      // Calculate new position
      let newX = dragStartPos.current.itemX + xDelta
      let newY = dragStartPos.current.itemY + yDelta

      // Clamp to boundaries
      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))

      // Update item position
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            x: newX,
            y: newY,
          }
        }
        return item
      }

      updatedItems.outerwear = updateItemPosition(updatedItems.outerwear)
      updatedItems.top = updateItemPosition(updatedItems.top)
      updatedItems.bottom = updateItemPosition(updatedItems.bottom)
      updatedItems.shoe = updateItemPosition(updatedItems.shoe)
      updatedItems.others = updatedItems.others.map(updateItemPosition).filter(Boolean) as ClothingItem[]

      setEditedCategorizedItems(updatedItems)
    },
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  // Global mouse and touch events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // RESIZE SYSTEM
  const handleWidthChange = useCallback(
    (itemId: string, newWidth: number) => {
      if (!setEditedCategorizedItems || !editedCategorizedItems) return

      const updatedItems = { ...editedCategorizedItems }
      const updateItemWidth = (item: ClothingItem | undefined) => {
        if (item && item.id === itemId) {
          return {
            ...item,
            width: newWidth,
          }
        }
        return item
      }

      updatedItems.outerwear = updateItemWidth(updatedItems.outerwear)
      updatedItems.top = updateItemWidth(updatedItems.top)
      updatedItems.bottom = updateItemWidth(updatedItems.bottom)
      updatedItems.shoe = updateItemWidth(updatedItems.shoe)
      updatedItems.others = updatedItems.others.map(updateItemWidth).filter(Boolean) as ClothingItem[]

      setEditedCategorizedItems(updatedItems)
    },
    [editedCategorizedItems, setEditedCategorizedItems],
  )

  // Regular card click handler
  const handleCardClick = (e: React.MouseEvent) => {
    if (isDetailView) return // Don't handle clicks in detail view

    if (isMultiSelecting || selectMode) {
      e.preventDefault()
      e.stopPropagation()
      if (onToggleSelect) {
        onToggleSelect(outfit.id)
      } else if (onSelectToggle) {
        onSelectToggle(!isSelected)
      }
    }
    // Navigation to detail page removed - no separate outfit detail page needed
  }

  // const handleCheckboxClick = (e: React.MouseEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   if (onToggleSelect) {
  //     onToggleSelect(outfit.id)
  //   } else if (onSelectToggle) {
  //     onSelectToggle(!isSelected)
  //   }
  // }

  // RENDER OUTFIT DISPLAY - Always use OutfitCanvas for consistency
  const renderOutfitDisplay = () => {
    return (
      <div className={`relative w-[280px] h-[32rem] mx-auto ${(isMultiSelecting || selectMode) ? 'pointer-events-none' : ''}`}>
        {allCurrentItems.length > 0 ? (
          // Always use OutfitCanvas component - same as CreateOutfitModal
          <OutfitCanvas
            items={allCurrentItems}
            outerwearOnTop={outfit.outerwearOnTop ?? false}
            draggedItemId={draggedItemId}
            selectedItemForResize={selectedItemForResize}
            enableDragDrop={isDetailView && isEditing && enableDragDrop}
            enableResize={isDetailView && isEditing && enableResize}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={(e, itemId) => {
              if (enableResize) {
                setSelectedItemForResize(itemId)
              }
            }}
          />
        ) : (
          // Fallback if no images
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // DETAIL VIEW LAYOUT
  if (isDetailView) {
    return (
      <div className="space-y-6">
        {/* Resize Controls */}
        {!hideResizeControls && isEditing && selectedItemForResize && enableResize && (
          <Card className="border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                <Settings className="w-4 h-4" />
                <span>Resize Item</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const selectedItem = allCurrentItems.find((item) => item.id === selectedItemForResize)
                if (!selectedItem) return null

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {selectedItem.name || "Item"}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {(selectedItem.width ?? 10).toFixed(1)}rem
                      </Badge>
                    </div>
                    <Slider
                      value={[selectedItem.width ?? 10]}
                      onValueChange={([value]) => handleWidthChange(selectedItem.id, value)}
                      min={6}
                      max={20}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Outfit Card for Detail View */}
        <Card className="w-full max-w-md mx-auto h-[500px] overflow-hidden bg-card shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl">
          {!hideHeader && (
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Shirt className="w-5 h-5" />
                  <span>Outfit Preview</span>
                  {isEditing && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Drag to reposition • Click to resize
                    </Badge>
                  )}
                </div>
                {isEditing && selectedItemForResize && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedItemForResize(null)}>
                    <X className="w-4 h-4 mr-2" />
                    Close Resize
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0 flex-1">
            <div className="relative bg-card rounded-lg w-full h-full max-w-sm mx-auto">
              {renderOutfitDisplay()}
            </div>
          </CardContent>
        </Card>

        {/* Item Category Selection (only when editing) */}
        {isEditing && onItemSelect && !hideItemSelection && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {/* Outerwear */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => onItemSelect("outerwear")}
                >
                  <Card className="h-24 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 hover:shadow-md">
                    <CardContent className="h-full flex items-center justify-center p-2">
                      {currentCategorizedItems.outerwear ? (
                        <Image
                          src={currentCategorizedItems.outerwear.url || "/placeholder.svg"}
                          alt="Outerwear"
                          width={100}
                          height={100}
                          className="w-full h-full object-contain rounded"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-1 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Outerwear</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Top */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => onItemSelect("top")}
                >
                  <Card className="h-24 border-2 border-dashed border-green-300 hover:border-green-500 transition-all duration-200 hover:shadow-md">
                    <CardContent className="h-full flex items-center justify-center p-2">
                      {currentCategorizedItems.top ? (
                        <Image
                          src={currentCategorizedItems.top.url || "/placeholder.svg"}
                          alt="Top"
                          width={100}
                          height={100}
                          className="w-full h-full object-contain rounded"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-1 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Top</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => onItemSelect("bottom")}
                >
                  <Card className="h-24 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 hover:shadow-md">
                    <CardContent className="h-full flex items-center justify-center p-2">
                      {currentCategorizedItems.bottom ? (
                        <Image
                          src={currentCategorizedItems.bottom.url || "/placeholder.svg"}
                          alt="Bottom"
                          width={100}
                          height={100}
                          className="w-full h-full object-contain rounded"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-1 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Bottom</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Shoes */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => onItemSelect("shoe")}
                >
                  <Card className="h-24 border-2 border-dashed border-orange-300 hover:border-orange-500 transition-all duration-200 hover:shadow-md">
                    <CardContent className="h-full flex items-center justify-center p-2">
                      {currentCategorizedItems.shoe ? (
                        <Image
                          src={currentCategorizedItems.shoe.url || "/placeholder.svg"}
                          alt="Shoes"
                          width={100}
                          height={100}
                          className="w-full h-full object-contain rounded"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg mx-auto mb-1 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Shoes</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // REGULAR CARD VIEW
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Multi-select checkmark overlay - consistent with background selection */}
      {(isMultiSelecting || selectMode) && isSelected && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl z-50 pointer-events-none">
          <Check className="w-12 h-12 text-white" />
        </div>
      )}

      <Card
        className={`cursor-pointer overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 rounded-xl ${
          isSelected
            ? "ring-2 ring-black dark:ring-white"
            : "hover:border-gray-300 dark:hover:border-gray-600"
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex flex-col">
          {/* Outfit Visual Area - Fixed height to match CreateOutfitModal canvas */}
          <div className="h-[32rem] relative bg-card">
            {renderOutfitDisplay()}
          </div>

          {/* Outfit Info */}
          {!hideFooter && (
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-card-foreground truncate text-base">
                  {outfit.name || `Outfit ${outfit.id.substring(0, 6)}`}
                </h3>
                <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
                  <Shirt className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{(outfit.clothingItems || []).length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 flex-wrap">
                  {outfit.occasion && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {outfit.occasion}
                    </Badge>
                  )}
                  {outfit.season && (
                    <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground">
                      {outfit.season}
                    </Badge>
                  )}
                </div>
                {outfit.totalPrice && (
                  <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    ${outfit.totalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default OutfitCard
