"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { ArrowLeft, Edit3, Trash2, Save, X, AlertTriangle, Shirt, DollarSign, Tag, Folder, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import ClothingModal from "../../components/ClothingModal"
import ClothingItemSelectModal from "../../components/ClothingItemSelectModal"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  key?: string
  mode: "closet" | "wishlist"
  x?: number
  y?: number
  scale?: number
  left?: number
  bottom?: number
  width?: number
}

interface CategorizedOutfitItems {
  outerwear?: ClothingItem
  top?: ClothingItem
  bottom?: ClothingItem
  shoe?: ClothingItem
  others: ClothingItem[]
}

interface Outfit {
  id: string
  name?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  totalPrice?: number
  clothingItems: ClothingItem[]
}

interface OutfitDetailPageProps {
  params: Promise<{ outfitId: string }>
}

export default function OutfitDetailPage({ params }: OutfitDetailPageProps) {
  const router = useRouter()
  const { outfitId } = use(params)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedOutfit, setEditedOutfit] = useState<Partial<Outfit>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const [allClothingItems, setAllClothingItems] = useState<ClothingItem[]>([])
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [selectModalCategory, setSelectModalCategory] = useState<"outerwear" | "top" | "bottom" | "shoe" | null>(null)
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [originalCategorizedItems, setOriginalCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getItemCategory = useCallback((item: ClothingItem): "top" | "bottom" | "outerwear" | "shoe" | "others" => {
    const type = item.type?.toLowerCase() || ""
    if (["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(type)) {
      return "top"
    } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
      return "bottom"
    } else if (["jacket", "coat", "blazer", "vest"].includes(type)) {
      return "outerwear"
    } else if (["shoes", "boots", "sneakers", "sandals"].includes(type)) {
      return "shoe"
    } else {
      return "others"
    }
  }, [])

  const categorizeOutfitItems = useCallback(
    (items: ClothingItem[]): CategorizedOutfitItems => {
      const categorized: CategorizedOutfitItems = { others: [] }
      items.forEach((item) => {
        const category = getItemCategory(item)
        if (category === "outerwear") {
          categorized.outerwear = item
        } else if (category === "top") {
          categorized.top = item
        } else if (category === "bottom") {
          categorized.bottom = item
        } else if (category === "shoe") {
          categorized.shoe = item
        } else {
          categorized.others.push(item)
        }
      })
      return categorized
    },
    [getItemCategory],
  )

  // Helper to check if any item has custom layout (same logic as OutfitCard)
  const hasCustomLayout = useCallback((items: ClothingItem[]): boolean => {
    const DEFAULTS = {
      x: 0,
      y: 0,
      scale: 1,
      left: 50,
      bottom: 0,
      width: 10,
    }

    return items.some(
      (item) =>
        (item.x !== undefined && item.x !== DEFAULTS.x) ||
        (item.y !== undefined && item.y !== DEFAULTS.y) ||
        (item.scale !== undefined && item.scale !== DEFAULTS.scale) ||
        (item.left !== undefined && item.left !== DEFAULTS.left) ||
        (item.bottom !== undefined && item.bottom !== DEFAULTS.bottom) ||
        (item.width !== undefined && item.width !== DEFAULTS.width),
    )
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [outfitRes, wishlistRes, closetRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/outfits/${outfitId}`, { withCredentials: true }),
        axios.get("http://localhost:8000/api/images?mode=wishlist", { withCredentials: true }),
        axios.get("http://localhost:8000/api/images?mode=closet", { withCredentials: true }),
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
      setAllClothingItems(allItems)

      const outfitClothingItemsWithMode = (outfitRes.data.outfit.clothingItems || [])
        .map((outfitItem: ClothingItem) => {
          const baseItem = allItems.find((item: ClothingItem) => item.id === outfitItem.id)
          if (baseItem) {
            return {
              ...baseItem,
              // Preserve coordinate data from the outfit
              x: outfitItem.x,
              y: outfitItem.y,
              scale: outfitItem.scale,
              left: outfitItem.left,
              bottom: outfitItem.bottom,
              width: outfitItem.width,
            }
          }
          return null
        })
        .filter((item: ClothingItem | null): item is ClothingItem => item !== null)

      const outfitWithFullItems = {
        ...outfitRes.data.outfit,
        clothingItems: outfitClothingItemsWithMode,
      }

      setOutfit(outfitWithFullItems)
      setEditedOutfit(outfitWithFullItems)
      setEditedCategorizedItems(categorizeOutfitItems(outfitWithFullItems.clothingItems))
      setOriginalCategorizedItems(categorizeOutfitItems(outfitWithFullItems.clothingItems))
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [outfitId, categorizeOutfitItems])

  useEffect(() => {
    if (outfitId) {
      fetchData()
    }
  }, [outfitId, fetchData])

  const handleDeleteOutfit = async () => {
    if (!outfit) return
    if (confirm(`Are you sure you want to delete this outfit${outfit.name ? `: ${outfit.name}` : ""}?`)) {
      try {
        await axios.delete(`http://localhost:8000/api/outfits/${outfit.id}`, {
          withCredentials: true,
        })
        router.push("/outfits")
      } catch (err: any) {
        console.error("Error deleting outfit:", err)
        alert(`Failed to delete outfit: ${err.message || "Unknown error"}`)
      }
    }
  }

  const handleEditOutfit = () => {
    // When entering edit mode, ensure items without custom coordinates get proper default positions
    if (editedCategorizedItems && !hasCustomLayout(Object.values(editedCategorizedItems).flat().filter(Boolean) as ClothingItem[])) {
      const updatedItems = { ...editedCategorizedItems }
      
      // Set default positions matching the default layout
      if (updatedItems.bottom) {
        updatedItems.bottom = {
          ...updatedItems.bottom,
          left: 50,
          bottom: 0,
          width: 14.4, // 36 units / 2.5 ratio for responsive scaling
          scale: 1,
        }
      }
      
      if (updatedItems.top) {
        updatedItems.top = {
          ...updatedItems.top,
          left: 50,
          bottom: 8.4,
          width: 12.8, // 32 units / 2.5 ratio
          scale: 1,
        }
      }
      
      if (updatedItems.outerwear) {
        updatedItems.outerwear = {
          ...updatedItems.outerwear,
          left: 50,
          bottom: 8.8,
          width: 12.8, // 32 units / 2.5 ratio
          scale: 1,
        }
      }
      
      if (updatedItems.shoe) {
        updatedItems.shoe = {
          ...updatedItems.shoe,
          left: 50,
          bottom: 0,
          width: 11.2, // 28 units / 2.5 ratio
          scale: 1,
        }
      }
      
      // Position other items around the outfit
      updatedItems.others = updatedItems.others.map((item, index) => ({
        ...item,
        left: index % 2 === 0 ? 20 : 80,
        bottom: 5 + index * 3,
        width: 4,
        scale: 1,
      }))
      
      setEditedCategorizedItems(updatedItems)
    }
    
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!outfit || !editedCategorizedItems) return

    try {
      const clothingItemsToSave = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...editedCategorizedItems.others,
      ].filter((item) => item !== undefined) as ClothingItem[]

      const outfitData = {
        ...editedOutfit,
        price: editedOutfit.price || editedOutfit.totalPrice,
        clothingItems: clothingItemsToSave.map((item) => ({
          id: item.id,
          left: item.left,
          bottom: item.bottom,
          width: item.width,
          scale: item.scale,
        })),
      }

      const res = await axios.put(`http://localhost:8000/api/outfits/${outfit.id}`, outfitData, {
        withCredentials: true,
      })

      const updatedOutfitWithFullItems = {
        ...res.data.outfit,
        clothingItems: clothingItemsToSave,
      }

      setOutfit(updatedOutfitWithFullItems)
      setEditedOutfit(updatedOutfitWithFullItems)
      setEditedCategorizedItems(categorizeOutfitItems(clothingItemsToSave))
      setOriginalCategorizedItems(categorizeOutfitItems(clothingItemsToSave))
      setIsEditing(false)
    } catch (err: any) {
      console.error("Error updating outfit:", err)
      alert(`Failed to update outfit: ${err.message || "Unknown error"}`)
    }
  }

  const handleCancelEdit = () => {
    if (outfit && originalCategorizedItems) {
      setEditedOutfit(outfit)
      setEditedCategorizedItems(originalCategorizedItems)
    }
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditedOutfit((prev) => ({
      ...prev,
      [name]: name === "price" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleOpenModal = (index: number) => {
    setSelectedItemIndex(index)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleOpenSelectModal = (category: "outerwear" | "top" | "bottom" | "shoe") => {
    setSelectModalCategory(category)
    setIsSelectModalOpen(true)
  }

  const handleCloseSelectModal = () => {
    setIsSelectModalOpen(false)
    setSelectModalCategory(null)
  }

  const handleSelectItemForOutfit = (selectedItem: ClothingItem) => {
    if (!editedCategorizedItems || !selectModalCategory) return

    const updatedCategorizedItems = { ...editedCategorizedItems }
    if (selectedItem.id === "none") {
      updatedCategorizedItems[selectModalCategory] = undefined
    } else {
      updatedCategorizedItems[selectModalCategory] = selectedItem
    }

    setEditedCategorizedItems(updatedCategorizedItems)
    handleCloseSelectModal()
  }

  // Drag handlers for canvas editing
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!isEditing) return

    setDraggedItem(itemId)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !isEditing || !editedCategorizedItems) return

    const canvas = e.currentTarget as HTMLElement
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y

    // Convert to percentage-based positioning
    const leftPercent = (x / rect.width) * 100
    const bottomRem = ((rect.height - y) / rect.height) * 20 // Assuming 20rem max height

    // Update the item position
    const updatedItems = { ...editedCategorizedItems }
    const updateItemPosition = (item: ClothingItem | undefined) => {
      if (item && item.id === draggedItem) {
        return {
          ...item,
          left: Math.max(0, Math.min(100, leftPercent)),
          bottom: Math.max(0, Math.min(20, bottomRem)),
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
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  // Scale change handler for resize sliders
  const handleScaleChange = useCallback((itemId: string, newScale: number) => {
    console.log("Scale change:", itemId, newScale)
    
    setEditedCategorizedItems(prevItems => {
      if (!prevItems) return prevItems

      const updatedItems = { ...prevItems }
      const updateItemScale = (item: ClothingItem | undefined) => {
        if (item && item.id === itemId) {
          console.log("Updating item scale:", item.name, "from", item.scale, "to", newScale)
          return {
            ...item,
            scale: newScale,
          }
        }
        return item
      }

      updatedItems.outerwear = updateItemScale(updatedItems.outerwear)
      updatedItems.top = updateItemScale(updatedItems.top)
      updatedItems.bottom = updateItemScale(updatedItems.bottom)
      updatedItems.shoe = updateItemScale(updatedItems.shoe)
      updatedItems.others = updatedItems.others.map(updateItemScale).filter(Boolean) as ClothingItem[]

      console.log("Updated items:", updatedItems)
      return updatedItems
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading outfit details...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </motion.div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Outfit not found</h2>
          <p className="text-slate-600 dark:text-slate-400">The outfit you're looking for doesn't exist.</p>
        </motion.div>
      </div>
    )
  }

  // Get current items for display
  const currentCategorizedItems: CategorizedOutfitItems =
    isEditing && editedCategorizedItems ? editedCategorizedItems : categorizeOutfitItems(outfit.clothingItems)

  const allCurrentItems = [
    currentCategorizedItems.outerwear,
    currentCategorizedItems.top,
    currentCategorizedItems.bottom,
    currentCategorizedItems.shoe,
    ...currentCategorizedItems.others,
  ].filter(Boolean) as ClothingItem[]

  // console.log("Current items for rendering:", allCurrentItems.map(item => ({ id: item.id, name: item.name, scale: item.scale })))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button onClick={() => router.push("/outfits")} variant="outline" className="group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Outfits
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Outfit Preview */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-[700px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shirt className="w-5 h-5" />
                  <span>Outfit Preview</span>
                  {isEditing && (
                    <Badge variant="secondary" className="ml-2">
                      Drag to reposition • Use sliders to resize
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="h-[600px] relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 flex items-center justify-center rounded-xl overflow-hidden"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`preview-${allCurrentItems.map((i) => i.id).join("-")}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-full h-full"
                    >
                      {/* Use custom layout if any item has custom positioning, otherwise use default layout like OutfitCard */}
                      {hasCustomLayout(allCurrentItems) || isEditing ? (
                        <>
                          {allCurrentItems.map((item, index) => (
                            <motion.img
                              key={`${item.id}-${item.scale ?? 1}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              src={item.url}
                              alt={item.name || ""}
                              className={`absolute object-contain rounded-lg ${
                                isEditing ? "cursor-move hover:shadow-lg transition-shadow" : ""
                              } ${draggedItem === item.id ? "z-50 shadow-2xl" : ""}`}
                              style={{
                                left: `${item.left ?? 50}%`,
                                bottom: `${item.bottom ?? 0}rem`,
                                width: `${item.width ?? 10}rem`,
                                transform: `translateX(-50%) scale(${item.scale ?? 1})`,
                                zIndex: draggedItem === item.id ? 50 : index,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, item.id)}
                              draggable={false}
                            />
                          ))}
                          
                          {/* Resize sliders - only visible in edit mode */}
                          {isEditing && allCurrentItems.map((item, index) => (
                            <div
                              key={`slider-${item.id}`}
                              className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-200 dark:border-slate-700"
                              style={{
                                left: `${item.left ?? 50}%`,
                                bottom: `${(item.bottom ?? 0) + (item.width ?? 10) * 0.0625 + 1}rem`, // Position above the item
                                transform: "translateX(-50%)",
                                zIndex: 100,
                                minWidth: "140px"
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-8">
                                  Size
                                </span>
                                <Slider
                                  value={[item.scale ?? 1]}
                                  onValueChange={(value) => handleScaleChange(item.id, value[0])}
                                  min={0.3}
                                  max={2.0}
                                  step={0.1}
                                  className="flex-1"
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-right">
                                  {Math.round((item.scale ?? 1) * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        /* Default layout matching OutfitCard - centered in the container */
                        <div className="relative w-44 h-80 mx-auto">
                          {/* Bottom (pants) - Standardized size */}
                          {currentCategorizedItems.bottom && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              src={currentCategorizedItems.bottom.url}
                              alt={currentCategorizedItems.bottom.name || "Bottom"}
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 z-10 object-contain rounded-lg"
                            />
                          )}
                          {/* Top (shirt) - Standardized size */}
                          {currentCategorizedItems.top && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              src={currentCategorizedItems.top.url}
                              alt={currentCategorizedItems.top.name || "Top"}
                              className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-32 z-20 object-contain rounded-lg"
                            />
                          )}
                          {/* Outerwear - Standardized size */}
                          {currentCategorizedItems.outerwear && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              src={currentCategorizedItems.outerwear.url}
                              alt={currentCategorizedItems.outerwear.name || "Outerwear"}
                              className="absolute bottom-[8.8rem] left-1/2 -translate-x-1/2 w-32 z-30 object-contain rounded-lg"
                            />
                          )}
                          {/* Shoes */}
                          {currentCategorizedItems.shoe && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              src={currentCategorizedItems.shoe.url}
                              alt={currentCategorizedItems.shoe.name || "Shoes"}
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 z-5 object-contain rounded-lg"
                            />
                          )}
                          {/* Other items - positioned around the outfit */}
                          {currentCategorizedItems.others.map((item, index) => (
                            <motion.img
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              src={item.url}
                              alt={item.name || "Accessory"}
                              className="absolute object-contain rounded-lg"
                              style={{
                                left: index % 2 === 0 ? '10%' : '80%',
                                top: `${20 + index * 30}%`,
                                width: '4rem',
                                zIndex: 40 + index,
                                transform: 'translateX(-50%)',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Fallback if no items */}
                  {allCurrentItems.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                      <div className="text-center">
                        <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No items</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side - Outfit Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Outfit Details</CardTitle>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSaveEdit} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleEditOutfit} variant="outline" size="sm">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button onClick={handleDeleteOutfit} variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto space-y-6">
                {/* Name */}
                <div>
                  {isEditing ? (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <Tag className="w-4 h-4 mr-1" />
                        Name
                      </Label>
                      <Input
                        name="name"
                        value={editedOutfit.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter outfit name"
                      />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {outfit.name || "Untitled Outfit"}
                      </h2>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  {isEditing ? (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Price
                      </Label>
                      <Input
                        type="number"
                        name="price"
                        value={editedOutfit.price || editedOutfit.totalPrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                        ${(outfit.price || outfit.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Clothing Items */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Shirt className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-lg">Clothing Items</span>
                    <Badge variant="outline">{allCurrentItems.length} items</Badge>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Outerwear */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer"
                        onClick={() => handleOpenSelectModal("outerwear")}
                      >
                        <Card className="h-24 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
                          <CardContent className="h-full flex items-center justify-center p-2">
                            {currentCategorizedItems.outerwear ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={currentCategorizedItems.outerwear.url || "/placeholder.svg"}
                                  alt="Outerwear"
                                  className="w-full h-full object-contain"
                                />
                                {currentCategorizedItems.outerwear.mode === "wishlist" && (
                                  <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-slate-400">
                                <Plus className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs">Outerwear</p>
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
                        onClick={() => handleOpenSelectModal("top")}
                      >
                        <Card className="h-24 border-2 border-dashed border-green-300 hover:border-green-500 transition-colors">
                          <CardContent className="h-full flex items-center justify-center p-2">
                            {currentCategorizedItems.top ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={currentCategorizedItems.top.url || "/placeholder.svg"}
                                  alt="Top"
                                  className="w-full h-full object-contain"
                                />
                                {currentCategorizedItems.top.mode === "wishlist" && (
                                  <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-slate-400">
                                <Plus className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs">Top</p>
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
                        onClick={() => handleOpenSelectModal("bottom")}
                      >
                        <Card className="h-24 border-2 border-dashed border-purple-300 hover:border-purple-500 transition-colors">
                          <CardContent className="h-full flex items-center justify-center p-2">
                            {currentCategorizedItems.bottom ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={currentCategorizedItems.bottom.url || "/placeholder.svg"}
                                  alt="Bottom"
                                  className="w-full h-full object-contain"
                                />
                                {currentCategorizedItems.bottom.mode === "wishlist" && (
                                  <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-slate-400">
                                <Plus className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs">Bottom</p>
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
                        onClick={() => handleOpenSelectModal("shoe")}
                      >
                        <Card className="h-24 border-2 border-dashed border-pink-300 hover:border-pink-500 transition-colors">
                          <CardContent className="h-full flex items-center justify-center p-2">
                            {currentCategorizedItems.shoe ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={currentCategorizedItems.shoe.url || "/placeholder.svg"}
                                  alt="Shoes"
                                  className="w-full h-full object-contain"
                                />
                                {currentCategorizedItems.shoe.mode === "wishlist" && (
                                  <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-slate-400">
                                <Plus className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs">Shoes</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {allCurrentItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Card
                            className="h-20 cursor-pointer hover:shadow-md transition-shadow relative"
                            onClick={() => handleOpenModal(index)}
                          >
                            <CardContent className="h-full flex items-center justify-center p-1">
                              <img
                                src={item.url || "/placeholder.svg"}
                                alt={item.name || "Clothing Item"}
                                className="w-full h-full object-contain"
                              />
                              {item.mode === "wishlist" && (
                                <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>


                {/* Occasion Folder */}
                {outfit.occasion && (
                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Occasion:</span>
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      >
                        {outfit.occasion}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <ClothingModal
            isOpen={isModalOpen}
            onCloseAction={handleCloseModal}
            clothingItems={allCurrentItems || []}
            initialItemIndex={selectedItemIndex}
          />
        )}
        {isSelectModalOpen && selectModalCategory && (
          <ClothingItemSelectModal
            isOpen={isSelectModalOpen}
            onCloseAction={handleCloseSelectModal}
            clothingItems={[
              ...allClothingItems.filter((item) => getItemCategory(item) === selectModalCategory),
              { id: "none", url: "", name: "Select None", mode: "closet" as const },
            ]}
            onSelectItem={handleSelectItemForOutfit}
            viewMode="closet"
            selectedCategory={selectModalCategory}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
