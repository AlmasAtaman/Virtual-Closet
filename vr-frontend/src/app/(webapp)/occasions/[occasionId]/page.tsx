"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import OutfitCard from "../../../components/OutfitCard"
import { DashboardSidebar } from "../../../components/DashboardSidebar"
import { useTheme } from "../../../contexts/ThemeContext"
import AddOutfitsToOccasionModal from "../../../components/occasions/AddOutfitsToOccasionModal"
import Image from "next/image"

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

export default function OccasionPage({ params }: { params: Promise<{ occasionId: string }> }) {
  const resolvedParams = use(params)
  const occasionId = resolvedParams.occasionId
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toggleTheme } = useTheme()

  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAddOutfitsModalOpen, setIsAddOutfitsModalOpen] = useState(false)

  const fetchOccasionOutfits = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/${occasionId}/outfits`, {
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to fetch occasion outfits")

      const data = await response.json()
      setOccasion(data.occasion)
      setOutfits(data.outfits || [])
    } catch {
      setOccasion(null)
      setOutfits([])
    } finally {
      setLoading(false)
    }
  }, [occasionId])

  useEffect(() => {
    if (occasionId) {
      fetchOccasionOutfits()
    }
  }, [occasionId, fetchOccasionOutfits])

  // Check for openAddModal query parameter
  useEffect(() => {
    const openModal = searchParams.get("openAddModal")
    if (openModal === "true" && occasion) {
      setIsAddOutfitsModalOpen(true)
      // Clean up the URL by removing the query parameter
      router.replace(`/occasions/${occasionId}`)
    }
  }, [searchParams, occasion, occasionId, router])

  const handleOutfitDeleted = (outfitId: string) => {
    setOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId))
    setSelectedOutfitIds((prev) => prev.filter((id) => id !== outfitId))
  }

  const handleOutfitUpdated = () => {
    fetchOccasionOutfits()
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
      const currentOutfitIds = outfits.map(outfit => outfit.id)
      const remainingOutfitIds = currentOutfitIds.filter(id => !selectedOutfitIds.includes(id))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions/assign`, {
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

      setOutfits((prev) => prev.filter((outfit) => !selectedOutfitIds.includes(outfit.id)))
      setSelectedOutfitIds([])
      setIsMultiSelecting(false)
    } catch {
      alert("Failed to remove outfits from occasion. Please try again.")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleBackToOccasions = () => {
    router.push("/outfits?tab=occasions")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading occasion...</p>
        </div>
      </div>
    )
  }

  if (!occasion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Occasion not found</p>
          <button
            onClick={handleBackToOccasions}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Occasions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sidebar */}
      <DashboardSidebar
        onThemeToggle={toggleTheme}
        onSettingsClick={() => router.push("/settings")}
      />

      {/* Main Content with left margin for sidebar on desktop */}
      <main className="md:ml-[60px] md:w-[calc(100%-60px)] w-full flex flex-col flex-1 min-h-0">
        {/* Content Area */}
        <div className="flex-1 px-6 py-6 overflow-auto">
          {/* Header with Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {/* Back Arrow & Title - Left */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToOccasions}
                className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {occasion.name}
                </h1>
              </div>
            </div>

            {/* Action Buttons - Right */}
            <div className="flex items-center gap-3">
              {/* Grid Select */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                onClick={toggleMultiSelect}
              >
                <Image
                  src={isMultiSelecting ? "/multiSelect.PNG" : "/multi.PNG"}
                  alt="Multi-select"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </motion.button>

              {/* Add */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                onClick={() => setIsAddOutfitsModalOpen(true)}
              >
                <Plus size={20} />
              </motion.button>
            </div>
          </div>

          {/* Remove from Occasion Toolbar */}
          <AnimatePresence>
            {isMultiSelecting && selectedOutfitIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
              >
                <div className="bg-card rounded-full shadow-lg border border-border px-6 py-3 flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedOutfitIds.length} outfit{selectedOutfitIds.length > 1 ? 's' : ''} selected
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRemoveFromOccasion}
                    disabled={isRemoving}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50"
                  >
                    {isRemoving ? "..." : "Unsave from Folder"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Outfits Grid */}
          {outfits.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">
                No outfits in this occasion yet. Click the + button to add outfits!
              </p>
            </div>
          ) : (
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, 280px)', justifyContent: 'start' }}>
              {outfits.map((outfit) => (
                <div key={outfit.id} className="w-[280px]">
                  <OutfitCard
                    outfit={outfit}
                    onDelete={handleOutfitDeleted}
                    onUpdate={handleOutfitUpdated}
                    isSelected={selectedOutfitIds.includes(outfit.id)}
                    isMultiSelecting={isMultiSelecting}
                    onToggleSelect={toggleOutfitSelection}
                    hideFooter={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Outfits Modal */}
      <AddOutfitsToOccasionModal
        isOpen={isAddOutfitsModalOpen}
        onClose={() => {
          setIsAddOutfitsModalOpen(false)
          fetchOccasionOutfits()
        }}
        occasionName={occasion.name}
        occasionId={occasionId}
        existingOutfitIds={outfits.map(o => o.id)}
      />
    </div>
  )
}
