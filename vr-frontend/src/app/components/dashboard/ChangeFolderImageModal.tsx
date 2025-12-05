"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Upload, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SelectFromFolderModal from "./SelectFromFolderModal";

type RectanglePosition = "main" | "top-right" | "bottom-right";

interface RectangleImage {
  position: RectanglePosition;
  imageUrl?: string;
  clothingItemId?: string;
}

interface ChangeFolderImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeImage: (imageType: string) => Promise<void>;
  folderName: string;
  folderId: string;
}

export default function ChangeFolderImageModal({
  isOpen,
  onClose,
  onChangeImage,
  folderName,
  folderId,
}: ChangeFolderImageModalProps) {
  const [selectedLayout, setSelectedLayout] = useState<"one" | "multiple">("multiple");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRect, setHoveredRect] = useState<RectanglePosition | null>(null);
  const [editingRect, setEditingRect] = useState<RectanglePosition | null>(null);
  const [rectangleImages, setRectangleImages] = useState<RectangleImage[]>([]);
  const [showSelectFromFolderModal, setShowSelectFromFolderModal] = useState(false);
  const [uploadingRect, setUploadingRect] = useState<RectanglePosition | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await onChangeImage(selectedLayout === "one" ? "one-picture" : "three-pictures");
      onClose();
    } catch (err) {
      console.error("Failed to change folder image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLayout = () => {
    setSelectedLayout((prev) => (prev === "one" ? "multiple" : "one"));
  };

  const handleFolderSelect = (position: RectanglePosition) => {
    setEditingRect(position);
    setShowSelectFromFolderModal(true);
  };

  const handleUploadSelect = (position: RectanglePosition) => {
    setUploadingRect(position);
    // Trigger file input click directly
    const fileInput = document.getElementById(`upload-${position}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingRect) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setUploadPreview(result);

      // Update rectangle images with the preview
      setRectangleImages((prev) => {
        const filtered = prev.filter((img) => img.position !== uploadingRect);
        return [
          ...filtered,
          {
            position: uploadingRect,
            imageUrl: result,
            clothingItemId: undefined, // Will be set after actual upload
          },
        ];
      });

      // Exit upload mode
      setUploadingRect(null);
      setUploadPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelUpload = () => {
    setEditingRect(null);
    setUploadingRect(null);
    setUploadPreview(null);
  };

  const handleImageSelected = (imageUrl: string, itemId: string) => {
    if (!editingRect) return;

    setRectangleImages((prev) => {
      const filtered = prev.filter((img) => img.position !== editingRect);
      return [
        ...filtered,
        {
          position: editingRect,
          imageUrl,
          clothingItemId: itemId,
        },
      ];
    });

    setEditingRect(null);
    setShowSelectFromFolderModal(false);
  };

  const handleCloseSelectModal = () => {
    setShowSelectFromFolderModal(false);
    setEditingRect(null);
  };

  // Interactive Rectangle Component
  const InteractiveRectangle = ({
    position,
    className,
  }: {
    position: RectanglePosition;
    className?: string;
  }) => {
    const isHovered = hoveredRect === position;
    const rectImage = rectangleImages.find((img) => img.position === position);

    return (
      <div
        className={`relative ${className || "w-full h-full"} bg-gray-200 dark:bg-gray-600 overflow-hidden group`}
        onMouseEnter={() => !showSelectFromFolderModal && setHoveredRect(position)}
        onMouseLeave={() => !showSelectFromFolderModal && setHoveredRect(null)}
      >
        {/* Hidden file input for upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`upload-${position}`}
        />

        {/* Image if exists */}
        {rectImage?.imageUrl && (
          <img
            src={rectImage.imageUrl}
            alt="Rectangle preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* Hover overlay with buttons */}
        {isHovered && !showSelectFromFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFolderSelect(position);
              }}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FolderOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Folder
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadSelect(position);
              }}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Upload
              </span>
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main Dialog - Hidden when SelectFromFolderModal is open */}
      {!showSelectFromFolderModal && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg w-full p-8 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible">
            <VisuallyHidden>
              <DialogTitle>Change Folder Image</DialogTitle>
            </VisuallyHidden>

            {/* Custom Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 -right-12 z-50 w-8 h-8 rounded-full bg-white dark:bg-background border border-gray-200 dark:border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-accent/50 transition-all shadow-sm hover:shadow-md pointer-events-auto opacity-90 hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-foreground/70" />
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Header with title and toggle button */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Folder Images
                </h2>
                <button
                  type="button"
                  onClick={toggleLayout}
                  className="bg-black dark:bg-black text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/90 transition-colors"
                >
                  {selectedLayout === "one" ? "Multiple Pictures" : "One Picture"}
                </button>
              </div>

              {/* Preview Container */}
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                <AnimatePresence mode="wait">
                  {selectedLayout === "one" ? (
                    <motion.div
                      key="one"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-full"
                    >
                      <InteractiveRectangle position="main" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="multiple"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-full grid grid-cols-[2fr_1fr] gap-[2px] p-[2px]"
                    >
                      <InteractiveRectangle position="main" />
                      <div className="flex flex-col gap-[2px]">
                        <InteractiveRectangle position="top-right" className="w-full h-1/2" />
                        <InteractiveRectangle position="bottom-right" className="w-full h-1/2" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {/* SelectFromFolderModal */}
      <SelectFromFolderModal
        show={showSelectFromFolderModal}
        onClose={handleCloseSelectModal}
        folderId={folderId}
        onSelectImage={handleImageSelected}
      />
    </>
  );
}
