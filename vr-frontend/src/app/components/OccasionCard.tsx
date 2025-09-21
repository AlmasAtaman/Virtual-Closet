"use client"

import type React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Folder, MoreVertical, Trash2, Edit2, Check, Camera, Upload, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import ThumbnailEditorModal from "./ThumbnailEditorModal"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
  x?: number
  y?: number
  scale?: number
  left?: number
  bottom?: number
  width?: number
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
  customThumbnail?: string
}

interface OccasionCardProps {
  occasion: Occasion
  onClick?: () => void
  onDelete?: (occasionId: string) => void
  onUpdate?: () => void
  isSelected?: boolean
  isMultiSelecting?: boolean
  onToggleSelect?: (occasionId: string) => void
}

export default function OccasionCard({
  occasion,
  onClick,
  onDelete,
  onUpdate,
  isSelected = false,
  isMultiSelecting = false,
  onToggleSelect,
}: OccasionCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showThumbnailInput, setShowThumbnailInput] = useState(false)
  const [showThumbnailEditor, setShowThumbnailEditor] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (
      !confirm(`Are you sure you want to delete "${occasion.name}"? This will remove the folder but keep your outfits.`)
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/${occasion.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete occasion")
      }

      onDelete?.(occasion.id)
    } catch (error) {
      console.error("Failed to delete occasion:", error)
      alert("Failed to delete occasion. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      // Create image URL and open editor modal
      const url = URL.createObjectURL(file)
      setSelectedImageUrl(url)
      setShowThumbnailInput(false)
      setShowThumbnailEditor(true)
    }
    // Reset the input
    e.target.value = ""
  }

  const handleSaveThumbnail = async (thumbnailBase64: string) => {
    setIsUpdatingThumbnail(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/${occasion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customThumbnail: thumbnailBase64,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update thumbnail")
      }

      onUpdate?.()
    } catch (error) {
      console.error("Failed to update thumbnail:", error)
      throw error // Re-throw to let the modal handle the error
    } finally {
      setIsUpdatingThumbnail(false)
    }
  }

  const handleCloseThumbnailEditor = () => {
    setShowThumbnailEditor(false)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl("")
    }
  }

  const handleRemoveThumbnail = async () => {
    setIsUpdatingThumbnail(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/${occasion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customThumbnail: null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove thumbnail")
      }

      onUpdate?.()
    } catch (error) {
      console.error("Failed to remove thumbnail:", error)
      alert("Failed to remove thumbnail. Please try again.")
    } finally {
      setIsUpdatingThumbnail(false)
    }
  }

  const handleRename = async () => {
    const trimmedName = newName.trim()

    if (!trimmedName) {
      alert("Please enter a valid name.")
      return
    }

    if (trimmedName === occasion.name) {
      setShowRenameDialog(false)
      return
    }

    setIsRenaming(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/${occasion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to rename occasion")
      }

      onUpdate?.()
      setShowRenameDialog(false)
    } catch (error) {
      console.error("Failed to rename occasion:", error)
      alert("Failed to rename occasion. Please try again.")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleOpenRename = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setNewName(occasion.name)
    setShowRenameDialog(true)
    setShowMenu(false)
  }

  // Handle clicking on the folder name to rename
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleOpenRename()
  }

  const outfitCount = occasion.outfits?.length || 0

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't handle card clicks when menu is open
    if (showMenu) {
      return
    }

    if (isMultiSelecting) {
      e.preventDefault()
      e.stopPropagation()
      onToggleSelect?.(occasion.id)
    } else {
      onClick?.()
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect?.(occasion.id)
  }

  return (
    <motion.div
      whileHover={{ scale: isMultiSelecting ? 1 : 1.02 }}
      whileTap={{ scale: isMultiSelecting ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative"
    >
      {/* Selection Checkbox - positioned absolutely */}
      {isMultiSelecting && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute top-3 left-3 z-20"
        >
          <button
            onClick={handleCheckboxClick}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                : "bg-white border-slate-300 hover:border-blue-400 chrome:bg-muted chrome:border-border chrome:hover:border-primary shadow-md"
            }`}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        </motion.div>
      )}

      <Card
        className={`aspect-[3/4] cursor-pointer overflow-hidden bg-white dark:bg-slate-800 chrome:bg-card shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 group ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900"
            : "ring-slate-200 dark:ring-slate-700 chrome:ring-border hover:ring-slate-300 dark:hover:ring-slate-600 chrome:hover:ring-accent"
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Folder Preview Area */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 chrome:from-muted chrome:to-accent overflow-hidden">
            {occasion.customThumbnail ? (
              <div className="relative w-full h-full">
                <Image
                  src={occasion.customThumbnail || "/placeholder.svg"}
                  alt={`${occasion.name} thumbnail`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : occasion.outfits && occasion.outfits.length > 0 ? (
              <div className="relative w-full h-full p-3">
                {/* Folder thumbnail showing multiple outfits in a grid */}
                <div className="relative w-full h-full">
                  {(() => {
                    // Get a diverse sample of clothing items from all outfits
                    const allClothingItems = occasion.outfits
                      .flatMap(outfit => outfit.clothingItems)
                      .filter(item => item.url) // Only include items with valid URLs

                    if (allClothingItems.length === 0) return null

                    // Create a diverse sample by type and outfit
                    const sampleItems: ClothingItem[] = []
                    const usedTypes = new Set<string>()
                    const usedOutfits = new Set<string>()

                    // First, try to get one item from each outfit
                    for (const outfit of occasion.outfits.slice(0, 4)) {
                      if (sampleItems.length >= 6) break
                      const outfitItems = outfit.clothingItems.filter(item => item.url)
                      if (outfitItems.length > 0 && !usedOutfits.has(outfit.id)) {
                        // Prefer diverse types (tops, bottoms, outerwear)
                        const preferredItem = outfitItems.find(item => {
                          const type = item.type?.toLowerCase() || ""
                          return !usedTypes.has(type) && ["top", "bottom", "outerwear", "shoe"].includes(type)
                        }) || outfitItems[0]

                        sampleItems.push(preferredItem)
                        usedTypes.add(preferredItem.type?.toLowerCase() || "")
                        usedOutfits.add(outfit.id)
                      }
                    }

                    // Fill remaining slots with other items if needed
                    if (sampleItems.length < 6) {
                      for (const item of allClothingItems) {
                        if (sampleItems.length >= 6) break
                        if (!sampleItems.some(existing => existing.id === item.id)) {
                          sampleItems.push(item)
                        }
                      }
                    }

                    return sampleItems.slice(0, 6).map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="absolute"
                        style={{
                          left: `${(index % 3) * 28}%`,
                          top: `${Math.floor(index / 3) * 45}%`,
                          width: "35%",
                          height: "40%",
                          zIndex: index === 0 ? 10 : 10 - index,
                          filter: index === 0 ? "none" : "brightness(0.85)", // Highlight center item
                          opacity: index < 3 ? 1 : 0.8, // Fade background items
                        }}
                      >
                        <Image
                          src={item.url || "/placeholder.svg"}
                          alt={item.name || `Item ${index + 1}`}
                          fill
                          className="object-contain rounded-sm"
                          unoptimized
                        />
                      </div>
                    ))
                  })()}
                </div>

                {/* Folder effect - subtle overlay to indicate it's a collection */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-200/20 dark:to-slate-800/20 pointer-events-none rounded-lg" />

                {/* Stacked folder effect for multiple outfits */}
                {outfitCount > 1 && (
                  <>
                    <div className="absolute inset-2 bg-white/40 dark:bg-slate-700/40 rounded-lg -z-10 transform rotate-1" />
                    {outfitCount > 2 && (
                      <div className="absolute inset-1 bg-white/20 dark:bg-slate-600/20 rounded-lg -z-20 transform rotate-2" />
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Folder className="w-16 h-16 text-slate-400 dark:text-slate-500 chrome:text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 chrome:text-muted-foreground font-medium">
                    Empty Folder
                  </p>
                </div>
              </div>
            )}

            {/* Floating action menu */}
            <div
              className={`absolute top-3 right-3 transition-opacity ${showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 chrome:bg-card/80 chrome:hover:bg-card backdrop-blur-sm rounded-full shadow-md border border-slate-200/50 dark:border-slate-600/50 chrome:border-border/50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  disabled={isDeleting || isUpdatingThumbnail}
                >
                  {isDeleting || isUpdatingThumbnail ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300 chrome:text-foreground" />
                  )}
                </Button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 chrome:bg-card rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 chrome:border-border z-50"
                  >
                    <div className="py-1">
                      <button
                        onClick={handleOpenRename}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 chrome:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 chrome:hover:bg-accent flex items-center gap-3 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Rename Folder
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowThumbnailInput(true)
                          setShowMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 chrome:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 chrome:hover:bg-accent flex items-center gap-3 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Set Custom Thumbnail
                      </button>
                      {occasion.customThumbnail && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveThumbnail()
                            setShowMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 chrome:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 chrome:hover:bg-accent flex items-center gap-3 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Remove Thumbnail
                        </button>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-600 chrome:border-border my-1" />
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 chrome:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Folder
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Folder Name and Info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 chrome:border-border bg-white/50 dark:bg-slate-800/50 chrome:bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Clickable folder name for renaming */}
                <h3 
                  className="font-semibold text-slate-900 dark:text-white chrome:text-foreground text-base mb-1 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                  onClick={handleNameClick}
                  title="Click to rename"
                >
                  {occasion.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 chrome:text-muted-foreground">
                  {outfitCount === 0 ? "Empty folder" : `${outfitCount} outfit${outfitCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              {/* Removed the folder icon from here */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(false)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
        />
      )}

      {/* Thumbnail Input Modal */}
      <Dialog open={showThumbnailInput} onOpenChange={setShowThumbnailInput}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Custom Thumbnail</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Upload an image from your device to use as the folder thumbnail
            </p>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Click to select an image</span>
                  <span className="text-xs text-slate-500 mt-1">JPG, PNG, GIF up to 10MB</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowThumbnailInput(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Editor Modal */}
      <ThumbnailEditorModal
        isOpen={showThumbnailEditor}
        onClose={handleCloseThumbnailEditor}
        imageUrl={selectedImageUrl}
        onSave={handleSaveThumbnail}
        title="Edit Folder Thumbnail"
      />

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="rename-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Folder Name
                </label>
                <Input
                  id="rename-input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full"
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleRename()
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      setShowRenameDialog(false)
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">{newName.length}/50 characters</p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRenameDialog(false)}
                  className="flex-1"
                  disabled={isRenaming}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  className="flex-1"
                  disabled={isRenaming || !newName.trim() || newName.trim() === occasion.name}
                >
                  {isRenaming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Renaming...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Rename
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}