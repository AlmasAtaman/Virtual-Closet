"use client"

import type React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Folder, MoreVertical, Trash2, Edit2, Check, Camera, Upload, X, ZoomIn, ZoomOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useRef, useCallback } from "react"

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
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  // New inline editor states - using normalized coordinates (0-1 range)
  const [isEditingThumbnail, setIsEditingThumbnail] = useState(false)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImageUrl, setEditImageUrl] = useState<string>("")
  const [editImagePosition, setEditImagePosition] = useState({ x: 0, y: 0 }) // Normalized coordinates (-1 to 1)
  const [editImageScale, setEditImageScale] = useState(1)
  const [isDraggingEditImage, setIsDraggingEditImage] = useState(false)
  const [editDragStart, setEditDragStart] = useState({ x: 0, y: 0 })
  const [editImageDimensions, setEditImageDimensions] = useState({ width: 0, height: 0 })

  const cardRef = useRef<HTMLDivElement>(null)
  const editImageRef = useRef<HTMLImageElement>(null)

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
      const url = URL.createObjectURL(file)
      setEditImageFile(file)
      setEditImageUrl(url)
      setShowThumbnailInput(false)
      setIsEditingThumbnail(true)
      setEditImagePosition({ x: 0, y: 0 })
      setEditImageScale(1)
      
      // Load image to get dimensions
      const img = new window.Image()
      img.onload = () => {
        setEditImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = url
    }
    e.target.value = ""
  }

  // Convert screen coordinates to normalized coordinates
  const screenToNormalized = (screenX: number, screenY: number, containerRect: DOMRect) => {
    // Normalize to -1 to 1 range based on container dimensions
    const normalizedX = ((screenX - containerRect.left - containerRect.width / 2) / (containerRect.width / 2))
    const normalizedY = ((screenY - containerRect.top - containerRect.height / 2) / (containerRect.height / 2))
    
    return { x: normalizedX, y: normalizedY }
  }

  const handleEditImageMouseDown = (e: React.MouseEvent) => {
    if (!isEditingThumbnail || !cardRef.current) return
    e.preventDefault()
    e.stopPropagation()
    
    const containerRect = cardRef.current.getBoundingClientRect()
    const normalizedPos = screenToNormalized(e.clientX, e.clientY, containerRect)
    
    setIsDraggingEditImage(true)
    setEditDragStart({
      x: normalizedPos.x - editImagePosition.x,
      y: normalizedPos.y - editImagePosition.y,
    })
  }

  const handleEditImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingEditImage || !isEditingThumbnail || !cardRef.current) return
    e.preventDefault()
    
    const containerRect = cardRef.current.getBoundingClientRect()
    const normalizedPos = screenToNormalized(e.clientX, e.clientY, containerRect)
    
    setEditImagePosition({
      x: normalizedPos.x - editDragStart.x,
      y: normalizedPos.y - editDragStart.y,
    })
  }

  const handleEditImageMouseUp = () => {
    setIsDraggingEditImage(false)
  }

  const handleZoomChange = (newScale: number) => {
    setEditImageScale(Math.max(0.1, Math.min(3, newScale)))
  }

  const generateDirectEditThumbnail = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!editImageFile || !cardRef.current || editImageDimensions.width === 0) {
        reject(new Error("Missing image file, card reference, or image dimensions"))
        return
      }

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      // Set canvas dimensions to match card aspect ratio (3:4)
      const canvasWidth = 300
      const canvasHeight = 400
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
      gradient.addColorStop(0, "#f1f5f9")
      gradient.addColorStop(1, "#e2e8f0")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Load and draw the image using FileReader
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e.target?.result) {
          reject(new Error("Failed to read file"))
          return
        }

        const img = new window.Image()
        img.onload = () => {
          try {
            // Get the current container dimensions for accurate mapping
            const containerRect = cardRef.current!.getBoundingClientRect()
            const containerWidth = containerRect.width
            const containerHeight = containerRect.height
            
            // Calculate how the image appears in the preview container
            const imageAspect = editImageDimensions.width / editImageDimensions.height
            const containerAspect = containerWidth / containerHeight
            
            let baseImageWidth, baseImageHeight
            
            // Determine how the image fits in the container (same logic as CSS object-fit: cover)
            if (imageAspect > containerAspect) {
              // Image is wider - fit to height
              baseImageHeight = containerHeight
              baseImageWidth = baseImageHeight * imageAspect
            } else {
              // Image is taller - fit to width  
              baseImageWidth = containerWidth
              baseImageHeight = baseImageWidth / imageAspect
            }
            
            // Apply the user's scale
            const scaledImageWidth = baseImageWidth * editImageScale
            const scaledImageHeight = baseImageHeight * editImageScale
            
            // Calculate position in container space
            const containerCenterX = containerWidth / 2
            const containerCenterY = containerHeight / 2
            
            const pixelOffsetX = editImagePosition.x * (containerWidth / 2)
            const pixelOffsetY = editImagePosition.y * (containerHeight / 2)
            
            const imageLeftInContainer = containerCenterX + pixelOffsetX - scaledImageWidth / 2
            const imageTopInContainer = containerCenterY + pixelOffsetY - scaledImageHeight / 2
            
            // Now map from container space to canvas space
            const scaleX = canvasWidth / containerWidth
            const scaleY = canvasHeight / containerHeight
            
            const finalX = imageLeftInContainer * scaleX
            const finalY = imageTopInContainer * scaleY
            const finalWidth = scaledImageWidth * scaleX
            const finalHeight = scaledImageHeight * scaleY
            
            // Draw the image
            ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight)
            
            const base64 = canvas.toDataURL("image/jpeg", 0.9)
            resolve(base64)
          } catch (err) {
            reject(err)
          }
        }
        
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target.result as string
      }
      
      reader.onerror = () => reject(new Error("FileReader error"))
      reader.readAsDataURL(editImageFile)
    })
  }, [editImageFile, editImageScale, editImagePosition, editImageDimensions])

  const handleSaveDirectEdit = async () => {
    if (!editImageFile) return
    
    setIsUpdatingThumbnail(true)
    try {
      const thumbnailBase64 = await generateDirectEditThumbnail()
      
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

      handleCancelDirectEdit()
      onUpdate?.()
    } catch (error) {
      console.error("Failed to save thumbnail:", error)
      alert("Failed to save thumbnail. Please try again.")
    } finally {
      setIsUpdatingThumbnail(false)
    }
  }

  const handleCancelDirectEdit = () => {
    setIsEditingThumbnail(false)
    setEditImageFile(null)
    if (editImageUrl) {
      URL.revokeObjectURL(editImageUrl)
      setEditImageUrl("")
    }
    setEditImagePosition({ x: 0, y: 0 })
    setEditImageScale(1)
    setIsDraggingEditImage(false)
    setEditImageDimensions({ width: 0, height: 0 })
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

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleOpenRename()
  }

  const outfitCount = occasion.outfits?.length || 0

  const handleCardClick = (e: React.MouseEvent) => {
    if (showMenu || isEditingThumbnail) {
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

  // Calculate display position and scale for the editing preview
  const getEditImageDisplayStyle = () => {
    if (!cardRef.current || editImageDimensions.width === 0) return {}
    
    const containerRect = cardRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    
    // Calculate how the image should appear in the container
    const imageAspect = editImageDimensions.width / editImageDimensions.height
    const containerAspect = containerWidth / containerHeight
    
    let baseImageWidth, baseImageHeight
    
    // Determine how the image fits in the container (same logic as CSS object-fit: cover)
    if (imageAspect > containerAspect) {
      // Image is wider - fit to height
      baseImageHeight = containerHeight
      baseImageWidth = baseImageHeight * imageAspect
    } else {
      // Image is taller - fit to width  
      baseImageWidth = containerWidth
      baseImageHeight = baseImageWidth / imageAspect
    }
    
    // Apply the user's scale
    const scaledImageWidth = baseImageWidth * editImageScale
    const scaledImageHeight = baseImageHeight * editImageScale
    
    // Calculate position
    const containerCenterX = containerWidth / 2
    const containerCenterY = containerHeight / 2
    
    const pixelOffsetX = editImagePosition.x * (containerWidth / 2)
    const pixelOffsetY = editImagePosition.y * (containerHeight / 2)
    
    const finalLeft = containerCenterX + pixelOffsetX - scaledImageWidth / 2
    const finalTop = containerCenterY + pixelOffsetY - scaledImageHeight / 2
    
    return {
      position: "absolute" as const,
      left: `${finalLeft}px`,
      top: `${finalTop}px`,
      width: `${scaledImageWidth}px`,
      height: `${scaledImageHeight}px`,
      transform: "none", // Don't use transform, use direct positioning
      transformOrigin: "center",
      maxWidth: "none",
      maxHeight: "none",
    }
  }

  return (
    <div className="relative">
      {/* Full-screen overlay when editing */}
      {isEditingThumbnail && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={handleCancelDirectEdit} 
        />
      )}

      <motion.div
        whileHover={{ scale: isMultiSelecting ? 1 : 1.02 }}
        whileTap={{ scale: isMultiSelecting ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative ${isEditingThumbnail ? 'z-50' : ''}`}
      >
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

        {/* Zoom controls for editing mode */}
        {isEditingThumbnail && (
          <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 z-30">
            <div className="bg-white rounded-lg p-3 shadow-xl border border-slate-200 flex flex-col items-center gap-3">
              <button
                onClick={() => handleZoomChange(editImageScale + 0.1)}
                disabled={editImageScale >= 3}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col items-center h-32">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={editImageScale}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="w-2 h-24 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-vertical"
                  style={{
                    writingMode: 'bt-lr' as React.CSSProperties['writingMode'],
                    WebkitAppearance: 'slider-vertical' as React.CSSProperties['WebkitAppearance']
                  }}
                />
                <span className="text-xs text-slate-600 mt-2 font-medium">
                  {Math.round(editImageScale * 100)}%
                </span>
              </div>
              
              <button
                onClick={() => handleZoomChange(editImageScale - 0.1)}
                disabled={editImageScale <= 0.1}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Save/Cancel buttons for editing mode */}
        {isEditingThumbnail && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-30">
            <div className="flex gap-3">
              <button
                onClick={handleCancelDirectEdit}
                disabled={isUpdatingThumbnail}
                className="px-4 py-2 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-lg border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDirectEdit}
                disabled={isUpdatingThumbnail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {isUpdatingThumbnail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        )}

        <Card
          ref={cardRef}
          className={`aspect-[3/4] cursor-pointer overflow-hidden bg-white dark:bg-slate-800 chrome:bg-card shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 group ${
            isSelected
              ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900"
              : "ring-slate-200 dark:ring-slate-700 chrome:ring-border hover:ring-slate-300 dark:hover:ring-slate-600 chrome:hover:ring-accent"
          }`}
          onClick={handleCardClick}
        >
          <CardContent className="p-0 h-full flex flex-col">
            <div 
              className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 chrome:from-muted chrome:to-accent overflow-hidden"
              onMouseMove={handleEditImageMouseMove}
              onMouseUp={handleEditImageMouseUp}
              onMouseLeave={handleEditImageMouseUp}
            >
              {occasion.customThumbnail && !isEditingThumbnail ? (
                <div className="relative w-full h-full">
                  <Image
                    src={occasion.customThumbnail}
                    alt={`${occasion.name} thumbnail`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error('Failed to load custom thumbnail for', occasion.name)
                      // Fallback to default folder display
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ) : !isEditingThumbnail ? (
                // Default folder view
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Folder className="w-16 h-16 text-slate-400 dark:text-slate-500 chrome:text-muted-foreground mb-4" />
                  <h3 
                    className="font-semibold text-slate-900 dark:text-white chrome:text-foreground text-lg mb-2 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={handleNameClick}
                    title="Click to rename"
                  >
                    {occasion.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 chrome:text-muted-foreground text-center">
                    {outfitCount === 0 ? "Empty folder" : `${outfitCount} outfit${outfitCount !== 1 ? "s" : ""}`}
                  </p>
                </div>
              ) : null}
              
              {/* Editing mode */}
              {isEditingThumbnail && editImageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={editImageRef}
                    src={editImageUrl}
                    alt="Edit thumbnail"
                    className="absolute select-none cursor-move"
                    style={getEditImageDisplayStyle()}
                    onMouseDown={handleEditImageMouseDown}
                    draggable={false}
                  />
                  
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Editing
                  </div>
                </>
              )}

              {/* Menu button - only show when not editing */}
              {!isEditingThumbnail && (
                <div className={`absolute top-3 right-3 transition-opacity ${showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
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
              )}
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
    </div>
  )
}