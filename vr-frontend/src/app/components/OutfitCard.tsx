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
import { Shirt, Check, Settings, X } from "lucide-react"

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
  const dragStartPos = useRef<{ x: number; y: number; itemLeft: number; itemBottom: number }>({
    x: 0,
    y: 0,
    itemLeft: 0,
    itemBottom: 0,
  })

  useEffect(() => {
    if (!isEditing) {
      setSelectedItemForResize(null)
      setDraggedItemId(null)
    }
  }, [isEditing, setSelectedItemForResize])

  const DEFAULTS = {
    x: 0,
    y: 0,
    scale: 1,
    left: 50,
    bottom: 0,
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

  // Check if outfit has custom positioning (any non-default values)
  const hasCustomLayout = (outfit.clothingItems || []).some((item) => {
    const hasCustomLeft = item.left !== undefined && item.left !== 50
    const hasCustomBottom = item.bottom !== undefined && item.bottom !== 0
    const hasCustomWidth = item.width !== undefined && item.width !== 10
    const hasCustomScale = item.scale !== undefined && item.scale !== 1
    const hasCustomX = item.x !== undefined && item.x !== 0
    const hasCustomY = item.y !== undefined && item.y !== 0

    return hasCustomLeft || hasCustomBottom || hasCustomWidth || hasCustomScale || hasCustomX || hasCustomY
  })

  console.log(`[DEBUG] OutfitCard ${outfit.id} - hasCustomLayout:`, hasCustomLayout)

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
        itemLeft: currentItem.left ?? DEFAULTS.left,
        itemBottom: currentItem.bottom ?? DEFAULTS.bottom,
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedItemId || !editedCategorizedItems || !setEditedCategorizedItems) return

      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      // Container size: w-44 = 176px, h-80 = 320px
      const containerWidth = 176
      const containerHeight = 320

      const leftDelta = (deltaX / containerWidth) * 100
      const bottomDelta = -(deltaY / containerHeight) * 20

      // Get the current item to check its width for boundary calculations
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      const itemWidth = currentItem?.width ?? DEFAULTS.width

      // Calculate boundaries accounting for transform: translateX(-50%)
      // Since items are centered on their left position, we need to account for half the item width
      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100 // Convert rem to percentage
      const halfItemWidthPercent = itemWidthPercent / 2

      // Boundary calculations:
      // - Left edge: item center can't go below half item width (so left edge touches container left)
      // - Right edge: item center can't go above 100% minus half item width (so right edge touches container right)
      // - Bottom edge: item can touch the bottom (0rem)
      // - Top edge: item can reach the top, accounting for container height in rem (20rem)
      const minLeft = halfItemWidthPercent
      const maxLeft = 100 - halfItemWidthPercent
      const minBottom = 0
      const maxBottom = 20

      const newLeft = Math.max(minLeft, Math.min(maxLeft, dragStartPos.current.itemLeft + leftDelta))
      const newBottom = Math.max(minBottom, Math.min(maxBottom, dragStartPos.current.itemBottom + bottomDelta))

      // Update item position
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            left: newLeft,
            bottom: newBottom,
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
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems, DEFAULTS.width],
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
        itemLeft: currentItem.left ?? DEFAULTS.left,
        itemBottom: currentItem.bottom ?? DEFAULTS.bottom,
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

      const containerWidth = 176
      const containerHeight = 320

      const leftDelta = (deltaX / containerWidth) * 100
      const bottomDelta = -(deltaY / containerHeight) * 20

      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      const itemWidth = currentItem?.width ?? DEFAULTS.width

      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidthPercent = itemWidthPercent / 2

      const minLeft = halfItemWidthPercent
      const maxLeft = 100 - halfItemWidthPercent
      const minBottom = 0
      const maxBottom = 20

      const newLeft = Math.max(minLeft, Math.min(maxLeft, dragStartPos.current.itemLeft + leftDelta))
      const newBottom = Math.max(minBottom, Math.min(maxBottom, dragStartPos.current.itemBottom + bottomDelta))

      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            left: newLeft,
            bottom: newBottom,
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
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems, DEFAULTS.width],
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
    } else {
      window.location.href = `/outfits/${outfit.id}`
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleSelect) {
      onToggleSelect(outfit.id)
    } else if (onSelectToggle) {
      onSelectToggle(!isSelected)
    }
  }

  // RENDER OUTFIT DISPLAY - FIXED COORDINATE SYSTEM
  const renderOutfitDisplay = () => {
    const useCustomLayout = hasCustomLayout || (isDetailView && isEditing)

    console.log(`[DEBUG] OutfitCard ${outfit.id} - useCustomLayout:`, useCustomLayout)

    return (
      <div className="relative w-44 h-80 mx-auto">
        {useCustomLayout ? (
          // FIXED: Custom layout with corrected coordinate system that maintains item relationships
          allCurrentItems.map((item, index) => {
            // COORDINATE SYSTEM FIX: Apply different adjustments based on item type and position
            // This maintains the relative positioning between items while centering the overall outfit
            let adjustedLeft = item.left ?? DEFAULTS.left

            // Check if this is a pants/bottom item
            const isPants = ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || "")

            if (isPants) {
              // Special adjustment just for pants
              adjustedLeft = adjustedLeft - 3 // <-- Change this number to move pants left/right
            } else {
              // Regular adjustment for all other items (shirts, jackets, etc.)
              const distanceFromCenter = Math.abs(adjustedLeft - 50)
              const adjustmentFactor = Math.max(0.7, 1 - distanceFromCenter / 100)
              const baseAdjustment = 5
              const finalAdjustment = baseAdjustment * adjustmentFactor
              adjustedLeft = adjustedLeft - finalAdjustment
            }

            return (
              <motion.div
                key={`${item.id}-${item.width ?? 10}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`absolute ${
                  isDetailView && isEditing ? "cursor-move hover:shadow-lg transition-shadow" : ""
                } ${draggedItemId === item.id ? "z-50 shadow-2xl" : ""} ${
                  selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""
                }`}
                style={{
                  left: `${adjustedLeft}%`, // FIXED: Use adjusted left position
                  bottom: `${item.bottom ?? DEFAULTS.bottom}rem`,
                  width: `${item.width ?? DEFAULTS.width}rem`,
                  transform: `translateX(-50%) scale(${item.scale ?? DEFAULTS.scale})`,
                  zIndex: (() => {
                    if (draggedItemId === item.id) return 50
                    if (selectedItemForResize === item.id) return 40

                    // Apply custom layer ordering based on outfit preference
                    const itemType = item.type?.toLowerCase() || ""
                    const isOuterwear = ["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(itemType)
                    const isTop = ["t-shirt", "dress", "shirt", "blouse"].includes(itemType)
                    const outerwearOnTop = outfit.outerwearOnTop ?? false

                    if (outerwearOnTop && isOuterwear) {
                      return 30 // Outerwear on top
                    } else if (!outerwearOnTop && isTop) {
                      return 30 // Top on top (default)
                    } else {
                      return index
                    }
                  })(),
                }}
                onMouseDown={(e) => enableDragDrop && handleMouseDown(e, item.id)}
                onTouchStart={(e) => enableDragDrop && handleTouchStart(e, item.id)}
                onClick={() => enableResize && setSelectedItemForResize(item.id)}
              >
              <Image
                src={item.url || "/placeholder.svg"}
                alt={item.name || ""}
                width={100}
                height={120}
                className="w-full h-auto object-contain rounded-lg"
                draggable={false}
                unoptimized
              />
                {isDetailView && isEditing && enableResize && (
                  <div className="absolute -top-2 -right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItemForResize(selectedItemForResize === item.id ? null : item.id)
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )
          })
        ) : (
          // Default layout for outfits without custom positioning
          <>
            {console.log(`[DEBUG] OutfitCard ${outfit.id} - Using default layout`)}

            {/* Bottom (pants) - Default centered position */}
            {categorizedItems.bottoms[0] && (
              <Image
                src={categorizedItems.bottoms[0].url || "/placeholder.svg"}
                alt="Bottom"
                width={144}
                height={144}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-36 z-10"
                style={{ objectFit: "contain" }}
                unoptimized
              />
            )}
            {/* Top (shirt) - Default centered position */}
            {topItems[0] && (
              <Image
                src={topItems[0].url || "/placeholder.svg"}
                alt="Top"
                width={128}
                height={128}
                className="absolute bottom-[8.4rem] left-1/2 transform -translate-x-1/2 w-32 z-20"
                style={{ objectFit: "contain" }}
                unoptimized
              />
            )}
            {/* Outerwear - Default centered position */}
            {categorizedItems.outerwear[0] && (
              <Image
                src={categorizedItems.outerwear[0].url || "/placeholder.svg"}
                alt="Outerwear"
                width={128}
                height={128}
                className="absolute bottom-[8.8rem] left-1/2 transform -translate-x-1/2 w-32 z-30"
                style={{ objectFit: "contain" }}
                unoptimized
              />
            )}
          </>
        )}

        {/* Fallback if no images */}
        {allCurrentItems.length === 0 && (
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
        <Card className="w-full max-w-md mx-auto h-[500px] overflow-hidden bg-card shadow-lg border-0 ring-1 ring-border rounded-xl">
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
          <CardContent className="p-0 flex-1 flex items-center justify-center">
            <div className="relative bg-gradient-to-br from-muted via-background to-card rounded-lg p-4 w-full h-full max-w-sm mx-auto flex items-center justify-center">
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
      {/* Multi-select checkbox */}
      {(isMultiSelecting || selectMode) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <button
            onClick={handleCheckboxClick}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                : "bg-white border-border hover:border-accent shadow-md"
            }`}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        </motion.div>
      )}

      <Card
        className={`h-[32rem] cursor-pointer overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 rounded-xl ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900 scale-[1.02]"
            : "ring-border hover:ring-accent"
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Outfit Visual Area */}
          <div className="flex-1 relative bg-gradient-to-br from-muted via-background to-card p-6 flex items-center justify-center">
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
