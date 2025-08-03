"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { X, ZoomIn, ZoomOut, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ThumbnailEditorModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onSave: (thumbnailBase64: string) => Promise<void>
  title?: string
}

export default function ThumbnailEditorModal({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  title = "Edit Thumbnail",
}: ThumbnailEditorModalProps) {
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, imageScale + delta))
    setImageScale(newScale)
  }

  const generateThumbnail = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!imgRef.current || !containerRef.current) return

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set thumbnail size (square)
      const thumbnailSize = 400
      canvas.width = thumbnailSize
      canvas.height = thumbnailSize

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Fill with white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, thumbnailSize, thumbnailSize)

      // Get the crop area dimensions (320x320 from the UI)
      const cropAreaSize = 320
      const img = imgRef.current

      // Calculate the actual image dimensions as displayed
      const imgNaturalWidth = img.naturalWidth
      const imgNaturalHeight = img.naturalHeight

      // Calculate displayed size maintaining aspect ratio
      let displayWidth, displayHeight
      const aspectRatio = imgNaturalWidth / imgNaturalHeight

      if (aspectRatio > 1) {
        // Landscape
        displayWidth = cropAreaSize * imageScale
        displayHeight = displayWidth / aspectRatio
      } else {
        // Portrait or square
        displayHeight = cropAreaSize * imageScale
        displayWidth = displayHeight * aspectRatio
      }

      // Calculate the crop area in the original image coordinates
      const centerX = cropAreaSize / 2
      const centerY = cropAreaSize / 2

      // Calculate what part of the image is visible in the crop area
      const visibleX = centerX - imagePosition.x - displayWidth / 2
      const visibleY = centerY - imagePosition.y - displayHeight / 2

      // Convert to source image coordinates
      const sourceX = Math.max(0, -visibleX * (imgNaturalWidth / displayWidth))
      const sourceY = Math.max(0, -visibleY * (imgNaturalHeight / displayHeight))
      const sourceWidth = Math.min(imgNaturalWidth, cropAreaSize * (imgNaturalWidth / displayWidth))
      const sourceHeight = Math.min(imgNaturalHeight, cropAreaSize * (imgNaturalHeight / displayHeight))

      // Draw the cropped portion to fill the entire canvas
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, thumbnailSize, thumbnailSize)

      const base64 = canvas.toDataURL("image/jpeg", 0.85)
      resolve(base64)
    })
  }, [imagePosition, imageScale])

  const handleSave = async () => {
    if (!imgRef.current) return

    setIsSaving(true)
    try {
      const thumbnailBase64 = await generateThumbnail()
      await onSave(thumbnailBase64)
      handleClose()
    } catch (error) {
      console.error("Failed to save thumbnail:", error)
      alert("Failed to save thumbnail. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // Reset editor state
    setImagePosition({ x: 0, y: 0 })
    setImageScale(1)
    setIsDragging(false)
    setIsSaving(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Crop, rotate, and zoom your image</span>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Image Editor Area */}
            <div className="flex-1 p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="flex gap-8 items-center max-w-full max-h-full">
                {/* Crop Preview Area */}
                <div className="relative">
                  <div className="text-sm text-slate-500 mb-3 text-center font-medium">Crop Area (400×400)</div>
                  <div
                    ref={containerRef}
                    className="relative w-80 h-80 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden cursor-move rounded-lg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      ref={imgRef}
                      src={imageUrl || "/placeholder.svg"}
                      alt="Edit thumbnail"
                      className="absolute select-none pointer-events-none"
                      style={{
                        transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                        transformOrigin: "center",
                        maxWidth: "none",
                        maxHeight: "none",
                      }}
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Original Image Preview */}
                <div className="relative">
                  <div className="text-sm text-slate-500 mb-3 text-center font-medium">Original Image</div>
                  <div className="w-64 h-64 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center rounded-lg">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-72 p-6 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="space-y-8">
                {/* Instructions */}
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Move className="w-4 h-4" />
                    <span className="font-medium">How to use:</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Drag image to reposition</li>
                    <li>• Use zoom slider to scale</li>
                    <li>• Square crop area shows final result</li>
                  </ul>
                </div>

                {/* Zoom Controls */}
                <div>
                  <label className="text-sm font-medium mb-4 block">Zoom</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(-0.1)}
                        disabled={imageScale <= 0.5}
                        className="flex-1"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(0.1)}
                        disabled={imageScale >= 3}
                        className="flex-1"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={imageScale}
                      onChange={(e) => setImageScale(Number.parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                    />
                    <div className="text-center">
                      <span className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                        {Math.round(imageScale * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reset Controls */}
                <div>
                  <label className="text-sm font-medium mb-4 block">Reset</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePosition({ x: 0, y: 0 })
                        setImageScale(1)
                      }}
                    >
                      Center
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setImageScale(1)}>
                      100%
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <div>Final thumbnail will be 400×400 pixels</div>
                <div className="text-xs text-slate-500 mt-1">Drag and zoom to adjust the crop area</div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Thumbnail"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
