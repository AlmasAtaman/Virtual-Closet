"use client"

import { motion } from "framer-motion"
import { Folder, MoreVertical, Trash2, Edit2, Check, Camera, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

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
  onToggleSelect 
}: OccasionCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showThumbnailInput, setShowThumbnailInput] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${occasion.name}"? This will remove the folder but keep your outfits.`)) {
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
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.3): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio - much smaller
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw and compress aggressively
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        
        console.log('Compressed image size:', compressedBase64.length, 'characters')
        resolve(compressedBase64)
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleUpdateThumbnail = async () => {
    if (!selectedFile) return

    setIsUpdatingThumbnail(true)
    try {
      // Compress image before sending - very small size
      const compressedBase64 = await compressImage(selectedFile, 150, 0.2)

      const response = await fetch(`http://localhost:8000/api/occasions/${occasion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customThumbnail: compressedBase64,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update thumbnail")
      }

      onUpdate?.()
      setShowThumbnailInput(false)
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl("")
      }
    } catch (error) {
      console.error("Failed to update thumbnail:", error)
      alert("Failed to update thumbnail. Please try again.")
    } finally {
      setIsUpdatingThumbnail(false)
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
  const previewOutfits = (occasion.outfits || []).slice(0, 4)

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
      whileHover={{ y: isMultiSelecting ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                : "bg-white border-slate-300 hover:border-blue-400 shadow-md"
            }`}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        </motion.div>
      )}

      <Card 
        className={`cursor-pointer group hover:shadow-xl transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800 overflow-hidden border-0 ring-1 rounded-xl ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900 scale-[1.02]"
            : "ring-slate-200 dark:ring-slate-700 hover:ring-purple-300 dark:hover:ring-purple-600"
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Preview Section */}
          <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 relative overflow-hidden">
            {occasion.customThumbnail ? (
              <div className="relative w-full h-full">
                <img
                  src={occasion.customThumbnail}
                  alt={`${occasion.name} thumbnail`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : previewOutfits.length > 0 && previewOutfits[0].clothingItems.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Show first outfit as main thumbnail */}
                <div className="relative w-56 h-64">
                  {previewOutfits[0].clothingItems.map((item, index) => (
                    <img
                      key={item.id}
                      src={item.url}
                      alt={item.name || `Item ${index + 1}`}
                      className="absolute object-contain"
                      style={{
                        left: `${item.left || 50}%`,
                        bottom: `${(item.bottom || 0) * 0.6}rem`,
                        width: `${(item.width || 8) * 0.5}rem`,
                        maxWidth: "80%",
                        maxHeight: "60%",
                        transform: "translateX(-50%)",
                        zIndex: index,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Folder className="w-12 h-12 text-purple-300 dark:text-purple-700 mx-auto mb-2" />
                  <p className="text-xs text-purple-400 dark:text-purple-600">Empty Folder</p>
                </div>
              </div>
            )}

            {/* Floating action menu */}
            <div className={`absolute top-2 right-2 transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-600"
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
                    className="absolute right-0 top-9 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50"
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
              <div className="absolute bottom-2 left-2">
                <Badge 
                  variant="secondary" 
                  className="bg-white/95 dark:bg-slate-800/95 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 font-medium shadow-sm"
                >
                  {outfitCount} outfit{outfitCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate text-base mb-1">
                  {occasion.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {outfitCount === 0 
                    ? "Empty folder" 
                    : `${outfitCount} outfit${outfitCount !== 1 ? "s" : ""}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2 bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
      {showThumbnailInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          >
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
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Click to select an image
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    JPG, PNG, GIF up to 10MB
                  </span>
                </label>
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Preview:</p>
                  <img
                    src={previewUrl}
                    alt="Thumbnail preview"
                    className="w-20 h-20 object-cover rounded-md border mx-auto"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
                    {selectedFile?.name}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowThumbnailInput(false)
                    setSelectedFile(null)
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl)
                      setPreviewUrl("")
                    }
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateThumbnail}
                  disabled={!selectedFile || isUpdatingThumbnail}
                  className="flex-1"
                >
                  {isUpdatingThumbnail ? "Uploading..." : "Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}