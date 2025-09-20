"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Shuffle, RotateCcw, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
import OutfitCard from "./OutfitCard"
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
}

interface CategorizedClothing {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  outerwear: ClothingItem[]
  allItems: ClothingItem[]
}

interface MockOutfit {
  id: string
  name?: string
  clothingItems: ClothingItem[]
  totalPrice?: number
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const [outfitName, setOutfitName] = useState("")

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    }
  }, [show])

  const fetchClothingItems = async () => {
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

  const handleRemoveItem = (category: "top" | "bottom" | "outerwear") => {
    if (category === "top") {
      setSelectedTop(null)
    } else if (category === "bottom") {
      setSelectedBottom(null)
    } else if (category === "outerwear") {
      setSelectedOuterwear(null)
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
  }

  const resetLayout = () => {
    setSelectedTop(null)
    setSelectedBottom(null)
    setSelectedOuterwear(null)
  }

  const createOutfit = async () => {
    const selectedItems = [selectedTop, selectedBottom, selectedOuterwear].filter(Boolean) as ClothingItem[]
    
    if (selectedItems.length === 0) {
      alert("Please select at least one clothing item.")
      return
    }

    setIsCreating(true)
    try {
      const clothingData = selectedItems.map((item, index) => ({
        clothingId: item.id,
        left: 50,
        bottom: index * 5,
        width: 16,
        scale: 1.2,
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
    setOutfitName("")
    onCloseAction()
  }

  // Create a mock outfit for the OutfitCard
  const mockOutfit: MockOutfit = {
    id: "preview",
    name: outfitName || "New Outfit",
    clothingItems: [selectedTop, selectedBottom, selectedOuterwear].filter(Boolean) as ClothingItem[],
    totalPrice: [selectedTop, selectedBottom, selectedOuterwear]
      .filter(Boolean)
      .reduce((total, item) => total + (item?.price || 0), 0)
  }

  const hasMinimumItems = selectedTop && selectedBottom

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
            className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Outfit Details */}
              <div className="w-96 border-r border-slate-200 dark:border-border p-6 overflow-y-auto bg-white dark:bg-card">
                {/* Outfit Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-foreground mb-2">
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

                {/* Top Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-foreground mb-3">
                    Top *
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowTopSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border rounded-xl p-4 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-muted/30 min-h-[200px] flex flex-col items-center justify-center"
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
                            <p className="font-medium text-slate-900 dark:text-foreground">
                              {selectedTop.name || "Untitled"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground capitalize">
                              {selectedTop.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-slate-400 dark:text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground">
                            Select Top
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedTop && (
                      <button
                        onClick={() => handleRemoveItem("top")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-foreground mb-3">
                    Bottom *
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowBottomSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border rounded-xl p-4 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-muted/30 min-h-[200px] flex flex-col items-center justify-center"
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
                            <p className="font-medium text-slate-900 dark:text-foreground">
                              {selectedBottom.name || "Untitled"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground capitalize">
                              {selectedBottom.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-slate-400 dark:text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground">
                            Select Bottom
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedBottom && (
                      <button
                        onClick={() => handleRemoveItem("bottom")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Outerwear Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-foreground mb-3">
                    Outerwear
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowOuterwearSelectModal(true)}
                      className="border-2 border-dashed border-slate-300 dark:border-border rounded-xl p-4 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-muted/30 min-h-[140px] flex flex-col items-center justify-center"
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
                            <p className="font-medium text-slate-900 dark:text-foreground text-sm">
                              {selectedOuterwear.name || "Untitled"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground capitalize">
                              {selectedOuterwear.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-6 h-6 text-slate-400 dark:text-muted-foreground mx-auto mb-2" />
                          <span className="text-sm text-slate-600 dark:text-muted-foreground">
                            Add Outerwear
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedOuterwear && (
                      <button
                        onClick={() => handleRemoveItem("outerwear")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Panel - Outfit Preview */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-muted/30">
                {mockOutfit.clothingItems.length > 0 ? (
                  <div className="w-80">
                    <OutfitCard
                      outfit={mockOutfit}
                      onDelete={() => {}}
                      onUpdate={() => {}}
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-500">
                    <div className="text-6xl mb-4">👗</div>
                    <p className="text-lg font-medium mb-2">No items selected</p>
                    <p className="text-sm">Choose a top and bottom to see your outfit preview</p>
                  </div>
                )}
              </div>

              {/* Right Panel - Item Controls */}
              <div className="w-80 border-l border-slate-200 dark:border-border p-6 bg-white dark:bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground">
                    Item Controls
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4 mb-8">
                  <Button variant="outline" size="sm" onClick={shuffleOutfit} disabled={loadingClothing} className="w-full">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetLayout} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Layout
                  </Button>
                </div>
                
                <div className="text-center py-8">
                  <div className="text-slate-400 dark:text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center">
                      <Move className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium mb-2">No Item Is Selected</p>
                    <p className="text-sm">Select An Item for further controls</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-border">
                  <p className="text-sm text-slate-600 dark:text-muted-foreground mb-4 text-center">
                    Select at least a top and bottom
                  </p>
                  <div className="space-y-3">
                    <Button variant="outline" onClick={handleCloseModal} className="w-full">
                      Cancel
                    </Button>
                    <Button 
                      onClick={createOutfit} 
                      disabled={!hasMinimumItems || isCreating}
                      className="w-full"
                    >
                      {isCreating ? "Creating..." : "Create Outfit"}
                    </Button>
                  </div>
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