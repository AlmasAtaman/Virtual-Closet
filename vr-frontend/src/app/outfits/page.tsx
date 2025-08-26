"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Check, X, Trash2, Loader2, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import CreateOutfitModal from "../components/CreateOutfitModal"
import CreateOccasionModal from "../components/CreateOccasionModal"
import AddToFolderModal from "../components/AddToFolderModal"
import OutfitCard from "../components/OutfitCard"
import OccasionCard from "../components/OccasionCard"
import OccasionOutfits from "../components/OccasionOutfits"
import LogOutButton from "../components/LogoutButton"
import { ThemeToggle } from "../components/ThemeToggle"
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

interface Occasion {
  id: string
  name: string
  userId: string
  createdAt?: string
  outfits: Outfit[]
  customThumbnail?: string
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [occasionsLoading, setOccasionsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateOccasionModal, setShowCreateOccasionModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"outfits" | "occasions">("outfits")
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | null>(null)
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [isMultiSelectingOccasions, setIsMultiSelectingOccasions] = useState(false)
  const [selectedOccasionIds, setSelectedOccasionIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchOutfits()
  }, [])

  useEffect(() => {
    if (activeTab === "occasions") {
      fetchOccasions()
    }
  }, [activeTab])

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

  const fetchOccasions = async () => {
    setOccasionsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/occasions", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch occasions")

