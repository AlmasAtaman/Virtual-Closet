"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import axios from "axios"
import { Upload, Link, X, Loader2, Check, Sparkles, ImageIcon, Plus, Zap, Clock } from "lucide-react"
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
import type { ClothingItem, ScrapedProduct } from "../types/clothing"


interface UploadFormProps {
  isOpen: boolean
  onCloseAction: () => void
  onUploadComplete?: (mode: "closet" | "wishlist", newItem: ClothingItem) => void
  currentViewMode?: "closet" | "wishlist"
  fetchGeminiMetadata?: (url: string) => Promise<Partial<ClothingItem>>
}

export default function UploadForm({
  isOpen,
  onCloseAction,
  onUploadComplete,
  currentViewMode = "closet",
  fetchGeminiMetadata,
}: UploadFormProps) {
  const [uploadMethod, setUploadMethod] = useState<"direct" | "url">("direct")
  const [urlExtractionMode, setUrlExtractionMode] = useState<"quick" | "full">("quick")
  const [uploadTarget, setUploadTarget] = useState<"closet" | "wishlist">(currentViewMode)
  const [mode, setMode] = useState<"basic" | "advanced">("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const initialFormData = {
    mode: currentViewMode,
    name: "",
    type: "",
    brand: "",
    price: undefined,
    sourceUrl: "",
    image: "",
    occasion: "",
    style: "",
    fit: "",
    color: "",
    material: "",
    season: "",
    notes: "",
  }

  const [formData, setFormData] = useState<Partial<ClothingItem>>(initialFormData)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([])
  const [selectedScrapedImage, setSelectedScrapedImage] = useState<string>("")
  const [scrapingUrl, setScrapingUrl] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [quickMetadataFetched, setQuickMetadataFetched] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUploadMethod("direct")
      setUrlExtractionMode("quick")
      setUploadTarget(currentViewMode)
      setMode("basic")
      setIsLoading(false)
      setIsAutoFilling(false)
      setIsSubmitting(false)
      setUploadProgress(0)
      setFormData(initialFormData)
      setSelectedFile(null)
      setImagePreview("")
      setScrapedProducts([])
      setSelectedScrapedImage("")
      setScrapingUrl("")
      setIsDragOver(false)
      setIsFetching(false)
      setQuickMetadataFetched(false)
      setHasFetched(false)
      setFetchError(null)
    }
  }, [isOpen, currentViewMode])

  const isFormValid = () => {
    const hasImage = imagePreview || selectedScrapedImage
    const hasName = formData.name?.trim()
    const hasType = formData.type?.trim()

    if (!hasImage || !hasName || !hasType) return false

    if (uploadTarget === "wishlist") {
      return formData.price !== undefined && formData.sourceUrl?.trim()
    }

    return true
  }

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const result = e.target?.result
      if (!result) return

      // Convert AVIF to PNG using canvas
      if (file.type === "image/avif") {
        const img = new Image()
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

  // Helper function to normalize AI responses to dropdown values
  const normalizeAIValue = (value: string | undefined, type: 'type' | 'fit' | 'material' | 'season'): string => {
    if (!value) return ""
    
    const lowerValue = value.toLowerCase().trim()
    
    switch (type) {
      case 'type':
        const typeMap: Record<string, string> = {
          'tshirt': 'T-Shirt',
          't-shirt': 'T-Shirt',
          'tee': 'T-Shirt',
          'shirt': 'T-Shirt',
          'jacket': 'Jacket',
          'coat': 'Jacket',
          'blazer': 'Jacket',
          'pants': 'Pants',
          'trousers': 'Pants',
          'jeans': 'Pants',
          'shoes': 'Shoes',
          'sneakers': 'Shoes',
          'boots': 'Shoes',
          'hat': 'Hat',
          'cap': 'Hat',
          'beanie': 'Hat',
          'sweater': 'Sweater',
          'jumper': 'Sweater',
          'pullover': 'Sweater',
          'shorts': 'Shorts',
          'dress': 'Dress',
          'skirt': 'Skirt'
        }
        return typeMap[lowerValue] || 'Other'
      
      case 'fit':
        const fitMap: Record<string, string> = {
          'slim': 'Slim',
          'slim fit': 'Slim',
          'skinny': 'Skinny',
          'regular': 'Regular',
          'regular fit': 'Regular',
          'standard': 'Regular',
          'oversized': 'Oversized',
          'oversize': 'Oversized',
          'loose': 'Oversized',
          'baggy': 'Baggy',
          'crop': 'Crop',
          'cropped': 'Crop',
          'tapered': 'Tapered'
        }
        return fitMap[lowerValue] || 'Other'
      
      case 'material':
        const materialMap: Record<string, string> = {
          'cotton': 'Cotton',
          '100% cotton': 'Cotton',
          'cotton blend': 'Cotton',
          'linen': 'Linen',
          'denim': 'Denim',
          'jean': 'Denim',
          'leather': 'Leather',
          'faux leather': 'Leather',
          'knit': 'Knit',
          'knitted': 'Knit',
          'polyester': 'Polyester',
          'poly': 'Polyester',
          'synthetic': 'Polyester'
        }
        return materialMap[lowerValue] || 'Other'
      
      case 'season':
        const seasonMap: Record<string, string> = {
          'spring': 'Spring',
          'summer': 'Summer',
          'fall': 'Fall',
          'autumn': 'Fall',
          'winter': 'Winter'
        }
        return seasonMap[lowerValue] || ''
      
      default:
        return value
    }
  }

  const handleAutoFill = async () => {
    if (!selectedFile) return

    setIsAutoFilling(true)
    try {
      const form = new FormData()
      form.append("image", selectedFile)

      const res = await axios.post("http://localhost:8000/api/images", form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { clothingData } = res.data

      if (!clothingData?.isClothing) {
        alert("This image doesn't look like clothing. Try a different image.")
        return
      }

      setFormData((prev: Partial<ClothingItem>) => ({
        ...prev,
        name: clothingData?.name ?? prev.name,
        type: normalizeAIValue(clothingData?.type, 'type') || prev.type,
        brand: clothingData?.brand ?? prev.brand,
        price: clothingData?.price ?? prev.price,
        occasion: clothingData?.occasion ?? prev.occasion,
        style: clothingData?.style ?? prev.style,
        fit: normalizeAIValue(clothingData?.fit, 'fit') || prev.fit,
        color: clothingData?.color ?? prev.color,
        material: normalizeAIValue(clothingData?.material, 'material') || prev.material,
        season: normalizeAIValue(clothingData?.season, 'season') || prev.season,
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
      const res = await axios.post("http://localhost:8000/api/quick-scrape", {
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
        type: normalizeAIValue(data.type, 'type') || prev.type,
        occasion: data.occasion || prev.occasion,
        style: data.style || prev.style,
        fit: normalizeAIValue(data.fit, 'fit') || prev.fit,
        color: data.color || prev.color,
        material: normalizeAIValue(data.material, 'material') || prev.material,
        season: normalizeAIValue(data.season, 'season') || prev.season,
        sourceUrl: scrapingUrl,
      }));

      setTimeout(() => setUploadProgress(0), 1000);
      setQuickMetadataFetched(true);
    } catch (error) {
      console.error("Gemini metadata fetch failed:", error);
      alert("Failed to fetch metadata. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlScraping = async () => {
    if (!scrapingUrl.trim()) return

    setIsLoading(true)
    setUploadProgress(0)

    let progressInterval: NodeJS.Timeout | undefined

    try {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const res = await axios.post("http://localhost:8000/api/scrape", {
        url: scrapingUrl,
        process: false,
      })

      const data = res.data

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.imageGallery || !Array.isArray(data.imageGallery) || data.imageGallery.length === 0) {
        throw new Error("No product images found at this URL.")
      }

      setScrapedProducts([
        {
          name: data.name || "",
          brand: data.brand || "",
          price: data.price || null,
          images: data.imageGallery,
          sourceUrl: data.sourceUrl || scrapingUrl,
        },
      ])
      setSelectedScrapedImage(data.imageGallery[0])
      setFormData((prev: Partial<ClothingItem>) => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        price: data.price || prev.price,
        sourceUrl: data.sourceUrl || scrapingUrl,
        type: normalizeAIValue(data.type, 'type') || prev.type,
        occasion: data.occasion || prev.occasion,
        style: data.style || prev.style,
        fit: normalizeAIValue(data.fit, 'fit') || prev.fit,
        color: data.color || prev.color,
        material: normalizeAIValue(data.material, 'material') || prev.material,
        season: normalizeAIValue(data.season, 'season') || prev.season,
      }))

      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setUploadProgress(100)
      setHasFetched(true)
    } catch (error) {
      console.error("Scraping failed:", error)
      alert(error instanceof Error ? error.message : "Scraping failed. Please try a different URL.")
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const submitFormData = new FormData()

      let finalImageFile: File | undefined
      let finalImageUrl: string | undefined

      if (uploadMethod === "direct" && selectedFile) {
        finalImageFile = selectedFile
      } else if (uploadMethod === "url" && urlExtractionMode === "quick" && selectedFile) {
        finalImageFile = selectedFile
      } else if (uploadMethod === "url" && urlExtractionMode === "full" && selectedScrapedImage) {
        finalImageUrl = selectedScrapedImage
      }

      if (finalImageFile) {
        submitFormData.append("image", finalImageFile)
      } else if (finalImageUrl) {
        submitFormData.append("imageUrl", finalImageUrl)
      } else {
        alert("No image selected for submission.")
        return
      }

      submitFormData.append("name", formData.name || "")
      submitFormData.append("type", formData.type || "")
      submitFormData.append("brand", formData.brand || "")
      submitFormData.append("price", (formData.price || 0).toString())
      submitFormData.append("mode", uploadTarget)
      submitFormData.append("sourceUrl", formData.sourceUrl || "")

      // Always append all fields from formData, as auto-fill populates them regardless of mode
      submitFormData.append("occasion", formData.occasion || "")
      submitFormData.append("style", formData.style || "")
      submitFormData.append("fit", formData.fit || "")
      submitFormData.append("color", formData.color || "")
      submitFormData.append("material", formData.material || "")
      submitFormData.append("season", formData.season || "")
      submitFormData.append("notes", formData.notes || "")

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const res = await axios.post("http://localhost:8000/api/images/final-submit", submitFormData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const { item: newItem } = res.data

      const clothingItem: ClothingItem = {
        id: newItem.id,
        key: newItem.key,
        url: newItem.url,
        image: newItem.url,
        name: newItem.name,
        type: newItem.type,
        brand: newItem.brand,
        price: newItem.price,
        occasion: newItem.occasion,
        style: newItem.style,
        fit: newItem.fit,
        color: newItem.color,
        material: newItem.material,
        season: newItem.season,
        notes: newItem.notes,
        mode: newItem.mode,
        sourceUrl: newItem.sourceUrl,
        tags: newItem.tags,
        isFavorite: newItem.isFavorite || false
      }

      if (onUploadComplete) {
        onUploadComplete(uploadTarget, clothingItem)
      }

      setFormData(initialFormData)
      setSelectedFile(null)
      setImagePreview("")
      setScrapedProducts([])
      setSelectedScrapedImage("")
      setScrapingUrl("")
      setUploadMethod("direct")
      setUrlExtractionMode("quick")
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

  // Type guard for urlExtractionMode
  function isFullMode(mode: string): mode is "full" {
    return mode === "full";
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <motion.div
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

            <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
              {/* Left Column - Image Upload */}
              <div className="lg:w-2/5 p-6 border-r bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="space-y-6">
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <Card
                        className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
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
                        <CardContent className="p-8">
                          <AnimatePresence mode="wait">
                            {imagePreview ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="space-y-4"
                              >
                                <div className="relative group">
                                  <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Preview"
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                              >
                                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                  <p className="text-lg font-medium text-foreground">Upload or Copy, Paste a Image</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Up to 10MB • Paste from clipboard
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Before metadata fetch: show only URL input, fetch button, and extraction mode toggle */}
                      {((urlExtractionMode === "quick" && !quickMetadataFetched) || (urlExtractionMode === "full" && scrapedProducts.length === 0)) && !isFetching && (
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
                                placeholder="Enter product URL..."
                                value={scrapingUrl}
                                onChange={e => { 
                                  setScrapingUrl(e.target.value); 
                                  setHasFetched(false); 
                                  setFetchError(null);
                                  setQuickMetadataFetched(false);
                                  setScrapedProducts([]);
                                }}
                                className="flex-1"
                                disabled={isLoading}
                              />
                              <Button
                                onClick={
                                  urlExtractionMode === "quick" 
                                    ? handleGeminiMetadata 
                                    : handleUrlScraping
                                }
                                disabled={!scrapingUrl.trim() || isLoading}
                                className="px-6 w-[140px]"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Fetch Info"
                                )}
                              </Button>
                            </div>
                          </div>
                          {fetchError && <div className="text-xs text-destructive mt-1">{fetchError}</div>}
                          
                          <div className="relative pt-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-background px-2 text-xs text-muted-foreground">Extraction Mode</span>
                            </div>
                          </div>

                          <div className="flex w-full justify-center gap-2">
                            <Button
                              variant={urlExtractionMode === "quick" ? "default" : "outline"}
                              size="sm"
                              onClick={() => { setUrlExtractionMode("quick"); }}
                              className="flex-1 flex items-center gap-2"
                              disabled={isLoading}
                            >
                              <Zap className="w-4 h-4" /> Quick Metadata
                            </Button>
                            <Button
                              variant={urlExtractionMode === "full" ? "default" : "outline"}
                              size="sm"
                              onClick={() => { setUrlExtractionMode("full"); }}
                              className="flex-1 flex items-center gap-2"
                              disabled={isLoading}
                            >
                              <Clock className="w-4 h-4" /> Full Scrape
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground text-center mt-2">
                            {urlExtractionMode === "quick"
                              ? "Fast (~2s) • you upload image manually"
                              : "Takes longer (~10s) • auto-extracts images (beta—may not work on all sites)"}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* After quick metadata fetch: show only image upload area, no form fields */}
                      {urlExtractionMode === "quick" && quickMetadataFetched && hasFetched && (
                        <Card className="p-4 bg-background/50 backdrop-blur-sm border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer overflow-hidden">
                          <CardContent className="flex flex-col items-center justify-center">
                            <div className="w-full text-center mb-4">
                              <p className="text-lg font-medium text-foreground">Upload or Paste Product Image</p>
                              <p className="text-sm text-muted-foreground mt-1">Drag & drop, click to upload, or paste from clipboard</p>
                            </div>
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
                            {imagePreview ? (
                              <div className="relative group w-full flex flex-col items-center">
                                <img
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Preview"
                                  className="w-full h-64 object-contain mx-auto rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setImagePreview("")
                                    setSelectedFile(null)
                                  }}
                                  className="mx-auto flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors mt-2"
                                >
                                  <X className="w-4 h-4" /> Remove Image
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                                onClick={() => quickImageInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  setIsDragOver(true)
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                              >
                                <ImageIcon className="w-8 h-8 text-primary mb-2" />
                                <span className="text-sm text-muted-foreground">Click or drag image here</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      {/* Full Scrape and other flows remain unchanged */}
                      {urlExtractionMode === "full" && scrapedProducts.length > 0 && !isLoading &&(
                        <motion.div
                          key="step3-full"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <Label className="text-sm font-medium mb-2 block">Select Product Image</Label>
                          <div className="w-full max-h-[420px] overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-4">
                              {scrapedProducts.length > 0 && scrapedProducts[0].images?.map((image, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    selectedScrapedImage === image
                                      ? "border-primary shadow-lg scale-[1.02]"
                                      : "border-border hover:border-primary/50 hover:scale-[1.01]"
                                  }`}
                                  style={{ height: 220 }}
                                  onClick={() => setSelectedScrapedImage(image)}
                                >
                                  <img
                                    src={image || "/placeholder.svg"}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <AnimatePresence>
                                    {selectedScrapedImage === image && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg"
                                      >
                                        <Check className="w-3 h-3" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                              {scrapedProducts.length === 0 && (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                  Enter a URL and click "Full Scrape" to view product images
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:w-3/5 flex flex-col overflow-hidden">
                <div className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
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
                          {uploadTarget === "wishlist" ? "✨ Wishlist" : "👕 My Closet"}
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
                            Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="e.g., Classic Denim Jacket"
                            value={formData.name || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Type *
                          </Label>
                          <Select
                            value={formData.type || ""}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                              <SelectItem value="Jacket">Jacket</SelectItem>
                              <SelectItem value="Pants">Pants</SelectItem>
                              <SelectItem value="Shoes">Shoes</SelectItem>
                              <SelectItem value="Hat">Hat</SelectItem>
                              <SelectItem value="Sweater">Sweater</SelectItem>
                              <SelectItem value="Shorts">Shorts</SelectItem>
                              <SelectItem value="Dress">Dress</SelectItem>
                              <SelectItem value="Skirt">Skirt</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
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
                            Price {uploadTarget === "wishlist" && "*"}
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
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="sourceUrl" className="text-sm font-medium">
                              Source URL *
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
                          <Label htmlFor="occasion" className="text-sm font-medium">
                            Occasion
                          </Label>
                          <Input
                            id="occasion"
                            placeholder="e.g., Casual, Formal, Work"
                            value={formData.occasion || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, occasion: e.target.value }))}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="style" className="text-sm font-medium">
                            Style
                          </Label>
                          <Input
                            id="style"
                            placeholder="e.g., Vintage, Modern, Bohemian"
                            value={formData.style || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, style: e.target.value }))}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fit" className="text-sm font-medium">
                            Fit
                          </Label>
                          <Select
                            value={formData.fit || ""}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, fit: value }))}
                          >
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select fit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Slim">Slim</SelectItem>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Oversized">Oversized</SelectItem>
                              <SelectItem value="Baggy">Baggy</SelectItem>
                              <SelectItem value="Crop">Crop</SelectItem>
                              <SelectItem value="Skinny">Skinny</SelectItem>
                              <SelectItem value="Tapered">Tapered</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Label htmlFor="material" className="text-sm font-medium">
                            Material
                          </Label>
                          <Select
                            value={formData.material || ""}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, material: value }))}
                          >
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cotton">Cotton</SelectItem>
                              <SelectItem value="Linen">Linen</SelectItem>
                              <SelectItem value="Denim">Denim</SelectItem>
                              <SelectItem value="Leather">Leather</SelectItem>
                              <SelectItem value="Knit">Knit</SelectItem>
                              <SelectItem value="Polyester">Polyester</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="season" className="text-sm font-medium">
                            Season
                          </Label>
                          <Select
                            value={formData.season || ""}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, season: value }))}
                          >
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Spring">Spring</SelectItem>
                              <SelectItem value="Summer">Summer</SelectItem>
                              <SelectItem value="Fall">Fall</SelectItem>
                              <SelectItem value="Winter">Winter</SelectItem>
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
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span className="font-medium">
                            {isSubmitting
                              ? "Uploading..."
                              : urlExtractionMode === "quick"
                                ? "Fetching metadata..."
                                : "Scraping..."}
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
    </AnimatePresence>
  )
}
