"use client"

import type React from "react"
import Image from "next/image"
import { useState, useCallback, useRef, useEffect } from "react"
import axios from "axios"
import { Upload, Link, X, Loader2, Check, Sparkles, ImageIcon, Plus, Zap, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { ClothingItem } from "../types/clothing"
import { MAIN_CATEGORIES, SUBCATEGORIES, STYLE_TAGS, SIZES, POPULAR_BRANDS, SEASONS, getSubcategoriesForCategory } from "../constants/clothing"


interface UploadFormProps {
  isOpen: boolean
  onCloseAction: () => void
  onUploadComplete?: (mode: "closet" | "wishlist", newItem: ClothingItem) => void
  currentViewMode?: "closet" | "wishlist"
}

export default function UploadForm({
  isOpen,
  onCloseAction,
  onUploadComplete,
  currentViewMode = "closet",
}: UploadFormProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  const [uploadMethod, setUploadMethod] = useState<"direct" | "url">("direct")
  const [uploadTarget, setUploadTarget] = useState<"closet" | "wishlist">(currentViewMode)
  const [mode, setMode] = useState<"basic" | "advanced">("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const initialFormData = {
    mode: currentViewMode,
    name: "",
    type: "",  // Subcategory (e.g., "t-shirt", "jeans")
    category: "",  // Main category (tops/bottoms/outerwear/etc)
    brand: "",
    price: undefined,
    sourceUrl: "",
    image: "",
    color: "",
    season: "",
    notes: "",
    tags: [] as string[],  // Style tags (max 3)
    size: "",  // Clothing size
  }

  const [formData, setFormData] = useState<Partial<ClothingItem>>(initialFormData)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [scrapingUrl, setScrapingUrl] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [quickMetadataFetched, setQuickMetadataFetched] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showBotDetectionModal, setShowBotDetectionModal] = useState(false)
  const [botDetectionUrl, setBotDetectionUrl] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUploadMethod("direct")
      setUploadTarget(currentViewMode)
      setMode("basic")
      setIsLoading(false)
      setIsAutoFilling(false)
      setIsSubmitting(false)
      setUploadProgress(0)
      setFormData(initialFormData)
      setSelectedFile(null)
      setImagePreview("")
      setScrapingUrl("")
      setIsDragOver(false)
      setQuickMetadataFetched(false)
      setFetchError(null)
      setShowBotDetectionModal(false)
      setBotDetectionUrl("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentViewMode])

  const isFormValid = () => {
    const hasImage = imagePreview
    const hasCategory = formData.category && formData.category.trim() !== ''
    const hasType = formData.type && formData.type.trim() !== ''

    if (!hasImage) return false
    if (!hasCategory) return false // Category is required for consistent sizing
    if (!hasType) return false // Type (subcategory) is also required

    return true
  }

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const result = e.target?.result
      if (!result) return

      // Convert AVIF to PNG using canvas
      if (file.type === "image/avif") {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (!ctx) return

          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            if (!blob) return
            const convertedFile = new File([blob], file.name.replace(/\.avif$/, ".png"), {
              type: "image/png",
            })
            setSelectedFile(convertedFile)
            setImagePreview(URL.createObjectURL(convertedFile))
          }, "image/png")
        }
        img.src = result as string
      } else {
        setSelectedFile(file)
        setImagePreview(result as string)
      }
    }

    reader.readAsDataURL(file)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            handleFileUpload(file)
            event.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [isOpen, handleFileUpload])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith("image/"))
      if (imageFile) {
        handleFileUpload(imageFile)
      }
    },
    [handleFileUpload],
  )

  // Store AI suggestions for analytics tracking
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  const handleAutoFill = async () => {
    if (!selectedFile) return

    setIsAutoFilling(true)
    try {
      const form = new FormData()
      form.append("image", selectedFile)

      const res = await axios.post(`${API_URL}/api/images`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { clothingData } = res.data

      if (!clothingData?.isClothing) {
        alert("This image doesn't look like clothing. Try a different image.")
        return
      }

      // Store AI suggestions for analytics
      setAiSuggestions(clothingData)

      setFormData((prev: Partial<ClothingItem>) => ({
        ...prev,
        name: clothingData?.name ?? prev.name,
        category: clothingData?.category ?? prev.category,
        type: clothingData?.type ?? prev.type,
        brand: clothingData?.brand ?? prev.brand,
        price: clothingData?.price ?? prev.price,
        color: clothingData?.color ?? prev.color,
        season: clothingData?.season ?? prev.season,
        tags: clothingData?.tags ?? prev.tags ?? [],
        size: clothingData?.size ?? prev.size,
        notes: "",
      }))
    } catch (error) {
      console.error("Auto-fill failed:", error)
      alert("Auto-fill failed.")
    } finally {
      setIsAutoFilling(false)
    }
  }

  const handleGeminiMetadata = async () => {
    if (!scrapingUrl.trim()) return;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Quick progress animation for Gemini
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 30;
        });
      }, 100);

      // Call the new quick-scrape backend endpoint
      const res = await axios.post(`${API_URL}/api/quick-scrape`, {
        url: scrapingUrl,
      });
      const data = res.data;

      clearInterval(progressInterval);
      setUploadProgress(100);

      setFormData((prev: Partial<ClothingItem>) => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        price: data.price || prev.price,
        category: data.category || prev.category,
        type: data.type || prev.type,
        color: data.color || prev.color,
        season: data.season || prev.season,
        tags: data.tags || prev.tags || [],
        size: data.size || prev.size,
        sourceUrl: scrapingUrl,
      }));

      setTimeout(() => setUploadProgress(0), 1000);
      setQuickMetadataFetched(true);
    } catch (error: unknown) {
      console.error("Gemini metadata fetch failed:", error);

      // Check the error type from backend response
      const axiosError = error as { response?: { status?: number; data?: { _errorType?: string; error?: string } } };
      const errorType = axiosError.response?.data?._errorType;
      const errorMessage = axiosError.response?.data?.error;

      if (errorType === 'bot_detection' || axiosError.response?.status === 403) {
        setBotDetectionUrl(scrapingUrl);
        setShowBotDetectionModal(true);
      } else {
        // Use the user-friendly error message from backend, or fallback to generic
        setFetchError(errorMessage || "Failed to fetch metadata. Please try again or upload the image manually.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bot detection modal actions
  const handleManualUpload = () => {
    setShowBotDetectionModal(false);
    // Keep the URL in sourceUrl field for reference
    setFormData(prev => ({ ...prev, sourceUrl: botDetectionUrl }));
    // The image upload area is already visible, so no need to do anything else
  };

  const handleTryDifferentUrl = () => {
    setShowBotDetectionModal(false);
    setScrapingUrl("");
    setBotDetectionUrl("");
    setFetchError(null);
  };


  // Function to fetch existing items and generate auto name
  const generateAutoName = async (): Promise<string> => {
    try {
      // Fetch existing items from both closet and wishlist
      const [closetRes, wishlistRes] = await Promise.all([
        axios.get(`${API_URL}/api/images?mode=closet`, { withCredentials: true }),
        axios.get(`${API_URL}/api/images?mode=wishlist`, { withCredentials: true })
      ])

      const allItems = [
        ...(closetRes.data.clothingItems || []),
        ...(wishlistRes.data.clothingItems || [])
      ]

      // Find all existing "Untitled" names
      const untitledPattern = /^Untitled( \d+)?$/
      const existingUntitledNumbers = new Set<number>()

      allItems.forEach((item: { name?: string }) => {
        if (item.name) {
          const match = item.name.match(untitledPattern)
          if (match) {
            if (match[1]) {
              // Extract number from "Untitled X"
              const num = parseInt(match[1].trim())
              existingUntitledNumbers.add(num)
            } else {
              // "Untitled" without number is considered as 1
              existingUntitledNumbers.add(1)
            }
          }
        }
      })

      // Find the next available number
      let nextNumber = 1
      while (existingUntitledNumbers.has(nextNumber)) {
        nextNumber++
      }

      return nextNumber === 1 ? "Untitled" : `Untitled ${nextNumber}`
    } catch (error) {
      console.error('Error generating auto name:', error)
      // Fallback to simple "Untitled" if API call fails
      return "Untitled"
    }
  }

  const handleSubmit = async () => {
    // SAFETY CHECK: Prevent double submission
    if (!isFormValid() || isSubmitting) {
      console.log('⚠️ Submission blocked - form invalid or already submitting');
      return;
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    console.log('🚀 Starting submission process');
    setUploadProgress(0)

    try {
      const submitFormData = new FormData()

      let finalImageFile: File | undefined
      let finalImageUrl: string | undefined

      if (uploadMethod === "direct" && selectedFile) {
        finalImageFile = selectedFile
      } else if (uploadMethod === "url" && selectedFile) {
        finalImageFile = selectedFile
      }

      if (finalImageFile) {
        submitFormData.append("image", finalImageFile)
        console.log('📤 Submitting direct upload to final-submit endpoint');
      } else if (finalImageUrl) {
        submitFormData.append("imageUrl", finalImageUrl)
        console.log('📤 Submitting URL upload to final-submit endpoint');
      } else {
        alert("No image selected for submission.")
        return
      }

      // Auto-generate name if not provided
      const finalName = formData.name?.trim() || await generateAutoName()
      // Set default type if not provided
      const finalType = formData.type?.trim() || "uncategorized"

      submitFormData.append("name", finalName)
      submitFormData.append("type", finalType)
      submitFormData.append("category", formData.category || "")
      submitFormData.append("brand", formData.brand || "")
      submitFormData.append("price", (formData.price || 0).toString())
      submitFormData.append("mode", uploadTarget)
      submitFormData.append("sourceUrl", formData.sourceUrl || "")

      // New schema fields
      submitFormData.append("color", formData.color || "")
      submitFormData.append("season", formData.season || "")
      submitFormData.append("notes", formData.notes || "")
      submitFormData.append("tags", JSON.stringify(formData.tags || []))
      submitFormData.append("size", formData.size || "")

      // Include AI suggestions if they exist (for backend analytics)
      if (aiSuggestions) {
        submitFormData.append("aiSuggestions", JSON.stringify(aiSuggestions))
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Use optimistic endpoint instead of final-submit
      const res = await axios.post(`${API_URL}/api/images/create-optimistic`, submitFormData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      console.log('✅ Optimistic submission successful - item will process in background');

      const { item: newItem } = res.data

      const clothingItem: ClothingItem = {
        id: newItem.id,
        key: newItem.key,
        url: newItem.url,
        image: newItem.url,
        name: newItem.name,
        type: newItem.type,
        category: newItem.category,
        brand: newItem.brand,
        price: newItem.price,
        color: newItem.color,
        season: newItem.season,
        notes: newItem.notes,
        mode: newItem.mode,
        sourceUrl: newItem.sourceUrl,
        tags: newItem.tags || [],
        size: newItem.size,
        purchaseDate: newItem.purchaseDate,
        isFavorite: newItem.isFavorite || false,
        processingStatus: newItem.processingStatus || "pending",
        processingError: newItem.processingError,
        originalImageUrl: newItem.originalImageUrl
      }

      if (onUploadComplete) {
        onUploadComplete(uploadTarget, clothingItem)
      }

      setFormData(initialFormData)
      setSelectedFile(null)
      setImagePreview("")
      setScrapingUrl("")
      setUploadMethod("direct")
      setMode("basic")
      setUploadTarget(currentViewMode)

      onCloseAction()
    } catch (error) {
      console.error("Submission failed:", error)
      alert("Submission failed.")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }


  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog key="upload-modal" open={isOpen} onOpenChange={onCloseAction}>
          <DialogContent className="max-w-6xl w-[95vw] h-[85vh] max-h-[85vh] p-0 flex flex-col overflow-hidden">
              <motion.div
              key="upload-modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Add New Clothing Item
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Left Column - Image Upload */}
                <div className="lg:w-2/5 p-6 border-r bg-gradient-to-br from-muted/30 to-muted/10 flex flex-col min-h-0 overflow-y-auto">
                  <div className="space-y-6 flex flex-col flex-1">
                    {/* Upload Method Toggle */}
                    <Card className="p-1 bg-background/50 backdrop-blur-sm">
                      <div className="flex gap-1">
                        <Button
                          variant={uploadMethod === "direct" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setUploadMethod("direct")}
                          className="flex-1 transition-all duration-200"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Direct Upload
                        </Button>
                        <Button
                          variant={uploadMethod === "url" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setUploadMethod("url")}
                          className="flex-1 transition-all duration-200"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          From URL
                        </Button>
                      </div>
                    </Card>
                    {/* Direct Upload Flow */}
                    {uploadMethod === "direct" && (
                      <motion.div
                        key="direct-upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 flex flex-col flex-1"
                      >
                        <Card
                          className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden flex flex-col flex-1 ${
                            isDragOver
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : imagePreview
                                ? "border-primary/50 bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                          onDrop={handleDrop}
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragOver(true)
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <CardContent className="p-8 flex flex-col justify-center items-center flex-1">
                            <AnimatePresence mode="wait">
                              {imagePreview ? (
                                <motion.div
                                  key="image-preview"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="space-y-4"
                                >
                                  <div className="relative group">
                                    <Image
                                      src={imagePreview || "/placeholder.svg"}
                                      alt="Preview"
                                      width={400}
                                      height={256}
                                      className="w-full h-64 object-contain mx-auto rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setImagePreview("")
                                      setSelectedFile(null)
                                    }}
                                    className="mx-auto flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                    Remove Image
                                  </Button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="upload-placeholder"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-center space-y-4 flex flex-col justify-center items-center h-full"
                                >
                                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-medium text-foreground">Upload or Copy, Paste a Image</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Up to 10MB • Paste from clipboard (Ctrl+C, Ctrl+V)
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file)
                          }}
                        />
                        <AnimatePresence>
                          {imagePreview && (
                            <motion.div
                              key="auto-fill-button"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <Button
                                onClick={handleAutoFill}
                                disabled={isAutoFilling || !selectedFile}
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                                size="lg"
                              >
                                {isAutoFilling ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                {isAutoFilling ? "Analyzing..." : "Auto-fill with AI"}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                    {/* From URL 3-step Flow */}
                    {uploadMethod === "url" && (
                      <motion.div
                        key="url-upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 flex flex-col flex-1"
                      >
                        {/* URL Input Section */}
                        <motion.div
                          key="url-input-step"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Product URL</Label>
                            <div className="flex gap-2 w-full">
                              <Input
                                placeholder="Enter product URL and press Enter..."
                                value={scrapingUrl}
                                onChange={e => {
                                  setScrapingUrl(e.target.value);
                                  setFetchError(null);
                                  setQuickMetadataFetched(false);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && scrapingUrl.trim() && !isLoading) {
                                    e.preventDefault();
                                    handleGeminiMetadata();
                                  }
                                }}
                                className="flex-1"
                                disabled={isLoading}
                              />
                              <Button
                                onClick={handleGeminiMetadata}
                                disabled={!scrapingUrl.trim() || isLoading}
                                className="px-6 w-[140px]"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4 mr-1" />
                                    Fetch Info
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          {fetchError && <div className="text-xs text-destructive mt-1">{fetchError}</div>}

                          {quickMetadataFetched && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  Metadata extracted successfully!
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 ml-6">
                                Now upload your product image below ↓
                              </p>
                            </div>
                          )}
                        </motion.div>
                        
                        {/* Always show image upload area after URL input */}
                        <Card
                          className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden flex flex-col flex-1 ${
                            isDragOver
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : imagePreview
                                ? "border-primary/50 bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                          onDrop={handleDrop}
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragOver(true)
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onClick={() => quickImageInputRef.current?.click()}
                        >
                          <CardContent className="p-8 flex flex-col justify-center items-center flex-1">
                            <AnimatePresence mode="wait">
                              {imagePreview ? (
                                <motion.div
                                  key="url-image-preview"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="space-y-4"
                                >
                                  <div className="relative group">
                                    <Image
                                      src={imagePreview || "/placeholder.svg"}
                                      alt="Preview"
                                      width={400}
                                      height={256}
                                      className="w-full h-64 object-contain mx-auto rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setImagePreview("")
                                      setSelectedFile(null)
                                    }}
                                    className="mx-auto flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                    Remove Image
                                  </Button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="url-upload-placeholder"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-center space-y-4 flex flex-col justify-center items-center h-full"
                                >
                                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-medium text-foreground">Upload Product Image</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Upload while metadata is being fetched • Paste from clipboard (Ctrl+C, Ctrl+V)
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                        <input
                          ref={quickImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file)
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Right Column - Form */}
                  <div className="lg:w-3/5 flex flex-col overflow-hidden min-h-0">
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/20" style={{minHeight: 0}}>
                    {/* Target Toggle */}
                    <Card className="p-4 bg-gradient-to-r from-background to-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Add to:</Label>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={uploadTarget === "wishlist"}
                            onCheckedChange={(checked: boolean) => {
                              setUploadTarget(checked ? "wishlist" : "closet")
                              setFormData((prev) => ({ ...prev, mode: checked ? "wishlist" : "closet" }))
                            }}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Badge
                            variant={uploadTarget === "wishlist" ? "default" : "secondary"}
                            className="px-3 py-1 font-medium transition-all duration-200"
                          >
                            {uploadTarget === "wishlist" ? "✨ Wishlist" : "My Closet"}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Separator />

                    {/* Form Tabs */}
                    <Tabs value={mode} onValueChange={(value) => setMode(value as "basic" | "advanced")}>
                      <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
                        <TabsTrigger value="basic" className="transition-all duration-200">
                          Basic Details
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="transition-all duration-200">
                          Advanced Details
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-6 mt-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                              Name
                            </Label>
                            <Input
                              id="name"
                              placeholder="e.g., Classic Denim Jacket (optional - auto-names if empty)"
                              value={formData.name || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                              Category
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.category || ""}
                              onValueChange={(value: string) => {
                                setFormData((prev) => ({ ...prev, category: value, type: "" }))
                              }}
                              required
                            >
                              <SelectTrigger className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${!formData.category ? 'border-orange-300 bg-orange-50/30 dark:border-orange-500 dark:bg-orange-950/50' : ''}`}>
                                <SelectValue placeholder="Select main category..." />
                              </SelectTrigger>
                              <SelectContent>
                                {MAIN_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!formData.category && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <span className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></span>
                                Select a category for consistent sizing
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium flex items-center gap-2">
                              Type
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.type || ""}
                              onValueChange={(value: string) => setFormData((prev) => ({ ...prev, type: value }))}
                              disabled={!formData.category}
                              required
                            >
                              <SelectTrigger className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${formData.category && !formData.type ? 'border-orange-300 bg-orange-50/30 dark:border-orange-500 dark:bg-orange-950/50' : ''}`}>
                                <SelectValue placeholder={formData.category ? "Select type..." : "Select category first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.category && getSubcategoriesForCategory(formData.category).map((subcat) => (
                                  <SelectItem key={subcat} value={subcat}>
                                    {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="brand" className="text-sm font-medium">
                              Brand
                            </Label>
                            <Input
                              id="brand"
                              placeholder="e.g., Levi's, Nike, Zara"
                              value={formData.brand || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="price" className="text-sm font-medium">
                              Price
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              placeholder="0.00"
                              value={formData.price ?? ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  price: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                                }))
                              }
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {uploadTarget === "wishlist" && (
                            <motion.div
                              key="wishlist-url-field"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="sourceUrl" className="text-sm font-medium">
                                Source URL
                              </Label>
                              <Input
                                id="sourceUrl"
                                placeholder="https://..."
                                value={formData.sourceUrl || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">
                            Notes
                          </Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional notes about this item..."
                            maxLength={100}
                            value={formData.notes || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground text-right">{formData.notes?.length || 0}/100</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-6 mt-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="tags" className="text-sm font-medium">
                              Style Tags (Max 3)
                            </Label>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
                              {STYLE_TAGS.map((tag) => {
                                const isSelected = formData.tags?.includes(tag) || false
                                const canSelect = (formData.tags?.length || 0) < 3

                                return (
                                  <Badge
                                    key={tag}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer transition-all ${
                                      !isSelected && !canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                                    }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          tags: prev.tags?.filter((t) => t !== tag) || []
                                        }))
                                      } else if (canSelect) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          tags: [...(prev.tags || []), tag]
                                        }))
                                      }
                                    }}
                                  >
                                    {tag}
                                  </Badge>
                                )
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formData.tags?.length || 0}/3 tags selected
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="size" className="text-sm font-medium">
                              Size
                            </Label>
                            <Input
                              id="size"
                              placeholder="e.g., M, L, 32, 10"
                              value={formData.size || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              list="sizes-datalist"
                            />
                            <datalist id="sizes-datalist">
                              {SIZES.map((size) => (
                                <option key={size} value={size} />
                              ))}
                            </datalist>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="color" className="text-sm font-medium">
                              Color
                            </Label>
                            <Input
                              id="color"
                              placeholder="e.g., Navy Blue, Black, Red"
                              value={formData.color || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="season" className="text-sm font-medium">
                              Season
                            </Label>
                            <Select
                              value={formData.season || ""}
                              onValueChange={(value: string) => setFormData((prev) => ({ ...prev, season: value }))}
                            >
                              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 data-[placeholder]:text-muted-foreground">
                                <SelectValue placeholder="Select season" />
                              </SelectTrigger>
                              <SelectContent>
                                {SEASONS.map((season) => (
                                  <SelectItem key={season} value={season}>
                                    {season}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t bg-gradient-to-r from-background to-muted/20 p-6">
                    <AnimatePresence>
                      {(isSubmitting || isLoading) && (
                        <motion.div
                          key="upload-progress"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4"
                        >
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span className="font-medium">
                              {isSubmitting ? "Uploading..." : "Fetching metadata..."}
                            </span>
                            <span className="font-mono">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={onCloseAction}
                        disabled={isSubmitting}
                        className="px-6 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isSubmitting}
                        className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Adding..." : "Add Item"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bot Detection Modal */}
      <Dialog key="bot-detection-modal" open={showBotDetectionModal} onOpenChange={setShowBotDetectionModal}>
        <DialogContent className="max-w-md">
          <motion.div
            key="bot-detection-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                This site protects against automated requests
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <p className="text-center text-muted-foreground leading-relaxed">
                Some websites block automatic data extraction for security. No worries - you can upload the image manually instead.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleManualUpload}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image Manually
                </Button>

                <Button
                  variant="outline"
                  onClick={handleTryDifferentUrl}
                  className="w-full transition-all duration-200"
                  size="lg"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Try Different URL
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  This is normal and happens with many shopping sites
                </p>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}