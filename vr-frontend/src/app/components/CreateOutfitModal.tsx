"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Shuffle, RotateCcw } from "lucide-react"
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

      // FIXED: Updated container dimensions to match the actual CSS classes
      const containerWidth = 500 // w-[32rem] = 512px, adjusted to ~500px for better calculations
      const containerHeight = 600 // h-[38rem] = 608px, adjusted to ~600px

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

  // FIXED: Corrected API endpoint and data fetching
  const fetchClothingItems = async () => {
    try {
      setLoadingClothing(true)
      const axios = createAuthenticatedAxios()
      
      // FIXED: Use the correct endpoint /api/images instead of /api/clothes
      const [closetResponse, wishlistResponse] = await Promise.all([
        axios.get("/api/images?mode=closet"),
        axios.get("/api/images?mode=wishlist")
      ])

      const closetItems = closetResponse.data.clothingItems || []
      const wishlistItems = wishlistResponse.data.clothingItems || []
      const allItems = [...closetItems, ...wishlistItems]
      
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
    if (category === "top") {
      setSelectedTop(item)
    } else if (category === "bottom") {
      setSelectedBottom(item)
    } else if (category === "outerwear") {
      setSelectedOuterwear(item)
    }
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
    setAnimationKey((prev) => prev + 1)
  }

  const resetLayout = () => {
    setOutfitItems((prev) =>
      prev.map((outfitItem) => {
        if (outfitItem.item.id === selectedTop?.id) {
          return { ...outfitItem, ...DEFAULT_LAYOUT.top }
        } else if (outfitItem.item.id === selectedBottom?.id) {
          return { ...outfitItem, ...DEFAULT_LAYOUT.bottom }
        } else if (outfitItem.item.id === selectedOuterwear?.id) {
          const useTopPosition = !selectedTop
          const defaultLayout = useTopPosition ? DEFAULT_LAYOUT.top : DEFAULT_LAYOUT.outerwear
          return { ...outfitItem, ...defaultLayout }
        }
        return outfitItem
      }),
    )
  }

  const createOutfit = async () => {
    if (outfitItems.length === 0) {
      alert("Please select at least one clothing item.")
      return
    }

    setIsCreating(true)
    try {
      const clothingData = outfitItems.map((outfitItem) => ({
        clothingId: outfitItem.item.id,
        left: outfitItem.left,
        bottom: outfitItem.bottom,
        width: outfitItem.width,
        scale: outfitItem.scale,
        x: 0,
        y: 0,
      }))

      const axios = createAuthenticatedAxios()
      await axios.post("/api/outfits", {
        clothingItems: clothingData,
        name: outfitName || null,
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
    setOutfitItems([])
    setOutfitName("")
    setAnimationKey(0)
    onCloseAction()
  }

  const getLayerOrder = (item: ClothingItem): number => {
    const type = item.type?.toLowerCase() || ""
    if (["jacket", "coat", "blazer", "vest", "sweater", "hoodie", "cardigan"].includes(type)) {
      return 20 // Outerwear on top
    } else if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
      return 10 // Tops in middle
    } else {
      return 5 // Bottoms at bottom
    }
  }

  const renderDragDropArea = () => {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div 
          className="relative bg-slate-50 dark:bg-muted/20 border-2 border-dashed border-slate-300 dark:border-border rounded-xl overflow-hidden"
          style={{ 
            width: '32rem', // 512px
            height: '38rem', // 608px
            minWidth: '32rem',
            minHeight: '38rem'
          }}
        >
          {/* Outfit Items */}
          {outfitItems.map((outfitItem) => {
            const item = outfitItem.item
            return (
              <motion.div
                key={`${item.id}-${animationKey}`}
                className={`absolute cursor-grab select-none ${
                  draggedItemId === item.id 
                    ? "z-50 shadow-2xl dragging" : ""
                } ${selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""}`}
                style={{
                  left: `${outfitItem.left}%`,
                  bottom: `${outfitItem.bottom}%`,
                  width: `${outfitItem.width}%`,
                  transform: `translateX(-50%) scale(${outfitItem.scale})`,
                  zIndex: draggedItemId === item.id ? 50 : selectedItemForResize === item.id ? 30 : getLayerOrder(item)
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: outfitItem.scale, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                  <Input
                    type="text"
                    placeholder="Enter outfit name (optional)"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Category Selection - Compact Cards */}
                <div className="space-y-3">
                  {/* Top Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-2">
                      Top *
                    </label>
                    <div
                      onClick={() => setShowTopSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border chrome:border-border rounded-lg p-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 chrome:hover:border-slate-600 transition-colors"
                    >
                      {selectedTop ? (
                        <div className="flex items-center space-x-3">
                          <Image
                            src={selectedTop.url}
                            alt={selectedTop.name || "Selected top"}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-foreground chrome:text-foreground truncate">
                              {selectedTop.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                              {selectedTop.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2">
                          <Plus className="w-5 h-5 mr-2 text-slate-400 dark:text-muted-foreground chrome:text-muted-foreground" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                            Select Top
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-2">
                      Bottom *
                    </label>
                    <div
                      onClick={() => setShowBottomSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border chrome:border-border rounded-lg p-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 chrome:hover:border-slate-600 transition-colors"
                    >
                      {selectedBottom ? (
                        <div className="flex items-center space-x-3">
                          <Image
                            src={selectedBottom.url}
                            alt={selectedBottom.name || "Selected bottom"}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-foreground chrome:text-foreground truncate">
                              {selectedBottom.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                              {selectedBottom.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2">
                          <Plus className="w-5 h-5 mr-2 text-slate-400 dark:text-muted-foreground chrome:text-muted-foreground" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                            Select Bottom
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outerwear Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-2">
                      Outerwear
                    </label>
                    <div
                      onClick={() => setShowOuterwearSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border chrome:border-border rounded-lg p-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 chrome:hover:border-slate-600 transition-colors"
                    >
                      {selectedOuterwear ? (
                        <div className="flex items-center space-x-3">
                          <Image
                            src={selectedOuterwear.url}
                            alt={selectedOuterwear.name || "Selected outerwear"}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-foreground chrome:text-foreground truncate">
                              {selectedOuterwear.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                              {selectedOuterwear.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2">
                          <Plus className="w-5 h-5 mr-2 text-slate-400 dark:text-muted-foreground chrome:text-muted-foreground" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                            Add Outerwear
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Item Controls */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-foreground chrome:text-foreground mb-3">
                    Item Controls
                  </h3>
                  <div className="text-center py-8">
                    {selectedItemForResize ? (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground mb-2">
                          Item Selected
                        </p>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                              Width: {outfitItems.find((item) => item.item.id === selectedItemForResize)?.width}%
                            </label>
                            <input
                              type="range"
                              min="8"
                              max="30"
                              value={outfitItems.find((item) => item.item.id === selectedItemForResize)?.width || 16}
                              onChange={(e) =>
                                handleWidthChange(selectedItemForResize, Number.parseInt(e.target.value))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500 chrome:text-slate-500">
                        <div className="text-2xl mb-2">🎯</div>
                        <p className="text-sm">No Item Is Selected</p>
                        <p className="text-xs mt-1">Select An Item for further controls</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Panel - Drag & Drop Area */}
              {renderDragDropArea()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-border chrome:border-border bg-slate-50 dark:bg-muted/30 chrome:bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                  Select at least a top and bottom
                </p>
                <div className="space-x-3">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createOutfit} 
                    disabled={outfitItems.length === 0 || isCreating}
                    className="min-w-[120px]"
                  >
                    {isCreating ? "Creating..." : "Create Outfit"}
                  </Button>
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
    </>
  )
}