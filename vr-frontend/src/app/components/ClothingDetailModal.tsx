"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Edit, Trash2, MoveRight, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { ClothingItem } from "../types/clothing"

interface ClothingDetailModalProps {
  item: ClothingItem
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: (key: string) => void
  onMoveToCloset: (item: ClothingItem) => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  editForm: {
    name: string
    type: string
    brand: string
    price: string
    occasion: string
    style: string
    fit: string
    color: string
    material: string
    season: string
    notes: string
    sourceUrl: string
  }
  setEditForm: (value: any) => void
  isDeleting: boolean
  isMoving: boolean
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
}: ClothingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("general")

  // Helper function to safely format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return ""
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    if (isNaN(numPrice) || numPrice === 0) return ""
    return `$${numPrice.toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{isEditing ? "Edit Item" : "Clothing Details"}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            {/* Image Section */}
            <div className="md:w-1/2 p-6 flex items-center justify-center bg-muted/30">
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  src={item.url}
                  alt={item.name}
                  className="max-h-[400px] max-w-full object-contain rounded-lg shadow-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {item.mode === "wishlist" && (
                  <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-500/90 text-white">
                    Wishlist
                  </Badge>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-grow">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Item name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <Select
                          value={editForm.type}
                          onValueChange={(value: string) => setEditForm({ ...editForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="T-shirt">T-shirt</SelectItem>
                            <SelectItem value="Shirt">Shirt</SelectItem>
                            <SelectItem value="Pants">Pants</SelectItem>
                            <SelectItem value="Jeans">Jeans</SelectItem>
                            <SelectItem value="Jacket">Jacket</SelectItem>
                            <SelectItem value="Sweater">Sweater</SelectItem>
                            <SelectItem value="Dress">Dress</SelectItem>
                            <SelectItem value="Skirt">Skirt</SelectItem>
                            <SelectItem value="Shoes">Shoes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Brand</label>
                        <Input
                          value={editForm.brand}
                          onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                          placeholder="Brand name"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Price</label>
                        <Input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Source URL</label>
                        <Input
                          value={editForm.sourceUrl}
                          onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Details</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 pt-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Notes</label>
                          <Textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Add notes about this item..."
                            rows={3}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Occasion</label>
                            <Select
                              value={editForm.occasion}
                              onValueChange={(value: string) => setEditForm({ ...editForm, occasion: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select occasion" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Casual">Casual</SelectItem>
                                <SelectItem value="Formal">Formal</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Athletic">Athletic</SelectItem>
                                <SelectItem value="Party">Party</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Style</label>
                            <Input
                              value={editForm.style}
                              onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                              placeholder="Style"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Fit</label>
                            <Select
                              value={editForm.fit}
                              onValueChange={(value: string) => setEditForm({ ...editForm, fit: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select fit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Slim">Slim</SelectItem>
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Oversized">Oversized</SelectItem>
                                <SelectItem value="Skinny">Skinny</SelectItem>
                                <SelectItem value="Relaxed">Relaxed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Color</label>
                            <Input
                              value={editForm.color}
                              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                              placeholder="Color"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Material</label>
                            <Select
                              value={editForm.material}
                              onValueChange={(value: string) => setEditForm({ ...editForm, material: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cotton">Cotton</SelectItem>
                                <SelectItem value="Denim">Denim</SelectItem>
                                <SelectItem value="Leather">Leather</SelectItem>
                                <SelectItem value="Linen">Linen</SelectItem>
                                <SelectItem value="Polyester">Polyester</SelectItem>
                                <SelectItem value="Wool">Wool</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Season</label>
                            <Select
                              value={editForm.season}
                              onValueChange={(value: string) => setEditForm({ ...editForm, season: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select season" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Spring">Spring</SelectItem>
                                <SelectItem value="Summer">Summer</SelectItem>
                                <SelectItem value="Fall">Fall</SelectItem>
                                <SelectItem value="Winter">Winter</SelectItem>
                                <SelectItem value="All Seasons">All Seasons</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">{item.name}</h2>
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View product page
                        </a>
                      )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General Info</TabsTrigger>
                        <TabsTrigger value="details">Style & Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {item.type && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                              <p className="text-base">{item.type}</p>
                            </div>
                          )}

                          {item.brand && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Brand</h4>
                              <p className="text-base">{item.brand}</p>
                            </div>
                          )}

                          {formatPrice(item.price) && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                              <p className="text-base font-medium text-primary">{formatPrice(item.price)}</p>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                            <Card>
                              <CardContent className="p-4 text-sm">{item.notes}</CardContent>
                            </Card>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="details" className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          {item.occasion && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Occasion</h4>
                              <p className="text-base">{item.occasion}</p>
                            </div>
                          )}

                          {item.style && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Style</h4>
                              <p className="text-base">{item.style}</p>
                            </div>
                          )}

                          {item.fit && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Fit</h4>
                              <p className="text-base">{item.fit}</p>
                            </div>
                          )}

                          {item.color && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Color</h4>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: item.color.toLowerCase() }}
                                ></div>
                                <p className="text-base">{item.color}</p>
                              </div>
                            </div>
                          )}

                          {item.material && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Material</h4>
                              <p className="text-base">{item.material}</p>
                            </div>
                          )}

                          {item.season && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Season</h4>
                              <p className="text-base">{item.season}</p>
                            </div>
                          )}
                        </div>

                        {!item.occasion &&
                          !item.style &&
                          !item.fit &&
                          !item.color &&
                          !item.material &&
                          !item.season && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No additional details available.</p>
                              <p className="text-sm mt-1">Click Edit to add more information.</p>
                            </div>
                          )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={onEdit} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    {item.mode === "wishlist" && (
                      <Button
                        variant="outline"
                        onClick={() => onMoveToCloset(item)}
                        disabled={isMoving}
                        className="gap-2"
                      >
                        {isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />}
                        Move to Closet
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true)
                        setEditForm({
                          name: item.name,
                          type: item.type || "",
                          brand: item.brand || "",
                          price: item.price?.toString() || "",
                          occasion: item.occasion || "",
                          style: item.style || "",
                          fit: item.fit || "",
                          color: item.color || "",
                          material: item.material || "",
                          season: item.season || "",
                          notes: item.notes || "",
                          sourceUrl: item.sourceUrl || "",
                        })
                      }}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onDelete(item.key)}
                      disabled={isDeleting}
                      className="gap-2"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 