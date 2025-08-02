"use client"

import { motion } from "framer-motion"
import { Folder, MoreVertical, Trash2, Edit2 } from "lucide-react"
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
}

interface OccasionCardProps {
  occasion: Occasion
  onClick?: () => void
  onDelete?: (occasionId: string) => void
  onUpdate?: () => void
}

export default function OccasionCard({ occasion, onClick, onDelete, onUpdate }: OccasionCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const outfitCount = occasion.outfits?.length || 0
  const previewOutfits = occasion.outfits?.slice(0, 4) || []

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        className="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-800 overflow-hidden"
        onClick={onClick}
      >
        <CardContent className="p-0">
          {/* Preview Section */}
          <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 relative overflow-hidden">
            {previewOutfits.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 p-3 h-full">
                {previewOutfits.map((outfit, index) => (
                  <div
                    key={outfit.id}
                    className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center"
                  >
                    {outfit.clothingItems.length > 0 ? (
                      <div className="relative w-full h-full">
                        {/* Show first few clothing items as a mini preview */}
                        {outfit.clothingItems.slice(0, 2).map((item, itemIndex) => (
                          <img
                            key={item.id}
                            src={item.url}
                            alt={item.name || `Item ${itemIndex + 1}`}
                            className="absolute object-contain max-w-[70%] max-h-[70%]"
                            style={{
                              left: "50%",
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              zIndex: itemIndex,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-300 dark:text-slate-600 text-lg">👗</div>
                    )}
                  </div>
                ))}
                
                {/* Fill empty slots with placeholders */}
                {Array.from({ length: 4 - previewOutfits.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-600"
                  >
                    <div className="text-slate-300 dark:text-slate-600 text-lg">📂</div>
                  </div>
                ))}
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
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-9 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[120px] z-10"
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
                  className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs px-2 py-1"
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
                <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm mb-1">
                  {occasion.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {outfitCount === 0 
                    ? "Empty folder" 
                    : `${outfitCount} outfit${outfitCount !== 1 ? "s" : ""}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Folder className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  )
}