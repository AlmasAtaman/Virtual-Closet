"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Shuffle, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
import ScrollableClothingRow from "./ScrollableClothingRow"
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
  const [isCreating, setIsCreating] = useState(false)
  const [outfitName, setOutfitName] = useState("")
  
  // Drag and drop and resize state
  const [selectedItemForResize, setSelectedItemForResize] = useState<string | null>(null)
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [outerwearOnTop, setOuterwearOnTop] = useState(false) // Layer order toggle

  // Mode state
  const [activeMode, setActiveMode] = useState<"canvas" | "dressme" | "moodboards">("dressme")
  const [showOuterwearRow, setShowOuterwearRow] = useState(false)

  // Dress Me mode state
  const [dressMeSelectedTop, setDressMeSelectedTop] = useState<ClothingItem | null>(null)
  const [dressMeSelectedBottom, setDressMeSelectedBottom] = useState<ClothingItem | null>(null)
  const [dressMeSelectedOuterwear, setDressMeSelectedOuterwear] = useState<ClothingItem | null>(null)

  // Randomize animation state
  const [isRandomizing, setIsRandomizing] = useState(false)
  const [randomizingCategory, setRandomizingCategory] = useState<string | null>(null)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number; itemLeft: number; itemBottom: number }>({
    x: 0,
    y: 0,
    itemLeft: 0,
    itemBottom: 0,
  })

  const DEFAULTS = {
    x: 0,
    y: 0,
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

  // DRAG AND DROP SYSTEM - Copied from OutfitCard
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

      // Simple boundary calculations based on item size
      // These values are easy to adjust manually:
      const leftBuffer = 85.2     // How far past left edge (adjust this number)
      const rightBuffer = -5.7    // How far past right edge (adjust this number)  
      const bottomBuffer = 5.5   // How far below bottom (adjust this number)
      const topBuffer = -7.1      // How far above top (adjust this number)
      
      // Calculate boundaries accounting for item width and transform: translateX(-50%)
      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidth = itemWidthPercent / 2
      
      const minLeft = halfItemWidth - leftBuffer    // Left boundary
      const maxLeft = 100 - halfItemWidth + rightBuffer  // Right boundary  
      const minBottom = -bottomBuffer  // Bottom boundary
      const maxBottom = 20 + topBuffer  // Top boundary

      const newLeft = Math.max(minLeft, Math.min(maxLeft, dragStartPos.current.itemLeft + leftDelta))
      const newBottom = Math.max(minBottom, Math.min(maxBottom, dragStartPos.current.itemBottom + bottomDelta))

      // DEBUG: Calculate what buffer values would be needed for current position
      const neededLeftBuffer = halfItemWidth - newLeft
      const neededRightBuffer = newLeft - (100 - halfItemWidth)
      const neededBottomBuffer = -newBottom
      const neededTopBuffer = newBottom - 20
      
      console.log("NEEDED BUFFER VALUES FOR THIS POSITION:")
      console.log({
        leftBuffer: Math.round(neededLeftBuffer * 10) / 10,
        rightBuffer: Math.round(neededRightBuffer * 10) / 10,
        bottomBuffer: Math.round(neededBottomBuffer * 10) / 10,
        topBuffer: Math.round(neededTopBuffer * 10) / 10,
        currentPosition: { newLeft: Math.round(newLeft * 10) / 10, newBottom: Math.round(newBottom * 10) / 10 }
      })

      // COORDINATE FINDER: Log exact coordinates for setting defaults
      console.log("🎯 POSITION COORDINATES FOR DEFAULT POSITIONS:")
      console.log(`Item ${draggedItemId} is at: left: ${Math.round(newLeft * 10) / 10}, bottom: ${Math.round(newBottom * 10) / 10}`)
      console.log("Copy these values to update DEFAULT_POSITIONS in updateCategorizedItems function")

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
        itemLeft: currentItem.left ?? DEFAULTS.left,
        itemBottom: currentItem.bottom ?? DEFAULTS.bottom,
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

      const leftBuffer = 85.2
      const rightBuffer = -5.7
      const bottomBuffer = 5.5
      const topBuffer = -7.1

      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidth = itemWidthPercent / 2

      const minLeft = halfItemWidth - leftBuffer
      const maxLeft = 100 - halfItemWidth + rightBuffer
      const minBottom = -bottomBuffer
      const maxBottom = 20 + topBuffer

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

  const updateCategorizedItems = (category: "top" | "bottom" | "outerwear", item: ClothingItem) => {
    // Default positions for each category (matching OutfitCard)
    const DEFAULT_POSITIONS = {
      top: { left: 8, bottom: 8.9, width: 10, scale: 1 },
      bottom: { left: 7.9, bottom: 0.2, width: 10, scale: 1 },
      outerwear: { left: 35.6, bottom: 10.2, width: 10, scale: 0.8 },
    }

    setEditedCategorizedItems(prev => {
      const newItems = prev || { others: [] }
      
      if (category === "top") {
        // When adding a top, place it in top position
        newItems.top = {
          ...item,
          left: DEFAULT_POSITIONS.top.left,
          bottom: DEFAULT_POSITIONS.top.bottom,
          width: DEFAULT_POSITIONS.top.width,
          scale: DEFAULT_POSITIONS.top.scale,
        }
        
        // If there's outerwear, move it back to its default position
        if (newItems.outerwear) {
          newItems.outerwear = {
            ...newItems.outerwear,
            left: DEFAULT_POSITIONS.outerwear.left,
            bottom: DEFAULT_POSITIONS.outerwear.bottom,
            width: DEFAULT_POSITIONS.outerwear.width,
            scale: DEFAULT_POSITIONS.outerwear.scale,
          }
        }
      } else if (category === "bottom") {
        newItems.bottom = {
          ...item,
          left: DEFAULT_POSITIONS.bottom.left,
          bottom: DEFAULT_POSITIONS.bottom.bottom,
          width: DEFAULT_POSITIONS.bottom.width,
          scale: DEFAULT_POSITIONS.bottom.scale,
        }
      } else if (category === "outerwear") {
        // If there's no top, put outerwear in top position
        const shouldUseTopPosition = !newItems.top
        const position = shouldUseTopPosition ? DEFAULT_POSITIONS.top : DEFAULT_POSITIONS.outerwear
        
        newItems.outerwear = {
          ...item,
          left: position.left,
          bottom: position.bottom,
          width: position.width,
          scale: position.scale,
        }
      }
      
      return { ...newItems }
    })
  }

  const handleRemoveItem = (category: "top" | "bottom" | "outerwear") => {
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
        
        // If there's outerwear and no top, move outerwear to top position
        if (newItems.outerwear) {
          const DEFAULT_POSITIONS = {
            top: { left: 8, bottom: 8.9, width: 10, scale: 1 },
            outerwear: { left: 35.6, bottom: 10.2, width: 10, scale: 0.8 },
          }
          
          newItems.outerwear = {
            ...newItems.outerwear,
            left: DEFAULT_POSITIONS.top.left,
            bottom: DEFAULT_POSITIONS.top.bottom,
            width: DEFAULT_POSITIONS.top.width,
            scale: DEFAULT_POSITIONS.top.scale,
          }
        }
      } else if (category === "bottom") {
        newItems.bottom = undefined
      } else if (category === "outerwear") {
        newItems.outerwear = undefined
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

  // Randomize function for Dress Me mode with slot machine animation
  const randomizeDressMeOutfit = async () => {
    setIsRandomizing(true)

    // Helper function to simulate slot machine effect
    const animateSlotMachine = (
      items: ClothingItem[],
      setItem: (item: ClothingItem | null) => void,
      duration: number
    ) => {
      return new Promise<void>((resolve) => {
        if (items.length === 0) {
          resolve()
          return
        }

        const finalItem = items[Math.floor(Math.random() * items.length)]
        const iterations = 15 // Number of rapid changes
        const interval = duration / iterations

        let currentIteration = 0
        const timer = setInterval(() => {
          const randomItem = items[Math.floor(Math.random() * items.length)]
          setItem(randomItem)
          currentIteration++

          if (currentIteration >= iterations) {
            clearInterval(timer)
            setItem(finalItem)
            resolve()
          }
        }, interval)
      })
    }

    // Animate tops (1.5 seconds)
    if (clothingItems.tops.length > 0) {
      setRandomizingCategory("tops")
      await animateSlotMachine(clothingItems.tops, setDressMeSelectedTop, 1500)
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small pause
    }

    // Animate bottoms (1.8 seconds, slightly slower)
    if (clothingItems.bottoms.length > 0) {
      setRandomizingCategory("bottoms")
      await animateSlotMachine(clothingItems.bottoms, setDressMeSelectedBottom, 1800)
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small pause
    }

    // Animate outerwear (2 seconds, slowest) - only if shown
    if (showOuterwearRow && clothingItems.outerwear.length > 0) {
      setRandomizingCategory("outerwear")
      await animateSlotMachine(clothingItems.outerwear, setDressMeSelectedOuterwear, 2000)
    }

    setRandomizingCategory(null)
    setIsRandomizing(false)
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

  // Save outfit from Dress Me mode
  const saveDressMeOutfit = async () => {
    const selectedItems = [
      dressMeSelectedTop,
      dressMeSelectedBottom,
      dressMeSelectedOuterwear,
    ].filter(Boolean) as ClothingItem[]

    if (selectedItems.length === 0) {
      alert("Please select at least one clothing item.")
      return
    }

    setIsCreating(true)
    try {
      // Apply default positions based on item type
      const DEFAULT_POSITIONS = {
        top: { left: 8, bottom: 8.9, width: 10, scale: 1 },
        bottom: { left: 7.9, bottom: 0.2, width: 10, scale: 1 },
        outerwear: { left: 35.6, bottom: 10.2, width: 10, scale: 0.8 },
      }

      const clothingData = selectedItems.map((item) => {
        const type = item.type?.toLowerCase() || ""
        let position = { left: 50, bottom: 0, width: 10, scale: 1 }

        if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
          position = DEFAULT_POSITIONS.top
        } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
          position = DEFAULT_POSITIONS.bottom
        } else if (["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(type)) {
          position = DEFAULT_POSITIONS.outerwear
        }

        return {
          clothingId: item.id,
          left: position.left,
          bottom: position.bottom,
          width: position.width,
          scale: position.scale,
          x: 0,
          y: 0,
        }
      })

      const axios = createAuthenticatedAxios()
      await axios.post("/api/outfits", {
        clothingItems: clothingData,
        name: outfitName || null,
        outerwearOnTop: outerwearOnTop,
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
    setOuterwearOnTop(false) // Reset layer order toggle

    // Reset Dress Me mode state
    setDressMeSelectedTop(null)
    setDressMeSelectedBottom(null)
    setDressMeSelectedOuterwear(null)
    setShowOuterwearRow(false)
    setIsRandomizing(false)
    setRandomizingCategory(null)

    onCloseAction()
  }

  // Render preview for Dress Me mode
  const renderDressMePreview = () => {
    const items = [
      dressMeSelectedOuterwear,
      dressMeSelectedTop,
      dressMeSelectedBottom,
    ].filter(Boolean) as ClothingItem[]

    if (items.length === 0) return null

    // Apply default positions
    const DEFAULT_POSITIONS = {
      top: { left: 8, bottom: 8.9, width: 10, scale: 1 },
      bottom: { left: 7.9, bottom: 0.2, width: 10, scale: 1 },
      outerwear: { left: 35.6, bottom: 10.2, width: 10, scale: 0.8 },
    }

    const positionedItems = items.map((item) => {
      const type = item.type?.toLowerCase() || ""
      let position = { left: 50, bottom: 0, width: 10, scale: 1 }

      if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
        position = DEFAULT_POSITIONS.top
      } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
        position = DEFAULT_POSITIONS.bottom
      } else if (["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(type)) {
        position = DEFAULT_POSITIONS.outerwear
      }

      return { ...item, ...position }
    })

    return (
      <div className="relative w-44 h-80 mx-auto">
        {positionedItems.map((item, index) => {
          // Z-index calculation for layer ordering
          let zIndex = index
          const itemType = item.type?.toLowerCase() || ""
          const isOuterwear = ["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(itemType)
          const isTop = ["t-shirt", "dress", "shirt", "blouse"].includes(itemType)

          if (outerwearOnTop && isOuterwear) {
            zIndex = 30
          } else if (!outerwearOnTop && isTop) {
            zIndex = 30
          }

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute"
              style={{
                left: `${item.left}%`,
                bottom: `${item.bottom}rem`,
                transform: `translateX(-50%) scale(${item.scale})`,
                zIndex: zIndex,
                width: `${item.width}rem`,
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
              } ${selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""}`}
              style={{
                left: `${item.left ?? DEFAULTS.left}%`,
                bottom: `${item.bottom ?? DEFAULTS.bottom}rem`,
                transform: `translateX(-50%) scale(${item.scale ?? DEFAULTS.scale})`,
                zIndex: zIndex,
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
            className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab Navigation */}
            <div className="flex items-center justify-center border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
                <button
                  onClick={() => setActiveMode("dressme")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    activeMode === "dressme"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Dress Me
                </button>
                <button
                  onClick={() => setActiveMode("canvas")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    activeMode === "canvas"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Canvas
                </button>
                <button
                  onClick={() => setActiveMode("moodboards")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    activeMode === "moodboards"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Moodboards
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Moodboards Mode - Coming Soon */}
              {activeMode === "moodboards" && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground mb-2">Coming Soon</p>
                    <p className="text-muted-foreground">Moodboards feature is under development</p>
                  </div>
                </div>
              )}

              {/* Dress Me Mode */}
              {activeMode === "dressme" && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* Left Side - Scrollable Rows */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Outfit Name Input */}
                    <div className="mb-6 px-4">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Outfit Name (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter outfit name"
                        value={outfitName}
                        onChange={(e) => setOutfitName(e.target.value)}
                        className="w-full max-w-md"
                      />
                    </div>

                    {/* Tops Row */}
                    <ScrollableClothingRow
                      items={clothingItems.tops}
                      selectedItemId={dressMeSelectedTop?.id}
                      onSelectItem={(item) => setDressMeSelectedTop(item)}
                      label="Tops"
                      isAnimating={isRandomizing && randomizingCategory === "tops"}
                      animatingItemId={dressMeSelectedTop?.id}
                    />

                    {/* Bottoms Row */}
                    <ScrollableClothingRow
                      items={clothingItems.bottoms}
                      selectedItemId={dressMeSelectedBottom?.id}
                      onSelectItem={(item) => setDressMeSelectedBottom(item)}
                      label="Bottoms"
                      isAnimating={isRandomizing && randomizingCategory === "bottoms"}
                      animatingItemId={dressMeSelectedBottom?.id}
                    />

                    {/* Add/Remove Outerwear Button */}
                    {!showOuterwearRow && (
                      <div className="px-4 mb-6">
                        <Button
                          onClick={() => setShowOuterwearRow(true)}
                          className="w-full max-w-md bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Outerwear
                        </Button>
                      </div>
                    )}

                    {/* Outerwear Row (conditional) */}
                    {showOuterwearRow && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ScrollableClothingRow
                          items={clothingItems.outerwear}
                          selectedItemId={dressMeSelectedOuterwear?.id}
                          onSelectItem={(item) => setDressMeSelectedOuterwear(item)}
                          label="Outerwear"
                          isAnimating={isRandomizing && randomizingCategory === "outerwear"}
                          animatingItemId={dressMeSelectedOuterwear?.id}
                        />
                        <div className="px-4 mb-6">
                          <Button
                            onClick={() => {
                              setShowOuterwearRow(false)
                              setDressMeSelectedOuterwear(null)
                            }}
                            variant="outline"
                            className="w-full max-w-md"
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Remove Outerwear
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Bottom Actions */}
                    <div className="px-4 mt-8 flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={randomizeDressMeOutfit}
                        variant="outline"
                        className="flex-1 max-w-xs"
                        disabled={isRandomizing}
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        {isRandomizing ? "Randomizing..." : "Randomize"}
                      </Button>
                      <Button
                        onClick={saveDressMeOutfit}
                        className="flex-1 max-w-xs bg-lime-400 hover:bg-lime-500 text-black font-semibold"
                        disabled={(!dressMeSelectedTop && !dressMeSelectedBottom) || isCreating}
                      >
                        {isCreating ? "Saving..." : "Save Outfit"}
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - Outfit Preview */}
                  <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-gradient-to-br from-muted/30 via-background to-muted/50 p-6 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
                    <div className="w-full max-w-sm h-[400px] bg-gradient-to-br from-muted via-background to-card rounded-xl flex items-center justify-center border ring-1 ring-border shadow-lg overflow-hidden p-4">
                      {!dressMeSelectedTop && !dressMeSelectedBottom && !dressMeSelectedOuterwear ? (
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">Select items to preview outfit</p>
                        </div>
                      ) : (
                        renderDressMePreview()
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas Mode - Original Content */}
              {activeMode === "canvas" && (
                <>
                  {/* Left Panel - Outfit Details */}
                  <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border p-4 overflow-y-auto bg-card" onClick={() => setSelectedItemForResize(null)}>
                {/* Outfit Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Outfit Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter outfit name (optional)"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Top Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Top *
                  </label>
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTopSelectModal(true)
                      }}
                      className="border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 min-h-[200px] flex flex-col items-center justify-center"
                    >
                      {selectedTop ? (
                        <div className="w-full">
                          <div className="relative aspect-square max-w-[150px] mx-auto mb-3">
                            <Image
                              src={selectedTop.url}
                              alt={selectedTop.name || "Selected top"}
                              fill
                              className="object-contain rounded-lg"
                              unoptimized
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground">
                              {selectedTop.name || "Untitled"}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {selectedTop.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Select Top
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedTop && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveItem("top")
                        }}
                        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Bottom *
                  </label>
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowBottomSelectModal(true)
                      }}
                      className="border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 min-h-[200px] flex flex-col items-center justify-center"
                    >
                      {selectedBottom ? (
                        <div className="w-full">
                          <div className="relative aspect-square max-w-[150px] mx-auto mb-3">
                            <Image
                              src={selectedBottom.url}
                              alt={selectedBottom.name || "Selected bottom"}
                              fill
                              className="object-contain rounded-lg"
                              unoptimized
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground">
                              {selectedBottom.name || "Untitled"}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {selectedBottom.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Select Bottom
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedBottom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveItem("bottom")
                        }}
                        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Outerwear Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Outerwear
                  </label>
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowOuterwearSelectModal(true)
                      }}
                      className="border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30 min-h-[140px] flex flex-col items-center justify-center"
                    >
                      {selectedOuterwear ? (
                        <div className="w-full">
                          <div className="relative aspect-square max-w-[100px] mx-auto mb-2">
                            <Image
                              src={selectedOuterwear.url}
                              alt={selectedOuterwear.name || "Selected outerwear"}
                              fill
                              className="object-contain rounded-lg"
                              unoptimized
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground text-sm">
                              {selectedOuterwear.name || "Untitled"}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {selectedOuterwear.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Add Outerwear
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedOuterwear && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveItem("outerwear")
                        }}
                        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Panel - Outfit Preview */}
              <div
                className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/50 p-4 md:p-8 relative"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedItemForResize(null)
                  }
                }}
              >
                <div className="w-full max-w-xs md:max-w-md mx-auto h-[400px] md:h-[500px] bg-gradient-to-br from-muted via-background to-card rounded-xl flex items-center justify-center border ring-1 ring-border shadow-lg overflow-hidden">
                  <div 
                    className="relative bg-gradient-to-br from-muted via-background to-card rounded-lg p-4 w-full h-full max-w-sm mx-auto flex items-center justify-center"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setSelectedItemForResize(null)
                      }
                    }}
                  >
                    {editedCategorizedItems && (editedCategorizedItems.top || editedCategorizedItems.bottom || editedCategorizedItems.outerwear) ? (
                      renderOutfitDisplay()
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">Select items to preview outfit</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Item Controls */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border p-4 bg-card flex flex-col" onClick={(e) => {
                // Only deselect if not clicking on interactive elements
                if (!(e.target as HTMLElement).closest('input, button, .resize-control')) {
                    setSelectedItemForResize(null)
                }
              }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Item Controls
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Resize Controls - Always visible */}
                <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30 resize-control">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Resize Item
                  </h4>
                  {(() => {
                    const selectedItem = getSelectedResizeItem()
                    
                    if (!selectedItem) {
                      // Show grayed out state when no item selected
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              Select an item to adjust the size
                            </span>
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              --
                            </span>
                          </div>
                          <input
                            type="range"
                            min="6"
                            max="20"
                            step="0.1"
                            value={10}
                            disabled
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-not-allowed opacity-50"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Small</span>
                            <span>Large</span>
                          </div>
                        </div>
                      )
                    }

                    // Show active state when item is selected
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-foreground">
                            {selectedItem.name || "Item"}
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {(selectedItem.width ?? 10).toFixed(1)}rem
                          </span>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="20"
                          step="0.1"
                          value={selectedItem.width ?? 10}
                          onChange={(e) => {
                            const newWidth = parseFloat(e.target.value)
                            setEditedCategorizedItems(prev => {
                              if (!prev) return prev
                              const updated = { ...prev }
                              const updateItemWidth = (item: ClothingItem | undefined) => {
                                if (item && item.id === selectedItemForResize) {
                                  return { ...item, width: newWidth }
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
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Small</span>
                          <span>Large</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Layer Order Toggle */}
                <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Layer Order
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {outerwearOnTop ? "Outerwear on top" : "Tops on top (default)"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={outerwearOnTop}
                        onChange={(e) => setOuterwearOnTop(e.target.checked)}
                        className="sr-only peer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Flexible space that pushes buttons to bottom */}
                <div className="flex-1"></div>

                {/* Bottom buttons - stuck to bottom */}
                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Select at least one clothing item
                  </p>
                  <div className="space-y-3">
                    {/* Shuffle button */}
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation()
                      shuffleOutfit()
                    }} disabled={loadingClothing} className="w-full">
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle
                    </Button>
                    
                    {/* Cancel and Create Outfit in same row */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        handleCloseModal()
                      }} className="w-full">
                        Cancel
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          createOutfit()
                        }}
                        disabled={!hasMinimumItems || isCreating}
                        className="w-full"
                      >
                        {isCreating ? "Creating..." : "Create Outfit"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}
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
    </>
  )
}