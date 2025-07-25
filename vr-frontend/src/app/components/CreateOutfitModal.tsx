"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Shuffle, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ClothingItemSelectModal from "./ClothingItemSelectModal"
import { Slider } from "@/components/ui/slider"
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
}

interface CategorizedClothing {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  outerwear: ClothingItem[]
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
  const [activeAdjust, setActiveAdjust] = useState<string | null>(null)
  const [topControls, setTopControls] = useState<{ left: number; bottom: number; width: number } | null>(null)
  const [bottomControls, setBottomControls] = useState<{ left: number; bottom: number; width: number } | null>(null)
  const [outerwearControls, setOuterwearControls] = useState<{ left: number; bottom: number; width: number } | null>(
    null,
  )
  const [topTransform, setTopTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [bottomTransform, setBottomTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [outerwearTransform, setOuterwearTransform] = useState({ x: 0, y: 0, scale: 1 })

  // Updated default layout to match the original positioning from the previous working version
  const DEFAULT_LAYOUT = {
    top: { left: 50, bottom: 8.4, width: 9 }, // Centered, middle height
    bottom: { left: 50, bottom: 0, width: 10 }, // Centered, at bottom
    outerwear: { left: 65, bottom: 10, width: 8 }, // Right side, slightly above top
  }

  const topImgRef = useRef<HTMLImageElement>(null)
  const bottomImgRef = useRef<HTMLImageElement>(null)
  const outerwearImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (show) {
      fetchClothingItems()
    }
  }, [show])

