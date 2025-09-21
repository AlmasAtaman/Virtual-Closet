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
          className={`bg-white dark:bg-background chrome:bg-background rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col ${
            step === "name" ? "max-w-md" : "max-w-4xl"
          }`}
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
                {/* Simple Header for Name Step */}
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
                {/* Header for Selection Step - Same as Original */}
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
                        size="sm"
                        onClick={() => setStep("name")}
                        className="gap-2"
                      >
                        Back
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted-foreground chrome:text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search outfits..."
                        className="pl-10 bg-white dark:bg-background chrome:bg-background border-slate-300 dark:border-border chrome:border-border text-slate-900 dark:text-foreground chrome:text-foreground placeholder-slate-500 dark:placeholder-muted-foreground chrome:placeholder-muted-foreground"
                      />
                    </div>

                    {/* Outfits Grid - Restored Original Design */}
                    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                      {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="aspect-[3/4] bg-slate-200 dark:bg-muted chrome:bg-muted rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : filteredOutfits.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                            {searchQuery ? "No outfits match your search" : "No outfits found"}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredOutfits.map((outfit) => (
                            <motion.div
                              key={outfit.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card
                                className={`cursor-pointer transition-all duration-200 ${
                                  selectedOutfitIds.includes(outfit.id)
                                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 chrome:bg-blue-50"
                                    : "hover:ring-2 hover:ring-slate-300 dark:hover:ring-border chrome:hover:ring-border"
                                }`}
                                onClick={() => toggleOutfitSelection(outfit.id)}
                              >
                                <CardContent className="p-3">
                                  {/* Outfit Preview - Original Design */}
                                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-muted dark:to-card chrome:from-muted chrome:to-card rounded-lg mb-3 relative flex items-center justify-center overflow-hidden">
                                    {outfit.clothingItems.length > 0 ? (
                                      <div className="relative w-full h-full">
                                        {outfit.clothingItems.map((item, index) => {
                                          // Adjust positioning for CreateOccasionModal preview cards
                                          let adjustedLeft = item.left ?? 50;
                                          
                                          // Move items more to the left and center them
                                          adjustedLeft = adjustedLeft + 40; // Move everything 10% to the left
                                          
                                          return (
                                            <Image
                                              key={item.id}
                                              src={item.url}
                                              alt={item.name || `Clothing item ${index + 1}`}
                                              width={200}
                                              height={200}
                                              className="absolute object-contain max-w-[70%] max-h-[70%]"
                                              unoptimized
                                              style={{
                                                left: `${adjustedLeft}%`,
                                                bottom: `${(item.bottom || 0) * 0.3}rem`, // Reduced from 0.6 to 0.3 to bring items closer together
                                                width: `${(item.width || 8) * 0.5}rem`,
                                                transform: "translateX(-50%)",
                                                zIndex: index,
                                              }}
                                            />
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 dark:text-muted-foreground chrome:text-muted-foreground text-center">
                                        <div className="text-2xl mb-1">👗</div>
                                        <p className="text-xs">Empty Outfit</p>
                                      </div>
                                    )}
                                    
                                    {/* Selection indicator */}
                                    <div className="absolute top-2 right-2">
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          selectedOutfitIds.includes(outfit.id)
                                            ? "bg-blue-500 border-blue-500"
                                            : "bg-white border-slate-300 dark:bg-background dark:border-border chrome:bg-background chrome:border-border"
                                        }`}
                                      >
                                        {selectedOutfitIds.includes(outfit.id) && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Outfit Info */}
                                  <div className="space-y-1">
                                    <h4 className="font-medium text-sm text-slate-900 dark:text-white chrome:text-foreground truncate">
                                      {outfit.name || "Untitled Outfit"}
                                    </h4>
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-muted-foreground chrome:text-muted-foreground">
                                      <span>{outfit.clothingItems.length} items</span>
                                      {outfit.totalPrice && (
                                        <span>${outfit.totalPrice.toFixed(2)}</span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer - Same as Original */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-border chrome:border-border bg-slate-50 dark:bg-muted/30 chrome:bg-muted/30 flex-shrink-0">
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