"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState, use, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import axios from "axios"
import { ArrowLeft, Edit3, Trash2, Save, X, AlertTriangle, DollarSign, Sparkles, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import OutfitCard from "../../components/OutfitCard"
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
  shoe?: ClothingItem // Keep shoe support for compatibility
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
  isFavorite?: boolean
  createdAt?: string
}

interface Occasion {
  id: string
  name: string
  userId: string
  createdAt?: string
  outfits: Outfit[]
}

interface OutfitDetailPageProps {
  params: Promise<{ outfitId: string }>
}

export default function OutfitDetailPage({ params }: OutfitDetailPageProps) {
  const { outfitId } = use(params)
  const router = useRouter()

  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [allClothingItems, setAllClothingItems] = useState<ClothingItem[]>([])
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [selectedModalState, setSelectedModalState] = useState<{
    category: "outerwear" | "top" | "bottom" | "shoe"
    isOpen: boolean
  }>({ category: "top", isOpen: false })

  // Folder/Occasion related state

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    occasion: "",
    season: "",
    notes: "",
  })

  // Calculate total price from clothing items
  const calculateTotalPrice = useCallback((items: ClothingItem[]): number => {
    return items.reduce((total, item) => {
      const price = typeof item.price === "number" ? item.price : 0
      return total + price
    }, 0)
  }, [])

  const getCurrentItems = useCallback((): ClothingItem[] => {
    if (isEditing && editedCategorizedItems) {
      return [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        editedCategorizedItems.shoe,
        ...(editedCategorizedItems.others || []),
      ].filter(Boolean) as ClothingItem[]
    }
    return outfit?.clothingItems || []
  }, [isEditing, editedCategorizedItems, outfit])

  const currentTotalPrice = calculateTotalPrice(getCurrentItems())

  // Fetch functions - defined before useEffect to avoid hoisting issues

