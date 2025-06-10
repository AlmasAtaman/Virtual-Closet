"use client";

import type React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { Upload, Link, Wand2, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ClothingItem, ScrapedProduct } from "../types/clothing";

interface UploadFormProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onUploadComplete?: (mode: "closet" | "wishlist", newItem: ClothingItem) => void;
  currentViewMode?: "closet" | "wishlist";
}

export default function UploadForm({
  isOpen,
  onCloseAction,
  onUploadComplete,
  currentViewMode = "closet",
}: UploadFormProps) {
  const [uploadMethod, setUploadMethod] = useState<"direct" | "url">("direct");
  const [uploadTarget, setUploadTarget] = useState<"closet" | "wishlist">(currentViewMode);
  const [mode, setMode] = useState<"basic" | "advanced">("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

const initialFormData = {
    mode: currentViewMode,
    name: "",
    type: "",
    brand: "",
    price: undefined,
    sourceUrl: "",
    image: "", // This will be the URL after upload/scraping
    occasion: "",
    style: "",
    fit: "",
    color: "",
    material: "",
    season: "",
    notes: "",
  };

  const [formData, setFormData] = useState<Partial<ClothingItem>>(initialFormData);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [selectedScrapedImage, setSelectedScrapedImage] = useState<string>("");
  const [scrapingUrl, setScrapingUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form when modal opens or viewMode changes
    if (isOpen) {
      setUploadMethod("direct");
      setUploadTarget(currentViewMode);
      setMode("basic");
      setIsLoading(false);
      setIsAutoFilling(false);
      setIsSubmitting(false);
      setUploadProgress(0);
      setFormData(initialFormData);
      setSelectedFile(null);
      setImagePreview("");
      setScrapedProducts([]);
      setSelectedScrapedImage("");
      setScrapingUrl("");
    }
  }, [isOpen, currentViewMode]);

  // Validation
  const isFormValid = () => {
    const hasImage = imagePreview || selectedScrapedImage;
    const hasName = formData.name?.trim();
    const hasType = formData.type?.trim();

    if (!hasImage || !hasName || !hasType) return false;

    if (uploadTarget === "wishlist") {
      return formData.price !== undefined && formData.sourceUrl?.trim();
    }

    return true;
  };

  // Handle file upload for direct upload
  const handleFileUpload = useCallback((file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));
      if (imageFile) {
        handleFileUpload(imageFile);
      }
    },
    [handleFileUpload]
  );

  // Auto-fill using AI (for direct image upload)
  const handleAutoFill = async () => {
    if (!selectedFile) return;

    setIsAutoFilling(true);
    try {
      const form = new FormData();
      form.append("image", selectedFile);

      const res = await axios.post("http://localhost:8000/api/images", form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { clothingData } = res.data;

      if (!clothingData?.isClothing) {
        alert("This image doesn't look like clothing. Try a different image.");
        return;
      }

      setFormData((prev: Partial<ClothingItem>) => ({
        ...prev,
        name: clothingData?.name ?? prev.name,
        type: clothingData?.type ?? prev.type,
        brand: clothingData?.brand ?? prev.brand,
        price: clothingData?.price ?? prev.price,
        occasion: clothingData?.occasion ?? prev.occasion,
        style: clothingData?.style ?? prev.style,
        fit: clothingData?.fit ?? prev.fit,
        color: clothingData?.color ?? prev.color,
        material: clothingData?.material ?? prev.material,
        season: clothingData?.season ?? prev.season,
        notes: "",
      }));
    } catch (error) {
      console.error("Auto-fill failed:", error);
      alert("Auto-fill failed.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Handle URL scraping
  const handleUrlScraping = async () => {
    if (!scrapingUrl.trim()) return;

    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/scrape", {
        url: scrapingUrl,
        process: false, // We just want the scrape data, not image processing yet
      });

      const data = res.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.imageGallery && data.imageGallery.length > 0) {
        setScrapedProducts([{
          name: data.name,
          brand: data.brand,
          price: data.price,
          images: data.imageGallery,
          sourceUrl: data.sourceUrl
        }]);
        setSelectedScrapedImage(data.imageGallery[0]); // Select the first image by default
        setFormData((prev: Partial<ClothingItem>) => ({
          ...prev,
          name: data.name,
          brand: data.brand,
          price: data.price,
          sourceUrl: data.sourceUrl,
          type: data.type,
          occasion: data.occasion,
          style: data.style,
          fit: data.fit,
          color: data.color,
          material: data.material,
          season: data.season
        }));
      } else {
        alert("No product images found at this URL.");
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      alert(error instanceof Error ? error.message : "Scraping failed. Please try a different URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submitFormData = new FormData();

      let finalImageFile: File | undefined;
      let finalImageUrl: string | undefined;

      if (uploadMethod === "direct" && selectedFile) {
        finalImageFile = selectedFile;
      } else if (uploadMethod === "url" && selectedScrapedImage) {
        // If using URL, we need to send the image URL to backend to fetch and process
        finalImageUrl = selectedScrapedImage;
      }

      if (finalImageFile) {
        submitFormData.append("image", finalImageFile);
      } else if (finalImageUrl) {
        submitFormData.append("imageUrl", finalImageUrl);
      } else {
        alert("No image selected for submission.");
        return;
      }

      submitFormData.append("name", formData.name || "");
      submitFormData.append("type", formData.type || "");
      submitFormData.append("brand", formData.brand || "");
      submitFormData.append("price", (formData.price || 0).toString());
      submitFormData.append("mode", uploadTarget); // Use uploadTarget for mode
      submitFormData.append("sourceUrl", formData.sourceUrl || "");

      if (mode === "advanced") {
        submitFormData.append("occasion", formData.occasion || "");
        submitFormData.append("style", formData.style || "");
        submitFormData.append("fit", formData.fit || "");
        submitFormData.append("color", formData.color || "");
        submitFormData.append("material", formData.material || "");
        submitFormData.append("season", formData.season || "");
        submitFormData.append("notes", formData.notes || "");
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await axios.post("http://localhost:8000/api/images/final-submit", submitFormData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { item: newItem } = res.data; // Assuming backend returns the new item

      // Map backend item to frontend ClothingItem type
      const clothingItem: ClothingItem = {
        id: newItem.id,
        key: newItem.key,
        url: newItem.url,
        image: newItem.url, // Alias url to image
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
        mode: newItem.mode, // Ensure mode is correctly passed
        sourceUrl: newItem.sourceUrl,
        tags: newItem.tags, // If tags exist
      };

      if (onUploadComplete) {
        onUploadComplete(uploadTarget, clothingItem);
      }

      // Reset form
      setFormData(initialFormData);
      setSelectedFile(null);
      setImagePreview("");
      setScrapedProducts([]);
      setSelectedScrapedImage("");
      setScrapingUrl("");
      setUploadMethod("direct");
      setMode("basic");
      setUploadTarget(currentViewMode);

      onCloseAction();
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">


        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Add New Clothing Item</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left Column - Image Upload */}
          <div className="lg:w-2/5 p-6 border-r bg-gray-50/50">
            <div className="space-y-4">
              {/* Upload Method Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={uploadMethod === "direct" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("direct")}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Direct Upload
                </Button>
                {uploadTarget === "wishlist" && (
                <Button
                  variant={uploadMethod === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("url")}
                  className="flex-1"
                >
                  <Link className="w-4 h-4 mr-2" />
                  From URL
                </Button>
                )}
              </div>

              {/* Direct Upload */}
              {uploadMethod === "direct" && (
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview("");
                            setSelectedFile(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-gray-600">Drop an image here or click to browse</p>
                        <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  {imagePreview && (
                    <Button onClick={handleAutoFill} disabled={isAutoFilling || !selectedFile} className="w-full" variant="secondary">
                      {isAutoFilling ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      {isAutoFilling ? "Analyzing..." : "Auto-fill Details"}
                    </Button>
                  )}
                </div>
              )}

              {/* URL Upload */}
              {uploadTarget === "wishlist" && uploadMethod === "url" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter product URL..."
                      value={scrapingUrl}
                      onChange={(e) => setScrapingUrl(e.target.value)}
                    />
                    <Button onClick={handleUrlScraping} disabled={isLoading || !scrapingUrl.trim()}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape"}
                    </Button>
                  </div>

                  {scrapedProducts.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select Product Image</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {scrapedProducts[0].images.map((image, index) => (
                          <div
                            key={index}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                              selectedScrapedImage === image
                                ? "border-blue-500"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedScrapedImage(image)}
                          >
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Product ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            {selectedScrapedImage === image && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:w-3/5 flex flex-col overflow-hidden">

          <div className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">

              {/* Target Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Add to:</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={uploadTarget === "wishlist"}
                      onCheckedChange={(checked: boolean) => {
                        setUploadTarget(checked ? "wishlist" : "closet");
                        setFormData((prev) => ({ ...prev, mode: checked ? "wishlist" : "closet" }));
                      }}
                    />
                    <Badge variant={uploadTarget === "wishlist" ? "default" : "secondary"}>
                      {uploadTarget === "wishlist" ? "Wishlist" : "My Closet"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mode Toggle */}
              <Tabs value={mode} onValueChange={(value) => setMode(value as "basic" | "advanced")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Details</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Details</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Classic Denim Jacket"
                        value={formData.name || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Input
                        id="type"
                        placeholder="e.g., Jacket, T-Shirt, Jeans"
                        value={formData.type || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        placeholder="e.g., Levi's, Nike, Zara"
                        value={formData.brand || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price {uploadTarget === "wishlist" && "*"}</Label>
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
                      />
                    </div>
                  </div>

                  {uploadTarget === "wishlist" && (
                    <div className="space-y-2">
                      <Label htmlFor="sourceUrl">Source URL *</Label>
                      <Input
                        id="sourceUrl"
                        placeholder="https://..."
                        value={formData.sourceUrl || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about this item..."
                      maxLength={100}
                      value={formData.notes || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 text-right">{formData.notes?.length || 0}/100</p>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occasion">Occasion</Label>
                      <Input
                        id="occasion"
                        placeholder="e.g., Casual, Formal, Work"
                        value={formData.occasion || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, occasion: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Style</Label>
                      <Input
                        id="style"
                        placeholder="e.g., Vintage, Modern, Bohemian"
                        value={formData.style || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, style: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fit">Fit</Label>
                      <Select
                        value={formData.fit || ""}
                        onValueChange={(value: string) => setFormData((prev) => ({ ...prev, fit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slim">Slim</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="oversized">Oversized</SelectItem>
                          <SelectItem value="crop">Crop</SelectItem>
                          <SelectItem value="skinny">Skinny</SelectItem>
                          <SelectItem value="tapered">Tapered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        placeholder="e.g., Navy Blue, Black, Red"
                        value={formData.color || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Select
                        value={formData.material || ""}
                        onValueChange={(value: string) => setFormData((prev) => ({ ...prev, material: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cotton">Cotton</SelectItem>
                          <SelectItem value="linen">Linen</SelectItem>
                          <SelectItem value="denim">Denim</SelectItem>
                          <SelectItem value="leather">Leather</SelectItem>
                          <SelectItem value="knit">Knit</SelectItem>
                          <SelectItem value="polyester">Polyester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="season">Season</Label>
                      <Select
                        value={formData.season || ""}
                        onValueChange={(value: string) => setFormData((prev) => ({ ...prev, season: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spring">Spring</SelectItem>
                          <SelectItem value="summer">Summer</SelectItem>
                          <SelectItem value="fall">Fall</SelectItem>
                          <SelectItem value="winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-6">
              {isSubmitting && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onCloseAction} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!isFormValid() || isSubmitting} className="min-w-24">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Item"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
