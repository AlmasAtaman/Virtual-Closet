"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { X, ZoomIn, ZoomOut, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const previewRef = useRef<HTMLDivElement>(null)

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
      if (!imgRef.current || !previewRef.current) return

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set thumbnail size to match OccasionCard aspect ratio (3:4 portrait)
      const thumbnailWidth = 300
      const thumbnailHeight = 400
      canvas.width = thumbnailWidth
      canvas.height = thumbnailHeight

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Use HTML2Canvas-like approach: capture exactly what's visible in preview
      const previewElement = previewRef.current
      const previewRect = previewElement.getBoundingClientRect()
      const img = imgRef.current

      // Get the computed style of the image to match the exact rendering
      const imgRect = img.getBoundingClientRect()
      const previewWidth = previewRect.width
      const previewHeight = previewRect.height

      // Calculate scale from preview size to canvas size
      const scaleX = thumbnailWidth / previewWidth
      const scaleY = thumbnailHeight / previewHeight

      // Get image position relative to preview container
      const imgLeft = imgRect.left - previewRect.left
      const imgTop = imgRect.top - previewRect.top
      const imgWidth = imgRect.width
      const imgHeight = imgRect.height

      // Create gradient background to match OccasionCard
      const gradient = ctx.createLinearGradient(0, 0, thumbnailWidth, thumbnailHeight)
      gradient.addColorStop(0, "#f1f5f9") // from-slate-100
      gradient.addColorStop(1, "#e2e8f0") // to-slate-200
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight)

      // Calculate the visible portion of the image
      const visibleLeft = Math.max(0, -imgLeft)
      const visibleTop = Math.max(0, -imgTop)
      const visibleRight = Math.min(imgWidth, previewWidth - imgLeft)
      const visibleBottom = Math.min(imgHeight, previewHeight - imgTop)

      if (visibleRight > visibleLeft && visibleBottom > visibleTop) {
        // Calculate source coordinates in the original image
        const imgNaturalWidth = img.naturalWidth
        const imgNaturalHeight = img.naturalHeight

        const sourceX = (visibleLeft / imgWidth) * imgNaturalWidth
        const sourceY = (visibleTop / imgHeight) * imgNaturalHeight
        const sourceWidth = ((visibleRight - visibleLeft) / imgWidth) * imgNaturalWidth
        const sourceHeight = ((visibleBottom - visibleTop) / imgHeight) * imgNaturalHeight

        // Calculate destination coordinates on canvas
        const destX = Math.max(0, imgLeft) * scaleX
        const destY = Math.max(0, imgTop) * scaleY
        const destWidth = (visibleRight - visibleLeft) * scaleX
        const destHeight = (visibleBottom - visibleTop) * scaleY

        // Draw the visible portion of the image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          destX, destY, destWidth, destHeight
        )
      }

      const base64 = canvas.toDataURL("image/jpeg", 0.85)
      resolve(base64)
    })
  }, [])

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
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="px-6 pt-6">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Drag the image in the folder preview to position it perfectly</span>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Image Editor Area */}
            <div className="flex-1 p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="flex gap-8 items-center max-w-full max-h-full">
                {/* Main Folder Preview - This is where users interact */}
                <div className="relative">
                  <div className="text-sm text-slate-500 mb-3 text-center font-medium">
                    📁 Drag Image to Position
                  </div>
                  <div
                    ref={previewRef}
                    className="relative w-60 h-80 border-2 border-dashed border-blue-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden cursor-move rounded-lg shadow-lg ring-2 ring-blue-200"
                    style={{ aspectRatio: "3/4" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Container for the cropped image preview */}
                    <div className="relative w-full h-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imgRef}
                        src={imageUrl || "/placeholder.svg"}
                        alt="Edit thumbnail"
                        className="absolute select-none pointer-events-none"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px)) scale(${imageScale})`,
                          transformOrigin: "center",
                          width: "auto",
                          height: "auto",
                          minWidth: "100%",
                          minHeight: "100%",
                          objectFit: "cover",
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* Overlay to show it's interactive */}
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Drag to reposition
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 text-center mt-2 font-medium">
                    This is exactly how it will look on your folder
                  </div>
                </div>

                {/* Original Image Reference */}
                <div className="relative">
                  <div className="text-sm text-slate-500 mb-3 text-center font-medium">Original Image</div>
                  <div className="w-48 h-48 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <div className="w-64 p-6 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="space-y-6">
                {/* Instructions */}
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Move className="w-4 h-4" />
                    <span className="font-medium">How to use:</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Drag image directly on folder preview</li>
                    <li>• Use zoom controls to resize</li>
                    <li>• Preview shows exact result</li>
                  </ul>
                </div>

                {/* Zoom Controls */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Zoom</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
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
                  <label className="text-sm font-medium mb-3 block">Reset</label>
                  <div className="grid grid-cols-2 gap-2">
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

          {/* Footer - Fixed height to prevent cut-off */}
          <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <div>Final thumbnail: 300×400 pixels (3:4 portrait)</div>
                <div className="text-xs text-slate-500 mt-1">Perfect for folder cards</div>
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