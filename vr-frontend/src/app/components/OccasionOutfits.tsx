"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, X, Loader2, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import OutfitCard from "./OutfitCard"

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

interface OccasionOutfitsProps {
  occasionId: string
  onBack: () => void
  onOccasionUpdated?: () => void
}

export default function OccasionOutfits({ occasionId, onBack, onOccasionUpdated }: OccasionOutfitsProps) {
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (occasionId) {
      fetchOccasionOutfits()
    }
  }, [occasionId, fetchOccasionOutfits])

  const fetchOccasionOutfits = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/occasions/${occasionId}/outfits`, {
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to fetch occasion outfits")

      const data = await response.json()
      console.log('Occasion outfits data:', data)
      console.log('First outfit clothingItems:', data.outfits?.[0]?.clothingItems)
      setOccasion(data.occasion)
      setOutfits(data.outfits || [])
    } catch (error) {
      console.error("Failed to fetch occasion outfits:", error)
      setOccasion(null)
      setOutfits([])
    } finally {
      setLoading(false)
    }
  }, [occasionId])

  const handleOutfitDeleted = (outfitId: string) => {
    setOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId))
    setSelectedOutfitIds((prev) => prev.filter((id) => id !== outfitId))
    onOccasionUpdated?.()
  }

  const handleOutfitUpdated = () => {
    fetchOccasionOutfits()
    onOccasionUpdated?.()
  }

  const toggleMultiSelect = () => {
    setIsMultiSelecting((prev) => !prev)
    if (isMultiSelecting) {
      setSelectedOutfitIds([])
    }
  }

  const toggleOutfitSelection = (outfitId: string) => {
    setSelectedOutfitIds((prev) =>
      prev.includes(outfitId) ? prev.filter((id) => id !== outfitId) : [...prev, outfitId]
    )
  }

  const handleRemoveFromOccasion = async () => {
    if (selectedOutfitIds.length === 0) return

    setIsRemoving(true)
    try {
      // Get current outfit IDs in occasion
      const currentOutfitIds = outfits.map(outfit => outfit.id)
      // Remove selected outfits
      const remainingOutfitIds = currentOutfitIds.filter(id => !selectedOutfitIds.includes(id))

      const response = await fetch("http://localhost:8000/api/occasions/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          occasionId: occasionId,
          outfitIds: remainingOutfitIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove outfits from occasion")
      }

      // Update local state
      setOutfits((prev) => prev.filter((outfit) => !selectedOutfitIds.includes(outfit.id)))
      setSelectedOutfitIds([])
      setIsMultiSelecting(false)
      onOccasionUpdated?.()
    } catch (error) {
      console.error("Failed to remove outfits from occasion:", error)
      alert("Failed to remove outfits from occasion. Please try again.")
    } finally {
      setIsRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!occasion) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Occasion Not Found</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          The occasion you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Occasions
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Occasions
          </Button>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-purple-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {occasion.name}
            </h1>
          </div>
        </div>
        
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {outfits.length} outfit{outfits.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Multi-select Controls */}
      {outfits.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMultiSelecting && selectedOutfitIds.length > 0 && (
              <span className="text-sm font-medium">{selectedOutfitIds.length} selected</span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant={isMultiSelecting ? "destructive" : "outline"}
              onClick={toggleMultiSelect}
            >
              {isMultiSelecting ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Remove from Occasion Toolbar */}
      <AnimatePresence>
        {isMultiSelecting && selectedOutfitIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedOutfitIds.length} outfit{selectedOutfitIds.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveFromOccasion}
                disabled={isRemoving}
                className="gap-2"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Remove from Folder
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outfits Grid */}
      {outfits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Empty Folder</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This occasion folder doesn&apos;t contain any outfits yet.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Go back to the main occasions view to add outfits to this folder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {outfits.map((outfit, index) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <OutfitCard
                outfit={outfit}
                onDelete={handleOutfitDeleted}
                onUpdate={handleOutfitUpdated}
                isSelected={selectedOutfitIds.includes(outfit.id)}
                isMultiSelecting={isMultiSelecting}
                onToggleSelect={toggleOutfitSelection}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}