      const data = await response.json()
      setOccasions(data.occasions || [])
    } catch (error) {
      console.error("Failed to fetch occasions:", error)
      setOccasions([])
    } finally {
      setOccasionsLoading(false)
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

  const handleOccasionCreated = () => {
    fetchOccasions()
  }

  const handleOccasionDeleted = (occasionId: string) => {
    setOccasions((prev) => prev.filter((occasion) => occasion.id !== occasionId))
  }

  const handleOccasionUpdated = () => {
    fetchOccasions()
  }

  const handleOccasionClick = (occasionId: string) => {
    setSelectedOccasionId(occasionId)
  }

  const handleBackToOccasions = () => {
    setSelectedOccasionId(null)
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
      prev.includes(outfitId) ? prev.filter((id) => id !== outfitId) : [...prev, outfitId],
    )
  }

  const toggleMultiSelectOccasions = () => {
    setIsMultiSelectingOccasions((prev) => !prev)
    if (isMultiSelectingOccasions) {
      setSelectedOccasionIds([])
    }
  }

  const toggleOccasionSelection = (occasionId: string) => {
    setSelectedOccasionIds((prev) =>
      prev.includes(occasionId) ? prev.filter((id) => id !== occasionId) : [...prev, occasionId],
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
          }),
        ),
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

  const handleDeleteSelectedOccasions = async () => {
    if (selectedOccasionIds.length === 0) return

    if (
      !confirm(
        `Are you sure you want to delete ${selectedOccasionIds.length} folder${selectedOccasionIds.length > 1 ? "s" : ""}? This will remove the folders but keep your outfits.`,
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)

      // Delete occasions in parallel
      await Promise.all(
        selectedOccasionIds.map((occasionId) =>
          fetch(`http://localhost:8000/api/occasions/${occasionId}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      )

      // Update frontend state
      setOccasions((prev) => prev.filter((occasion) => !selectedOccasionIds.includes(occasion.id)))
      setSelectedOccasionIds([])
      setIsMultiSelectingOccasions(false) // Exit multi-select mode after deletion
    } catch (error) {
      console.error("Error deleting selected occasions:", error)
      alert("Failed to delete selected folders.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddToFolderSuccess = () => {
    // Exit multi-select mode and clear selections
    setSelectedOutfitIds([])
    setIsMultiSelecting(false)
    // Refresh occasions data if we're on the occasions tab
    if (activeTab === "occasions") {
      fetchOccasions()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/vrclogo.png" alt="VRC Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight">VrC</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-transparent"
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
            <TabsList className="grid w-full grid-cols-2 rounded-lg overflow-hidden shadow-sm border border-border dark:border-border/60">
              <TabsTrigger value="outfits">Outfits</TabsTrigger>
              <TabsTrigger value="occasions">Occasions</TabsTrigger>
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
              <Button variant={isMultiSelecting ? "destructive" : "outline"} onClick={toggleMultiSelect}>
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

        {/* Multi-select Controls for Occasions */}
        {activeTab === "occasions" && !selectedOccasionId && occasions.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {isMultiSelectingOccasions && selectedOccasionIds.length > 0 && (
                <span className="text-sm font-medium">{selectedOccasionIds.length} selected</span>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant={isMultiSelectingOccasions ? "destructive" : "outline"}
                onClick={toggleMultiSelectOccasions}
              >
                {isMultiSelectingOccasions ? (
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
              <div className="bg-card rounded-full shadow-lg border border-border dark:border-border/60 px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedOutfitIds.length} outfit{selectedOutfitIds.length > 1 ? "s" : ""} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setShowAddToFolderModal(true)} className="gap-2">
                  <Folder className="h-4 w-4" />
                  Add to Folder
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
          {isMultiSelectingOccasions && selectedOccasionIds.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-card rounded-full shadow-lg border border-border dark:border-border/60 px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedOccasionIds.length} folder{selectedOccasionIds.length > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelectedOccasions}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete Folders
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="aspect-[3/4] bg-card rounded-xl animate-pulse shadow-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {/* Create Outfit Button - Same size as outfit cards */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <div
                      onClick={() => setShowCreateModal(true)}
                      className="h-[32rem] flex flex-col justify-between bg-gradient-to-br from-muted via-background to-muted border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-gradient-to-br hover:from-accent hover:via-muted hover:to-accent transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl"
                    >
                      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-muted to-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                          <Plus className="w-10 h-10 text-primary" />
                        </div>
                        <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          Create Outfit
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">Design your look</span>
                      </div>
                      <div className="h-[42px]" /> {/* matches height of footer in OutfitCard */}
                    </div>
                  </motion.div>

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
            >
              {selectedOccasionId ? (
                <OccasionOutfits
                  occasionId={selectedOccasionId}
                  onBack={handleBackToOccasions}
                  onOccasionUpdated={handleOccasionUpdated}
                />
              ) : (
                <>
                  {occasionsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="aspect-square bg-card rounded-xl animate-pulse shadow-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {/* Create Folder Button - First item in grid */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          onClick={() => setShowCreateOccasionModal(true)}
                          className="aspect-[3/4] bg-gradient-to-br from-muted via-background to-accent border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-gradient-to-br hover:from-accent hover:via-muted hover:to-secondary transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl flex flex-col items-center justify-center p-6"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                            <Plus className="w-10 h-10 text-primary" />
                          </div>
                          <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                            Create New Folder
                          </span>
                        </div>
                      </motion.div>

                      {occasions.map((occasion, index) => (
                        <motion.div
                          key={occasion.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: (index + 1) * 0.05 }}
                        >
                          <OccasionCard
                            occasion={occasion}
                            onClick={() => handleOccasionClick(occasion.id)}
                            onDelete={handleOccasionDeleted}
                            onUpdate={handleOccasionUpdated}
                            isSelected={selectedOccasionIds.includes(occasion.id)}
                            isMultiSelecting={isMultiSelectingOccasions}
                            onToggleSelect={toggleOccasionSelection}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                </>
              )}
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

      {/* Create Occasion Modal */}
      <CreateOccasionModal
        show={showCreateOccasionModal}
        onCloseAction={() => setShowCreateOccasionModal(false)}
        onOccasionCreated={handleOccasionCreated}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Selected Outfits"
        description={`Are you sure you want to delete ${selectedOutfitIds.length} outfit${selectedOutfitIds.length > 1 ? "s" : ""}? This will only delete the outfit records - your clothing items will remain in your closet. This action cannot be undone.`}
        onConfirm={handleDeleteSelected}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />

      {/* Add to Folder Modal */}
      <AddToFolderModal
        show={showAddToFolderModal}
        onCloseAction={() => setShowAddToFolderModal(false)}
        selectedOutfitIds={selectedOutfitIds}
        onSuccess={handleAddToFolderSuccess}
      />
    </div>
  )
}
