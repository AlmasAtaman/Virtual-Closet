"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Check, Search, Loader2, Folder } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface CreateOccasionModalProps {
  show: boolean
  onCloseAction: () => void
  onOccasionCreated: () => void
}

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

export default function CreateOccasionModal({ show, onCloseAction, onOccasionCreated }: CreateOccasionModalProps) {
  const [occasionName, setOccasionName] = useState("")
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [step, setStep] = useState<"name" | "selection">("name")

  useEffect(() => {
    if (show) {
      setStep("name")
      setOccasionName("")
      setSelectedOutfitIds([])
      setSearchQuery("")
      fetchOutfits()
    }
  }, [show])

  const fetchOutfits = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits`, {
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

  const handleCreateOccasion = async () => {
    if (!occasionName.trim()) {
      alert("Please enter a name for the occasion folder.")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/occasions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: occasionName.trim(),
          outfitIds: selectedOutfitIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create occasion")
      }

      onOccasionCreated()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to create occasion:", error)
      alert("Failed to create occasion. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    setStep("name")
    setOccasionName("")
    setSelectedOutfitIds([])
    setSearchQuery("")
    onCloseAction()
  }

  const handleNameNext = () => {
    if (occasionName.trim()) {
      setStep("selection")
    }
  }

  const toggleOutfitSelection = (outfitId: string) => {
    setSelectedOutfitIds((prev) =>
      prev.includes(outfitId) ? prev.filter((id) => id !== outfitId) : [...prev, outfitId]
    )
  }

  const filteredOutfits = outfits.filter((outfit) => {
    const outfitName = outfit.name || "Untitled Outfit"
    const matchesSearch = outfitName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (!show) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleCloseModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-white dark:bg-background chrome:bg-background rounded-2xl shadow-2xl flex flex-col ${
            step === "name" 
              ? "w-full max-w-md" // Small width for name step
              : "w-full max-w-4xl" // Large width for selection step
          } max-h-[90vh]`}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {step === "name" && (
              <motion.div
                key="name-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Simple Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Occasion Folder</h2>
                      <p className="text-sm text-slate-600 dark:text-muted-foreground">Name your folder</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Compact Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name" className="text-sm font-medium text-slate-700 dark:text-foreground">
                      Folder Name
                    </Label>
                    <Input
                      id="folder-name"
                      value={occasionName}
                      onChange={(e) => setOccasionName(e.target.value)}
                      placeholder="e.g., Work Outfits, Date Night, Casual Friday..."
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && occasionName.trim()) {
                          handleNameNext()
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <Button
                    onClick={handleNameNext}
                    disabled={!occasionName.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Select Outfits
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "selection" && (
              <motion.div
                key="selection-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-border chrome:border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-card dark:to-muted chrome:from-card chrome:to-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white chrome:text-foreground">Create Occasion Folder</h2>
                      <p className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                        Select outfits to organize
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white chrome:text-foreground">
                          Adding outfits to &quot;{occasionName}&quot;
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                          {selectedOutfitIds.length} outfit{selectedOutfitIds.length !== 1 ? "s" : ""} selected
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setStep("name")}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        ← Back
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search outfits..."
                        className="pl-10 bg-white dark:bg-background chrome:bg-background border-slate-300 dark:border-border chrome:border-border"
                      />
                    </div>

                    {/* Optional message */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 chrome:bg-blue-50 border border-blue-200 dark:border-blue-800 chrome:border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300 chrome:text-blue-700">
                        💡 You can create an empty folder and add outfits later if you prefer.
                      </p>
                    </div>

                    {/* Outfits Grid */}
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                      </div>
                    ) : filteredOutfits.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">👔</div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white chrome:text-foreground mb-2">
                          {searchQuery ? "No matching outfits" : "No outfits found"}
                        </h3>
                        <p className="text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                          {searchQuery
                            ? "Try adjusting your search or create an empty folder."
                            : "Create your first outfit to get started."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOutfits.map((outfit) => (
                          <motion.div
                            key={outfit.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                          >
                            <Card
                              className={`cursor-pointer transition-all duration-200 border-2 ${
                                selectedOutfitIds.includes(outfit.id)
                                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 chrome:ring-blue-200"
                                  : "border-slate-200 dark:border-border chrome:border-border hover:border-slate-300 dark:hover:border-slate-600 chrome:hover:border-slate-300"
                              }`}
                              onClick={() => toggleOutfitSelection(outfit.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 dark:text-white chrome:text-foreground truncate">
                                      {outfit.name || "Untitled Outfit"}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                                      {outfit.clothingItems.length} item{outfit.clothingItems.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  {selectedOutfitIds.includes(outfit.id) && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>

                                {/* Outfit Preview */}
                                <div className="grid grid-cols-2 gap-2 h-24">
                                  {outfit.clothingItems.slice(0, 4).map((item, index) => (
                                    <div key={item.id} className="relative bg-slate-100 dark:bg-slate-800 chrome:bg-slate-100 rounded-lg overflow-hidden">
                                      <Image
                                        src={item.url}
                                        alt={item.name || "Clothing Item"}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                  ))}
                                  {outfit.clothingItems.length > 4 && (
                                    <div className="bg-slate-100 dark:bg-slate-800 chrome:bg-slate-100 rounded-lg flex items-center justify-center">
                                      <span className="text-xs text-slate-600 dark:text-slate-400 chrome:text-slate-600">
                                        +{outfit.clothingItems.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-border chrome:border-border bg-slate-50 dark:bg-card chrome:bg-slate-50">
                  <div className="text-sm text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                    {selectedOutfitIds.length === 0 ? (
                      "You can create an empty folder and add outfits later"
                    ) : (
                      <div className="flex items-center text-slate-600 dark:text-muted-foreground chrome:text-muted-foreground">
                        <Check className="w-4 h-4 mr-1" />
                        {selectedOutfitIds.length} outfit{selectedOutfitIds.length !== 1 ? "s" : ""} selected
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOccasion}
                      disabled={isCreating}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Folder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}