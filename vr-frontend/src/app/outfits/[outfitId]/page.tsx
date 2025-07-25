"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Shirt,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  Tag,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
        .map((itemObject: { id: string }) => allItems.find((item: ClothingItem) => item.id === itemObject.id))
        .filter((item: ClothingItem | undefined): item is ClothingItem => item !== undefined) as ClothingItem[]

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
        clothingItems: clothingItemsToSave.map((item) => item.id),
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedOutfit((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditedOutfit((prev) => ({
      ...prev,
      [name]: value === "none" ? undefined : value,
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

  // Get current items for display (either editing or viewing)
  const currentCategorizedItems: CategorizedOutfitItems =
    isEditing && editedCategorizedItems ? editedCategorizedItems : categorizeOutfitItems(outfit.clothingItems)

  // Categorize items for the preview (same as OutfitCard)
  const categorizedItems = {
    tops: currentCategorizedItems.top ? [currentCategorizedItems.top] : [],
    bottoms: currentCategorizedItems.bottom ? [currentCategorizedItems.bottom] : [],
    outerwear: currentCategorizedItems.outerwear ? [currentCategorizedItems.outerwear] : [],
    shoes: currentCategorizedItems.shoe ? [currentCategorizedItems.shoe] : [],
    others: currentCategorizedItems.others,
  }

  const topItems = [...categorizedItems.outerwear, ...categorizedItems.tops]

  // Check if outfit has custom layout
  const hasCustomLayout = outfit.clothingItems.some(
    (item) =>
      (item.x !== undefined && item.x !== 0) ||
      (item.y !== undefined && item.y !== 0) ||
      (item.scale !== undefined && item.scale !== 1) ||
      (item.left !== undefined && item.left !== 50) ||
      (item.bottom !== undefined && item.bottom !== 0) ||
      (item.width !== undefined && item.width !== 10),
  )

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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 flex items-center justify-center rounded-xl">
                  {/* Outfit Image Collage */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentCategorizedItems.outerwear?.id}-${currentCategorizedItems.top?.id}-${currentCategorizedItems.bottom?.id}-${currentCategorizedItems.shoe?.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-44 h-80 mx-auto"
                    >
                      {hasCustomLayout ? (
                        outfit.clothingItems.map((item, index) => (
                          <motion.img
                            key={item.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            src={item.url}
                            alt={item.name || ""}
                            style={{
                              left: `${item.left ?? 50}%`,
                              bottom: `${item.bottom ?? 0}rem`,
                              width: `${item.width ?? 10}rem`,
                              position: "absolute",
                              transform: `translateX(-50%) scale(${item.scale ?? 1})`,
                              zIndex: index,
                              borderRadius: "0.5rem",
                            }}
                            className="object-contain"
                          />
                        ))
                      ) : (
                        <>
                          {/* Bottom (pants) */}
                          {categorizedItems.bottoms[0] && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              src={categorizedItems.bottoms[0].url}
                              alt="Bottom"
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 z-10"
                            />
                          )}
                          {/* Top (shirt) */}
                          {categorizedItems.tops[0] && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              src={categorizedItems.tops[0].url}
                              alt="Top"
                              className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-36 z-20"
                            />
                          )}
                          {/* Outerwear */}
                          {categorizedItems.outerwear[0] && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              src={categorizedItems.outerwear[0].url}
                              alt="Outerwear"
                              className="absolute bottom-[9rem] left-[40%] w-[8rem] z-5"
                            />
                          )}
                          {/* Shoes */}
                          {categorizedItems.shoes[0] && (
                            <motion.img
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              src={categorizedItems.shoes[0].url}
                              alt="Shoes"
                              className="absolute bottom-[9rem] left-[60%] w-[8rem] z-5"
                            />
                          )}
                          {/* Others/Accessories indicator */}
                          {categorizedItems.others.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 }}
                              className="absolute top-2 right-2"
                            >
                              <Badge variant="outline" className="text-xs">
                                +{categorizedItems.others.length} accessories
                              </Badge>
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Fallback if no images */}
                  {topItems.length === 0 && categorizedItems.bottoms.length === 0 && (
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

          {/* Right Side - Outfit Details & Items */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Main Details Card */}
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Outfit Information</CardTitle>
                  {!isEditing && (
                    <div className="flex space-x-2">
                      <Button onClick={handleEditOutfit} variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button onClick={handleDeleteOutfit} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-6">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        Occasion
                      </Label>
                      <Select
                        value={editedOutfit.occasion || "none"}
                        onValueChange={(value: string) => handleSelectChange("occasion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select occasion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Party">Party</SelectItem>
                          <SelectItem value="Athletic">Athletic</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        Season
                      </Label>
                      <Select
                        value={editedOutfit.season || "none"}
                        onValueChange={(value: string) => handleSelectChange("season", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="Winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-2">
                        <FileText className="w-4 h-4 mr-1" />
                        Notes
                      </Label>
                      <Textarea
                        name="notes"
                        value={editedOutfit.notes || ""}
                        onChange={handleInputChange}
                        placeholder="Add any notes about this outfit..."
                        rows={3}
                      />
                    </div>
                    {/* Clothing Items in Edit Mode */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-3">
                        <Shirt className="w-4 h-4 mr-1" />
                        Clothing Items
                        <span className="text-xs text-slate-400 ml-2">(click to change)</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Outerwear */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <Button onClick={handleSaveEdit} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" className="flex-1 bg-transparent">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {outfit.name && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Name:</span>
                        <span>{outfit.name}</span>
                      </div>
                    )}
                    {(outfit.price != null || outfit.totalPrice != null) && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Price:</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ${(outfit.price || outfit.totalPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {outfit.occasion && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Occasion:</span>
                        <Badge variant="secondary">{outfit.occasion}</Badge>
                      </div>
                    )}
                    {outfit.season && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Season:</span>
                        <Badge variant="outline">{outfit.season}</Badge>
                      </div>
                    )}
                    {outfit.notes && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Notes:</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          {outfit.notes}
                        </p>
                      </div>
                    )}
                    {/* Clothing Items Display */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Shirt className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Clothing Items:</span>
                        <Badge variant="outline">{outfit.clothingItems.length} items</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {outfit.clothingItems.map((item, index) => (
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
            clothingItems={outfit.clothingItems || []}
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
