"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Folder, MoreVertical, Trash2, Edit2, Check, Camera, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (
      !confirm(`Are you sure you want to delete "${occasion.name}"? This will remove the folder but keep your outfits.`)
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`http://localhost:8000/api/occasions/${occasion.id}`, {
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
      const response = await fetch(`http://localhost:8000/api/occasions/${occasion.id}`, {
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
      const response = await fetch(`http://localhost:8000/api/occasions/${occasion.id}`, {
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

  const outfitCount = occasion.outfits?.length || 0
  const firstOutfit = occasion.outfits?.[0]

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
                <img
                  src={occasion.customThumbnail || "/placeholder.svg"}
                  alt={`${occasion.name} thumbnail`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : firstOutfit && firstOutfit.clothingItems.length > 0 ? (
              <div className="relative w-full h-full p-4">
                {/* Main outfit preview */}
                <div className="relative w-full h-full">
                  {firstOutfit.clothingItems.slice(0, 3).map((item, index) => (
                    <img
                      key={item.id}
                      src={item.url || "/placeholder.svg"}
                      alt={item.name || `Item ${index + 1}`}
                      className="absolute object-contain"
                      style={{
                        left: `${(item.left || 50) - 10 + index * 2}%`,
                        bottom: `${(item.bottom || 0) * 0.8 + index * 0.5}rem`,
                        width: `${(item.width || 8) * 0.7}rem`,
                        transform: "translateX(-50%)",
                        zIndex: 10 - index,
                        filter: index > 0 ? "brightness(0.9)" : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Stacked card effect for multiple outfits */}
                {outfitCount > 1 && (
                  <>
                    <div className="absolute inset-2 bg-white/60 dark:bg-slate-700/60 rounded-lg -z-10 transform rotate-1" />
                    {outfitCount > 2 && (
                      <div className="absolute inset-1 bg-white/40 dark:bg-slate-600/40 rounded-lg -z-20 transform rotate-2" />
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
              className={`absolute top-3 right-3 transition-opacity ${showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 chrome:bg-card/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 chrome:hover:bg-card shadow-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(true)
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-9 bg-white dark:bg-slate-800 chrome:bg-popover rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 chrome:border-border py-1 min-w-[140px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        // TODO: Implement edit functionality
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-2" />
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        setShowThumbnailInput(true)
                      }}
                    >
                      <Camera className="h-3 w-3 mr-2" />
                      {occasion.customThumbnail ? "Change Thumbnail" : "Set Thumbnail"}
                    </Button>
                    {occasion.customThumbnail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          handleRemoveThumbnail()
                        }}
                        disabled={isUpdatingThumbnail}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Remove Thumbnail
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Outfit count badge */}
            {outfitCount > 0 && (
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-white/90 dark:bg-slate-800/90 chrome:bg-card/90 text-slate-700 dark:text-slate-300 chrome:text-card-foreground text-xs px-2 py-1 backdrop-blur-sm"
                >
                  {outfitCount} outfit{outfitCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* Folder Info */}
          <div className="p-4 bg-white dark:bg-slate-800 chrome:bg-card border-t border-slate-100 dark:border-slate-700 chrome:border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white chrome:text-card-foreground truncate text-sm mb-1">
                  {occasion.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 chrome:text-muted-foreground">
                  {outfitCount === 0 ? "Empty folder" : `${outfitCount} outfit${outfitCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Folder className="w-4 h-4 text-blue-500" />
              </div>
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
          <div className="p-2">
            <h3 className="text-lg font-semibold mb-4">Set Custom Thumbnail</h3>
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
    </motion.div>
  )
}
