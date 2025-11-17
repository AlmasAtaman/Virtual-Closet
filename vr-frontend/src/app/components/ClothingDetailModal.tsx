"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Loader2, ShoppingCart, Pencil, Trash2, ExternalLink, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { ExpandIcon } from "./icons/ExpandIcon"
import { ClosetIcon } from "./icons/ClosetIcon"
import { ColorSwatches } from "./icons/ColorSwatches"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ClothingItem } from "../types/clothing"

interface EditForm {
  name: string
  category: string
  type: string
  brand: string
  price: string
  color: string
  season: string
  notes: string
  sourceUrl: string
  tags: string[]
  size: string
}

interface ClothingDetailModalProps {
  item: ClothingItem
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: (key: string) => void
  onMoveToCloset: (item: ClothingItem) => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  editForm: EditForm
  setEditForm: (value: EditForm) => void
  isDeleting: boolean
  isMoving: boolean
  allItems?: ClothingItem[]
  onToggleFavorite?: (id: string, newState: boolean) => void
  onRetryProcessing?: (id: string) => void
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

export default function ClothingDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onMoveToCloset,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  isDeleting,
  isMoving,
  onToggleFavorite,
  onNavigateNext,
  onNavigatePrev,
  hasNext,
  hasPrev,
}: ClothingDetailModalProps) {
  const currentItem = item
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[420px] p-6 overflow-visible border border-border rounded-lg">
        <VisuallyHidden>
          <DialogTitle>Clothing Details</DialogTitle>
        </VisuallyHidden>

        {/* Left Sidebar - Expanded Mode Only */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="left-sidebar"
              initial={{ width: 0, opacity: 0, x: 0 }}
              animate={{ width: 220, opacity: 1, x: -220 }}
              exit={{ width: 0, opacity: 0, x: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-background border-y border-l border-border overflow-hidden h-[480px] rounded-l-lg"
              style={{ originX: 1 }}
            >
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        placeholder=""
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="h-9 flex items-center text-sm">{currentItem.name || "-"}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price</Label>
                    {isEditing ? (
                      <Input
                        id="price"
                        type="text"
                        placeholder=""
                        value={editForm.price || ""}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="h-9 flex items-center text-sm">{currentItem.price ? `$${currentItem.price}` : "-"}</p>
                    )}
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                    {isEditing ? (
                      <Input
                        id="brand"
                        placeholder=""
                        value={editForm.brand || ""}
                        onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="h-9 flex items-center text-sm">{currentItem.brand || "-"}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    {isEditing ? (
                      <Input
                        id="type"
                        placeholder=""
                        value={editForm.type || ""}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="h-9 flex items-center text-sm">{currentItem.type || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Mode Toggle - Only visible in edit mode */}
                {isEditing && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditForm({ ...editForm, mode: 'closet' as any })}
                        className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                          (editForm as any).mode === 'closet' || currentItem.mode === 'closet'
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}
                      >
                        Closet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar - Expanded Mode Only */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="right-sidebar"
              initial={{ width: 0, opacity: 0, x: 0 }}
              animate={{ width: 220, opacity: 1, x: 220 }}
              exit={{ width: 0, opacity: 0, x: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-background border-y border-r border-border overflow-hidden h-[480px] rounded-r-lg"
              style={{ originX: 0 }}
            >
              <div className="p-6 space-y-3 h-full flex flex-col overflow-hidden">
                {/* Source URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="sourceUrl" className="text-sm font-medium">Source URL</Label>
                  {isEditing ? (
                    <Input
                      id="sourceUrl"
                      placeholder=""
                      value={editForm.sourceUrl || ""}
                      onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <p className="h-8 flex items-center text-xs truncate">{currentItem.sourceUrl || "-"}</p>
                  )}
                </div>

                {/* Season */}
                <div className="space-y-1.5">
                  <Label htmlFor="season" className="text-sm font-medium">Season</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.season || ""}
                      onValueChange={(value: string) => setEditForm({ ...editForm, season: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                        <SelectItem value="all">All Seasons</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="h-8 flex items-center text-xs capitalize">{currentItem.season || "-"}</p>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                  <Label className="text-sm font-medium">Color</Label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
                      {[
                        { name: "Beige", component: ColorSwatches.Beige },
                        { name: "Black", component: ColorSwatches.Black },
                        { name: "Blue", component: ColorSwatches.Blue },
                        { name: "Brown", component: ColorSwatches.Brown },
                        { name: "Green", component: ColorSwatches.Green },
                        { name: "Grey", component: ColorSwatches.Grey },
                        { name: "Orange", component: ColorSwatches.Orange },
                        { name: "Pink", component: ColorSwatches.Pink },
                        { name: "Purple", component: ColorSwatches.Purple },
                        { name: "Red", component: ColorSwatches.Red },
                        { name: "Silver", component: ColorSwatches.Silver },
                        { name: "Tan", component: ColorSwatches.Tan },
                        { name: "White", component: ColorSwatches.White },
                        { name: "Yellow", component: ColorSwatches.Yellow },
                      ].map((color) => {
                        const SwatchComponent = color.component;
                        const isSelected = editForm.color === color.name;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, color: color.name })}
                            className={`flex items-center gap-1.5 p-1.5 rounded-md border transition-all text-left ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <SwatchComponent size={18} />
                            <span className="text-[10px] font-medium truncate">{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-8 flex items-center gap-2">
                      {currentItem.color ? (
                        <>
                          {(() => {
                            const ColorComponent = ColorSwatches[currentItem.color as keyof typeof ColorSwatches];
                            return ColorComponent ? <ColorComponent size={18} /> : null;
                          })()}
                          <span className="text-[10px] font-medium">{currentItem.color}</span>
                        </>
                      ) : (
                        <p className="text-xs">-</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows - Pushed outward when wings expand - Hidden in edit mode */}
        {(hasPrev || hasNext) && (
          <>
            {/* Left Arrow */}
            {hasPrev && (
              <motion.button
                onClick={onNavigatePrev}
                animate={{
                  x: isExpanded ? -220 : 0,
                  opacity: isEditing ? 0 : 1,
                  pointerEvents: isEditing ? 'none' : 'auto'
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-1/2 -translate-y-1/2 -left-16 z-30 w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent transition-colors shadow-lg"
                aria-label="Previous item"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}

            {/* Right Arrow */}
            {hasNext && (
              <motion.button
                onClick={onNavigateNext}
                animate={{
                  x: isExpanded ? 220 : 0,
                  opacity: isEditing ? 0 : 1,
                  pointerEvents: isEditing ? 'none' : 'auto'
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-1/2 -translate-y-1/2 -right-16 z-30 w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent transition-colors shadow-lg"
                aria-label="Next item"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}
          </>
        )}

        <div className="relative -m-6">
          {/* Main Image Area */}
          <div className="group relative w-full h-[480px] flex items-center justify-center p-8 bg-background rounded-t-lg">
            {/* Plus Icon - Top Left - Only visible on hover */}
            <button
              className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70"
              onClick={() => {/* Could be used for adding to outfit or similar action */}}
              aria-label="Add"
            >
              <Plus className="w-6 h-6 stroke-[2]" />
            </button>

            {/* Heart Icon - Top Right - Only visible on hover */}
            <button
              className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70"
              onClick={() => onToggleFavorite?.(currentItem.id, !currentItem.isFavorite)}
              aria-label={currentItem.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              {currentItem.isFavorite ? (
                <Heart className="fill-current w-6 h-6 stroke-[1.5]" />
              ) : (
                <Heart className="w-6 h-6 stroke-[1.5]" />
              )}
            </button>
            {currentItem.url ? (
              <>
                {currentItem.processingStatus === 'completed' && (
                  <motion.img
                    src={currentItem.url}
                    alt={currentItem.name || "Clothing item"}
                    className="max-h-full max-w-full object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                {currentItem.processingStatus && currentItem.processingStatus !== 'completed' && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center text-gray-400">
                <span className="text-4xl">👕</span>
              </div>
            )}

            {/* Visit Site Button - Bottom Left of Image (only when not editing) */}
            {!isEditing && currentItem.sourceUrl && (
              <a
                href={currentItem.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full font-medium text-sm hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Site
              </a>
            )}
          </div>

          {/* Bottom Section - NAME and Icons OR Cancel/Save Buttons */}
          <div className="flex items-center justify-between px-6 border-t border-border bg-background rounded-b-lg h-[76px]">
            {isEditing ? (
              /* Edit Mode - Cancel/Save Buttons */
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => {
                    onEdit();
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
              </div>
            ) : (
              /* Normal Mode - NAME and Icons */
              <>
                {/* NAME Label */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold tracking-tight uppercase">
                    {currentItem.name || "NAME"}
                  </h3>
                </div>

                {/* 4 Action Icons */}
                <div className="flex items-center gap-1">
                  {/* First Icon - Expand/Panel Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`h-9 w-9 ${
                      isExpanded ? "bg-accent" : "hover:bg-accent"
                    }`}
                    aria-label="Expand"
                  >
                    <ExpandIcon size={20} />
                  </Button>

                  {/* Second Icon - Mode Toggle (Closet/Wishlist) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveToCloset(currentItem)}
                    disabled={isMoving}
                    className="h-9 w-9 hover:bg-accent"
                    aria-label={currentItem.mode === "closet" ? "Move to wishlist" : "Move to closet"}
                  >
                    {isMoving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : currentItem.mode === "closet" ? (
                      <ShoppingCart className="h-5 w-5" />
                    ) : (
                      <ClosetIcon size={20} />
                    )}
                  </Button>

                  {/* Third Icon - Edit/Pencil */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (!isEditing) {
                        setIsExpanded(true);
                      }
                    }}
                    className={`h-9 w-9 ${
                      isEditing ? "bg-accent" : "hover:bg-accent"
                    }`}
                    aria-label="Edit"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>

                  {/* Fourth Icon - Delete/Trash */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(currentItem.key)}
                    disabled={isDeleting}
                    className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
