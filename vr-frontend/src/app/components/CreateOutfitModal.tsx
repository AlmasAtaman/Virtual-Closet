"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
import Image from "next/image"
import axios from "axios"

interface CreateOutfitModalProps {
  show: boolean
  onCloseAction: () => void
  onOutfitCreated: () => void
}

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
  left?: number
  bottom?: number
  width?: number
  scale?: number
  x?: number
  y?: number
}

interface CategorizedClothing {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  outerwear: ClothingItem[]
  allItems: ClothingItem[]
}

interface CategorizedOutfitItems {
  outerwear?: ClothingItem
  top?: ClothingItem
  bottom?: ClothingItem
  shoe?: ClothingItem
  others: ClothingItem[]
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const createAuthenticatedAxios = useCallback(() => {
    return axios.create({
      withCredentials: true,
      baseURL: API_URL
    })
  }, [API_URL])
  
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null)
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null)
  const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null)
  const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [], allItems: [] })
  const [loadingClothing, setLoadingClothing] = useState(true)
  const [showTopSelectModal, setShowTopSelectModal] = useState(false)
  const [showBottomSelectModal, setShowBottomSelectModal] = useState(false)
  const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectingCategory, setSelectingCategory] = useState<"outerwear" | "top" | "bottom" | "shoe" | "accessory" | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [outfitName, setOutfitName] = useState("")
  
  // Drag and drop and resize state
  const [selectedItemForResize, setSelectedItemForResize] = useState<string | null>(null)
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [outerwearOnTop, setOuterwearOnTop] = useState(false) // Layer order toggle

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number; itemX: number; itemY: number }>({
    x: 0,
    y: 0,
    itemX: 50,
    itemY: 50,
  })

  const DEFAULTS = {
    x: 50,
    y: 50,
    scale: 1,
    left: 50,
    bottom: 0,
    width: 10,
  }

  const fetchClothingItems = useCallback(async () => {
    try {
      setLoadingClothing(true)
      const axios = createAuthenticatedAxios()

      const [closetResponse, wishlistResponse] = await Promise.all([
        axios.get("/api/images?mode=closet"),
        axios.get("/api/images?mode=wishlist")
      ])

      const closetItems = closetResponse.data.clothingItems || []
      const wishlistItems = wishlistResponse.data.clothingItems || []
      const allItems = [...closetItems, ...wishlistItems]

      const categorizedItems = {
        tops: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          return ["t-shirt", "dress", "shirt", "blouse"].includes(type)
        }),
        bottoms: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          return ["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)
        }),
        outerwear: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          return ["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(type)
        }),
        allItems: allItems,
      }

      setClothingItems(categorizedItems)
    } catch (error) {
      console.error("Error fetching clothing items:", error)
      setClothingItems({ tops: [], bottoms: [], outerwear: [], allItems: [] })
    } finally {
      setLoadingClothing(false)
    }
  }, [createAuthenticatedAxios])

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    }
  }, [show, fetchClothingItems])

  // Removed the useEffect that was overwriting positioned items
  // The updateCategorizedItems function already handles positioning correctly

  // DRAG AND DROP SYSTEM - Center-based positioning
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!editedCategorizedItems || !setEditedCategorizedItems) return

    e.preventDefault()
    setIsDragging(true)
    setDraggedItemId(itemId)

    const allCurrentItems = [
      editedCategorizedItems.outerwear,
      editedCategorizedItems.top,
      editedCategorizedItems.bottom,
      editedCategorizedItems.shoe,
      ...editedCategorizedItems.others,
    ].filter(Boolean) as ClothingItem[]

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

      // Container size: w-44 = 176px, h-80 = 320px
      const containerWidth = 176
      const containerHeight = 320

      // Convert pixel deltas to percentage deltas
      const xDelta = (deltaX / containerWidth) * 100
      const yDelta = (deltaY / containerHeight) * 100

      // Get the current item to check its width for boundary calculations
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      const itemWidth = currentItem?.width ?? DEFAULTS.width

      // Calculate item dimensions as percentage
      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidth = itemWidthPercent / 2

      // Assume height is proportional to width (approximately 1.5x for clothing items)
      const itemHeightPercent = itemWidthPercent * 1.5
      const halfItemHeight = itemHeightPercent / 2

      // Get current center position
      const currentX = dragStartPos.current.itemX
      const currentY = dragStartPos.current.itemY

      // Calculate new center position
      let newX = currentX + xDelta
      let newY = currentY + yDelta

      // Simple boundary constraints - center must stay within canvas minus half item size
      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))

      // Update item position with new center coordinates
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            x: newX,
            y: newY,
            // Keep left/bottom for backward compatibility
            left: newX,
            bottom: item.bottom ?? 0,
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
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems, DEFAULTS.width, DEFAULTS.x, DEFAULTS.y],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    if (!editedCategorizedItems) return
    const touch = e.touches[0]

    setIsDragging(true)
    setDraggedItemId(itemId)

    const allCurrentItems = [
      editedCategorizedItems.outerwear,
      editedCategorizedItems.top,
      editedCategorizedItems.bottom,
      editedCategorizedItems.shoe,
      ...editedCategorizedItems.others,
    ].filter(Boolean) as ClothingItem[]

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

      e.preventDefault() // Prevent scrolling while dragging
      const touch = e.touches[0]

      const deltaX = touch.clientX - dragStartPos.current.x
      const deltaY = touch.clientY - dragStartPos.current.y

      // Container size: w-44 = 176px, h-80 = 320px
      const containerWidth = 176
      const containerHeight = 320

      // Convert pixel deltas to percentage deltas
      const xDelta = (deltaX / containerWidth) * 100
      const yDelta = (deltaY / containerHeight) * 100

      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      const itemWidth = currentItem?.width ?? DEFAULTS.width

      // Calculate item dimensions as percentage
      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidth = itemWidthPercent / 2

      // Assume height is proportional to width (approximately 1.5x for clothing items)
      const itemHeightPercent = itemWidthPercent * 1.5
      const halfItemHeight = itemHeightPercent / 2

      // Get current center position
      const currentX = dragStartPos.current.itemX
      const currentY = dragStartPos.current.itemY

      // Calculate new center position
      let newX = currentX + xDelta
      let newY = currentY + yDelta

      // Simple boundary constraints - center must stay within canvas minus half item size
      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))

      // Update item position with new center coordinates
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            x: newX,
            y: newY,
            // Keep left/bottom for backward compatibility
            left: newX,
            bottom: item.bottom ?? 0,
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
    [isDragging, draggedItemId, editedCategorizedItems, setEditedCategorizedItems, DEFAULTS.width, DEFAULTS.x, DEFAULTS.y],
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

  const handleItemSelect = (category: "top" | "bottom" | "outerwear", item: ClothingItem) => {
    if (category === "top") {
      setSelectedTop(item)
    } else if (category === "bottom") {
      setSelectedBottom(item)
    } else if (category === "outerwear") {
      setSelectedOuterwear(item)
    }
    
    updateCategorizedItems(category, item)
  }

  const handleCanvasItemSelect = (item: ClothingItem) => {
    if (selectingCategory) {
      updateCategorizedItems(selectingCategory, item)
      setShowSelectModal(false)
      setSelectingCategory(null)
    }
  }

  const updateCategorizedItems = (category: "top" | "bottom" | "outerwear" | "shoe" | "accessory", item: ClothingItem) => {
    // Default positions for each category (Canvas mode) - using center coordinates (x, y as percentages)
    const DEFAULT_POSITIONS = {
      top: { x: 50, y: 55, width: 8 },
      bottom: { x: 50, y: 30, width: 8 },
      outerwear: { x: 50, y: 60, width: 8 },
      shoe: { x: 50, y: 15, width: 6 },
      accessory: { x: 50, y: 70, width: 5 },
    }

    setEditedCategorizedItems(prev => {
      const newItems = prev || { others: [] }

      if (category === "top") {
        newItems.top = {
          ...item,
          x: DEFAULT_POSITIONS.top.x,
          y: DEFAULT_POSITIONS.top.y,
          width: DEFAULT_POSITIONS.top.width,
          left: DEFAULT_POSITIONS.top.x,
          bottom: 4,
        }
      } else if (category === "bottom") {
        newItems.bottom = {
          ...item,
          x: DEFAULT_POSITIONS.bottom.x,
          y: DEFAULT_POSITIONS.bottom.y,
          width: DEFAULT_POSITIONS.bottom.width,
          left: DEFAULT_POSITIONS.bottom.x,
          bottom: 0,
        }
      } else if (category === "outerwear") {
        newItems.outerwear = {
          ...item,
          x: DEFAULT_POSITIONS.outerwear.x,
          y: DEFAULT_POSITIONS.outerwear.y,
          width: DEFAULT_POSITIONS.outerwear.width,
          left: DEFAULT_POSITIONS.outerwear.x,
          bottom: 5,
        }
      } else if (category === "shoe") {
        newItems.shoe = {
          ...item,
          x: DEFAULT_POSITIONS.shoe.x,
          y: DEFAULT_POSITIONS.shoe.y,
          width: DEFAULT_POSITIONS.shoe.width,
          left: DEFAULT_POSITIONS.shoe.x,
          bottom: -2,
        }
      } else if (category === "accessory") {
        // Accessories can have multiple items
        newItems.others = [
          ...newItems.others,
          {
            ...item,
            x: DEFAULT_POSITIONS.accessory.x,
            y: DEFAULT_POSITIONS.accessory.y,
            width: DEFAULT_POSITIONS.accessory.width,
            left: DEFAULT_POSITIONS.accessory.x,
            bottom: 8,
          }
        ]
      }

      return { ...newItems }
    })
  }

  const handleRemoveItem = (category: "top" | "bottom" | "outerwear" | "shoe", itemId?: string) => {
    if (category === "top") {
      setSelectedTop(null)
    } else if (category === "bottom") {
      setSelectedBottom(null)
    } else if (category === "outerwear") {
      setSelectedOuterwear(null)
    }

    setEditedCategorizedItems(prev => {
      const newItems = prev || { others: [] }

      if (category === "top") {
        newItems.top = undefined
      } else if (category === "bottom") {
        newItems.bottom = undefined
      } else if (category === "outerwear") {
        newItems.outerwear = undefined
      } else if (category === "shoe") {
        newItems.shoe = undefined
      }

      // Remove from others (accessories) if itemId provided
      if (itemId) {
        newItems.others = newItems.others.filter(item => item.id !== itemId)
      }

      return { ...newItems }
    })
  }

  const shuffleOutfit = () => {
    if (clothingItems.tops.length > 0) {
      const randomTop = clothingItems.tops[Math.floor(Math.random() * clothingItems.tops.length)]
      setSelectedTop(randomTop)
      updateCategorizedItems("top", randomTop)
    }
    if (clothingItems.bottoms.length > 0) {
      const randomBottom = clothingItems.bottoms[Math.floor(Math.random() * clothingItems.bottoms.length)]
      setSelectedBottom(randomBottom)
      updateCategorizedItems("bottom", randomBottom)
    }
    if (clothingItems.outerwear.length > 0 && Math.random() > 0.5) {
      const randomOuterwear = clothingItems.outerwear[Math.floor(Math.random() * clothingItems.outerwear.length)]
      setSelectedOuterwear(randomOuterwear)
      updateCategorizedItems("outerwear", randomOuterwear)
    }
  }


  const createOutfit = async () => {
    const selectedItems = [selectedTop, selectedBottom, selectedOuterwear].filter(Boolean) as ClothingItem[]

    if (selectedItems.length === 0) {
      alert("Please select at least one clothing item.")
      return
    }

    setIsCreating(true)
    try {
      const itemsToUse = editedCategorizedItems ? [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].filter(Boolean) as ClothingItem[] : selectedItems

      const clothingData = itemsToUse.map((item) => ({
        clothingId: item.id,
        left: item.left ?? 50,
        bottom: item.bottom ?? 0,
        width: item.width ?? 16,
        scale: item.scale ?? 1.2,
        x: item.x ?? 0,
        y: item.y ?? 0,
      }))

      const axios = createAuthenticatedAxios()
      await axios.post("/api/outfits", {
        clothingItems: clothingData,
        name: outfitName || null,
        outerwearOnTop: outerwearOnTop, // Include layer order preference
      })

      onOutfitCreated()
      handleCloseModal()
    } catch (error) {
      console.error("Error creating outfit:", error)
      alert("Failed to create outfit")
    } finally {
      setIsCreating(false)
    }
  }


  const handleCloseModal = () => {
    setSelectedTop(null)
    setSelectedBottom(null)
    setSelectedOuterwear(null)
    setOutfitName("")
    setEditedCategorizedItems(null)
    setSelectedItemForResize(null)
    setOuterwearOnTop(false)
    onCloseAction()
  }


  // Custom outfit display - matches OutfitCard exactly
  const renderOutfitDisplay = () => {
    if (!editedCategorizedItems) return null

    const allCurrentItems = [
      editedCategorizedItems.outerwear,
      editedCategorizedItems.top,
      editedCategorizedItems.bottom,
      editedCategorizedItems.shoe,
      ...editedCategorizedItems.others,
    ].filter(Boolean) as ClothingItem[]

    return (
      <div className="relative w-44 h-80 mx-auto">
        {allCurrentItems.map((item, index) => {
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

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                width: `${item.width ?? DEFAULTS.width}rem`
              }}
              transition={{
                opacity: { delay: index * 0.1 },
                y: { delay: index * 0.1 },
                width: { duration: 0.2, ease: "easeOut" }
              }}
              className={`absolute cursor-move hover:shadow-lg transition-shadow ${
                draggedItemId === item.id ? "z-50 shadow-2xl" : ""
              } ${selectedItemForResize === item.id ? "ring-2 ring-foreground" : ""}`}
              style={{
                left: `${item.x ?? DEFAULTS.x}%`,
                top: `${item.y ?? DEFAULTS.y}%`,
                transform: `translate(-50%, -50%) scale(${item.scale ?? DEFAULTS.scale})`,
                zIndex: zIndex,
              }}
              ref={(el) => {
                if (el) {
                  console.log("🎯 ITEM RENDER:", {
                    id: item.id,
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    actualPosition: el.getBoundingClientRect()
                  })
                }
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedItemForResize(item.id)
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
              />
            </motion.div>
          )
        })}
      </div>
    )
  }

  const hasMinimumItems = selectedTop || selectedBottom || selectedOuterwear

  // Get the selected item for resize controls
  const getSelectedResizeItem = () => {
    if (!editedCategorizedItems || !selectedItemForResize) return null
    
    const allCurrentItems = [
      editedCategorizedItems?.outerwear,
      editedCategorizedItems?.top,
      editedCategorizedItems?.bottom,
      editedCategorizedItems?.shoe,
      ...(editedCategorizedItems?.others || [])
    ].filter(Boolean) as ClothingItem[]
    
    return allCurrentItems.find((item) => item.id === selectedItemForResize)
  }

  if (!show) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Content - Canvas Mode Only */}
            <div className="flex-1 flex flex-row overflow-hidden justify-center items-start gap-6 p-6 relative" style={{ paddingTop: '66px' }}>
                  {/* Left Sidebar - Category Buttons */}
                  <div className="flex flex-col gap-3 relative" style={{ marginTop: 'calc(28px + 8px)', zIndex: 2 }}>
                    {/* White background behind buttons */}
                    <div className="absolute inset-0 -inset-x-3 -inset-y-3 bg-white rounded-2xl" style={{ zIndex: -1 }}></div>
                    <button
                      onClick={() => {
                        setSelectedItemForResize(null)
                        setSelectingCategory("outerwear")
                        setShowSelectModal(true)
                      }}
                      disabled={!!editedCategorizedItems?.outerwear}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Outer
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemForResize(null)
                        setSelectingCategory("top")
                        setShowSelectModal(true)
                      }}
                      disabled={!!editedCategorizedItems?.top}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Top
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemForResize(null)
                        setSelectingCategory("bottom")
                        setShowSelectModal(true)
                      }}
                      disabled={!!editedCategorizedItems?.bottom}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bottom
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemForResize(null)
                        setSelectingCategory("shoe")
                        setShowSelectModal(true)
                      }}
                      disabled={!!editedCategorizedItems?.shoe}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Shoes
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemForResize(null)
                        setSelectingCategory("accessory")
                        setShowSelectModal(true)
                      }}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center text-sm font-medium text-foreground"
                    >
                      Access
                    </button>
                  </div>

                  {/* Center - Canvas Area */}
                  <div className="flex flex-col relative" style={{ zIndex: 2 }}>
                    {/* Mode Toggle - Above Canvas, Aligned Right */}
                    <div className="flex justify-end mb-2">
                      <div className="flex gap-1 bg-muted rounded-lg p-1 relative">
                        {/* White background behind toggle only */}
                        <div className="absolute inset-0 -inset-x-3 -inset-y-2 bg-white rounded-2xl" style={{ zIndex: -1 }}></div>
                        <button className="px-4 py-1.5 rounded-md text-xs font-medium bg-foreground text-background">
                          Canvas
                        </button>
                        <button className="px-4 py-1.5 rounded-md text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                          Display
                        </button>
                      </div>
                    </div>

                    {/* Canvas Container with Save Button - White Background */}
                    <div className="relative">
                      {/* White background behind canvas and save button only */}
                      <div className="absolute inset-0 -inset-x-4 -inset-y-4 bg-white rounded-2xl" style={{ zIndex: -1 }}></div>

                      <div
                        className="relative w-80 h-[500px] bg-background rounded-xl border-2 border-border shadow-lg flex flex-col"
                        onClick={() => setSelectedItemForResize(null)}
                      >
                        {/* Inner Canvas - Fixed size for item rendering */}
                        <div className="flex-1 flex items-center justify-center p-4">
                          <div className="relative w-44 h-80 bg-muted/10 rounded-lg">
                            {renderOutfitDisplay()}
                          </div>
                        </div>

                        {/* Resize Slider (bottom left) */}
                        {selectedItemForResize && (
                          <div className="absolute bottom-4 left-4 flex flex-col items-center gap-2">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="range"
                              min="4"
                              max="11"
                              step="0.5"
                              value={getSelectedResizeItem()?.width ?? 8}
                              onChange={(e) => {
                                const newWidth = parseFloat(e.target.value)
                                setEditedCategorizedItems(prev => {
                                  if (!prev) return prev
                                  const updated = { ...prev }

                                  // Container size: w-44 = 176px (same as drag boundaries)
                                  const containerWidth = 176
                                  const containerHeight = 320

                                  const updateItemWidth = (item: ClothingItem | undefined) => {
                                    if (item && item.id === selectedItemForResize) {
                                      // Calculate item dimensions as percentage
                                      const itemWidthPercent = (newWidth * 16 / containerWidth) * 100
                                      const halfItemWidth = itemWidthPercent / 2

                                      // Assume height is proportional to width (approximately 1.5x for clothing items)
                                      const itemHeightPercent = itemWidthPercent * 1.5
                                      const halfItemHeight = itemHeightPercent / 2

                                      // Get current center position
                                      const currentX = item.x ?? DEFAULTS.x
                                      const currentY = item.y ?? DEFAULTS.y

                                      // Constrain center to stay within boundaries with new size
                                      const minX = halfItemWidth
                                      const maxX = 100 - halfItemWidth
                                      const minY = halfItemHeight
                                      const maxY = 100 - halfItemHeight

                                      const constrainedX = Math.max(minX, Math.min(maxX, currentX))
                                      const constrainedY = Math.max(minY, Math.min(maxY, currentY))

                                      return {
                                        ...item,
                                        width: newWidth,
                                        x: constrainedX,
                                        y: constrainedY,
                                        // Keep left/bottom for backward compatibility
                                        left: constrainedX,
                                        bottom: item.bottom ?? 0
                                      }
                                    }
                                    return item
                                  }

                                  updated.outerwear = updateItemWidth(updated.outerwear)
                                  updated.top = updateItemWidth(updated.top)
                                  updated.bottom = updateItemWidth(updated.bottom)
                                  updated.shoe = updateItemWidth(updated.shoe)
                                  updated.others = updated.others.map(updateItemWidth).filter(Boolean) as ClothingItem[]
                                  return updated
                                })
                              }}
                              className="h-24 w-2 rounded-full appearance-none cursor-pointer slider-vertical"
                              style={{
                                writingMode: 'bt-lr' as any,
                                WebkitAppearance: 'slider-vertical',
                                background: 'hsl(var(--foreground))',
                              } as React.CSSProperties}
                            />
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={createOutfit}
                        disabled={!editedCategorizedItems || (!editedCategorizedItems.top && !editedCategorizedItems.bottom && !editedCategorizedItems.outerwear && !editedCategorizedItems.shoe && editedCategorizedItems.others.length === 0) || isCreating}
                        className="w-80 bg-foreground text-background hover:bg-foreground/90 font-semibold mt-3"
                      >
                        {isCreating ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>

                  {/* Right Sidebar - Added Items */}
                  <div className="flex flex-col gap-3 relative" style={{ marginTop: 'calc(28px + 8px)', zIndex: 2 }}>
                    {/* White background behind thumbnails */}
                    <div className="absolute inset-0 -inset-x-3 -inset-y-3 bg-white rounded-2xl" style={{ zIndex: -1 }}></div>
                    <h3 className="text-xs font-semibold text-foreground text-center">Add</h3>
                    {/* Added items thumbnails */}
                    <div className="flex flex-col gap-2 min-w-[56px]">
                      <AnimatePresence mode="popLayout">
                        {editedCategorizedItems?.top && (
                          <motion.div
                            key="top"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex items-center group"
                          >
                            <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden">
                              <Image
                                src={editedCategorizedItems.top.url}
                                alt="Top"
                                width={56}
                                height={56}
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveItem("top")}
                              className="absolute -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:opacity-100 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                        {editedCategorizedItems?.bottom && (
                          <motion.div
                            key="bottom"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex items-center group"
                          >
                            <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden">
                              <Image
                                src={editedCategorizedItems.bottom.url}
                                alt="Bottom"
                                width={56}
                                height={56}
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveItem("bottom")}
                              className="absolute -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:opacity-100 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                        {editedCategorizedItems?.outerwear && (
                          <motion.div
                            key="outerwear"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex items-center group"
                          >
                            <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden">
                              <Image
                                src={editedCategorizedItems.outerwear.url}
                                alt="Outerwear"
                                width={56}
                                height={56}
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveItem("outerwear")}
                              className="absolute -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:opacity-100 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                        {editedCategorizedItems?.shoe && (
                          <motion.div
                            key="shoe"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex items-center group"
                          >
                            <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden">
                              <Image
                                src={editedCategorizedItems.shoe.url}
                                alt="Shoe"
                                width={56}
                                height={56}
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveItem("shoe")}
                              className="absolute -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:opacity-100 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                        {editedCategorizedItems?.others.slice(0, 5).map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative flex items-center group"
                          >
                            <div className="w-14 h-14 bg-background border border-border rounded-lg overflow-hidden">
                              <Image
                                src={item.url}
                                alt="Accessory"
                                width={56}
                                height={56}
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveItem("shoe", item.id)}
                              className="absolute -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:opacity-100 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Selection Modals */}
      <ClothingItemSelectModal
        isOpen={showTopSelectModal}
        onCloseAction={() => setShowTopSelectModal(false)}
        clothingItems={clothingItems.allItems}
        onSelectItem={(item) => handleItemSelect("top", item)}
        viewMode="closet"
        selectedCategory="top"
      />

      <ClothingItemSelectModal
        isOpen={showBottomSelectModal}
        onCloseAction={() => setShowBottomSelectModal(false)}
        clothingItems={clothingItems.allItems}
        onSelectItem={(item) => handleItemSelect("bottom", item)}
        viewMode="closet"
        selectedCategory="bottom"
      />

      <ClothingItemSelectModal
        isOpen={showOuterwearSelectModal}
        onCloseAction={() => setShowOuterwearSelectModal(false)}
        clothingItems={clothingItems.allItems}
        onSelectItem={(item) => handleItemSelect("outerwear", item)}
        viewMode="closet"
        selectedCategory="outerwear"
      />

      {/* Canvas Mode Selection Modal */}
      <ClothingItemSelectModal
        isOpen={showSelectModal}
        onCloseAction={() => {
          setShowSelectModal(false)
          setSelectingCategory(null)
        }}
        clothingItems={clothingItems.allItems}
        onSelectItem={handleCanvasItemSelect}
        viewMode="closet"
        selectedCategory={selectingCategory === "outerwear" ? "outerwear" : selectingCategory === "top" ? "top" : selectingCategory === "bottom" ? "bottom" : selectingCategory === "shoe" ? "shoe" : null}
      />
    </>
  )
}