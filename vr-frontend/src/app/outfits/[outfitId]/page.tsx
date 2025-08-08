"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { ArrowLeft, Edit3, Trash2, Save, X, AlertTriangle, DollarSign, Tag, Folder } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import OutfitCard from "../../components/OutfitCard" // Import the enhanced OutfitCard
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
      
      // Match OutfitCard logic exactly
      const tops = items.filter((item) =>
        ["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(item.type?.toLowerCase() || "")
      )
      const bottoms = items.filter((item) =>
        ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || "")
      )
      const outerwear = items.filter((item) =>
        ["jacket", "coat", "blazer", "vest"].includes(item.type?.toLowerCase() || "")
      )
      const others = items.filter(
        (item) =>
          ![
            "t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan",
            "pants", "skirt", "shorts", "jeans", "leggings",
            "jacket", "coat", "blazer", "vest"
          ].includes(item.type?.toLowerCase() || "")
      )

      // Use first item from each category like OutfitCard
      categorized.top = tops[0] || undefined
      categorized.bottom = bottoms[0] || undefined  
      categorized.outerwear = outerwear[0] || undefined
      categorized.others = others
      
      return categorized
    },
    [],
  )

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
    if (editedCategorizedItems) {
      // Set default positions for items that don't have custom coordinates
      const updatedItems = { ...editedCategorizedItems }
      
      if (updatedItems.bottom && !updatedItems.bottom.left) {
        updatedItems.bottom = {
          ...updatedItems.bottom,
          left: 50,
          bottom: 0,
          width: 14.4,
          scale: 1,
        }
      }
      
      if (updatedItems.top && !updatedItems.top.left) {
        updatedItems.top = {
          ...updatedItems.top,
          left: 50,
          bottom: 8.4,
          width: 12.8,
          scale: 1,
        }
      }
      
      if (updatedItems.outerwear && !updatedItems.outerwear.left) {
        updatedItems.outerwear = {
          ...updatedItems.outerwear,
          left: 50,
          bottom: 8.8,
          width: 12.8,
          scale: 1,
        }
      }
      
      if (updatedItems.shoe && !updatedItems.shoe.left) {
        updatedItems.shoe = {
          ...updatedItems.shoe,
          left: 50,
          bottom: 0,
          width: 11.2,
          scale: 1,
        }
      }
      
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
    
    const currentItem = updatedCategorizedItems[selectModalCategory]
    const preservedPosition = currentItem ? {
      left: currentItem.left,
      bottom: currentItem.bottom,
      width: currentItem.width,
      scale: currentItem.scale,
    } : {
      left: 50,
      bottom: selectModalCategory === "bottom" || selectModalCategory === "shoe" ? 0 : 
             selectModalCategory === "top" ? 8.4 : 
             selectModalCategory === "outerwear" ? 8.8 : 5,
      width: selectModalCategory === "bottom" ? 14.4 :
             selectModalCategory === "top" || selectModalCategory === "outerwear" ? 12.8 :
             selectModalCategory === "shoe" ? 11.2 : 10,
      scale: 1,
    }

    if (selectedItem.id === "none") {
      updatedCategorizedItems[selectModalCategory] = undefined
    } else {
      updatedCategorizedItems[selectModalCategory] = {
        ...selectedItem,
        ...preservedPosition
      }
    }

    setEditedCategorizedItems(updatedCategorizedItems)
    handleCloseSelectModal()
  }

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

  const allCurrentItems = [
    editedCategorizedItems?.outerwear,
    editedCategorizedItems?.top,
    editedCategorizedItems?.bottom,
    editedCategorizedItems?.shoe,
    ...(editedCategorizedItems?.others || []),
  ].filter(Boolean) as ClothingItem[]

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Enhanced OutfitCard in Detail View Mode */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }} 
            className="lg:col-span-2"
          >
            <OutfitCard 
              outfit={outfit}
              isDetailView={true}
              isEditing={isEditing}
              enableDragDrop={isEditing}
              enableResize={isEditing}
              editedCategorizedItems={editedCategorizedItems}
              setEditedCategorizedItems={setEditedCategorizedItems}
              onItemSelect={handleOpenSelectModal}
              allClothingItems={allClothingItems}
            />
          </motion.div>

          {/* Right Side - Details Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Main Details Card */}
            <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Outfit Details</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isEditing ? "Edit your outfit" : "View outfit information"}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSaveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
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
                        <Button onClick={handleEditOutfit} variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
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

              <CardContent className="space-y-6">
                {/* Name Section */}
                <div className="space-y-3">
                  {isEditing ? (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <Tag className="w-4 h-4 mr-2" />
                        Outfit Name
                      </Label>
                      <Input
                        name="name"
                        value={editedOutfit.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter outfit name"
                        className="text-lg font-semibold"
                      />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {outfit.name || "Untitled Outfit"}
                      </h2>
                      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <Tag className="w-4 h-4" />
                        <span>Created outfit</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  {isEditing ? (
                    <div>
                      <Label className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Price
                      </Label>
                      <Input
                        type="number"
                        name="price"
                        value={editedOutfit.price || editedOutfit.totalPrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="text-lg font-semibold"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Value</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${(outfit.price || outfit.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Overview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-lg">Items</span>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {allCurrentItems.length} pieces
                      </Badge>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-3">
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
                            className="h-20 cursor-pointer hover:shadow-lg transition-all duration-200 relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900"
                            onClick={() => handleOpenModal(index)}
                          >
                            <CardContent className="h-full flex items-center justify-center p-2">
                              <img
                                src={item.url || "/placeholder.svg"}
                                alt={item.name || "Clothing Item"}
                                className="w-full h-full object-contain rounded"
                              />
                              {item.mode === "wishlist" && (
                                <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500 shadow-md">W</Badge>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Occasion Section */}
                {outfit.occasion && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                        <Folder className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Occasion</span>
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        >
                          {outfit.occasion}
                        </Badge>
                      </div>
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