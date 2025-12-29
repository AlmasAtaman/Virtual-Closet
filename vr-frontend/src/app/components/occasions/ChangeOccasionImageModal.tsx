"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, CloudUpload, FolderOpen, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "framer-motion";
import SelectFromOccasionModal from "./SelectFromOccasionModal";

type RectanglePosition = "main";

interface RectangleImage {
  position: RectanglePosition;
  imageUrl?: string;
  outfitId?: string;
}

interface ChangeOccasionImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeImage: (imageType: string, previewImages: RectangleImage[]) => Promise<void>;
  occasionName: string;
  occasionId: string;
  currentImageLayout?: string | null;
  currentPreviewImages?: any;
}

export default function ChangeOccasionImageModal({
  isOpen,
  onClose,
  onChangeImage,
  occasionName,
  occasionId,
  currentImageLayout,
  currentPreviewImages,
}: ChangeOccasionImageModalProps) {
  // Always use single image layout
  const initialImages: RectangleImage[] = currentPreviewImages
    ? (Array.isArray(currentPreviewImages) ? currentPreviewImages : [])
    : [];

  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRect, setHoveredRect] = useState(false);
  const [editingRect, setEditingRect] = useState(false);
  const [rectangleImages, setRectangleImages] = useState<RectangleImage[]>(initialImages);
  const [showSelectFromOccasionModal, setShowSelectFromOccasionModal] = useState(false);
  const [uploadingRect, setUploadingRect] = useState(false);

  // Upload editing states
  const [isEditingUpload, setIsEditingUpload] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string>("");
  const [editImagePosition, setEditImagePosition] = useState({ x: 0, y: 0 });
  const [editImageScale, setEditImageScale] = useState(1);
  const [isDraggingEditImage, setIsDraggingEditImage] = useState(false);
  const [editDragStart, setEditDragStart] = useState({ x: 0, y: 0 });
  const [editImageDimensions, setEditImageDimensions] = useState({ width: 0, height: 0 });

  const rectRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      const images: RectangleImage[] = currentPreviewImages
        ? (Array.isArray(currentPreviewImages) ? currentPreviewImages : [])
        : [];

      setRectangleImages(images);
    }
  }, [isOpen, currentPreviewImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      // Always use one-picture layout
      await onChangeImage("one-picture", rectangleImages);
      onClose();
    } catch (err) {
      console.error("Failed to change occasion image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = () => {
    setEditingRect(true);
    setShowSelectFromOccasionModal(true);
  };

  const handleUploadSelect = useCallback(() => {
    setUploadingRect(true);
    requestAnimationFrame(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setEditImageFile(file);
      setEditImageUrl(url);
      setIsEditingUpload(true);
      setEditingRect(true);
      setUploadingRect(true);
      setEditImagePosition({ x: 0, y: 0 });
      setEditImageScale(1);

      // Load image to get dimensions
      const img = new window.Image();
      img.onload = () => {
        setEditImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    }

    // Reset file input
    e.target.value = "";
  };

  const handleCancelUpload = () => {
    setIsEditingUpload(false);
    setEditImageFile(null);
    if (editImageUrl) {
      URL.revokeObjectURL(editImageUrl);
      setEditImageUrl("");
    }
    setEditImagePosition({ x: 0, y: 0 });
    setEditImageScale(1);
    setIsDraggingEditImage(false);
    setEditImageDimensions({ width: 0, height: 0 });
    setEditingRect(false);
    setUploadingRect(false);
  };

  const handleImageSelected = (imageUrl: string, outfitId: string) => {
    setRectangleImages([
      {
        position: "main",
        imageUrl,
        outfitId,
      },
    ]);

    setEditingRect(false);
    setShowSelectFromOccasionModal(false);
  };

  const handleCloseSelectModal = () => {
    setShowSelectFromOccasionModal(false);
    setEditingRect(false);
  };

  // Convert screen coordinates to normalized coordinates
  const screenToNormalized = (screenX: number, screenY: number, containerRect: DOMRect) => {
    const normalizedX = ((screenX - containerRect.left - containerRect.width / 2) / (containerRect.width / 2));
    const normalizedY = ((screenY - containerRect.top - containerRect.height / 2) / (containerRect.height / 2));
    return { x: normalizedX, y: normalizedY };
  };

  const handleEditImageMouseDown = (e: React.MouseEvent) => {
    if (!isEditingUpload || !rectRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const containerRect = rectRef.current.getBoundingClientRect();
    const normalizedPos = screenToNormalized(e.clientX, e.clientY, containerRect);

    setIsDraggingEditImage(true);
    setEditDragStart({
      x: normalizedPos.x - editImagePosition.x,
      y: normalizedPos.y - editImagePosition.y,
    });
  };

  const handleEditImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingEditImage || !isEditingUpload || !rectRef.current) return;
    e.preventDefault();

    const containerRect = rectRef.current.getBoundingClientRect();
    const normalizedPos = screenToNormalized(e.clientX, e.clientY, containerRect);

    setEditImagePosition({
      x: normalizedPos.x - editDragStart.x,
      y: normalizedPos.y - editDragStart.y,
    });
  };

  const handleEditImageMouseUp = () => {
    setIsDraggingEditImage(false);
  };

  const handleZoomChange = (newScale: number) => {
    setEditImageScale(Math.max(0.1, Math.min(3, newScale)));
  };

  // Calculate display position and scale for the editing preview
  const getEditImageDisplayStyle = () => {
    if (!rectRef.current || editImageDimensions.width === 0) return {};

    const containerRect = rectRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const imageAspect = editImageDimensions.width / editImageDimensions.height;
    const containerAspect = containerWidth / containerHeight;

    let baseImageWidth, baseImageHeight;

    if (imageAspect > containerAspect) {
      baseImageHeight = containerHeight;
      baseImageWidth = baseImageHeight * imageAspect;
    } else {
      baseImageWidth = containerWidth;
      baseImageHeight = baseImageWidth / imageAspect;
    }

    const scaledImageWidth = baseImageWidth * editImageScale;
    const scaledImageHeight = baseImageHeight * editImageScale;

    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    const pixelOffsetX = editImagePosition.x * (containerWidth / 2);
    const pixelOffsetY = editImagePosition.y * (containerHeight / 2);

    const finalLeft = containerCenterX + pixelOffsetX - scaledImageWidth / 2;
    const finalTop = containerCenterY + pixelOffsetY - scaledImageHeight / 2;

    return {
      position: "absolute" as const,
      left: `${finalLeft}px`,
      top: `${finalTop}px`,
      width: `${scaledImageWidth}px`,
      height: `${scaledImageHeight}px`,
      transform: "none",
      transformOrigin: "center",
      maxWidth: "none",
      maxHeight: "none",
    };
  };

  const handleSaveUpload = async () => {
    if (!editImageFile || !rectRef.current) return;

    try {
      // Create a canvas to capture the cropped/positioned image
      const canvas = document.createElement('canvas');
      const rect = rectRef.current.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load the image
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = editImageUrl;
      });

      // Calculate image positioning based on current transform
      const imageAspect = editImageDimensions.width / editImageDimensions.height;
      const containerAspect = rect.width / rect.height;

      let baseImageWidth, baseImageHeight;
      if (imageAspect > containerAspect) {
        baseImageHeight = rect.height;
        baseImageWidth = baseImageHeight * imageAspect;
      } else {
        baseImageWidth = rect.width;
        baseImageHeight = baseImageWidth / imageAspect;
      }

      const scaledImageWidth = baseImageWidth * editImageScale;
      const scaledImageHeight = baseImageHeight * editImageScale;

      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;

      const pixelOffsetX = editImagePosition.x * (rect.width / 2);
      const pixelOffsetY = editImagePosition.y * (rect.height / 2);

      const finalX = containerCenterX + pixelOffsetX - scaledImageWidth / 2;
      const finalY = containerCenterY + pixelOffsetY - scaledImageHeight / 2;

      // Draw the image on canvas
      ctx.drawImage(img, finalX, finalY, scaledImageWidth, scaledImageHeight);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Add the image
      setRectangleImages([
        {
          position: "main",
          imageUrl: dataUrl,
          outfitId: undefined,
        },
      ]);

      // Clean up blob URL
      if (editImageUrl) {
        URL.revokeObjectURL(editImageUrl);
      }

      // Exit editing mode
      setIsEditingUpload(false);
      setEditImageFile(null);
      setEditImageUrl("");
      setEditImagePosition({ x: 0, y: 0 });
      setEditImageScale(1);
      setEditingRect(false);
      setUploadingRect(false);
      setEditImageDimensions({ width: 0, height: 0 });
    } catch (error) {
      console.error('Error saving upload:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const rectImage = rectangleImages.find((img) => img.position === "main");

  const handleRemoveImage = () => {
    setRectangleImages([]);
  };

  const handleMouseLeave = () => {
    if (!showSelectFromOccasionModal && !isEditingUpload) {
      setHoveredRect(false);
    }
    if (isEditingUpload) {
      handleEditImageMouseUp();
    }
  };

  return (
    <>
      {/* Full-screen overlay when editing upload */}
      {isEditingUpload && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelUpload();
          }}
        />
      )}

      {/* Main Dialog - Hidden when SelectFromOccasionModal is open */}
      {!showSelectFromOccasionModal && (
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) {
            if (isEditingUpload) {
              handleCancelUpload();
            } else {
              onClose();
            }
          }
        }}>
          <DialogContent className={`w-auto max-w-[calc(100vw-2rem)] p-8 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible ${isEditingUpload ? 'z-50' : ''}`}>
            <VisuallyHidden>
              <DialogTitle>Change Occasion Image</DialogTitle>
            </VisuallyHidden>

            {/* Custom Close Button */}
            <button
              onClick={() => {
                if (isEditingUpload) {
                  handleCancelUpload();
                } else {
                  onClose();
                }
              }}
              className="absolute -top-12 -right-12 z-50 w-8 h-8 rounded-full bg-white dark:bg-background border border-gray-200 dark:border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-accent/50 transition-all shadow-sm hover:shadow-md pointer-events-auto opacity-90 hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-foreground/70" />
            </button>

            {/* Zoom controls for editing mode */}
            {isEditingUpload && (
              <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 z-50">
                <div className="bg-white rounded-lg p-3 shadow-xl border border-slate-200 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleZoomChange(editImageScale + 0.1)}
                    disabled={editImageScale >= 3}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center h-32">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={editImageScale}
                      onChange={(e) => handleZoomChange(Number(e.target.value))}
                      className="w-2 h-24 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-vertical"
                      style={{
                        writingMode: 'bt-lr' as React.CSSProperties['writingMode'],
                        WebkitAppearance: 'slider-vertical' as React.CSSProperties['WebkitAppearance']
                      }}
                    />
                    <span className="text-xs text-slate-600 mt-2 font-medium">
                      {Math.round(editImageScale * 100)}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleZoomChange(editImageScale - 0.1)}
                    disabled={editImageScale <= 0.1}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Save/Cancel buttons for editing mode */}
            {isEditingUpload && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-50">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-4 py-2 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUpload}
                    className="px-4 py-2 bg-black dark:bg-black text-white rounded-lg font-medium hover:bg-black/90 transition-colors shadow-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Occasion Image
                </h2>
              </div>

              {/* Preview Container - Matches exact occasion card dimensions */}
              <div className="relative w-[293px] h-48 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <div
                    ref={rectRef}
                    className="relative w-full h-full bg-gray-200 dark:bg-gray-700 overflow-hidden group"
                    onMouseEnter={() => !showSelectFromOccasionModal && !isEditingUpload && setHoveredRect(true)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={isEditingUpload ? handleEditImageMouseMove : undefined}
                    onMouseUp={isEditingUpload ? handleEditImageMouseUp : undefined}
                  >
                    {/* Hidden file input for upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="upload-main"
                    />

                    {/* Image if exists */}
                    {rectImage?.imageUrl && !isEditingUpload && (
                      <img
                        src={rectImage.imageUrl}
                        alt="Rectangle preview"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}

                    {/* Editing mode - show the draggable image */}
                    {isEditingUpload && editImageUrl && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editImageUrl}
                          alt="Edit upload"
                          className="absolute select-none cursor-move"
                          style={getEditImageDisplayStyle()}
                          onMouseDown={handleEditImageMouseDown}
                          draggable={false}
                        />
                      </>
                    )}

                    {/* Hover overlay */}
                    {hoveredRect && !showSelectFromOccasionModal && !isEditingUpload && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
                      >
                        {rectImage?.imageUrl ? (
                          // Show X button to remove image
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Remove image"
                          >
                            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </button>
                        ) : (
                          // Show folder and upload icons
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFolderSelect();
                              }}
                              className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              aria-label="Select from occasion"
                            >
                              <FolderOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUploadSelect();
                              }}
                              className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              aria-label="Upload image"
                            >
                              <CloudUpload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-black dark:bg-black text-white text-sm rounded-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: isLoading ? undefined : '#000' }}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* SelectFromOccasionModal */}
      <SelectFromOccasionModal
        show={showSelectFromOccasionModal}
        onClose={handleCloseSelectModal}
        occasionId={occasionId}
        onSelectImage={handleImageSelected}
        selectedOutfitIds={rectangleImages
          .filter(img => img.outfitId)
          .map(img => img.outfitId!)}
      />
    </>
  );
}
