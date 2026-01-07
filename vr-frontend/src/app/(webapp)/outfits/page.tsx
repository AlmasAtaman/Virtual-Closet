"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import CreateOutfitModal from "../../components/CreateOutfitModal"
import AddToFolderModal from "../../components/AddToFolderModal"
import OutfitCard from "../../components/OutfitCard"
import { ConfirmDialog } from "@/components/ui/dialog"
import { DashboardSidebar } from "../../components/DashboardSidebar"
import { useTheme } from "../../contexts/ThemeContext"
import OccasionsView, { type OccasionsViewRef } from "../../components/occasions/OccasionsView"
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
  outerwearOnTop?: boolean // Layer order preference
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
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const occasionsViewRef = useRef<OccasionsViewRef>(null)

  const toggleTheme = useCallback(() => {
    const themeOrder: Array<"light" | "dark" | "chrome"> = ["light", "dark", "chrome"]
    const currentIndex = themeOrder.indexOf(theme as "light" | "dark" | "chrome")
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }, [theme, setTheme])

  // Check for tab parameter in URL and set active tab
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'occasions') {
      setActiveTab('occasions')
    } else if (tab === 'outfits') {
      setActiveTab('outfits')
    }
  }, [searchParams])

  useEffect(() => {
    fetchOutfits()
  }, [])

  const fetchOutfits = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch outfits")

      const data = await response.json()
      setOutfits(data.outfits || [])
    } catch {
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

  const handleDeleteSelected = async () => {
    setShowDeleteDialog(false)

    try {
      setIsDeleting(true)

      // Delete outfits in parallel
      await Promise.all(
        selectedOutfitIds.map((outfitId) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits/${outfitId}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      )

      // Update frontend state
      setOutfits((prev) => prev.filter((outfit) => !selectedOutfitIds.includes(outfit.id)))
      setSelectedOutfitIds([])
      setIsMultiSelecting(false) // Exit multi-select mode after deletion
    } catch {
      alert("Failed to delete selected outfits.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddToFolderSuccess = () => {
    // Exit multi-select mode and clear selections
    setSelectedOutfitIds([])
    setIsMultiSelecting(false)
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
              {/* 2-Section Segmented Control Toggle Bar */}
              <div className="relative w-full mb-6 bg-muted rounded-full p-0.5 flex items-center justify-center gap-0">
                {/* Left Half: Outfits Section */}
                <div className="flex-1">
                  <button
                    onClick={() => setActiveTab('outfits')}
                    className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${
                      activeTab === 'outfits'
                        ? 'bg-card text-foreground shadow-sm rounded-full'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Outfits
                  </button>
                </div>

                {/* Right Half: Occasions Section */}
                <div className="flex-1">
                  <button
                    onClick={() => setActiveTab('occasions')}
                    className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${
                      activeTab === 'occasions'
                        ? 'bg-card text-foreground shadow-sm rounded-full'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Occasions
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end mb-6 gap-3">
                {activeTab === 'outfits' ? (
                  <>
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
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus size={20} />
                    </motion.button>
                  </>
                ) : (
                  /* Create button for Occasions tab */
                  <button
                    onClick={() => occasionsViewRef.current?.createOccasion()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                  >
                    Create
                  </button>
                )}
              </div>

        {/* Delete Toolbar - Slide up from bottom when multiselect is active */}
        <AnimatePresence>
          {isMultiSelecting && (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddToFolderModal(true)}
                  className="gap-2"
                  disabled={selectedOutfitIds.length === 0}
                >
                  <Folder className="h-4 w-4" />
                  Add to Folder
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting || selectedOutfitIds.length === 0}
                  className="gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                <div className="grid gap-6 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="w-full max-w-[400px] h-[373px] bg-card rounded-xl animate-pulse shadow-lg mx-auto" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {outfits.map((outfit, index) => (
                    <motion.div
                      key={outfit.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="w-full max-w-[400px] mx-auto"
                    >
                      <OutfitCard
                        outfit={outfit}
                        onDelete={handleOutfitDeleted}
                        onUpdate={handleOutfitUpdated}
                        isSelected={selectedOutfitIds.includes(outfit.id)}
                        isMultiSelecting={isMultiSelecting}
                        onToggleSelect={toggleOutfitSelection}
                        hideFooter={true}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "occasions" && (
            <OccasionsView ref={occasionsViewRef} />
          )}
              </AnimatePresence>
            </div>
          </main>

          {/* Create Outfit Modal */}
          <CreateOutfitModal
            show={showCreateModal}
            onCloseAction={() => setShowCreateModal(false)}
            onOutfitCreated={handleOutfitCreated}
          />

          {/* Delete Outfits Confirmation Dialog */}
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
