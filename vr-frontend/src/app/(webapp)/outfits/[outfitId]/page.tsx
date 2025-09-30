"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState, use, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import axios from "axios"
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Shirt, 
  Folder,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import ClothingItemSelectModal from "../../../components/ClothingItemSelectModal"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
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
  others: ClothingItem[]
}

interface Outfit {
  id: string
  name?: string
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

  // Core state
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Clothing and edit state
  const [allClothingItems, setAllClothingItems] = useState<ClothingItem[]>([])
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null)
  const [selectedModalState, setSelectedModalState] = useState<{
    category: "outerwear" | "top" | "bottom"
    isOpen: boolean
  }>({ category: "top", isOpen: false })

  // Drag and resize state
  const [selectedItemForResize, setSelectedItemForResize] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  
  // Folder state
  const [outfitFolders, setOutfitFolders] = useState<Occasion[]>([])

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    notes: "",
  })

  // Drag refs
  const dragStartPos = useRef<{ x: number; y: number; itemLeft: number; itemBottom: number }>({
    x: 0,
    y: 0,
    itemLeft: 0,
    itemBottom: 0,
  })

  const DEFAULTS = {
    x: 0,
    y: 0,
    scale: 1,
    width: 10,
    // Default positions for each category - matching CreateOutfitModal
    positions: {
      top: { left: 8, bottom: 8.9, width: 10, scale: 1 },
      bottom: { left: 7.9, bottom: 0.2, width: 10, scale: 1 },
      outerwear: { left: 35.6, bottom: 10.2, width: 10, scale: 0.8 },
      others: { left: 50, bottom: 0, width: 10, scale: 1 }
    }
  }

  // Calculate total price
  const calculateTotalPrice = useCallback((items: ClothingItem[]): number => {
    return items.reduce((total, item) => {
      const price = typeof item.price === "number" ? item.price : 0
      return total + price
    }, 0)
  }, [])

  // Fetch outfit data
  const fetchOutfit = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits/${outfitId}`,
        { withCredentials: true }
      )
      setOutfit(response.data.outfit)
    } catch (error) {
      console.error("Failed to fetch outfit:", error)
      router.push("/outfits")
    } finally {
      setLoading(false)
    }
  }, [outfitId, router])

  // Fetch all clothing items
  const fetchAllClothingItems = useCallback(async () => {
    try {
      const [closetResponse, wishlistResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/images?mode=closet`, {
          withCredentials: true,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/images?mode=wishlist`, {
          withCredentials: true,
        }),
      ])

      const closetItems = closetResponse.data.clothingItems || []
      const wishlistItems = wishlistResponse.data.clothingItems || []
      setAllClothingItems([...closetItems, ...wishlistItems])
    } catch (error) {
      console.error("Failed to fetch clothing items:", error)
    }
  }, [])

  // Fetch outfit folders
  const fetchOutfitFolders = useCallback(async () => {
    if (!outfitId) return

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions`,
        { withCredentials: true }
      )
      const occasions = response.data.occasions || []

      // Filter occasions that contain this outfit
      const foldersWithOutfit = occasions.filter((occasion: Occasion) =>
        occasion.outfits.some((outfitInFolder) => outfitInFolder.id === outfitId)
      )

      setOutfitFolders(foldersWithOutfit)
    } catch (error) {
      console.error("Failed to fetch outfit folders:", error)
    }
  }, [outfitId])

  // Initialize data
  useEffect(() => {
    fetchOutfit()
    fetchAllClothingItems()
  }, [fetchOutfit, fetchAllClothingItems])

  useEffect(() => {
    if (outfit?.id) {
      fetchOutfitFolders()
    }
  }, [outfit?.id, fetchOutfitFolders])

  useEffect(() => {
    if (outfit) {
      setEditForm({
        name: outfit.name || "",
        notes: outfit.notes || "",
      })
    }
  }, [outfit])

  // Categorize items for editing
  const categorizeItems = useCallback((items: ClothingItem[]): CategorizedOutfitItems => {
    const categorized: CategorizedOutfitItems = { others: [] }

    items.forEach((item) => {
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
      } else {
        categorized.others.push(item)
      }
    })

    return categorized
  }, [])

  // Handle edit mode
  const handleEdit = () => {
    if (!outfit) return
    setIsEditing(true)
    setEditedCategorizedItems(categorizeItems(outfit.clothingItems))
  }

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!editedCategorizedItems) return

    e.preventDefault()
    setIsDragging(true)
    setDraggedItemId(itemId)

    const allCurrentItems = [
      editedCategorizedItems.outerwear,
      editedCategorizedItems.top,
      editedCategorizedItems.bottom,
      ...editedCategorizedItems.others,
    ].filter(Boolean) as ClothingItem[]

    const currentItem = allCurrentItems.find((item) => item.id === itemId)
    if (currentItem) {
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        itemLeft: currentItem.left ?? DEFAULTS.positions.others.left,
        itemBottom: currentItem.bottom ?? DEFAULTS.positions.others.bottom,
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedItemId || !editedCategorizedItems) return

      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      // Container size: w-44 = 176px, h-80 = 320px
      const containerWidth = 176
      const containerHeight = 320

      const leftDelta = (deltaX / containerWidth) * 100
      const bottomDelta = -(deltaY / containerHeight) * 20

      // Get the current item to check its width for boundary calculations
      const currentItem = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        ...editedCategorizedItems.others
      ].find(item => item?.id === draggedItemId)

      const itemWidth = currentItem?.width ?? DEFAULTS.width

      // Simple boundary calculations based on item size
      const leftBuffer = 85.2     
      const rightBuffer = -5.7    
      const bottomBuffer = 5.5   
      const topBuffer = -7.1      
      
      // Calculate boundaries accounting for item width and transform: translateX(-50%)
      const itemWidthPercent = (itemWidth * 16 / containerWidth) * 100
      const halfItemWidth = itemWidthPercent / 2
      
      const minLeft = halfItemWidth - leftBuffer    
      const maxLeft = 100 - halfItemWidth + rightBuffer  
      const minBottom = -bottomBuffer  
      const maxBottom = 20 + topBuffer  

      const newLeft = Math.max(minLeft, Math.min(maxLeft, dragStartPos.current.itemLeft + leftDelta))
      const newBottom = Math.max(minBottom, Math.min(maxBottom, dragStartPos.current.itemBottom + bottomDelta))

      // Update item position
      const updatedItems = { ...editedCategorizedItems }
      const updateItemPosition = (item: ClothingItem | undefined) => {
        if (item && item.id === draggedItemId) {
          return {
            ...item,
            left: newLeft,
            bottom: newBottom,
          }
        }
        return item
      }

      updatedItems.outerwear = updateItemPosition(updatedItems.outerwear)
      updatedItems.top = updateItemPosition(updatedItems.top)
      updatedItems.bottom = updateItemPosition(updatedItems.bottom)
      updatedItems.others = updatedItems.others.map(updateItemPosition).filter(Boolean) as ClothingItem[]

      setEditedCategorizedItems(updatedItems)
    },
    [isDragging, draggedItemId, editedCategorizedItems, DEFAULTS.width],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
  }, [])

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Item selection handlers
  const handleItemSelect = (category: "outerwear" | "top" | "bottom") => {
    setSelectedModalState({ category, isOpen: true })
  }

  const handleItemSelectFromModal = (category: string, item: ClothingItem) => {
    if (!editedCategorizedItems) return

    setEditedCategorizedItems(prev => {
      const newItems = prev || { others: [] }
      
      if (category === "top") {
        // If there's already a top, keep its position; otherwise use default
        const existingTop = newItems.top
        newItems.top = {
          ...item,
          left: existingTop?.left ?? DEFAULTS.positions.top.left,
          bottom: existingTop?.bottom ?? DEFAULTS.positions.top.bottom,
          width: existingTop?.width ?? DEFAULTS.positions.top.width,
          scale: existingTop?.scale ?? DEFAULTS.positions.top.scale,
        }
        
        // If there's outerwear, adjust its position based on whether there's a top
        if (newItems.outerwear) {
          newItems.outerwear = {
            ...newItems.outerwear,
            left: DEFAULTS.positions.outerwear.left,
            bottom: DEFAULTS.positions.outerwear.bottom,
            width: DEFAULTS.positions.outerwear.width,
            scale: DEFAULTS.positions.outerwear.scale,
          }
        }
      } else if (category === "bottom") {
        // If there's already a bottom, keep its position; otherwise use default
        const existingBottom = newItems.bottom
        newItems.bottom = {
          ...item,
          left: existingBottom?.left ?? DEFAULTS.positions.bottom.left,
          bottom: existingBottom?.bottom ?? DEFAULTS.positions.bottom.bottom,
          width: existingBottom?.width ?? DEFAULTS.positions.bottom.width,
          scale: existingBottom?.scale ?? DEFAULTS.positions.bottom.scale,
        }
      } else if (category === "outerwear") {
        // If there's already outerwear, keep its position
        // If no existing outerwear, use top position if no top exists, otherwise outerwear position
        const existingOuterwear = newItems.outerwear
        const shouldUseTopPosition = !newItems.top && !existingOuterwear
        const position = shouldUseTopPosition ? DEFAULTS.positions.top : DEFAULTS.positions.outerwear
        
        newItems.outerwear = {
          ...item,
          left: existingOuterwear?.left ?? position.left,
          bottom: existingOuterwear?.bottom ?? position.bottom,
          width: existingOuterwear?.width ?? position.width,
          scale: existingOuterwear?.scale ?? position.scale,
        }
      }
      
      return { ...newItems }
    })

    setSelectedModalState({ category: "top", isOpen: false })
  }

  // Remove item handler
  const handleRemoveItem = (category: string) => {
    if (!editedCategorizedItems) return

    setEditedCategorizedItems(prev => {
      if (!prev) return prev

      if (category === "outerwear") {
        return { ...prev, outerwear: undefined }
      } else if (category === "top") {
        return { ...prev, top: undefined }
      } else if (category === "bottom") {
        return { ...prev, bottom: undefined }
      }
      return prev
    })

    // Clear selection if removing the selected item
    if (selectedItemForResize && 
        ((category === "outerwear" && editedCategorizedItems.outerwear?.id === selectedItemForResize) ||
         (category === "top" && editedCategorizedItems.top?.id === selectedItemForResize) ||
         (category === "bottom" && editedCategorizedItems.bottom?.id === selectedItemForResize))) {
      setSelectedItemForResize(null)
    }
  }

  // Save changes
  const handleSave = async () => {
    if (!outfit || !editedCategorizedItems) return

    try {
      const allItems = [
        editedCategorizedItems.outerwear,
        editedCategorizedItems.top,
        editedCategorizedItems.bottom,
        ...editedCategorizedItems.others,
      ].filter(Boolean) as ClothingItem[]

      const updatedOutfit = {
        ...editForm,
        price: calculateTotalPrice(allItems),
        clothingItems: allItems.map(item => ({
          id: item.id,
          x: item.x ?? DEFAULTS.x,
          y: item.y ?? DEFAULTS.y,
          scale: item.scale ?? DEFAULTS.positions.others.scale,
          left: item.left ?? DEFAULTS.positions.others.left,
          bottom: item.bottom ?? DEFAULTS.positions.others.bottom,
          width: item.width ?? DEFAULTS.width,
        })),
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits/${outfitId}`,
        updatedOutfit,
        { withCredentials: true }
      )

      await fetchOutfit()
      setIsEditing(false)
      setEditedCategorizedItems(null)
      setSelectedItemForResize(null)
    } catch (error) {
      console.error("Failed to save outfit:", error)
      alert("Failed to save changes. Please try again.")
    }
  }

  // Cancel edit
  const handleCancel = () => {
    setIsEditing(false)
    setEditedCategorizedItems(null)
    setSelectedItemForResize(null)
    if (outfit) {
      setEditForm({
        name: outfit.name || "",
        notes: outfit.notes || "",
      })
    }
  }

  // Delete outfit
  const handleDelete = async () => {
    if (!outfit) return

    try {
      setIsDeleting(true)
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits/${outfitId}`,
        { withCredentials: true }
      )
      router.push("/outfits")
    } catch (error) {
      console.error("Failed to delete outfit:", error)
      alert("Failed to delete outfit. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Render outfit display
  const renderOutfitDisplay = () => {
    if (!editedCategorizedItems && (!outfit?.clothingItems || outfit.clothingItems.length === 0)) {
      return (
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select items to preview outfit</p>
        </div>
      )
    }

    const allCurrentItems = isEditing && editedCategorizedItems 
      ? [
          editedCategorizedItems.outerwear,
          editedCategorizedItems.top,
          editedCategorizedItems.bottom,
          ...editedCategorizedItems.others,
        ].filter(Boolean) as ClothingItem[]
      : outfit?.clothingItems || []

    return (
      <div className="relative w-44 h-80 mx-auto">
        {allCurrentItems.map((item, index) => {
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                width: `${item.width ?? DEFAULTS.width}rem`
              }}
              transition={{ 
                opacity: { delay: index * 0.1 },
                y: { delay: index * 0.1 },
                width: { duration: 0.2, ease: "easeOut" }
              }}
              className={`absolute ${isEditing ? 'cursor-move' : 'cursor-default'} hover:shadow-lg transition-shadow ${
                draggedItemId === item.id ? "z-50 shadow-2xl" : ""
              } ${selectedItemForResize === item.id ? "ring-2 ring-blue-500" : ""}`}
              style={{
                left: `${item.left ?? DEFAULTS.positions.others.left}%`,
                bottom: `${item.bottom ?? DEFAULTS.positions.others.bottom}rem`,
                transform: `translateX(-50%) scale(${item.scale ?? DEFAULTS.positions.others.scale})`,
                zIndex: draggedItemId === item.id ? 50 : selectedItemForResize === item.id ? 40 : index,
              }}
              onMouseDown={isEditing ? (e) => handleMouseDown(e, item.id) : undefined}
              onClick={isEditing ? (e) => {
                e.stopPropagation()
                setSelectedItemForResize(item.id)
              } : undefined}
            >
              <Image
                src={item.url || "/placeholder.svg"}
                alt={item.name || ""}
                width={100}
                height={120}
                className="w-full h-auto object-contain rounded-lg"
                draggable={false}
                unoptimized
              />
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Get selected item for resize controls
  const getSelectedResizeItem = () => {
    if (!editedCategorizedItems || !selectedItemForResize) return null
    
    const allCurrentItems = [
      editedCategorizedItems?.outerwear,
      editedCategorizedItems?.top,
      editedCategorizedItems?.bottom,
      ...(editedCategorizedItems?.others || [])
    ].filter(Boolean) as ClothingItem[]
    
    return allCurrentItems.find((item) => item.id === selectedItemForResize)
  }

  // Render folder display
  const renderFolderDisplay = () => {
    if (outfitFolders.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          This outfit is in 0 folders
        </div>
      )
    }

    if (outfitFolders.length <= 2) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            This outfit is in {outfitFolders.length} folder{outfitFolders.length > 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {outfitFolders.map((folder) => (
              <Badge key={folder.id} variant="secondary" className="text-xs">
                <Folder className="w-3 h-3 mr-1" />
                {folder.name}
              </Badge>
            ))}
          </div>
        </div>
      )
    }

    const displayFolders = outfitFolders.slice(0, 2)
    const remainingCount = outfitFolders.length - 2

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">
          This outfit is in {outfitFolders.length} folders
        </div>
        <div className="flex flex-wrap gap-2">
          {displayFolders.map((folder) => (
            <Badge key={folder.id} variant="secondary" className="text-xs">
              <Folder className="w-3 h-3 mr-1" />
              {folder.name}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            +{remainingCount} Folder{remainingCount > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading outfit...</p>
        </div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Outfit not found</p>
          <Button onClick={() => router.push("/outfits")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Outfits
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Sidebar - Outfit Info */}
        <div className="w-80 border-r border-border bg-card p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/outfits")}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Outfit Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Outfit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="outfit-name">Name</Label>
                {isEditing ? (
                  <Input
                    id="outfit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Outfit name"
                  />
                ) : (
                  <div className="text-sm font-medium">
                    {outfit.name || `Outfit ${outfit.id.substring(0, 6)}`}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="outfit-notes">Notes</Label>
                {isEditing ? (
                  <Input
                    id="outfit-notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this outfit..."
                  />
                ) : (
                  <div className="text-sm">
                    {outfit.notes || "No notes"}
                  </div>
                )}
              </div>

              <div>
                <Label>Total Price</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    ${isEditing && editedCategorizedItems 
                      ? calculateTotalPrice([
                          editedCategorizedItems.outerwear,
                          editedCategorizedItems.top,
                          editedCategorizedItems.bottom,
                          ...editedCategorizedItems.others
                        ].filter(Boolean) as ClothingItem[]).toFixed(2)
                      : (outfit.totalPrice || 0).toFixed(2)
                    }
                  </span>
                </div>
              </div>

              <div>
                <Label>Items Count</Label>
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {isEditing && editedCategorizedItems 
                      ? [
                          editedCategorizedItems.outerwear,
                          editedCategorizedItems.top,
                          editedCategorizedItems.bottom,
                          ...editedCategorizedItems.others
                        ].filter(Boolean).length
                      : outfit.clothingItems.length
                    } items
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Folders Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderFolderDisplay()}
            </CardContent>
          </Card>
        </div>

        {/* Center - Outfit Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="border-b border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {outfit.name || `Outfit ${outfit.id.substring(0, 6)}`}
              </h1>
            </div>
          </div>

          {/* Draggable Preview Area */}
          <div 
            className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/50 p-8 relative"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedItemForResize(null)
              }
            }}
          >                
            <div className="w-full max-w-xs mx-auto h-[500px] bg-gradient-to-br from-muted via-background to-card rounded-xl flex items-center justify-center border ring-1 ring-border shadow-lg overflow-hidden">
              <div 
                className="relative bg-gradient-to-br from-muted via-background to-card rounded-lg p-4 w-full h-full flex items-center justify-center"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedItemForResize(null)
                  }
                }}
              >
                {renderOutfitDisplay()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Current Items Management */}
        {isEditing && (
          <div className="w-80 border-l border-border bg-card p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Items</h3>
                
                <div className="space-y-3">
                  {/* Outerwear */}
                  <div className="border border-border rounded-lg bg-background">
                    {editedCategorizedItems?.outerwear ? (
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleItemSelect("outerwear")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative">
                            <Image
                              src={editedCategorizedItems.outerwear.url}
                              alt=""
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {editedCategorizedItems.outerwear.name || "Untitled"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Outerwear
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveItem("outerwear")
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full p-3 h-auto justify-start"
                        onClick={() => handleItemSelect("outerwear")}
                      >
                        <Plus className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Add Outerwear</div>
                          <div className="text-xs text-muted-foreground">Jackets, coats, blazers</div>
                        </div>
                      </Button>
                    )}
                  </div>

                  {/* Top */}
                  <div className="border border-border rounded-lg bg-background">
                    {editedCategorizedItems?.top ? (
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleItemSelect("top")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative">
                            <Image
                              src={editedCategorizedItems.top.url}
                              alt=""
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {editedCategorizedItems.top.name || "Untitled"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Top
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveItem("top")
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full p-3 h-auto justify-start"
                        onClick={() => handleItemSelect("top")}
                      >
                        <Plus className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Add Top</div>
                          <div className="text-xs text-muted-foreground">Shirts, blouses, sweaters</div>
                        </div>
                      </Button>
                    )}
                  </div>

                  {/* Bottom */}
                  <div className="border border-border rounded-lg bg-background">
                    {editedCategorizedItems?.bottom ? (
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleItemSelect("bottom")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative">
                            <Image
                              src={editedCategorizedItems.bottom.url}
                              alt=""
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {editedCategorizedItems.bottom.name || "Untitled"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Bottom
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveItem("bottom")
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full p-3 h-auto justify-start"
                        onClick={() => handleItemSelect("bottom")}
                      >
                        <Plus className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Add Bottom</div>
                          <div className="text-xs text-muted-foreground">Pants, skirts, shorts</div>
                        </div>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Resize Controls */}
                <div className="mt-8 p-4 border border-slate-200 dark:border-border rounded-lg bg-slate-50 dark:bg-muted/30">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-foreground mb-3">
                    Resize Item
                  </h4>
                  {(() => {
                    const selectedItem = getSelectedResizeItem()
                    if (!selectedItem) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Click on an item in the preview to resize it
                        </p>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-2">
                            Selected: {selectedItem.name || "Untitled"}
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-foreground mb-2">
                            Item Width
                          </label>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 dark:text-muted-foreground">Width:</span>
                            <span className="text-xs font-medium text-slate-900 dark:text-foreground">
                              {(selectedItem.width ?? 10).toFixed(1)}rem
                            </span>
                          </div>
                          <input
                            type="range"
                            min="6"
                            max="20"
                            step="0.1"
                            value={selectedItem.width ?? 10}
                            onChange={(e) => {
                              const newWidth = parseFloat(e.target.value)
                              setEditedCategorizedItems(prev => {
                                if (!prev) return prev
                                const updated = { ...prev }
                                const updateItemWidth = (item: ClothingItem | undefined) => {
                                  if (item && item.id === selectedItemForResize) {
                                    return { ...item, width: newWidth }
                                  }
                                  return item
                                }
                                updated.outerwear = updateItemWidth(updated.outerwear)
                                updated.top = updateItemWidth(updated.top)
                                updated.bottom = updateItemWidth(updated.bottom)
                                updated.others = updated.others.map(updateItemWidth).filter(Boolean) as ClothingItem[]
                                return updated
                              })
                            }}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Small</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Delete Outfit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this outfit? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selection Modals */}
      <ClothingItemSelectModal
        isOpen={selectedModalState.isOpen}
        onCloseAction={() => setSelectedModalState({ category: "top", isOpen: false })}
        clothingItems={allClothingItems}
        onSelectItem={(item) => handleItemSelectFromModal(selectedModalState.category, item)}
        viewMode="closet"
        selectedCategory={selectedModalState.category}
      />
    </div>
  )
}