const fetchOutfit = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/outfits/${outfitId}`, {
        withCredentials: true,
      })

      // The backend returns { outfit: transformedOutfit }

      const outfitData = response.data.outfit || response.data

      setOutfit(outfitData)
    } catch (error) {
      console.error("Failed to fetch outfit:", error)
    } finally {
      setLoading(false)
    }
  }, [outfitId])

const fetchAllClothingItems = useCallback(async () => {
    try {
      const [closetRes, wishlistRes] = await Promise.all([
        axios.get("http://localhost:8000/api/images?mode=closet", {
          withCredentials: true,
        }),
        axios.get("http://localhost:8000/api/images?mode=wishlist", {
          withCredentials: true,
        }),
      ])

      const closetItems = (closetRes.data.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "closet" as const,
      }))

      const wishlistItems = (wishlistRes.data.clothingItems || []).map((item: ClothingItem) => ({
        ...item,
        mode: "wishlist" as const,
      }))

      const allItems = [...closetItems, ...wishlistItems]
      setAllClothingItems(allItems)
    } catch (error) {
      console.error("Failed to fetch clothing items:", error)
    }
  }, [])

const fetchOutfitFolders = useCallback(async () => {
    if (!outfitId) return

    try {
      const response = await axios.get("http://localhost:8000/api/occasions", {
        withCredentials: true,
      })
      const occasions = response.data.occasions || []

      // Filter occasions that contain this outfit
      const foldersWithOutfit = occasions.filter((occasion: Occasion) =>
        occasion.outfits.some((outfitInFolder) => outfitInFolder.id === outfitId),
      )

      setOutfitFolders(foldersWithOutfit)
    } catch (error) {
      console.error("Failed to fetch outfit folders:", error)
    }
  }, [outfitId])

const fetchAllFolders = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/occasions", {
        withCredentials: true,
      })
      setAllFolders(response.data.occasions || [])
    } catch (error) {
      console.error("Failed to fetch folders:", error)
    }
  }, [])

  // useEffect hooks
  useEffect(() => {
    fetchOutfit()
    fetchAllClothingItems()
    fetchAllFolders()
  }, [outfitId, fetchOutfit, fetchAllClothingItems, fetchAllFolders])

  // Fetch outfit folders after we have the outfit data
  useEffect(() => {
    if (outfit?.id) {
      fetchOutfitFolders()
    }
  }, [outfit?.id, fetchOutfitFolders])

  useEffect(() => {
    if (outfit) {
      setEditForm({
        name: outfit.name || "",
        occasion: outfit.occasion || "",
        season: outfit.season || "",
        notes: outfit.notes || "",
      })
    }
  }, [outfit])

  const handleEdit = () => {
    if (!outfit) return

    setIsEditing(true)

    // Initialize edited categorized items
    const categorized: CategorizedOutfitItems = {
      others: [],
    }

    outfit.clothingItems.forEach((item) => {
      const type = item.type?.toLowerCase() || ""
      if (["t-shirt", "dress", "shirt", "blouse", "sweater", "hoodie", "cardigan"].includes(type)) {
        if (!categorized.top) categorized.top = item
        else categorized.others.push(item)
      } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
        if (!categorized.bottom) categorized.bottom = item
        else categorized.others.push(item)
      } else if (["jacket", "coat", "blazer", "vest"].includes(type)) {
        if (!categorized.outerwear) categorized.outerwear = item
        else categorized.others.push(item)
      } else if (["shoes", "sneakers", "boots", "sandals"].includes(type)) {
        if (!categorized.shoe) categorized.shoe = item
        else categorized.others.push(item)
      } else {
        categorized.others.push(item)
      }
    })

    setEditedCategorizedItems(categorized)
  }

  const handleSave = async () => {
    if (!outfit || !editedCategorizedItems) return

    try {
      const allCurrentItems = getCurrentItems()
      const totalPrice = calculateTotalPrice(allCurrentItems)

      const updatedOutfit = {
        ...outfit,
        name: editForm.name,
        occasion: editForm.occasion,
        season: editForm.season,
        notes: editForm.notes,
        clothingItems: allCurrentItems,
        totalPrice: totalPrice,
      }

      await axios.put(`http://localhost:8000/api/outfits/${outfitId}`, updatedOutfit, {
        withCredentials: true,
      })

      setOutfit(updatedOutfit)
      setIsEditing(false)
      setEditedCategorizedItems(null)
    } catch (error) {
      console.error("Failed to save outfit:", error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedCategorizedItems(null)
    if (outfit) {
      setEditForm({
        name: outfit.name || "",
        occasion: outfit.occasion || "",
        season: outfit.season || "",
        notes: outfit.notes || "",
      })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`http://localhost:8000/api/outfits/${outfitId}`, {
        withCredentials: true,
      })
      router.push("/outfits")
    } catch (error) {
      console.error("Failed to delete outfit:", error)
      setIsDeleting(false)
    }
  }

  // FIXED: Direct function reference instead of wrapper
  const handleOpenSelectModal = (category: "outerwear" | "top" | "bottom" | "shoe") => {
    // Filter out shoe category if you don't want to support it
    if (category === "shoe") {
      return
    }
    setSelectedModalState({ category, isOpen: true })
  }

  const handleItemSelected = (item: ClothingItem) => {
    if (!editedCategorizedItems) return

    const newCategorizedItems = { ...editedCategorizedItems }
    const category = selectedModalState.category
    const currentItem = newCategorizedItems[category]

    // Default positions for each category (matching CreateOutfitModal)
    const DEFAULT_POSITIONS = {
      outerwear: { left: 64, bottom: 9, width: 10, scale: 1 },
      top: { left: 45, bottom: 8, width: 10, scale: 1 },
      bottom: { left: 50, bottom: 0, width: 10, scale: 1 },
      shoe: { left: 50, bottom: 0, width: 10, scale: 1 },
    }

    // Create new item with preserved position or default position
    const newItem = { ...item }
    
    if (currentItem) {
      // Preserve position if replacing an existing item of the same type
      newItem.left = currentItem.left
      newItem.bottom = currentItem.bottom
      newItem.width = currentItem.width
      newItem.scale = currentItem.scale
      newItem.x = currentItem.x
      newItem.y = currentItem.y
    } else {
      // Use default position for new clothing type
      const defaultPos = DEFAULT_POSITIONS[category]
      newItem.left = defaultPos.left
      newItem.bottom = defaultPos.bottom
      newItem.width = defaultPos.width
      newItem.scale = defaultPos.scale
    }

    newCategorizedItems[category] = newItem

    // Remove item from others if it was there
    newCategorizedItems.others = newCategorizedItems.others.filter((i) => i.id !== item.id)

    setEditedCategorizedItems(newCategorizedItems)
    setSelectedModalState({ ...selectedModalState, isOpen: false })
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading outfit...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your outfit details.</p>
        </motion.div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Outfit not found</h2>
          <p className="text-muted-foreground mb-6">The outfit you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/outfits")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Outfits
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button onClick={() => router.push("/outfits")} variant="outline" className="group hover:bg-accent">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Outfits
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Side - Outfit Preview (3 columns) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-3"
          >
            <Card className="shadow-xl border border-border rounded-2xl overflow-hidden bg-card">
              <div className="bg-gradient-to-br from-muted/30 via-background to-muted/50 p-8 relative">
                <OutfitCard
                  outfit={outfit}
                  isDetailView={true}
                  isEditing={isEditing}
                  enableDragDrop={isEditing}
                  enableResize={isEditing}
                  editedCategorizedItems={editedCategorizedItems}
                  setEditedCategorizedItems={setEditedCategorizedItems}
                  onItemSelect={undefined}
                  allClothingItems={allClothingItems}
                />
              </div>
            </Card>
          </motion.div>

          {/* Right Side - Details Panel (2 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Header Card */}
            <Card className="shadow-lg border border-border rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">
                      {outfit?.name || `Outfit ${outfit?.id?.substring(0, 6) || "Unknown"}`}
                    </CardTitle>
                    <p className="text-blue-100 text-sm">
                      {isEditing ? "Edit your outfit details" : "View and manage your outfit"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Price Display */}
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Value</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Based on {getCurrentItems().length} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ${currentTotalPrice.toFixed(2)}
                      </p>
                      {isEditing && <p className="text-xs text-green-600 dark:text-green-400">Auto-calculated</p>}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={handleCancel} variant="outline" className="flex-1 bg-transparent">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleEdit}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Outfit
                      </Button>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items Overview Card - Changes based on edit mode */}
            <Card className="shadow-lg border border-border rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Shirt className="w-5 h-5 text-blue-600" />
                  <span>{isEditing ? "Change Items" : `Items (${getCurrentItems().length})`}</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {isEditing ? (
                  /* Edit Mode - Category Selection Grid (smaller, harmonious sizing) */
                  <div className="grid grid-cols-2 gap-3">
                    {/* Outerwear */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => handleOpenSelectModal("outerwear")}
                    >
                      <div className="h-20 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 hover:shadow-md rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 p-3">
                        {editedCategorizedItems?.outerwear ? (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              <Image
                                src={editedCategorizedItems.outerwear.url || "/placeholder.svg"}
                                alt={editedCategorizedItems.outerwear.name || "Outerwear"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                                {editedCategorizedItems.outerwear.name || "Outerwear"}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                                {editedCategorizedItems.outerwear.type}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shirt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Add Outerwear</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">Click to select</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Top */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => handleOpenSelectModal("top")}
                    >
                      <div className="h-20 border-2 border-dashed border-green-300 hover:border-green-500 transition-all duration-200 hover:shadow-md rounded-lg flex items-center justify-center bg-green-50 dark:bg-green-950/30 p-3">
                        {editedCategorizedItems?.top ? (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              <Image
                                src={editedCategorizedItems.top.url || "/placeholder.svg"}
                                alt={editedCategorizedItems.top.name || "Top"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                                {editedCategorizedItems.top.name || "Top"}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 capitalize">
                                {editedCategorizedItems.top.type}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shirt className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">Add Top</p>
                              <p className="text-xs text-green-600 dark:text-green-400">Click to select</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Bottom */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => handleOpenSelectModal("bottom")}
                    >
                      <div className="h-20 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 hover:shadow-md rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 p-3">
                        {editedCategorizedItems?.bottom ? (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              <Image
                                src={editedCategorizedItems.bottom.url || "/placeholder.svg"}
                                alt={editedCategorizedItems.bottom.name || "Bottom"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                                {editedCategorizedItems.bottom.name || "Bottom"}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                                {editedCategorizedItems.bottom.type}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shirt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Add Bottom</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">Click to select</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Others (if any exist) */}
                    {editedCategorizedItems?.others && editedCategorizedItems.others.length > 0 && (
                      <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
                        <div className="h-20 border-2 border-dashed border-gray-300 hover:border-gray-500 transition-all duration-200 hover:shadow-md rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-950/30 p-3">
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shirt className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Others</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {editedCategorizedItems.others.length} items
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* View Mode - Items List */
                  <div className="grid grid-cols-2 gap-3">
                    {getCurrentItems().map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-muted rounded-lg p-3 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center overflow-hidden border border-border">
                            <Image
                              src={item.url || "/placeholder.svg"}
                              alt={item.name || "Item"}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.name || item.type || "Unnamed Item"}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                              {item.price && item.price > 0 && (
                                <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                  ${item.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Delete Outfit</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-foreground mb-6">
                Are you sure you want to delete &quot;{outfit?.name || `Outfit ${outfit?.id?.substring(0, 6) || "Unknown"}`}
                &quot;? This will permanently remove the outfit from your wardrobe.
              </p>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowDeleteDialog(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Outfit
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clothing Item Selection Modal */}
      {selectedModalState.isOpen && (
        <ClothingItemSelectModal
          isOpen={selectedModalState.isOpen}
          onCloseAction={() => setSelectedModalState({ ...selectedModalState, isOpen: false })}
          onSelectItem={handleItemSelected}
          clothingItems={allClothingItems}
          viewMode="closet"
          selectedCategory={selectedModalState.category}
        />
      )}
    </div>
  )
}
