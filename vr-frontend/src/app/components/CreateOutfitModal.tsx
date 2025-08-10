"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Shuffle, Check, Plus, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

interface OutfitItem {
  item: ClothingItem
  left: number
  bottom: number
  width: number
  scale: number
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null)
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null)
  const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null)
  const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [] })
  const [loadingClothing, setLoadingClothing] = useState(true)
  const [showTopSelectModal, setShowTopSelectModal] = useState(false)
  const [showBottomSelectModal, setShowBottomSelectModal] = useState(false)
  const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [selectedItemForResize, setSelectedItemForResize] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number, y: number, itemLeft: number, itemBottom: number }>({ x: 0, y: 0, itemLeft: 0, itemBottom: 0 })

  // Outfit items with positioning
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([])

  const DEFAULT_LAYOUT = {
    top: { left: 45, bottom: 8, width: 10, scale: 1 },
    bottom: { left: 50, bottom: 0, width: 10, scale: 1 },
    outerwear: { left: 64, bottom: 9, width: 10, scale: 1 },
  }

  const DEFAULTS = {
    left: 50,
    bottom: 0,
    width: 10,
    scale: 1,
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
}, [selectedTop, selectedBottom, selectedOuterwear])

  // DRAG AND DROP SYSTEM
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setIsDragging(true)
    setDraggedItemId(itemId)

    const currentItem = outfitItems.find(outfitItem => outfitItem.item.id === itemId)
    if (currentItem) {
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        itemLeft: currentItem.left,
        itemBottom: currentItem.bottom,
      }
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedItemId) return

    const deltaX = e.clientX - dragStartPos.current.x
    const deltaY = e.clientY - dragStartPos.current.y

    // Container size: w-44 = 176px, h-80 = 320px
    const containerWidth = 176
    const containerHeight = 320

    const leftDelta = (deltaX / containerWidth) * 100
    const bottomDelta = -(deltaY / containerHeight) * 20

    const newLeft = Math.max(0, Math.min(100, dragStartPos.current.itemLeft + leftDelta))
    const newBottom = Math.max(0, Math.min(20, dragStartPos.current.itemBottom + bottomDelta))

    // Update item position
    setOutfitItems(prev => prev.map(outfitItem => 
      outfitItem.item.id === draggedItemId
        ? { ...outfitItem, left: newLeft, bottom: newBottom }
        : outfitItem
    ))
  }, [isDragging, draggedItemId])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // RESIZE SYSTEM
  const handleWidthChange = useCallback((itemId: string, newWidth: number) => {
    setOutfitItems(prev => prev.map(outfitItem => 
      outfitItem.item.id === itemId
        ? { ...outfitItem, width: newWidth }
        : outfitItem
    ))
  }, [])

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    } else {
      // Reset state when modal closes
      setSelectedTop(null)
      setSelectedBottom(null)
      setSelectedOuterwear(null)
      setOutfitItems([])
      setAnimationKey(prev => prev + 1)
      setSelectedItemForResize(null)
      setDraggedItemId(null)
    }
  }, [show])

  const fetchClothingItems = async () => {
    try {
      setLoadingClothing(true)
      
      // Fetch both closet and wishlist items
      const [closetRes, wishlistRes] = await Promise.all([
        axios.get("http://localhost:8000/api/images?mode=closet", { withCredentials: true }),
        axios.get("http://localhost:8000/api/images?mode=wishlist", { withCredentials: true }),
      ])

      const closetItems: ClothingItem[] = (closetRes.data.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "closet",
      }))

      const wishlistItems: ClothingItem[] = (wishlistRes.data.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "wishlist",
      }))

      const allItems = [...closetItems, ...wishlistItems]

      const categorized: CategorizedClothing = {
        tops: allItems.filter((item: ClothingItem) =>
          ["t-shirt", "dress", "shirt", "blouse"].includes(
            item.type?.toLowerCase() || ""
          )
        ),
        bottoms: allItems.filter((item: ClothingItem) =>
          ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || "")
        ),
        outerwear: allItems.filter((item: ClothingItem) =>
          ["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(item.type?.toLowerCase() || "")
        ),
      }

      setClothingItems(categorized)
    } catch (error) {
      console.error("Error fetching clothing items:", error)
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
    setAnimationKey(prev => prev + 1)
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
    setAnimationKey(prev => prev + 1)
  }

  const shuffleOutfit = () => {
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
    setAnimationKey(prev => prev + 1)
  }

  const resetLayout = () => {
    setOutfitItems(prev => prev.map(outfitItem => {
      const category = getItemCategory(outfitItem.item)
      const defaultLayout = DEFAULT_LAYOUT[category as keyof typeof DEFAULT_LAYOUT] || DEFAULTS
      return {
        ...outfitItem,
        left: defaultLayout.left,
        bottom: defaultLayout.bottom,
        width: defaultLayout.width,
        scale: defaultLayout.scale,
      }
    }))
  }

  const getItemCategory = (item: ClothingItem): string => {
    const type = item.type?.toLowerCase() || ""
    if (["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(type)) {
      return "top"
    }
    if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
      return "bottom"
    }
    if (["jacket", "coat", "blazer", "vest"].includes(type)) {
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
      const itemsToSave = outfitItems.map(outfitItem => ({
        clothingId: outfitItem.item.id,
        x: 0, // Keep existing x/y for backward compatibility
        y: 0,
        scale: outfitItem.scale,
        left: outfitItem.left,
        bottom: outfitItem.bottom,
        width: outfitItem.width,
      }))

      const outfitData = {
        clothingItems: itemsToSave,
      }

      await axios.post("http://localhost:8000/api/outfits", outfitData, {
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
    setAnimationKey(prev => prev + 1)
    setSelectedItemForResize(null)
    setDraggedItemId(null)
    onCloseAction()
  }

  const getLayerOrder = (item: ClothingItem) => {
  const category = getItemCategory(item)
    switch (category) {
      case "outerwear": return 1  // Back layer
      case "bottom": return 2     // Middle layer  
      case "top": return 3        // Front layer
      default: return 2
    }
  }

  const renderOutfitDisplay = () => {
    return (
      <div className="relative w-44 h-80 mx-auto">
        {outfitItems.map((outfitItem, index) => {
          const item = outfitItem.item
          
          // Apply coordinate adjustments similar to OutfitCard
          let adjustedLeft = outfitItem.left;
          const isPants = ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || "");

          if (isPants) {
            adjustedLeft = adjustedLeft - 42;
          } else {
            const distanceFromCenter = Math.abs(adjustedLeft - 50);
            const adjustmentFactor = Math.max(0.7, 1 - (distanceFromCenter / 100));
            const baseAdjustment = 39;
            const finalAdjustment = baseAdjustment * adjustmentFactor;
            adjustedLeft = adjustedLeft - finalAdjustment;
          }

          return (
            <motion.div
              key={`${item.id}-${outfitItem.width}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`absolute cursor-move hover:shadow-lg transition-shadow ${
                draggedItemId === item.id ? "z-50 shadow-2xl" : ""
              } ${
                selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""
              }`}
              style={{
                left: `${adjustedLeft}%`,
                bottom: `${outfitItem.bottom}rem`,
                width: `${outfitItem.width}rem`,
                transform: `translateX(-50%) scale(${outfitItem.scale})`,
                zIndex: draggedItemId === item.id ? 50 : selectedItemForResize === item.id ? 40 : getLayerOrder(item),
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onClick={() => setSelectedItemForResize(item.id)}
            >
              <img
                src={item.url}
                alt={item.name || ""}
                className="w-full h-auto object-contain rounded-lg"
                draggable={false}
              />
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
                  <Move className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )
        })}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Outfit</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Mix and match your clothing items with drag & drop positioning
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={shuffleOutfit} disabled={loadingClothing}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button variant="outline" onClick={resetLayout}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Layout
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(95vh-180px)]">
              {/* Left Panel - Item Selection */}
              <div className="w-80 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Top Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Top *
                    </label>
                      {selectedTop ? (
                        <div 
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowTopSelectModal(true)}
                        >
                          <img src={selectedTop.url} alt={selectedTop.name} className="w-full h-32 object-contain rounded-lg border-2 border-green-200 bg-green-50" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem("top")
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                            {selectedTop.name || "Unnamed Top"}
                          </div>
                        </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-blue-400"
                        onClick={() => setShowTopSelectModal(true)}
                        disabled={loadingClothing}
                      >
                        <Plus className="w-6 h-6 mr-2" />
                        Select Top
                      </Button>
                    )}
                  </div>

                  {/* Bottom Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Bottom *
                    </label>
                      {selectedBottom ? (
                        <div 
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowBottomSelectModal(true)}
                        >
                          <img src={selectedBottom.url} alt={selectedBottom.name} className="w-full h-32 object-contain rounded-lg border-2 border-green-200 bg-green-50" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem("bottom")
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                            {selectedBottom.name || "Unnamed Bottom"}
                          </div>
                        </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-blue-400"
                        onClick={() => setShowBottomSelectModal(true)}
                        disabled={loadingClothing}
                      >
                        <Plus className="w-6 h-6 mr-2" />
                        Select Bottom
                      </Button>
                    )}
                  </div>

                  {/* Outerwear Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Outerwear
                    </label>
                      {selectedOuterwear ? (
                        <div 
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowOuterwearSelectModal(true)}
                        >
                          <img src={selectedOuterwear.url} alt={selectedOuterwear.name} className="w-full h-32 object-contain rounded-lg border-2 border-green-200 bg-green-50" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem("outerwear")
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                            {selectedOuterwear.name || "Unnamed Outerwear"}
                          </div>
                        </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-blue-400"
                        onClick={() => setShowOuterwearSelectModal(true)}
                        disabled={loadingClothing}
                      >
                        <Plus className="w-6 h-6 mr-2" />
                        Add Outerwear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Panel - Outfit Preview */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 p-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={animationKey}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", duration: 0.4 }}
                    >
                      {renderOutfitDisplay()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Panel - Controls */}
              {selectedItemForResize && (
                <div className="w-80 border-l border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Item Controls
                  </h3>
                  
                  {(() => {
                    const selectedOutfitItem = outfitItems.find(item => item.item.id === selectedItemForResize)
                    if (!selectedOutfitItem) return null

                    return (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          Editing: {selectedOutfitItem.item.name || "Unnamed Item"}
                        </div>
                        
                        {/* Width Control */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Size: {selectedOutfitItem.width.toFixed(1)}rem
                          </label>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWidthChange(selectedItemForResize, Math.max(6, selectedOutfitItem.width - 0.5))}
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <div className="flex-1 px-2">
                              <input
                                type="range"
                                min="6"
                                max="15"
                                step="0.1"
                                value={selectedOutfitItem.width}
                                onChange={(e) => handleWidthChange(selectedItemForResize, parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWidthChange(selectedItemForResize, Math.min(15, selectedOutfitItem.width + 0.5))}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Position Info */}
                        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                          <div>Position: {selectedOutfitItem.left.toFixed(1)}%, {selectedOutfitItem.bottom.toFixed(1)}rem</div>
                          <div className="mt-1 text-xs">Drag the item to reposition</div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelectedItemForResize(null)}
                        >
                          Done Editing
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="text-sm text-slate-600 dark:text-slate-400">
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
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOutfit}
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
        clothingItems={clothingItems.tops}
        onSelectItem={(item) => handleItemSelect("top", item)}
        viewMode="closet"
        selectedCategory="top"
      />

      <ClothingItemSelectModal
        isOpen={showBottomSelectModal}
        onCloseAction={() => setShowBottomSelectModal(false)}
        clothingItems={clothingItems.bottoms}
        onSelectItem={(item) => handleItemSelect("bottom", item)}
        viewMode="closet"
        selectedCategory="bottom"
      />

      <ClothingItemSelectModal
        isOpen={showOuterwearSelectModal}
        onCloseAction={() => setShowOuterwearSelectModal(false)}
        clothingItems={clothingItems.outerwear}
        onSelectItem={(item) => handleItemSelect("outerwear", item)}
        viewMode="closet"
        selectedCategory="outerwear"
      />
    </>
  )
}