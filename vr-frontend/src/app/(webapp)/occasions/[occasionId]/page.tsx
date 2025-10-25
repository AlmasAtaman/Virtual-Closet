"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import OutfitCard from "../../../components/OutfitCard"
import LogOutButton from "../../../components/LogoutButton"
import { ThemeToggle } from "../../../components/ThemeToggle"
import { ThemedLogo as Logo } from "../../../components/Logo"

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

  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [isRemoving, setIsRemoving] = useState(false)

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
    } catch (error) {
      console.error("Failed to fetch occasion outfits:", error)
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
    } catch (error) {
      console.error("Failed to remove outfits from occasion:", error)
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
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-none flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push("/settings")} variant="outline" className="gap-2">
                Settings
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
                Closet
              </Button>
              <ThemeToggle />
              <LogOutButton />
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-6 xl:px-8 py-6">
          <div className="space-y-6">
            <div className="h-6 bg-muted rounded animate-pulse w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!occasion) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-none flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push("/settings")} variant="outline" className="gap-2">
                Settings
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
                Closet
              </Button>
              <ThemeToggle />
              <LogOutButton />
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-6 xl:px-8 py-6">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">Occasion Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The occasion you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button onClick={handleBackToOccasions} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Occasions
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/settings")} variant="outline" className="gap-2">
              Settings
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
              Closet
            </Button>
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-6 xl:px-8 py-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackToOccasions}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Occasions
          </Button>
        </motion.div>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">
              {occasion.name}
            </h1>
            <div className="text-sm text-muted-foreground">
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
                <div className="bg-card rounded-full shadow-lg border border-border dark:border-border/60 px-6 py-3 flex items-center gap-4">
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
              <h3 className="text-xl font-semibold mb-2">Empty Folder</h3>
              <p className="text-muted-foreground mb-4">
                This occasion folder doesn&apos;t contain any outfits yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Go to the Outfits tab to add outfits to this folder.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
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
      </div>
    </div>
  )
}
