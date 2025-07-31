"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Check, X, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import CreateOutfitModal from "../components/CreateOutfitModal"
import OutfitCard from "../components/OutfitCard"
import LogOutButton from "../components/LogoutButton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ui/dialog"

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

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"outfits" | "occasions">("outfits")
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchOutfits()
  }, [])

  const fetchOutfits = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/outfits", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch outfits")

      const data = await response.json()
      setOutfits(data.outfits || [])
    } catch (error) {
      console.error("Failed to fetch outfits:", error)
      setOutfits([])
    } finally {
      setLoading(false)
    }
  }

  const handleOutfitCreated = () => {
    fetchOutfits()
  }

  const handleOutfitDeleted = (outfitId: string) => {
    setOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId))
  }

  const handleOutfitUpdated = () => {
    fetchOutfits()
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  const toggleMultiSelect = () => {
    setIsMultiSelecting((prev) => !prev)
    if (isMultiSelecting) {
      setSelectedOutfitIds([])
    }
  }

  const toggleOutfitSelection = (outfitId: string) => {
    setSelectedOutfitIds((prev) => 
      prev.includes(outfitId) 
        ? prev.filter((id) => id !== outfitId) 
        : [...prev, outfitId]
    )
  }

  const handleDeleteSelected = async () => {
    setShowDeleteDialog(false)

    try {
      setIsDeleting(true)
      
      // Delete outfits in parallel
      await Promise.all(
        selectedOutfitIds.map((outfitId) =>
          fetch(`http://localhost:8000/api/outfits/${outfitId}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      )

      // Update frontend state
      setOutfits((prev) => prev.filter((outfit) => !selectedOutfitIds.includes(outfit.id)))
      setSelectedOutfitIds([])
      setIsMultiSelecting(false) // Exit multi-select mode after deletion
    } catch (error) {
      console.error("Error deleting selected outfits:", error)
      alert("Failed to delete selected outfits.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/vrclogo.png" alt="VRC Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight">VrC</span>
          </div>
          <div className="flex items-center gap-4">
            <LogOutButton />
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Closet
          </Button>
        </div>

        {/* Toggle Bar - Styled like closet */}
        <div className="mb-8 w-full max-w-md mx-auto">
          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => setActiveTab(value as "outfits" | "occasions")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full overflow-hidden p-1">
              <TabsTrigger
                value="outfits"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold text-muted-foreground"
              >
                Outfits
              </TabsTrigger>
              <TabsTrigger
                value="occasions"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold text-muted-foreground"
              >
                Occasions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Multi-select Controls */}
        {activeTab === "outfits" && (
          <div className="flex items-center justify-between mb-6">
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

        {/* Delete Toolbar - Slide up from bottom when items selected */}
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
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "outfits" && (
            <motion.div
              key="outfits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {/* Create Outfit Button - Same size as outfit cards */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <div
                      onClick={() => setShowCreateModal(true)}
                      className="h-full flex flex-col justify-between bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                          <Plus className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                          Create Outfit
                        </span>
                      </div>
                      <div className="h-[42px]" /> {/* matches height of footer in OutfitCard */}
                    </div>
                  </motion.div>

                  {/* Existing Outfits */}
                  {outfits.map((outfit, index) => (
                    <motion.div
                      key={outfit.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: (index + 1) * 0.05 }}
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
            </motion.div>
          )}

          {activeTab === "occasions" && (
            <motion.div
              key="occasions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Occasions Coming Soon</h3>
              <p className="text-slate-600 dark:text-slate-400">
                We're working on organizing your outfits by occasions!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Outfit Modal */}
      <CreateOutfitModal
        show={showCreateModal}
        onCloseAction={() => setShowCreateModal(false)}
        onOutfitCreated={handleOutfitCreated}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Selected Outfits"
        description={`Are you sure you want to delete ${selectedOutfitIds.length} outfit${selectedOutfitIds.length > 1 ? 's' : ''}? This will only delete the outfit records - your clothing items will remain in your closet. This action cannot be undone.`}
        onConfirm={handleDeleteSelected}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </div>
  )
}