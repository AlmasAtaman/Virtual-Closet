"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Edit, Trash2, MoveRight, Loader2, Save, ChevronLeft, ChevronRight, Heart, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ClothingItem } from "../types/clothing"
import { Label } from "@/components/ui/label"
import { MAIN_CATEGORIES, SUBCATEGORIES, STYLE_TAGS, SIZES, SEASONS, getSubcategoriesForCategory } from "../constants/clothing"

interface EditForm {
  name: string
  category: string
  type: string
  brand: string
  price: string
  color: string
  season: string
  notes: string
  sourceUrl: string
  tags: string[]
  size: string
}


interface ClothingDetailModalProps {
  item: ClothingItem
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: (key: string) => void
  onMoveToCloset: (item: ClothingItem) => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  editForm: EditForm
  setEditForm: (value: EditForm) => void
  isDeleting: boolean
  isMoving: boolean
  allItems?: ClothingItem[] // Added to support navigation
  onToggleFavorite?: (id: string, newState: boolean) => void
  onRetryProcessing?: (id: string) => void
}

export default function ClothingDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onMoveToCloset,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  isDeleting,
  isMoving,
  allItems = [],
  onToggleFavorite,
  onRetryProcessing,
}: ClothingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("general")
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0)

  // Find the current item index in the allItems array
  useEffect(() => {
    if (allItems.length > 0) {
      const index = allItems.findIndex((i) => i.id === item.id)
      if (index !== -1) {
        setCurrentItemIndex(index)
      }
    }
  }, [item.id, allItems])

  const capitalize = (s: string | null | undefined) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Navigate to the next or previous item
  const navigateItem = (direction: "next" | "prev") => {
    if (allItems.length <= 1) return

    let newIndex = currentItemIndex
    if (direction === "next") {
      newIndex = (currentItemIndex + 1) % allItems.length
    } else {
      newIndex = (currentItemIndex - 1 + allItems.length) % allItems.length
    }

    setCurrentItemIndex(newIndex)

    // Reset editing state and update form if needed
    if (isEditing) {
      setIsEditing(false)
    }
  }

  // Helper function to safely format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return ""
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    if (isNaN(numPrice) || numPrice === 0) return ""
    return `$${numPrice.toFixed(2)}`
  }


  if (!isOpen) return null

  const currentItem = allItems.length > 0 ? allItems[currentItemIndex] : item

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-[900px] h-auto max-h-[90vh] md:h-[550px] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <h2 className="text-lg md:text-xl font-semibold">{isEditing ? "Edit Item" : "Clothing Details"}</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            {/* Image Section */}
            <div className="md:w-1/2 p-4 md:p-6 flex items-center justify-center bg-muted/30">
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Heart icon in top-right */}
                <div className="absolute top-4 right-4 z-30">
                  <button
                    className="p-1 rounded-full bg-white/80 backdrop-blur-sm hover:scale-110 transition"
                    onClick={() => onToggleFavorite?.(currentItem.id, !currentItem.isFavorite)}
                    aria-label={currentItem.isFavorite ? 'Unfavorite' : 'Favorite'}
                    type="button"
                  >
                    {currentItem.isFavorite ? (
                      <Heart className="fill-red-500 text-red-500 w-6 h-6" />
                    ) : (
                      <Heart className="text-gray-600 w-6 h-6" />
                    )}
                  </button>
                </div>
                {/* Wishlist badge in top-left */}
                {currentItem.mode === 'wishlist' && (
                  <div className="absolute top-4 left-4 z-30">
                    <Badge variant="secondary" className="bg-amber-500/90 text-white">
                      Wishlist
                    </Badge>
                  </div>
                )}
                <div className="relative">
                  <motion.img
                    key={currentItem.id}
                    src={currentItem.url}
                    alt={currentItem.name}
                    className="max-h-[400px] max-w-full object-contain p-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Processing status indicator */}
                  {currentItem.processingStatus && currentItem.processingStatus !== 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
                      {currentItem.processingStatus === 'failed' ? (
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-12 h-12 text-red-500" />
                          <p className="text-white text-sm font-medium">Processing Failed</p>
                          {currentItem.processingError && (
                            <p className="text-white/80 text-xs max-w-xs text-center px-4">{currentItem.processingError}</p>
                          )}
                          {onRetryProcessing && (
                            <Button
                              onClick={() => onRetryProcessing(currentItem.id)}
                              size="sm"
                              className="mt-2"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Retry Processing
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                          <p className="text-white text-sm font-medium">
                            {currentItem.processingStatus === 'pending' ? 'Queued for processing...' : 'Processing image...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 flex flex-col overflow-hidden">
              <div className="p-4 md:p-6 overflow-y-auto flex-grow">
                {/* Title and Source URL - always visible */}
                <div className="mb-4">
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onEdit()
                        }
                      }}
                      placeholder="Item name"
                      className="text-2xl font-bold border-none bg-transparent p-0 focus:ring-0 focus:border-none"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{currentItem.name}</h2>
                  )}
                    {currentItem.sourceUrl && (
                      <div className="mt-1">
                        <a
                          href={currentItem.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View product page
                        </a>
                      </div>
                    )}
                </div>


                {/* Tab Navigation and Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="general">General Info</TabsTrigger>
                    <TabsTrigger value="details">Style & Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-6">
                        {/* Basic Info Section (edit fields) */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Type</label>
                                <Select
                                  value={editForm.type}
                                  onValueChange={(value: string) => setEditForm({ ...editForm, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                                    <SelectItem value="Jacket">Jacket</SelectItem>
                                    <SelectItem value="Pants">Pants</SelectItem>
                                    <SelectItem value="Shoes">Shoes</SelectItem>
                                    <SelectItem value="Hat">Hat</SelectItem>
                                    <SelectItem value="Sweater">Sweater</SelectItem>
                                    <SelectItem value="Shorts">Shorts</SelectItem>
                                    <SelectItem value="Dress">Dress</SelectItem>
                                    <SelectItem value="Skirt">Skirt</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">Brand</label>
                                <Input
                                  value={editForm.brand}
                                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                  placeholder="Brand name"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Price</label>
                                <Input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">Source URL</label>
                                <Input
                                  value={editForm.sourceUrl}
                                  onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Notes</label>
                              <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="Add notes about this item..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {currentItem.type && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                              <p className="text-base">{currentItem.type}</p>
                            </div>
                          )}

                          {currentItem.brand && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Brand</h4>
                              <p className="text-base">{currentItem.brand}</p>
                            </div>
                          )}

                          {formatPrice(currentItem.price) && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                              <p className="text-base font-medium text-primary">{formatPrice(currentItem.price)}</p>
                            </div>
                          )}
                        </div>

                        {currentItem.notes && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                            <div className="p-4 bg-muted/30 rounded-md text-sm">{currentItem.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-6">
                        {/* Style & Details Section (edit fields) */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Style & Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="category" className="text-sm font-medium">
                                Category
                              </Label>
                              <Select
                                value={editForm.category || ""}
                                onValueChange={(value: string) => setEditForm({ ...editForm, category: value, type: "" })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MAIN_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="type" className="text-sm font-medium">
                                Type
                              </Label>
                              <Select
                                value={editForm.type || ""}
                                onValueChange={(value: string) => setEditForm({ ...editForm, type: value })}
                                disabled={!editForm.category}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={editForm.category ? "Select type" : "Select category first"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {editForm.category && getSubcategoriesForCategory(editForm.category).map((subcat) => (
                                    <SelectItem key={subcat} value={subcat}>
                                      {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="col-span-2">
                              <Label className="text-sm font-medium mb-2 block">
                                Style Tags (Max 3)
                              </Label>
                              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
                                {STYLE_TAGS.map((tag) => {
                                  const isSelected = editForm.tags?.includes(tag) || false
                                  const canSelect = (editForm.tags?.length || 0) < 3

                                  return (
                                    <Badge
                                      key={tag}
                                      variant={isSelected ? "default" : "outline"}
                                      className={`cursor-pointer transition-all ${
                                        !isSelected && !canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                                      }`}
                                      onClick={() => {
                                        if (isSelected) {
                                          setEditForm({
                                            ...editForm,
                                            tags: editForm.tags?.filter((t) => t !== tag) || []
                                          })
                                        } else if (canSelect) {
                                          setEditForm({
                                            ...editForm,
                                            tags: [...(editForm.tags || []), tag]
                                          })
                                        }
                                      }}
                                    >
                                      {tag}
                                    </Badge>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {editForm.tags?.length || 0}/3 tags selected
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="size" className="text-sm font-medium">
                                Size
                              </Label>
                              <Input
                                value={editForm.size || ""}
                                onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                                placeholder="e.g., M, L, 32"
                                list="sizes-datalist"
                              />
                              <datalist id="sizes-datalist">
                                {SIZES.map((size) => (
                                  <option key={size} value={size} />
                                ))}
                              </datalist>
                            </div>

                            <div>
                              <Label htmlFor="color" className="text-sm font-medium">
                                Color
                              </Label>
                              <Input
                                value={editForm.color || ""}
                                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                placeholder="e.g., Navy Blue, Black, Red"
                              />
                            </div>

                            <div>
                              <Label htmlFor="season" className="text-sm font-medium">
                                Season
                              </Label>
                              <Select
                                value={editForm.season || ""}
                                onValueChange={(value: string) => setEditForm({ ...editForm, season: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select season" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SEASONS.map((season) => (
                                    <SelectItem key={season} value={season}>
                                      {season}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      (!isEditing ? (
                        (() => {
                          const hasDetails = !!(
                            currentItem.category ||
                            currentItem.tags?.length ||
                            currentItem.size ||
                            currentItem.color ||
                            currentItem.season
                          );
                          if (!hasDetails) {
                            return (
                              <div className="text-center text-muted-foreground mt-8 mb-4">
                                <div className="text-base font-medium">No additional details available.</div>
                                <div className="text-sm mt-1">Click Edit to add more information.</div>
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                              {currentItem.category && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Category</label>
                                  <p className="text-base">{capitalize(currentItem.category)}</p>
                                </div>
                              )}
                              {currentItem.tags && currentItem.tags.length > 0 && (
                                <div className="col-span-2 space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Style Tags</label>
                                  <div className="flex flex-wrap gap-2">
                                    {currentItem.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {currentItem.size && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Size</label>
                                  <p className="text-base">{currentItem.size}</p>
                                </div>
                              )}
                              {currentItem.color && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Color</label>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded-full border"
                                      style={{ backgroundColor: currentItem.color?.toLowerCase() }}
                                    />
                                    <p className="text-base">{currentItem.color}</p>
                                  </div>
                                </div>
                              )}
                              {currentItem.season && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Season</label>
                                  <p className="text-base">{capitalize(currentItem.season)}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center text-muted-foreground mt-8 mb-4">
                          <div className="text-base font-medium">No additional details available.</div>
                          <div className="text-sm mt-1">Click Edit to add more information.</div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col sm:flex-row justify-end gap-2 p-4 md:p-6 border-t">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="min-h-[44px] w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={onEdit} className="gap-2 min-h-[44px] w-full sm:w-auto">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    {currentItem.mode === "wishlist" && (
                      <Button
                        variant="outline"
                        onClick={() => onMoveToCloset(currentItem)}
                        disabled={isMoving}
                        className="gap-2 min-h-[44px] w-full sm:w-auto"
                      >
                        {isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />}
                        <span className="hidden sm:inline">Move to Closet</span>
                        <span className="sm:hidden">Move</span>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 min-h-[44px] w-full sm:w-auto">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(currentItem.key)} disabled={isDeleting} className="gap-2 min-h-[44px] w-full sm:w-auto">
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Left arrow - hidden on mobile */}
        {!isEditing && allItems.length > 1 && currentItemIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-y-1/2 -ml-[508px] rounded-full bg-background/80 hover:bg-background shadow-md z-50 min-w-[44px] min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation()
              navigateItem("prev")
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Right arrow - hidden on mobile */}
        {!isEditing && allItems.length > 1 && currentItemIndex < allItems.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute right-1/2 top-1/2 -translate-y-1/2 -mr-[508px] rounded-full bg-background/80 hover:bg-background shadow-md z-50 min-w-[44px] min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation()
              navigateItem("next")
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  )
} 