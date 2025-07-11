"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, SkipBackIcon as Skip, Save, DollarSign, Calendar, MapPin, FileText, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  price?: number
  mode: "closet" | "wishlist"
}

interface OutfitDetailsStepProps {
  isOpen: boolean
  onClose: () => void
  outfitId: string
  clothingItems: ClothingItem[]
  onComplete: () => void
  onSkip: () => void
}

interface OutfitDetails {
  name: string
  price: number
  occasion: string
  season: string
  notes: string
}

export default function OutfitDetailsModal({
  isOpen,
  onClose,
  outfitId,
  clothingItems,
  onComplete,
  onSkip,
}: OutfitDetailsStepProps) {
  const [details, setDetails] = useState<OutfitDetails>({
    name: "",
    price: 0,
    occasion: "",
    season: "",
    notes: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [manualPriceSet, setManualPriceSet] = useState(false)

  // Calculate total price from clothing items
  useEffect(() => {
    const totalPrice = clothingItems.reduce((sum, item) => sum + (item.price || 0), 0)
    if (!manualPriceSet) {
      setDetails((prev) => ({ ...prev, price: totalPrice }))
    }
  }, [clothingItems, manualPriceSet])

  const handleInputChange = (field: keyof OutfitDetails, value: string | number) => {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveDetails = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:8000/api/outfits/${outfitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: details.name || undefined,
          price: details.price || undefined,
          occasion: details.occasion || undefined,
          season: details.season || undefined,
          notes: details.notes || undefined,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update outfit details")
      }

      onComplete()
      onClose() // Close the modal on successful save
    } catch (error) {
      console.error("Error saving outfit details:", error)
      // Still complete the flow even if saving fails
      onComplete()
      onClose() // Close the modal even if saving fails
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onSkip()
    onClose() // Close the modal on skip
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          className="w-full"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <DialogTitle className="text-xl text-slate-900 dark:text-white">Want to add more details?</DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Totally optional! You can always edit these later.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="outfit-name"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center"
                >
                  <Tag className="w-4 h-4 mr-1" />
                  Name
                  <span className="text-xs text-slate-400 ml-2">(optional)</span>
                </Label>
                <Input
                  id="outfit-name"
                  placeholder="e.g., Weekend Casual, Date Night..."
                  value={details.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="border-slate-200 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500"
                />
              </motion.div>

              {/* Price Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="outfit-price"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Total Price
                  <span className="text-xs text-slate-400 ml-2">(auto-calculated)</span>
                </Label>
                <Input
                  id="outfit-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={details.price || ""}
                  onChange={(e) => {
                    setManualPriceSet(true)
                    handleInputChange("price", Number.parseFloat(e.target.value) || 0)
                  }}
                  className="border-slate-200 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500"
                />
              </motion.div>

              {/* Occasion Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Occasion
                  <span className="text-xs text-slate-400 ml-2">(optional)</span>
                </Label>
                <Select value={details.occasion} onValueChange={(value: string) => handleInputChange("occasion", value)}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select an occasion..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Party">Party</SelectItem>
                    <SelectItem value="Date">Date</SelectItem>
                    <SelectItem value="Athletic">Athletic</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Season Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Season
                  <span className="text-xs text-slate-400 ml-2">(optional)</span>
                </Label>
                <Select value={details.season} onValueChange={(value: string) => handleInputChange("season", value)}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select a season..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Notes Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="outfit-notes"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Notes
                  <span className="text-xs text-slate-400 ml-2">(optional)</span>
                </Label>
                <Textarea
                  id="outfit-notes"
                  placeholder="Any thoughts about this outfit..."
                  value={details.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="min-h-[80px] border-slate-200 dark:border-slate-700 focus:ring-purple-500 focus:border-purple-500 resize-y"
                />
              </motion.div>
            </CardContent>

            <DialogFooter className="flex flex-col sm:flex-row justify-between p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 order-2 sm:order-1 mt-2 sm:mt-0"
                disabled={isSaving}
              >
                <Skip className="w-4 h-4 mr-2 rotate-180" />
                Skip for now
              </Button>
              <Button
                onClick={handleSaveDetails}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 order-1 sm:order-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Details
              </Button>
            </DialogFooter>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 