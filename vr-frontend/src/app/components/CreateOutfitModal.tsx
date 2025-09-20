"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Shuffle, Check, Plus, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
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
  mode: "closet" | "wishlist"
  left?: number
  bottom?: number
  width?: number
  scale?: number
}

interface CategorizedClothing {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  outerwear: ClothingItem[]
  allItems: ClothingItem[]
}

interface OutfitItem {
  item: ClothingItem
  left: number
  bottom: number
  width: number
  scale: number
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Create an axios instance with credentials
  const createAuthenticatedAxios = () => {
    return axios.create({
      withCredentials: true,
      baseURL: API_URL
    })
  }
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null)
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null)
  const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null)
  const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [], allItems: [] })
  const [loadingClothing, setLoadingClothing] = useState(true)
  const [showTopSelectModal, setShowTopSelectModal] = useState(false)
  const [showBottomSelectModal, setShowBottomSelectModal] = useState(false)
  const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [outfitName, setOutfitName] = useState("")

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [selectedItemForResize, setSelectedItemForResize] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number; itemLeft: number; itemBottom: number }>({
    x: 0,
    y: 0,
    itemLeft: 0,
    itemBottom: 0,
  })

  // Outfit items with positioning
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([])

  const DEFAULT_LAYOUT = {
    top: { left: 45, bottom: 12, width: 16, scale: 1.2 },
    bottom: { left: 50, bottom: 0, width: 16, scale: 1.2 },
    outerwear: { left: 64, bottom: 14, width: 16, scale: 1.2 },
  }

  const DEFAULTS = {
    left: 50,
    bottom: 0,
    width: 16,
    scale: 1.2,
  }

  // Initialize outfit items when clothing items are selected
  useEffect(() => {
    const items: OutfitItem[] = []

    if (selectedTop) {
      items.push({
        item: selectedTop,
        left: selectedTop.left ?? DEFAULT_LAYOUT.top.left,
        bottom: selectedTop.bottom ?? DEFAULT_LAYOUT.top.bottom,
        width: selectedTop.width ?? DEFAULT_LAYOUT.top.width,
        scale: selectedTop.scale ?? DEFAULT_LAYOUT.top.scale,
      })
    }

    if (selectedBottom) {
      items.push({
        item: selectedBottom,
        left: selectedBottom.left ?? DEFAULT_LAYOUT.bottom.left,
        bottom: selectedBottom.bottom ?? DEFAULT_LAYOUT.bottom.bottom,
        width: selectedBottom.width ?? DEFAULT_LAYOUT.bottom.width,
        scale: selectedBottom.scale ?? DEFAULT_LAYOUT.bottom.scale,
      })
    }

    if (selectedOuterwear) {
      // If no top is selected, use top's position for outerwear
      const useTopPosition = !selectedTop
      const defaultLayout = useTopPosition ? DEFAULT_LAYOUT.top : DEFAULT_LAYOUT.outerwear

      items.push({
        item: selectedOuterwear,
        left: selectedOuterwear.left ?? defaultLayout.left,
        bottom: selectedOuterwear.bottom ?? defaultLayout.bottom,
        width: selectedOuterwear.width ?? defaultLayout.width,
        scale: selectedOuterwear.scale ?? defaultLayout.scale,
      })
    }

    setOutfitItems(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTop, selectedBottom, selectedOuterwear])

  // DRAG AND DROP SYSTEM
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setIsDragging(true)
    setDraggedItemId(itemId)

    const currentItem = outfitItems.find((outfitItem) => outfitItem.item.id === itemId)
    if (currentItem) {
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        itemLeft: currentItem.left,
        itemBottom: currentItem.bottom,
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedItemId) return

      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      // Container size: w-80 = 320px, h-[36rem] = 576px (increased height)
      const containerWidth = 320
      const containerHeight = 576

      const leftDelta = (deltaX / containerWidth) * 100
      const bottomDelta = -(deltaY / containerHeight) * 20

      const newLeft = Math.max(0, Math.min(100, dragStartPos.current.itemLeft + leftDelta))
      const newBottom = Math.max(0, Math.min(20, dragStartPos.current.itemBottom + bottomDelta))

      // Update item position
      setOutfitItems((prev) =>
        prev.map((outfitItem) =>
          outfitItem.item.id === draggedItemId
            ? { ...outfitItem, left: newLeft, bottom: newBottom }
            : outfitItem,
        ),
      )
    },
    [isDragging, draggedItemId],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "grabbing"
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "auto"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "auto"
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleWidthChange = (itemId: string, newWidth: number) => {
    setOutfitItems((prev) =>
      prev.map((outfitItem) =>
        outfitItem.item.id === itemId ? { ...outfitItem, width: newWidth } : outfitItem,
      ),
    )
  }

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    }
  }, [show])

  const fetchClothingItems = async () => {
    try {
      setLoadingClothing(true)
      const axios = createAuthenticatedAxios()
      const response = await axios.get("/api/clothes")

      const allItems = response.data || []
      
      // FIXED: Use consistent categorization that matches ClothingItemSelectModal
      const categorizedItems = {
        tops: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          // Only basic tops - moved sweater, hoodie, cardigan to outerwear
          return ["t-shirt", "dress", "shirt", "blouse"].includes(type)
        }),
        bottoms: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          return ["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)
        }),
        outerwear: allItems.filter((item: ClothingItem) => {
          const type = item.type?.toLowerCase() || ""
          // FIXED: Include sweater, hoodie, cardigan in outerwear to match ClothingItemSelectModal
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
  }

  const handleItemSelect = (category: "top" | "bottom" | "outerwear", item: ClothingItem) => {
    switch (category) {
      case "top":
        setSelectedTop(item)
        setShowTopSelectModal(false)
        break
      case "bottom":
        setSelectedBottom(item)
        setShowBottomSelectModal(false)
        break
      case "outerwear":
        setSelectedOuterwear(item)
        setShowOuterwearSelectModal(false)
        break
    }
    setAnimationKey((prev) => prev + 1)
  }

  const removeItem = (category: "top" | "bottom" | "outerwear") => {
    switch (category) {
      case "top":
        setSelectedTop(null)
        break
      case "bottom":
        setSelectedBottom(null)
        break
      case "outerwear":
        setSelectedOuterwear(null)
        break
    }
    setSelectedItemForResize(null)
    setAnimationKey((prev) => prev + 1)
  }

  const shuffleOutfit = () => {
    // Reset current selections
    setSelectedTop(null)
    setSelectedBottom(null)
    setSelectedOuterwear(null)

    // Select random items
    if (clothingItems.tops.length > 0) {
      const randomTop = clothingItems.tops[Math.floor(Math.random() * clothingItems.tops.length)]
      setSelectedTop(randomTop)
    }
    if (clothingItems.bottoms.length > 0) {
      const randomBottom = clothingItems.bottoms[Math.floor(Math.random() * clothingItems.bottoms.length)]
      setSelectedBottom(randomBottom)
    }
    if (clothingItems.outerwear.length > 0 && Math.random() > 0.5) {
      const randomOuterwear = clothingItems.outerwear[Math.floor(Math.random() * clothingItems.outerwear.length)]
      setSelectedOuterwear(randomOuterwear)
    }
    setAnimationKey((prev) => prev + 1)
  }

  const resetLayout = () => {
    setOutfitItems((prev) =>
      prev.map((outfitItem) => {
        const category = getItemCategory(outfitItem.item)
        const defaultLayout = DEFAULT_LAYOUT[category as keyof typeof DEFAULT_LAYOUT] || DEFAULTS
        return {
          ...outfitItem,
          left: defaultLayout.left,
          bottom: defaultLayout.bottom,
          width: defaultLayout.width,
          scale: defaultLayout.scale,
        }
      }),
    )
  }

  // FIXED: Updated getItemCategory to match ClothingItemSelectModal
  const getItemCategory = (item: ClothingItem): string => {
    const type = item.type?.toLowerCase() || ""
    if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
      return "top"
    }
    if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
      return "bottom"
    }
    if (["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(type)) {
      return "outerwear"
    }
    return "other"
  }

  const isFormValid = () => {
    return selectedBottom && (selectedTop || selectedOuterwear)
  }

  const handleCreateOutfit = async () => {
    if (!isFormValid()) return

    try {
      setIsCreating(true)

      // Prepare items with their positioning data - using the exact API format
      const itemsToSave = outfitItems.map((outfitItem) => ({
        clothingId: outfitItem.item.id,
        x: 0, // Keep existing x/y for backward compatibility
        y: 0,
        scale: outfitItem.scale,
        left: outfitItem.left,
        bottom: outfitItem.bottom,
        width: outfitItem.width,
      }))

      const outfitData = {
        name: outfitName.trim() || `Outfit ${new Date().getTime()}`,
        clothingItems: itemsToSave,
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits`, outfitData, {
        withCredentials: true,
      })

      onOutfitCreated()
      handleCloseModal()
    } catch (error) {
      console.error("Error creating outfit:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedTop(null)
    setSelectedBottom(null)
    setSelectedOuterwear(null)
    setOutfitItems([])
    setOutfitName("")
    setAnimationKey((prev) => prev + 1)
    setSelectedItemForResize(null)
    setDraggedItemId(null)
    onCloseAction()
  }

  const handleDeselectClick = (e: React.MouseEvent) => {
    // Only deselect if clicking the background, not interactive elements
    e.stopPropagation() // Prevent modal close
    if (e.target === e.currentTarget) {
      setSelectedItemForResize(null)
    }
  }

  const getLayerOrder = (item: ClothingItem) => {
    const itemType = item.type?.toLowerCase() || ""

    // Bottoms go in back
    if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(itemType)) {
      return 1 // Bottom layer
    }

    // ALL outerwear goes BEHIND tops (jackets, sweaters, hoodies, etc.)
    if (["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(itemType)) {
      return 2 // Behind tops
    }

    // Regular tops go in front of outerwear
    if (["t-shirt", "dress", "shirt", "blouse"].includes(itemType)) {
      return 3 // Front layer
    }

    return 3 // Default
  }

  const renderOutfitDisplay = () => {
    return (
      // FIXED: Increased height from h-[32rem] to h-[36rem] to prevent bottom cutoff
      <div className="relative w-80 h-[36rem] mx-auto bg-white dark:bg-slate-900 chrome:bg-card border-2 border-slate-200 dark:border-slate-700 chrome:border-border rounded-xl shadow-lg overflow-hidden">
        {/* Canvas Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)
            `,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {outfitItems.map((outfitItem, index) => {
          const item = outfitItem.item

          // Apply coordinate adjustments similar to OutfitCard
          let adjustedLeft = outfitItem.left
          const isPants = ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || "")

          if (isPants) {
            adjustedLeft = adjustedLeft - 42
          } else {
            const distanceFromCenter = Math.abs(adjustedLeft - 50)
            const adjustmentFactor = Math.max(0.7, 1 - distanceFromCenter / 100)
            const baseAdjustment = 39
            const finalAdjustment = baseAdjustment * adjustmentFactor
            adjustedLeft = adjustedLeft - finalAdjustment
          }

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                left: `${adjustedLeft}%`,
                bottom: `${outfitItem.bottom}rem`,
                width: `${outfitItem.width}rem`,
                scale: outfitItem.scale
              }}
              transition={{
                delay: index * 0.1,
                width: { duration: 0.2, ease: "easeOut" },
                scale: { duration: 0.2, ease: "easeOut" },
                left: { duration: 0.2, ease: "easeOut" },
                bottom: { duration: 0.2, ease: "easeOut" }
              }}
              className={`absolute cursor-move hover:shadow-lg clothing-item-smooth ${
                draggedItemId === item.id ? "z-50 shadow-2xl dragging" : ""
              } ${selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""}`}
              style={{
                transform: `translateX(-50%)`,
                zIndex: draggedItemId === item.id ? 50 : selectedItemForResize === item.id ? 30 : getLayerOrder(item)
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedItemForResize(selectedItemForResize === item.id ? null : item.id)
              }}
            >
              <Image
                src={item.url || "/placeholder.svg"}
                alt={item.name || "Clothing item"}
                width={200}
                height={200}
                className="w-full h-full object-contain pointer-events-none select-none"
                unoptimized
                draggable={false}
              />
            </motion.div>
          )
        })}

        {/* Empty state message */}
        {outfitItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👗</div>
              <p className="text-sm">Drag clothing items here</p>
            </div>
          </div>
        )}
      </div>
    )
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
            className="bg-white dark:bg-card chrome:bg-card rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-border chrome:border-border bg-slate-50 dark:bg-muted/30 chrome:bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground chrome:text-foreground">
                    Create New Outfit
                  </h2>
                  <p className="text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground text-sm mt-1">
                    Mix and match your clothing items with drag & drop positioning
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={shuffleOutfit} disabled={loadingClothing}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetLayout}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Layout
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Compact Selection */}
              <div className="w-72 border-r border-slate-200 dark:border-border chrome:border-border p-4 overflow-y-auto">
                {/* Outfit Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-2">
                    Outfit Name
                  </label>
                  <input
                    type="text"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    placeholder="Enter outfit name (optional)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-border chrome:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-background chrome:bg-background"
                  />
                </div>

                {/* Compact Selection Areas */}
                <div className="space-y-3">
                  {/* Top Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-foreground chrome:text-foreground">
                        Top *
                      </label>
                      {selectedTop && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => removeItem("top")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-transparent justify-start"
                      onClick={() => setShowTopSelectModal(true)}
                      disabled={loadingClothing}
                    >
                      {selectedTop ? (
                        <div className="flex items-center">
                          <Image
                            src={selectedTop.url}
                            alt={selectedTop.name || "Top"}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain rounded mr-2"
                            unoptimized
                          />
                          <span className="text-sm truncate">{selectedTop.name || "Unnamed Top"}</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Select Top
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Bottom Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-foreground chrome:text-foreground">
                        Bottom *
                      </label>
                      {selectedBottom && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => removeItem("bottom")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-transparent justify-start"
                      onClick={() => setShowBottomSelectModal(true)}
                      disabled={loadingClothing}
                    >
                      {selectedBottom ? (
                        <div className="flex items-center">
                          <Image
                            src={selectedBottom.url}
                            alt={selectedBottom.name || "Bottom"}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain rounded mr-2"
                            unoptimized
                          />
                          <span className="text-sm truncate">{selectedBottom.name || "Unnamed Bottom"}</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Select Bottom
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Outerwear Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-foreground chrome:text-foreground">
                        Outerwear
                      </label>
                      {selectedOuterwear && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => removeItem("outerwear")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-transparent justify-start"
                      onClick={() => setShowOuterwearSelectModal(true)}
                      disabled={loadingClothing}
                    >
                      {selectedOuterwear ? (
                        <div className="flex items-center">
                          <Image
                            src={selectedOuterwear.url}
                            alt={selectedOuterwear.name || "Outerwear"}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain rounded mr-2"
                            unoptimized
                          />
                          <span className="text-sm truncate">{selectedOuterwear.name || "Unnamed Outerwear"}</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Outerwear
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center Panel - Outfit Preview */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-gradient-to-br from-muted/30 via-background to-muted/50 dark:from-background dark:via-muted/20 dark:to-card chrome:from-background chrome:via-muted chrome:to-card p-4 flex items-center justify-center" onClick={handleDeselectClick}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={animationKey}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      className="relative"
                    >
                      {renderOutfitDisplay()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Panel - Always Visible Item Controls */}
              <div className="w-72 border-l border-slate-200 dark:border-border chrome:border-border p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground chrome:text-foreground mb-4">
                  Item Controls
                </h3>

                {selectedItemForResize ? (
                  (() => {
                    const selectedOutfitItem = outfitItems.find((item) => item.item.id === selectedItemForResize)
                    if (!selectedOutfitItem) return null

                    return (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground mb-4">
                          Editing: {selectedOutfitItem.item.name || "Unnamed Item"}
                        </div>

                        {/* Width Control */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-2">
                            Size: {selectedOutfitItem.width.toFixed(1)}rem
                          </label>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleWidthChange(selectedItemForResize, Math.max(10, selectedOutfitItem.width - 0.5))
                              }
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <div className="flex-1 px-2">
                              <input
                                type="range"
                                min="10"
                                max="25"
                                step="0.1"
                                value={selectedOutfitItem.width}
                                onChange={(e) =>
                                  handleWidthChange(selectedItemForResize, Number.parseFloat(e.target.value))
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-full"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleWidthChange(selectedItemForResize, Math.min(25, selectedOutfitItem.width + 0.5))
                              }
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Position Info */}
                        <div className="text-sm text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground bg-slate-100 dark:bg-muted chrome:bg-muted p-3 rounded-lg">
                          <div>
                            Position: {selectedOutfitItem.left.toFixed(1)}%, {selectedOutfitItem.bottom.toFixed(1)}rem
                          </div>
                          <div className="mt-1 text-xs">Drag the item to reposition</div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={(e) => { e.stopPropagation(); setSelectedItemForResize(null); }}
                        >
                          Done Editing
                        </Button>
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-center text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                    <div className="mb-4">
                      <Move className="w-12 h-12 mx-auto opacity-30" />
                    </div>
                    <p className="text-sm leading-relaxed">
                      No Item Is Selected
                    </p>
                    <p className="text-xs mt-2 text-slate-400 dark:text-muted-foreground/70 chrome:text-muted-foreground/70">
                      Select An Item for further controls
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-border chrome:border-border bg-slate-50 dark:bg-muted/30 chrome:bg-muted/30">
              <div className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                {isFormValid() ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4 mr-1" />
                    Ready to create
                  </div>
                ) : (
                  "Select at least a top and bottom"
                )}
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleCreateOutfit(); }}
                  disabled={!isFormValid() || isCreating}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isCreating ? "Creating..." : "Create Outfit"}
                </Button>
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
    </>
  )
}