  const fetchClothingItems = async () => {
    setLoadingClothing(true)
    try {
      const [closetRes, wishlistRes] = await Promise.all([
        fetch("http://localhost:8000/api/images?mode=closet", { credentials: "include" }),
        fetch("http://localhost:8000/api/images?mode=wishlist", { credentials: "include" }),
      ])

      if (!closetRes.ok || !wishlistRes.ok) {
        throw new Error("Failed to fetch clothing items")
      }

      const [closetData, wishlistData] = await Promise.all([closetRes.json(), wishlistRes.json()])

      const closetItems: ClothingItem[] = (closetData.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "closet",
      }))
      const wishlistItems: ClothingItem[] = (wishlistData.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "wishlist",
      }))

      const allItems = [...closetItems, ...wishlistItems]

      const categorized = allItems.reduce<CategorizedClothing>(
        (acc, item) => {
          if (item.type) {
            const lowerCaseType = item.type.toLowerCase()
            if (["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(lowerCaseType)) {
              acc.tops.push(item)
            } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(lowerCaseType)) {
              acc.bottoms.push(item)
            } else if (["jacket", "coat", "blazer", "vest"].includes(lowerCaseType)) {
              acc.outerwear.push(item)
            }
          }
          return acc
        },
        { tops: [], bottoms: [], outerwear: [] },
      )

      setClothingItems(categorized)
    } catch (error) {
      console.error("Failed to fetch clothing items:", error)
    } finally {
      setLoadingClothing(false)
    }
  }

  const isFormValid = () => {
    return selectedTop !== null && selectedTop.id !== "none" && selectedBottom !== null && selectedBottom.id !== "none"
  }

  const handleCreateOutfit = async () => {
    if (!selectedTop && !selectedBottom && !selectedOuterwear) {
      alert("Please select at least one clothing item to create an outfit.")
      return
    }

    setIsCreating(true)

    const clothingItems: {
      clothingId: string
      x: number
      y: number
      scale: number
      left: number
      bottom: number
      width: number
    }[] = []

    if (selectedTop) {
      const x = topControls ? 0 : topTransform.x
      const y = topControls ? 0 : topTransform.y
      const scale = topControls ? topControls.width / DEFAULT_LAYOUT.top.width : topTransform.scale
      const left = topControls?.left ?? DEFAULT_LAYOUT.top.left
      const bottom = topControls?.bottom ?? DEFAULT_LAYOUT.top.bottom
      const width = topControls?.width ?? DEFAULT_LAYOUT.top.width

      clothingItems.push({
        clothingId: selectedTop.id,
        x,
        y,
        scale,
        left,
        bottom,
        width,
      })
    }

    if (selectedBottom) {
      const x = bottomControls ? 0 : bottomTransform.x
      const y = bottomControls ? 0 : bottomTransform.y
      const scale = bottomControls ? bottomControls.width / DEFAULT_LAYOUT.bottom.width : bottomTransform.scale
      const left = bottomControls?.left ?? DEFAULT_LAYOUT.bottom.left
      const bottom = bottomControls?.bottom ?? DEFAULT_LAYOUT.bottom.bottom
      const width = bottomControls?.width ?? DEFAULT_LAYOUT.bottom.width

      clothingItems.push({
        clothingId: selectedBottom.id,
        x,
        y,
        scale,
        left,
        bottom,
        width,
      })
    }

    if (selectedOuterwear) {
      const x = outerwearControls ? 0 : outerwearTransform.x
      const y = outerwearControls ? 0 : outerwearTransform.y
      const scale = outerwearControls
        ? outerwearControls.width / DEFAULT_LAYOUT.outerwear.width
        : outerwearTransform.scale
      const left = outerwearControls?.left ?? DEFAULT_LAYOUT.outerwear.left
      const bottom = outerwearControls?.bottom ?? DEFAULT_LAYOUT.outerwear.bottom
      const width = outerwearControls?.width ?? DEFAULT_LAYOUT.outerwear.width

      clothingItems.push({
        clothingId: selectedOuterwear.id,
        x,
        y,
        scale,
        left,
        bottom,
        width,
      })
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/outfits",
        {
          clothingItems,
        },
        {
          withCredentials: true,
        },
      )

      console.log("Outfit created:", response.data)
      onOutfitCreated()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to create outfit:", error)
      alert("Failed to create outfit. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedTop(null)
    setSelectedBottom(null)
    setSelectedOuterwear(null)
    setShowTopSelectModal(false)
    setShowBottomSelectModal(false)
    setShowOuterwearSelectModal(false)
    setTopControls(null)
    setBottomControls(null)
    setOuterwearControls(null)
    setActiveAdjust(null)
    onCloseAction()
  }

  const getRandomItem = <T,>(arr: T[]): T | null =>
    arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null

  const handleRandomize = () => {
    const sources: ("closet" | "wishlist")[] = ["closet", "wishlist"]
    const filterBySource = (items: ClothingItem[]): ClothingItem[] =>
      items.filter((item: ClothingItem) => sources.includes(item.mode))

    const tops = filterBySource(clothingItems.tops)
    const bottoms = filterBySource(clothingItems.bottoms)
    const outerwear = filterBySource(clothingItems.outerwear)

    setSelectedTop(getRandomItem(tops))
    setSelectedBottom(getRandomItem(bottoms))
    setSelectedOuterwear(getRandomItem(outerwear))

    setAnimationKey((prev) => prev + 1)
  }

  if (!show) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleCloseModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Outfit</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRandomize}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Outfit Preview */}
              <div className="order-2 lg:order-1">
                <Card className="h-[500px]">
                  <CardContent className="h-full p-6">
                    <div className="h-full relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
                      <motion.div
                        key={animationKey}
                        className="relative w-44 h-80 mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {/* Bottom (pants) - Layer 1 (bottom layer) */}
                        {selectedBottom && (
                          <motion.img
                            ref={bottomImgRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            src={selectedBottom.url}
                            alt="Bottom"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 z-10"
                            style={
                              bottomControls
                                ? {
                                    left: `${bottomControls.left}%`,
                                    bottom: `${bottomControls.bottom}rem`,
                                    width: `${bottomControls.width}rem`,
                                    position: "absolute",
                                    transform: "translateX(-50%)",
                                    zIndex: 10,
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "bottom" ? "0 0 0 3px #a78bfa" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                                : {
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "bottom" ? "0 0 0 3px #a78bfa" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                            }
                            onClick={() => setActiveAdjust(activeAdjust === "bottom" ? null : "bottom")}
                          />
                        )}

                        {/* Outerwear - Layer 2 (middle layer - behind shirt) */}
                        {selectedOuterwear && (
                          <motion.img
                            ref={outerwearImgRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            src={selectedOuterwear.url}
                            alt="Outerwear"
                            className="absolute bottom-[10rem] left-[65%] -translate-x-1/2 w-32 z-20"
                            style={
                              outerwearControls
                                ? {
                                    left: `${outerwearControls.left}%`,
                                    bottom: `${outerwearControls.bottom}rem`,
                                    width: `${outerwearControls.width}rem`,
                                    position: "absolute",
                                    transform: "translateX(-50%)",
                                    zIndex: 20,
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "outerwear" ? "0 0 0 3px #fbbf24" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                                : {
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "outerwear" ? "0 0 0 3px #fbbf24" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                            }
                            onClick={() => setActiveAdjust(activeAdjust === "outerwear" ? null : "outerwear")}
                          />
                        )}

                        {/* Top (shirt) - Layer 3 (top layer - on top of everything) */}
                        {selectedTop && (
                          <motion.img
                            ref={topImgRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            src={selectedTop.url}
                            alt="Top"
                            className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-36 z-30"
                            style={
                              topControls
                                ? {
                                    left: `${topControls.left}%`,
                                    bottom: `${topControls.bottom}rem`,
                                    width: `${topControls.width}rem`,
                                    position: "absolute",
                                    transform: "translateX(-50%)",
                                    zIndex: 30,
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "top" ? "0 0 0 3px #22d3ee" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                                : {
                                    cursor: "pointer",
                                    boxShadow: activeAdjust === "top" ? "0 0 0 3px #22d3ee" : undefined,
                                    borderRadius: "0.5rem",
                                  }
                            }
                            onClick={() => setActiveAdjust(activeAdjust === "top" ? null : "top")}
                          />
                        )}

                        {/* Empty state */}
                        {!selectedTop && !selectedBottom && !selectedOuterwear && (
                          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                            <div className="text-center">
                              <p className="text-lg font-semibold mb-2">No items selected</p>
                              <p className="text-sm">Select items to preview</p>
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {/* Adjustment Panel */}
                      {activeAdjust && (
                        <div
                          className="absolute left-1/2 top-full -translate-x-1/2 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow p-4 w-full max-w-md z-50"
                          style={{ minWidth: 320 }}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveAdjust(null)}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">
                            {activeAdjust === "top" && "Adjust Top Position & Size"}
                            {activeAdjust === "bottom" && "Adjust Bottom Position & Size"}
                            {activeAdjust === "outerwear" && "Adjust Outerwear Position & Size"}
                          </div>
                          <div className="flex flex-col gap-2">
                            {activeAdjust === "top" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Left</span>
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={[topControls?.left ?? DEFAULT_LAYOUT.top.left]}
                                    onValueChange={([v]) => {
                                      setTopControls((prev) => ({
                                        left: v,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.top.bottom,
                                        width: prev?.width ?? DEFAULT_LAYOUT.top.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {topControls?.left ?? DEFAULT_LAYOUT.top.left}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Bottom</span>
                                  <Slider
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    value={[topControls?.bottom ?? DEFAULT_LAYOUT.top.bottom]}
                                    onValueChange={([v]) => {
                                      setTopControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.top.left,
                                        bottom: v,
                                        width: prev?.width ?? DEFAULT_LAYOUT.top.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {topControls?.bottom ?? DEFAULT_LAYOUT.top.bottom}rem
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Width</span>
                                  <Slider
                                    min={4}
                                    max={20}
                                    step={0.1}
                                    value={[topControls?.width ?? DEFAULT_LAYOUT.top.width]}
                                    onValueChange={([v]) => {
                                      setTopControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.top.left,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.top.bottom,
                                        width: v,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {topControls?.width ?? DEFAULT_LAYOUT.top.width}rem
                                  </span>
                                </div>
                                <div className="flex justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setTopControls(null)}>
                                    Reset
                                  </Button>
                                </div>
                              </>
                            )}
                            {activeAdjust === "bottom" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Left</span>
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={[bottomControls?.left ?? DEFAULT_LAYOUT.bottom.left]}
                                    onValueChange={([v]) => {
                                      setBottomControls((prev) => ({
                                        left: v,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.bottom.bottom,
                                        width: prev?.width ?? DEFAULT_LAYOUT.bottom.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {bottomControls?.left ?? DEFAULT_LAYOUT.bottom.left}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Bottom</span>
                                  <Slider
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    value={[bottomControls?.bottom ?? DEFAULT_LAYOUT.bottom.bottom]}
                                    onValueChange={([v]) => {
                                      setBottomControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.bottom.left,
                                        bottom: v,
                                        width: prev?.width ?? DEFAULT_LAYOUT.bottom.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {bottomControls?.bottom ?? DEFAULT_LAYOUT.bottom.bottom}rem
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Width</span>
                                  <Slider
                                    min={4}
                                    max={16}
                                    step={0.1}
                                    value={[bottomControls?.width ?? DEFAULT_LAYOUT.bottom.width]}
                                    onValueChange={([v]) => {
                                      setBottomControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.bottom.left,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.bottom.bottom,
                                        width: v,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {bottomControls?.width ?? DEFAULT_LAYOUT.bottom.width}rem
                                  </span>
                                </div>
                                <div className="flex justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setBottomControls(null)}>
                                    Reset
                                  </Button>
                                </div>
                              </>
                            )}
                            {activeAdjust === "outerwear" && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Left</span>
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={[outerwearControls?.left ?? DEFAULT_LAYOUT.outerwear.left]}
                                    onValueChange={([v]) => {
                                      setOuterwearControls((prev) => ({
                                        left: v,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.outerwear.bottom,
                                        width: prev?.width ?? DEFAULT_LAYOUT.outerwear.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {outerwearControls?.left ?? DEFAULT_LAYOUT.outerwear.left}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Bottom</span>
                                  <Slider
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    value={[outerwearControls?.bottom ?? DEFAULT_LAYOUT.outerwear.bottom]}
                                    onValueChange={([v]) => {
                                      setOuterwearControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.outerwear.left,
                                        bottom: v,
                                        width: prev?.width ?? DEFAULT_LAYOUT.outerwear.width,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {outerwearControls?.bottom ?? DEFAULT_LAYOUT.outerwear.bottom}rem
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Width</span>
                                  <Slider
                                    min={4}
                                    max={16}
                                    step={0.1}
                                    value={[outerwearControls?.width ?? DEFAULT_LAYOUT.outerwear.width]}
                                    onValueChange={([v]) => {
                                      setOuterwearControls((prev) => ({
                                        left: prev?.left ?? DEFAULT_LAYOUT.outerwear.left,
                                        bottom: prev?.bottom ?? DEFAULT_LAYOUT.outerwear.bottom,
                                        width: v,
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right">
                                    {outerwearControls?.width ?? DEFAULT_LAYOUT.outerwear.width}rem
                                  </span>
                                </div>
                                <div className="flex justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setOuterwearControls(null)}>
                                    Reset
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Item Selection */}
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Your Pieces</h3>

                {/* Outerwear Selection */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedOuterwear
                        ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20"
                        : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    }`}
                    onClick={() => setShowOuterwearSelectModal(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {selectedOuterwear ? (
                            <img
                              src={selectedOuterwear.url || "/placeholder.svg"}
                              alt={selectedOuterwear.name || "Outerwear"}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl text-slate-400">🧥</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {selectedOuterwear ? selectedOuterwear.name || "Selected Outerwear" : "Outerwear"}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {selectedOuterwear ? "Click to change" : "Optional - Click to select"}
                          </p>
                          {selectedOuterwear?.mode === "wishlist" && (
                            <Badge className="mt-1 bg-amber-500">Wishlist</Badge>
                          )}
                        </div>
                        {!selectedOuterwear && <Plus className="w-5 h-5 text-slate-400" />}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Top Selection */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTop
                        ? "ring-2 ring-green-500 shadow-lg bg-green-50 dark:bg-green-900/20"
                        : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                    }`}
                    onClick={() => setShowTopSelectModal(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {selectedTop ? (
                            <img
                              src={selectedTop.url || "/placeholder.svg"}
                              alt={selectedTop.name || "Top"}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl text-slate-400">👕</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {selectedTop ? selectedTop.name || "Selected Top" : "Top"}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {selectedTop ? "Click to change" : "Required - Click to select"}
                          </p>
                          {selectedTop?.mode === "wishlist" && <Badge className="mt-1 bg-amber-500">Wishlist</Badge>}
                        </div>
                        {!selectedTop && <Plus className="w-5 h-5 text-slate-400" />}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom Selection */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedBottom
                        ? "ring-2 ring-purple-500 shadow-lg bg-purple-50 dark:bg-purple-900/20"
                        : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                    }`}
                    onClick={() => setShowBottomSelectModal(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {selectedBottom ? (
                            <img
                              src={selectedBottom.url || "/placeholder.svg"}
                              alt={selectedBottom.name || "Bottom"}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl text-slate-400">👖</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {selectedBottom ? selectedBottom.name || "Selected Bottom" : "Bottom"}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {selectedBottom ? "Click to change" : "Required - Click to select"}
                          </p>
                          {selectedBottom?.mode === "wishlist" && <Badge className="mt-1 bg-amber-500">Wishlist</Badge>}
                        </div>
                        {!selectedBottom && <Plus className="w-5 h-5 text-slate-400" />}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  "Create Outfit"
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Selection Modals */}
        <ClothingItemSelectModal
          isOpen={showOuterwearSelectModal}
          onCloseAction={() => setShowOuterwearSelectModal(false)}
          clothingItems={[
            ...clothingItems.outerwear,
            { id: "none", url: "", name: "Select None", mode: "closet" as const },
          ]}
          onSelectItem={(item) => {
            setSelectedOuterwear(item.id === "none" ? null : item)
            setOuterwearControls(null)
            setShowOuterwearSelectModal(false)
            setAnimationKey((prev) => prev + 1)
          }}
          viewMode={clothingItems.outerwear.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
          selectedCategory="outerwear"
        />

        <ClothingItemSelectModal
          isOpen={showTopSelectModal}
          onCloseAction={() => setShowTopSelectModal(false)}
          clothingItems={clothingItems.tops}
          onSelectItem={(item) => {
            setSelectedTop(item)
            setTopControls(null)
            setShowTopSelectModal(false)
            setAnimationKey((prev) => prev + 1)
          }}
          viewMode={clothingItems.tops.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
          selectedCategory="top"
        />

        <ClothingItemSelectModal
          isOpen={showBottomSelectModal}
          onCloseAction={() => setShowBottomSelectModal(false)}
          clothingItems={clothingItems.bottoms}
          onSelectItem={(item) => {
            setSelectedBottom(item)
            setBottomControls(null)
            setShowBottomSelectModal(false)
            setAnimationKey((prev) => prev + 1)
          }}
          viewMode={clothingItems.bottoms.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
          selectedCategory="bottom"
        />
      </motion.div>
    </AnimatePresence>
  )
}
