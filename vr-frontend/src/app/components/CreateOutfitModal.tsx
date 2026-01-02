"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, ChevronLeft, ChevronRight, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
import Image from "next/image"
import axios from "axios"
import OutfitCanvas from "./OutfitCanvas"

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
  aspectRatio?: number
}

interface CategorizedClothing {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  outerwear: ClothingItem[]
  shoes: ClothingItem[]
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
  const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [], shoes: [], allItems: [] })
  const [, setLoadingClothing] = useState(true)
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

  // Display mode state
  const [mode, setMode] = useState<"canvas" | "display">("canvas")
  const [displayIndices, setDisplayIndices] = useState({ top: 0, bottom: 0, outerwear: 0, shoe: 0 })
  const [displayToggles, setDisplayToggles] = useState({ shoes: true, outerwear: true })
  const [diceRolling, setDiceRolling] = useState(false)
  const [currentDiceFace, setCurrentDiceFace] = useState(5)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number; itemX: number; itemY: number }>({
    x: 0,
    y: 0,
    itemX: 50,
    itemY: 50,
  })
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const DEFAULTS = useRef({
    x: 50,
    y: 50,
    width: 10,
  }).current

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
        shoes: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          return ["shoes", "sneakers", "boots", "sandals", "heels", "loafers"].includes(type)
        }),
        allItems: allItems,
      }

      setClothingItems(categorizedItems)
    } catch (error) {
      console.error("Error fetching clothing items:", error)
      setClothingItems({ tops: [], bottoms: [], outerwear: [], shoes: [], allItems: [] })
    } finally {
      setLoadingClothing(false)
    }
  }, [createAuthenticatedAxios])

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    }
  }, [show, fetchClothingItems])

  // Randomize initial display indices when clothing items are loaded
  useEffect(() => {
    if (clothingItems.allItems.length > 0) {
      setDisplayIndices({
        top: clothingItems.tops.length > 0 ? Math.floor(Math.random() * clothingItems.tops.length) : 0,
        bottom: clothingItems.bottoms.length > 0 ? Math.floor(Math.random() * clothingItems.bottoms.length) : 0,
        outerwear: clothingItems.outerwear.length > 0 ? Math.floor(Math.random() * clothingItems.outerwear.length) : 0,
        shoe: clothingItems.shoes.length > 0 ? Math.floor(Math.random() * clothingItems.shoes.length) : 0,
      })
    }
  }, [clothingItems.allItems.length, clothingItems.tops.length, clothingItems.bottoms.length, clothingItems.outerwear.length, clothingItems.shoes.length])

  // Removed the useEffect that was overwriting positioned items
  // The updateCategorizedItems function already handles positioning correctly

  // DRAG AND DROP SYSTEM - Center-based positioning with calc()
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
      // Calculate where on the item the user clicked
      const canvas = document.querySelector('[data-canvas]') as HTMLElement
      if (canvas) {
        const rect = canvas.getBoundingClientRect()

        // Item center is at x%, y% of canvas (box-sizing: border-box includes border)
        const itemCenterX = ((currentItem.x ?? DEFAULTS.x) / 100) * rect.width
        const itemCenterY = ((currentItem.y ?? DEFAULTS.y) / 100) * rect.height
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        // Store offset from center
        dragOffsetRef.current = {
          x: mouseX - itemCenterX,
          y: mouseY - itemCenterY,
        }
      }

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

      const canvas = document.querySelector('[data-canvas]') as HTMLElement
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()

      // Get the current item
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      if (!currentItem) return

      // Subtract offset so item doesn't "jump"
      const relativeX = e.clientX - rect.left - dragOffsetRef.current.x
      const relativeY = e.clientY - rect.top - dragOffsetRef.current.y

      // Convert to percentage (box-sizing: border-box means rect includes border correctly)
      let newX = (relativeX / rect.width) * 100
      let newY = (relativeY / rect.height) * 100

      // Calculate boundaries using actual dimensions
      // Item width is in rem (1rem = 16px)
      const itemWidthPx = (currentItem.width ?? DEFAULTS.width) * 16
      const aspectRatio = currentItem.aspectRatio || 1.25
      const itemHeightPx = itemWidthPx * aspectRatio

      // Convert pixel dimensions to percentages of canvas
      const itemWidthPercent = (itemWidthPx / rect.width) * 100
      const itemHeightPercent = (itemHeightPx / rect.height) * 100

      // Center-based boundaries: center must stay within canvas such that edges don't go outside
      const halfItemWidth = itemWidthPercent / 2
      const halfItemHeight = itemHeightPercent / 2

      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      // Clamp the center position to keep item fully inside canvas
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
      // Calculate where on the item the user touched
      const canvas = document.querySelector('[data-canvas]') as HTMLElement
      if (canvas) {
        const rect = canvas.getBoundingClientRect()

        // Item center is at x%, y% of canvas (box-sizing: border-box includes border)
        const itemCenterX = ((currentItem.x ?? DEFAULTS.x) / 100) * rect.width
        const itemCenterY = ((currentItem.y ?? DEFAULTS.y) / 100) * rect.height
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top

        // Store offset from center
        dragOffsetRef.current = {
          x: touchX - itemCenterX,
          y: touchY - itemCenterY,
        }
      }

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

      const canvas = document.querySelector('[data-canvas]') as HTMLElement
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()

      // Get the current item
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      if (!currentItem) return

      // Subtract offset so item doesn't "jump"
      const relativeX = touch.clientX - rect.left - dragOffsetRef.current.x
      const relativeY = touch.clientY - rect.top - dragOffsetRef.current.y

      // Convert to percentage (box-sizing: border-box means rect includes border correctly)
      let newX = (relativeX / rect.width) * 100
      let newY = (relativeY / rect.height) * 100

      // Calculate boundaries using actual dimensions
      // Item width is in rem (1rem = 16px)
      const itemWidthPx = (currentItem.width ?? DEFAULTS.width) * 16
      const aspectRatio = currentItem.aspectRatio || 1.25
      const itemHeightPx = itemWidthPx * aspectRatio

      // Convert pixel dimensions to percentages of canvas
      const itemWidthPercent = (itemWidthPx / rect.width) * 100
      const itemHeightPercent = (itemHeightPx / rect.height) * 100

      // Center-based boundaries: center must stay within canvas such that edges don't go outside
      const halfItemWidth = itemWidthPercent / 2
      const halfItemHeight = itemHeightPercent / 2

      const minX = halfItemWidth
      const maxX = 100 - halfItemWidth
      const minY = halfItemHeight
      const maxY = 100 - halfItemHeight

      // Clamp the center position to keep item fully inside canvas
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

  // Update item's aspect ratio when image loads
  const updateItemAspectRatio = (itemId: string, aspectRatio: number) => {
    setEditedCategorizedItems(prev => {
      if (!prev) return prev
      const updated = { ...prev }

      const updateAspect = (item: ClothingItem | undefined) => {
        if (item && item.id === itemId) {
          return { ...item, aspectRatio }
        }
        return item
      }

      updated.outerwear = updateAspect(updated.outerwear)
      updated.top = updateAspect(updated.top)
      updated.bottom = updateAspect(updated.bottom)
      updated.shoe = updateAspect(updated.shoe)
      updated.others = updated.others.map(updateAspect).filter(Boolean) as ClothingItem[]

      return updated
    })
  }

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
      top: { x: 50, y: 40, width: 9 },
      bottom: { x: 50, y: 68, width: 10 },
      outerwear: { x: 70, y: 35, width: 10 },
      shoe: { x: 50, y: 80, width: 8 },
      accessory: { x: 50, y: 25, width: 6 },
    }

    setEditedCategorizedItems(prev => {
      const newItems = prev || { others: [] }

      if (category === "top") {
        // If replacing an existing top, preserve its position and width
        const existingTop = newItems.top
        newItems.top = {
          ...item,
          x: existingTop?.x ?? DEFAULT_POSITIONS.top.x,
          y: existingTop?.y ?? DEFAULT_POSITIONS.top.y,
          width: existingTop?.width ?? DEFAULT_POSITIONS.top.width,
        }

        // If there's outerwear and we just added a top, move outerwear to its default position (only if it doesn't have custom position)
        if (newItems.outerwear && !existingTop) {
          newItems.outerwear = {
            ...newItems.outerwear,
            x: DEFAULT_POSITIONS.outerwear.x,
            y: DEFAULT_POSITIONS.outerwear.y,
            width: DEFAULT_POSITIONS.outerwear.width,
          }
        }
      } else if (category === "bottom") {
        // If replacing an existing bottom, preserve its position and width
        const existingBottom = newItems.bottom
        newItems.bottom = {
          ...item,
          x: existingBottom?.x ?? DEFAULT_POSITIONS.bottom.x,
          y: existingBottom?.y ?? DEFAULT_POSITIONS.bottom.y,
          width: existingBottom?.width ?? DEFAULT_POSITIONS.bottom.width,
        }
      } else if (category === "outerwear") {
        // If replacing an existing outerwear, preserve its position and width
        const existingOuterwear = newItems.outerwear
        // If there's no top, put outerwear in top position (but keep outerwear width)
        const shouldUseTopPosition = !newItems.top && !existingOuterwear

        newItems.outerwear = {
          ...item,
          x: existingOuterwear?.x ?? (shouldUseTopPosition ? DEFAULT_POSITIONS.top.x : DEFAULT_POSITIONS.outerwear.x),
          y: existingOuterwear?.y ?? (shouldUseTopPosition ? DEFAULT_POSITIONS.top.y : DEFAULT_POSITIONS.outerwear.y),
          width: existingOuterwear?.width ?? DEFAULT_POSITIONS.outerwear.width,
        }
      } else if (category === "shoe") {
        // If replacing an existing shoe, preserve its position and width
        const existingShoe = newItems.shoe
        newItems.shoe = {
          ...item,
          x: existingShoe?.x ?? DEFAULT_POSITIONS.shoe.x,
          y: existingShoe?.y ?? DEFAULT_POSITIONS.shoe.y,
          width: existingShoe?.width ?? DEFAULT_POSITIONS.shoe.width,
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

        // If there's outerwear and we just removed the top, move outerwear to top position (keep outerwear width)
        if (newItems.outerwear) {
          const DEFAULT_POSITIONS = {
            top: { x: 50, y: 40 },
          }

          newItems.outerwear = {
            ...newItems.outerwear,
            x: DEFAULT_POSITIONS.top.x,
            y: DEFAULT_POSITIONS.top.y,
            // Keep the outerwear's current width, don't change it
            left: DEFAULT_POSITIONS.top.x,
            bottom: 4,
          }
        }
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


  // Display mode navigation functions
  const navigateCategory = (category: "top" | "bottom" | "outerwear" | "shoe", direction: "prev" | "next") => {
    const items = category === "top" ? clothingItems.tops :
                  category === "bottom" ? clothingItems.bottoms :
                  category === "outerwear" ? clothingItems.outerwear :
                  clothingItems.shoes

    if (items.length === 0) return

    setDisplayIndices(prev => {
      const currentIndex = prev[category]
      let newIndex = currentIndex

      if (direction === "next") {
        // Only advance if there's a next item
        if (currentIndex < items.length - 1) {
          newIndex = currentIndex + 1
        }
      } else {
        // Only go back if there's a previous item
        if (currentIndex > 0) {
          newIndex = currentIndex - 1
        }
      }

      return { ...prev, [category]: newIndex }
    })
  }

  // Randomize all categories with instant change
  const randomizeOutfit = () => {
    // Instantly change dice face
    setCurrentDiceFace(Math.floor(Math.random() * 6) + 1)

    // Instantly set random outfit indices
    setDisplayIndices({
      top: clothingItems.tops.length > 0 ? Math.floor(Math.random() * clothingItems.tops.length) : 0,
      bottom: clothingItems.bottoms.length > 0 ? Math.floor(Math.random() * clothingItems.bottoms.length) : 0,
      outerwear: clothingItems.outerwear.length > 0 ? Math.floor(Math.random() * clothingItems.outerwear.length) : 0,
      shoe: clothingItems.shoes.length > 0 ? Math.floor(Math.random() * clothingItems.shoes.length) : 0,
    })
  }

  // Get current display layout configuration
  const getDisplayLayout = () => {
    const hasOuterwear = displayToggles.outerwear && clothingItems.outerwear.length > 0
    const hasTop = clothingItems.tops.length > 0
    const hasBottom = clothingItems.bottoms.length > 0

    if (hasOuterwear && hasTop && hasBottom) {
      // All 3 items: outerwear, top, bottom
      return {
        outerwear: { y: 18, width: 9 },
        top: { y: 48, width: 9 },
        bottom: { y: 76, width: 9 },
      }
    } else if (!hasOuterwear && hasTop && hasBottom) {
      // Just top and bottom (no outerwear)
      return {
        top: { y: 32, width: 11 },
        bottom: { y: 68, width: 11 },
      }
    } else if (hasOuterwear && !hasTop && hasBottom) {
      // Outerwear and bottom (no top)
      return {
        outerwear: { y: 32, width: 11 },
        bottom: { y: 68, width: 11 },
      }
    } else if (hasOuterwear && hasTop && !hasBottom) {
      // Outerwear and top (no bottom)
      return {
        outerwear: { y: 32, width: 11 },
        top: { y: 68, width: 11 },
      }
    } else if (hasTop) {
      // Only top
      return { top: { y: 50, width: 13 } }
    } else if (hasBottom) {
      // Only bottom
      return { bottom: { y: 50, width: 13 } }
    } else if (hasOuterwear) {
      // Only outerwear
      return { outerwear: { y: 50, width: 13 } }
    }
    return {}
  }

  // Get current display items with default canvas coordinates for saving
  const getCurrentDisplayItems = () => {
    const items: CategorizedOutfitItems = { others: [] }

    // Default positions for each category (Canvas mode) - using center coordinates (x, y as percentages)
    const DEFAULT_POSITIONS = {
      top: { x: 50, y: 40, width: 9 },
      bottom: { x: 50, y: 68, width: 10 },
      outerwear: { x: 70, y: 35, width: 10 },
      shoe: { x: 50, y: 80, width: 8 },
    }

    // Use default canvas coordinates for consistency when saving from Display mode
    if (clothingItems.outerwear.length > 0 && displayToggles.outerwear) {
      const item = clothingItems.outerwear[displayIndices.outerwear]
      items.outerwear = { ...item, x: DEFAULT_POSITIONS.outerwear.x, y: DEFAULT_POSITIONS.outerwear.y, width: DEFAULT_POSITIONS.outerwear.width }
    }
    if (clothingItems.tops.length > 0) {
      const item = clothingItems.tops[displayIndices.top]
      items.top = { ...item, x: DEFAULT_POSITIONS.top.x, y: DEFAULT_POSITIONS.top.y, width: DEFAULT_POSITIONS.top.width }
    }
    if (clothingItems.bottoms.length > 0) {
      const item = clothingItems.bottoms[displayIndices.bottom]
      items.bottom = { ...item, x: DEFAULT_POSITIONS.bottom.x, y: DEFAULT_POSITIONS.bottom.y, width: DEFAULT_POSITIONS.bottom.width }
    }
    if (clothingItems.shoes.length > 0 && displayToggles.shoes) {
      const item = clothingItems.shoes[displayIndices.shoe]
      items.shoe = { ...item, x: DEFAULT_POSITIONS.shoe.x, y: DEFAULT_POSITIONS.shoe.y, width: DEFAULT_POSITIONS.shoe.width }
    }

    return items
  }

  // Get roulette items (prev-2, prev-1, current, next-1, next-2) for a category
  const getRouletteItems = (category: "top" | "bottom" | "outerwear") => {
    const items = category === "top" ? clothingItems.tops :
                  category === "bottom" ? clothingItems.bottoms :
                  clothingItems.outerwear

    if (items.length === 0) return { prev2: null, prev: null, current: null, next: null, next2: null }

    const currentIndex = displayIndices[category]

    // Only show items that actually exist ahead/behind without circular wrapping
    return {
      prev2: currentIndex >= 2 ? items[currentIndex - 2] : null,
      prev: currentIndex >= 1 ? items[currentIndex - 1] : null,
      current: items[currentIndex],
      next: currentIndex < items.length - 1 ? items[currentIndex + 1] : null,
      next2: currentIndex < items.length - 2 ? items[currentIndex + 2] : null
    }
  }


  const createOutfit = async (itemsOverride?: CategorizedOutfitItems) => {
    // Use override items if provided (for Display mode), otherwise use editedCategorizedItems
    const itemsToCheck = itemsOverride || editedCategorizedItems

    // Check if there are any items in editedCategorizedItems OR the old selected items
    const hasItemsInCanvas = itemsToCheck && (
      itemsToCheck.top ||
      itemsToCheck.bottom ||
      itemsToCheck.outerwear ||
      itemsToCheck.shoe ||
      itemsToCheck.others.length > 0
    )

    const selectedItems = [selectedTop, selectedBottom, selectedOuterwear].filter(Boolean) as ClothingItem[]

    if (!hasItemsInCanvas && selectedItems.length === 0) {
      alert("Please select at least one clothing item.")
      return
    }

    setIsCreating(true)
    try {
      const itemsToUse = itemsToCheck ? [
        itemsToCheck.outerwear,
        itemsToCheck.top,
        itemsToCheck.bottom,
        itemsToCheck.shoe,
        ...itemsToCheck.others
      ].filter(Boolean) as ClothingItem[] : selectedItems

      console.log("[CREATE OUTFIT] Items to use:", itemsToUse)

      const clothingData = itemsToUse.map((item) => ({
        clothingId: item.id,
        x: item.x ?? 50,
        y: item.y ?? 50,
        width: item.width ?? 10,
        aspectRatio: item.aspectRatio ?? 1.25,
      }))

      console.log("[CREATE OUTFIT] Clothing data to send:", clothingData)

      const axios = createAuthenticatedAxios()
      const response = await axios.post("/api/outfits", {
        clothingItems: clothingData,
        name: outfitName || null,
        outerwearOnTop: outerwearOnTop, // Include layer order preference
      })

      console.log("[CREATE OUTFIT] Success! Response:", response.data)

      onOutfitCreated()
      handleCloseModal()
    } catch (error) {
      console.error("[CREATE OUTFIT] Error creating outfit:", error)
      if (axios.isAxiosError(error)) {
        console.error("[CREATE OUTFIT] Response data:", error.response?.data)
        console.error("[CREATE OUTFIT] Response status:", error.response?.status)
      }
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


  // Custom outfit display - using OutfitCanvas component
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
      <OutfitCanvas
        items={allCurrentItems}
        outerwearOnTop={outerwearOnTop}
        draggedItemId={draggedItemId}
        selectedItemForResize={selectedItemForResize}
        enableDragDrop={true}
        enableResize={true}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e, itemId) => {
          e.stopPropagation()
          setSelectedItemForResize(itemId)
        }}
        onImageLoad={updateItemAspectRatio}
      />
    )
  }

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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Main Content - Canvas Mode Only */}
            <div className="flex-1 flex flex-row overflow-hidden justify-center items-start gap-6 p-6 relative" style={{ paddingTop: '66px' }}>
                  {/* Left Sidebar - Category Buttons (Canvas Mode Only) */}
                  {mode === "canvas" && (
                    <div className="flex flex-col gap-3 relative" style={{ marginTop: 'calc(28px + 8px)', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedItemForResize(null)
                          setSelectingCategory("outerwear")
                          setShowSelectModal(true)
                        }}
                        className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center p-3"
                      >
                        <Image
                          src={editedCategorizedItems?.outerwear ? "/outerwearSelect.PNG" : "/outerwear.PNG"}
                          alt="Outerwear"
                          width={50}
                          height={50}
                          className="object-contain"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItemForResize(null)
                          setSelectingCategory("top")
                          setShowSelectModal(true)
                        }}
                        className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center p-3"
                      >
                        <Image
                          src={editedCategorizedItems?.top ? "/topSelect.PNG" : "/top.PNG"}
                          alt="Top"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItemForResize(null)
                          setSelectingCategory("bottom")
                          setShowSelectModal(true)
                        }}
                        className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center p-3"
                      >
                        <Image
                          src={editedCategorizedItems?.bottom ? "/bottomSelect.PNG" : "/bottom.PNG"}
                          alt="Bottom"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItemForResize(null)
                          setSelectingCategory("shoe")
                          setShowSelectModal(true)
                        }}
                        className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center p-3"
                      >
                        <Image
                          src={editedCategorizedItems?.shoe ? "/shoeSelect.PNG" : "/shoe.PNG"}
                          alt="Shoes"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItemForResize(null)
                          setSelectingCategory("accessory")
                          setShowSelectModal(true)
                        }}
                        className="w-16 h-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-background flex items-center justify-center p-3"
                      >
                        <Image
                          src={editedCategorizedItems?.accessory ? "/accessSelect.PNG" : "/access.PNG"}
                          alt="Accessories"
                          width={50}
                          height={50}
                          className="object-contain"
                        />
                      </button>
                    </div>
                  )}

                  {/* Center - Canvas Area */}
                  <div className="flex flex-col relative" style={{ zIndex: 2 }}>
                    {/* Mode Toggle - Above Canvas, Aligned Right */}
                    <div className="flex justify-end mb-2">
                      <div className="flex gap-1 bg-muted rounded-lg p-1 relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setMode("canvas")}
                          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            mode === "canvas"
                              ? "bg-foreground text-background"
                              : "text-muted-foreground"
                          }`}
                        >
                          Canvas
                        </button>
                        <button
                          onClick={() => setMode("display")}
                          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            mode === "display"
                              ? "bg-foreground text-background"
                              : "text-muted-foreground"
                          }`}
                        >
                          Display
                        </button>
                      </div>
                    </div>

                    {/* Canvas Container with Save Button */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>

                      {mode === "canvas" ? (
                        <>
                          {/* Canvas - Direct container with border as the visual boundary */}
                          <div
                            data-canvas
                            className="relative h-[32rem] w-[280px] bg-gradient-to-br from-muted via-background to-card rounded-xl ring-1 ring-border overflow-hidden shadow-lg"
                            style={{ boxSizing: 'border-box' }}
                            onClick={() => {
                              setSelectedItemForResize(null)
                            }}
                          >
                            {renderOutfitDisplay()}

                        {/* Resize Slider (bottom left) */}
                        {selectedItemForResize && (
                          <div className="absolute bottom-4 left-4 flex flex-col items-center gap-2 z-50">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="range"
                              min="4"
                              max="11"
                              step="0.5"
                              value={getSelectedResizeItem()?.width ?? 8}
                              onChange={(e) => {
                                const newWidth = parseFloat(e.target.value)
                                const canvas = document.querySelector('[data-canvas]') as HTMLElement
                                if (!canvas) return

                                const rect = canvas.getBoundingClientRect()

                                const allCurrentItems = [
                                  editedCategorizedItems?.outerwear,
                                  editedCategorizedItems?.top,
                                  editedCategorizedItems?.bottom,
                                  editedCategorizedItems?.shoe,
                                  ...(editedCategorizedItems?.others || [])
                                ].filter(Boolean) as ClothingItem[]

                                const item = allCurrentItems.find(i => i?.id === selectedItemForResize)
                                if (!item) return

                                // Calculate boundaries with NEW width
                                const itemWidthPx = newWidth * 16
                                const aspectRatio = item.aspectRatio || 1.25
                                const itemHeightPx = itemWidthPx * aspectRatio

                                const itemWidthPercent = (itemWidthPx / rect.width) * 100
                                const itemHeightPercent = (itemHeightPx / rect.height) * 100

                                const minX = itemWidthPercent / 2
                                const maxX = 100 - (itemWidthPercent / 2)
                                const minY = itemHeightPercent / 2
                                const maxY = 100 - (itemHeightPercent / 2)

                                // Get current position
                                const currentX = item.x ?? DEFAULTS.x
                                const currentY = item.y ?? DEFAULTS.y

                                // Check if current position would be INVALID with new size
                                if (currentX < minX || currentX > maxX || currentY < minY || currentY > maxY) {
                                  // Don't allow resize - would push item out of bounds
                                  return
                                }

                                // Resize is allowed - update width only (position stays the same)
                                setEditedCategorizedItems(prev => {
                                  if (!prev) return prev
                                  const updated = { ...prev }

                                  const updateItemWidth = (item: ClothingItem | undefined) => {
                                    if (item && item.id === selectedItemForResize) {
                                      return {
                                        ...item,
                                        width: newWidth,
                                        // Don't update x/y - keep position the same
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
                                WebkitAppearance: 'slider-vertical',
                                background: 'hsl(var(--foreground))',
                              } as React.CSSProperties}
                            />
                          </div>
                        )}
                      </div>

                      {/* Save Button for Canvas Mode */}
                      <Button
                        onClick={createOutfit}
                        disabled={!editedCategorizedItems || (!editedCategorizedItems.top && !editedCategorizedItems.bottom && !editedCategorizedItems.outerwear && !editedCategorizedItems.shoe && editedCategorizedItems.others.length === 0) || isCreating}
                        className="w-[280px] bg-foreground text-background hover:bg-foreground/90 font-semibold mt-3"
                      >
                        {isCreating ? "Saving..." : "Save"}
                      </Button>
                        </>
                      ) : (
                        <>
                          {/* Display Mode */}
                          <div className="relative h-[32rem] flex items-center justify-center" style={{ width: '480px' }}>
                            {(() => {
                              const layout = getDisplayLayout()
                              // Create a layout key that changes when the configuration changes
                              const layoutKey = `${layout.outerwear ? 'o' : ''}${layout.top ? 't' : ''}${layout.bottom ? 'b' : ''}`

                              return (
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={layoutKey}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 flex items-center justify-center"
                                  >
                                    {/* Left Arrow Column */}
                                    <div className="absolute left-[-60px] top-0 w-[40px] h-full flex flex-col justify-center z-10">
                                      {layout.outerwear && displayToggles.outerwear && clothingItems.outerwear.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("outerwear", "prev")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute left-0"
                                          style={{ top: `${layout.outerwear.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                      {layout.top && clothingItems.tops.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("top", "prev")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute left-0"
                                          style={{ top: `${layout.top.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                      {layout.bottom && clothingItems.bottoms.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("bottom", "prev")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute left-0"
                                          style={{ top: `${layout.bottom.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Center Roulette View */}
                                    <div className="relative w-[400px] h-[32rem]">
                                      {/* Render roulette for each category */}
                                      {layout.outerwear && displayToggles.outerwear && clothingItems.outerwear.length > 0 && (() => {
                                        const roulette = getRouletteItems("outerwear")
                                        const yPos = layout.outerwear.y
                                        const width = layout.outerwear.width

                                        return (
                                          <div
                                            className="absolute w-full flex items-center"
                                            style={{ top: `${yPos}%`, transform: 'translateY(-50%)' }}
                                          >
                                            {/* Prev-2 item - very faded, small, partially cut off on left */}
                                            {roulette.prev2 && (
                                              <motion.div
                                                key={roulette.prev2.id}
                                                initial={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.prev2.url}
                                                  alt={roulette.prev2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Prev-1 item - faded, positioned on left */}
                                            {roulette.prev && (
                                              <motion.div
                                                key={roulette.prev.id}
                                                initial={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.prev.url}
                                                  alt={roulette.prev.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Current item - full brightness, centered */}
                                            {roulette.current && (
                                              <motion.div
                                                key={roulette.current.id}
                                                initial={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                animate={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width}rem`,
                                                  position: 'absolute',
                                                  transform: 'translateX(-50%)',
                                                  zIndex: 10
                                                }}
                                              >
                                                <Image
                                                  src={roulette.current.url}
                                                  alt={roulette.current.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-1 item - faded, positioned on right */}
                                            {roulette.next && (
                                              <motion.div
                                                key={roulette.next.id}
                                                initial={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.next.url}
                                                  alt={roulette.next.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-2 item - very faded, small, partially cut off on right */}
                                            {roulette.next2 && (
                                              <motion.div
                                                key={roulette.next2.id}
                                                initial={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.next2.url}
                                                  alt={roulette.next2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}
                                          </div>
                                        )
                                      })()}

                                      {/* Top roulette */}
                                      {layout.top && clothingItems.tops.length > 0 && (() => {
                                        const roulette = getRouletteItems("top")
                                        const yPos = layout.top.y
                                        const width = layout.top.width

                                        return (
                                          <div
                                            className="absolute w-full flex items-center"
                                            style={{ top: `${yPos}%`, transform: 'translateY(-50%)' }}
                                          >
                                            {/* Prev-2 item - very faded, small, partially cut off on left */}
                                            {roulette.prev2 && (
                                              <motion.div
                                                key={roulette.prev2.id}
                                                initial={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.prev2.url}
                                                  alt={roulette.prev2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Prev-1 item - faded, positioned on left */}
                                            {roulette.prev && (
                                              <motion.div
                                                key={roulette.prev.id}
                                                initial={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.prev.url}
                                                  alt={roulette.prev.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Current item - full brightness, centered */}
                                            {roulette.current && (
                                              <motion.div
                                                key={roulette.current.id}
                                                initial={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                animate={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width}rem`,
                                                  position: 'absolute',
                                                  transform: 'translateX(-50%)',
                                                  zIndex: 10
                                                }}
                                              >
                                                <Image
                                                  src={roulette.current.url}
                                                  alt={roulette.current.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-1 item - faded, positioned on right */}
                                            {roulette.next && (
                                              <motion.div
                                                key={roulette.next.id}
                                                initial={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.next.url}
                                                  alt={roulette.next.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-2 item - very faded, small, partially cut off on right */}
                                            {roulette.next2 && (
                                              <motion.div
                                                key={roulette.next2.id}
                                                initial={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.next2.url}
                                                  alt={roulette.next2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}
                                          </div>
                                        )
                                      })()}

                                      {/* Bottom roulette */}
                                      {layout.bottom && clothingItems.bottoms.length > 0 && (() => {
                                        const roulette = getRouletteItems("bottom")
                                        const yPos = layout.bottom.y
                                        const width = layout.bottom.width

                                        return (
                                          <div
                                            className="absolute w-full flex items-center"
                                            style={{ top: `${yPos}%`, transform: 'translateY(-50%)' }}
                                          >
                                            {/* Prev-2 item - very faded, small, partially cut off on left */}
                                            {roulette.prev2 && (
                                              <motion.div
                                                key={roulette.prev2.id}
                                                initial={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '-10%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.prev2.url}
                                                  alt={roulette.prev2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Prev-1 item - faded, positioned on left */}
                                            {roulette.prev && (
                                              <motion.div
                                                key={roulette.prev.id}
                                                initial={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '10%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.prev.url}
                                                  alt={roulette.prev.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Current item - full brightness, centered */}
                                            {roulette.current && (
                                              <motion.div
                                                key={roulette.current.id}
                                                initial={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                animate={{
                                                  left: '50%',
                                                  opacity: 1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width}rem`,
                                                  position: 'absolute',
                                                  transform: 'translateX(-50%)',
                                                  zIndex: 10
                                                }}
                                              >
                                                <Image
                                                  src={roulette.current.url}
                                                  alt={roulette.current.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-1 item - faded, positioned on right */}
                                            {roulette.next && (
                                              <motion.div
                                                key={roulette.next.id}
                                                initial={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                animate={{
                                                  left: '90%',
                                                  opacity: 0.5
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.5}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-50"
                                              >
                                                <Image
                                                  src={roulette.next.url}
                                                  alt={roulette.next.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}

                                            {/* Next-2 item - very faded, small, partially cut off on right */}
                                            {roulette.next2 && (
                                              <motion.div
                                                key={roulette.next2.id}
                                                initial={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                animate={{
                                                  left: '110%',
                                                  opacity: 0.1
                                                }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{
                                                  width: `${width * 0.3}rem`,
                                                  position: 'absolute'
                                                }}
                                                className="opacity-10"
                                              >
                                                <Image
                                                  src={roulette.next2.url}
                                                  alt={roulette.next2.name || ""}
                                                  width={100}
                                                  height={120}
                                                  className="w-full h-auto object-contain rounded-lg"
                                                  draggable={false}
                                                  unoptimized
                                                />
                                              </motion.div>
                                            )}
                                          </div>
                                        )
                                      })()}
                                    </div>

                                    {/* Right Arrow Column */}
                                    <div className="absolute right-[-60px] top-0 w-[40px] h-full flex flex-col justify-center z-10">
                                      {layout.outerwear && displayToggles.outerwear && clothingItems.outerwear.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("outerwear", "next")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute right-0"
                                          style={{ top: `${layout.outerwear.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                      {layout.top && clothingItems.tops.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("top", "next")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute right-0"
                                          style={{ top: `${layout.top.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                      {layout.bottom && clothingItems.bottoms.length > 0 && (
                                        <button
                                          onClick={() => navigateCategory("bottom", "next")}
                                          className="p-2 hover:bg-muted/50 rounded transition-colors absolute right-0"
                                          style={{ top: `${layout.bottom.y}%`, transform: 'translateY(-50%)' }}
                                        >
                                          <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                </AnimatePresence>
                              )
                            })()}
                          </div>

                          {/* Display Mode Controls */}
                          <div className="flex justify-center mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDisplayToggles(prev => ({ ...prev, shoes: !prev.shoes }))}
                                className={`text-xs font-medium rounded-md whitespace-nowrap flex items-center justify-center shrink-0 ${
                                  displayToggles.shoes
                                    ? "bg-foreground text-background"
                                    : "bg-muted text-foreground hover:bg-muted/80"
                                }`}
                                style={{
                                  width: '108px',
                                  height: '36px',
                                  minWidth: '108px',
                                  maxWidth: '108px',
                                  boxSizing: 'border-box',
                                  padding: '0'
                                }}
                              >
                                Add Shoe
                              </button>
                              <button
                                onClick={() => setDisplayToggles(prev => ({ ...prev, outerwear: !prev.outerwear }))}
                                className={`text-xs font-medium rounded-md whitespace-nowrap flex items-center justify-center shrink-0 ${
                                  displayToggles.outerwear
                                    ? "bg-foreground text-background"
                                    : "bg-muted text-foreground hover:bg-muted/80"
                                }`}
                                style={{
                                  width: '108px',
                                  height: '36px',
                                  minWidth: '108px',
                                  maxWidth: '108px',
                                  boxSizing: 'border-box',
                                  padding: '0'
                                }}
                              >
                                Add Outerwear
                              </button>
                              <button
                                onClick={randomizeOutfit}
                                className="rounded-md bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center shrink-0"
                                style={{
                                  width: '40px',
                                  height: '36px',
                                  minWidth: '40px',
                                  maxWidth: '40px',
                                  boxSizing: 'border-box',
                                  padding: '0'
                                }}
                                title="Randomize outfit"
                              >
                                {currentDiceFace === 1 && <Dice1 className="w-5 h-5" />}
                                {currentDiceFace === 2 && <Dice2 className="w-5 h-5" />}
                                {currentDiceFace === 3 && <Dice3 className="w-5 h-5" />}
                                {currentDiceFace === 4 && <Dice4 className="w-5 h-5" />}
                                {currentDiceFace === 5 && <Dice5 className="w-5 h-5" />}
                                {currentDiceFace === 6 && <Dice6 className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          {/* Save Button for Display Mode */}
                          <div className="flex justify-center mt-2">
                            <Button
                              onClick={() => {
                                const currentItems = getCurrentDisplayItems()
                                setEditedCategorizedItems(currentItems)
                                createOutfit(currentItems)
                              }}
                              disabled={isCreating || (clothingItems.tops.length === 0 && clothingItems.bottoms.length === 0)}
                              className="w-[420px] bg-foreground text-background hover:bg-foreground/90 font-semibold"
                            >
                              {isCreating ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar - Added Items (Canvas Mode Only) */}
                  {mode === "canvas" && (
                    <div className="flex flex-col gap-3 relative" style={{ marginTop: 'calc(28px + 8px)', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
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
        currentlySelectedItemId={
          selectingCategory === "outerwear" ? editedCategorizedItems?.outerwear?.id :
          selectingCategory === "top" ? editedCategorizedItems?.top?.id :
          selectingCategory === "bottom" ? editedCategorizedItems?.bottom?.id :
          selectingCategory === "shoe" ? editedCategorizedItems?.shoe?.id :
          null
        }
      />
    </>
  )
}