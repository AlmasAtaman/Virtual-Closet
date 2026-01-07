"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Folder, Plus, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ClothingItem {
  id: string
  name?: string
  type?: string
  color?: string
  brand?: string
  price?: number
  imageUrl?: string
}

interface Outfit {
  id: string
  name?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  totalPrice?: number
  outerwearOnTop?: boolean
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

interface AddToFolderModalProps {
  show: boolean
  onCloseAction: () => void
  selectedOutfitIds: string[]
  onSuccess: () => void
}

export default function AddToFolderModal({
  show,
  onCloseAction,
  selectedOutfitIds,
  onSuccess,
}: AddToFolderModalProps) {
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | null>(null)

  useEffect(() => {
    if (show) {
      fetchOccasions()
    }
  }, [show])

  const fetchOccasions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch occasions")

      const data = await response.json()
      setOccasions(data.occasions || [])
    } catch {
      setOccasions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToFolder = async () => {
    if (!selectedOccasionId || selectedOutfitIds.length === 0) return

    setAssigning(true)
    try {
      // Get current outfits in the selected occasion
      const selectedOccasion = occasions.find(occ => occ.id === selectedOccasionId)
      const currentOutfitIds = selectedOccasion?.outfits.map(outfit => outfit.id) || []
      
      // Combine current outfits with selected outfits (avoid duplicates)
      const allOutfitIds = [...new Set([...currentOutfitIds, ...selectedOutfitIds])]

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          occasionId: selectedOccasionId,
          outfitIds: allOutfitIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add outfits to folder")
      }

      onSuccess()
      onCloseAction()
    } catch {
      alert("Failed to add outfits to folder. Please try again.")
    } finally {
      setAssigning(false)
    }
  }

  const handleClose = () => {
    setSelectedOccasionId(null)
    onCloseAction()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Add to Folder
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Add {selectedOutfitIds.length} outfit{selectedOutfitIds.length > 1 ? 's' : ''} to an occasion folder
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : occasions.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Folders Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You need to create occasion folders first before adding outfits to them.
              </p>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {occasions.map((occasion) => (
                  <Card
                    key={occasion.id}
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      selectedOccasionId === occasion.id
                        ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    onClick={() => setSelectedOccasionId(occasion.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-purple-500" />
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {occasion.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {occasion.outfits.length} outfit{occasion.outfits.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {selectedOccasionId === occasion.id && (
                          <Check className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {occasions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedOccasionId ? "Ready to add outfits" : "Select a folder"}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignToFolder}
                disabled={!selectedOccasionId || assigning}
                className="gap-2"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add to Folder
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}