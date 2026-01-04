"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import OccasionCard from "./OccasionCard";
import CreateOccasionModal from "./CreateOccasionModal";
import RenameOccasionModal from "./RenameOccasionModal";
import ChangeOccasionImageModal from "./ChangeOccasionImageModal";
import { ConfirmDialog } from "@/components/ui/dialog";
import axios from "axios";

interface ClothingItem {
  id: string;
  name?: string;
  url: string;
  type?: string;
  brand?: string;
  price?: number;
  mode: "closet" | "wishlist";
  x?: number;
  y?: number;
  scale?: number;
  left?: number;
  bottom?: number;
  width?: number;
}

interface OutfitPreview {
  id: string;
  name?: string;
  clothingItems?: ClothingItem[];
  imageUrl?: string;
}

export interface Occasion {
  id: string;
  name: string;
  description?: string | null;
  imageLayout?: string | null;
  previewImages?: any;
  createdAt: string;
  updatedAt: string;
  outfitCount?: number;
  outfits?: OutfitPreview[];
  previewOutfits?: OutfitPreview[];
}

export interface OccasionsViewRef {
  createOccasion: () => void;
}

const OccasionsView = forwardRef<OccasionsViewRef, {}>((props, ref) => {
  const router = useRouter();
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isChangeImageModalOpen, setIsChangeImageModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch occasions on mount
  useEffect(() => {
    fetchOccasions();
  }, []);

  // Expose createOccasion method via ref
  useImperativeHandle(ref, () => ({
    createOccasion: () => {
      setIsCreateModalOpen(true);
    }
  }));

  const fetchOccasions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions`,
        { withCredentials: true }
      );
      setOccasions(response.data.occasions || []);
    } catch {
      setError("Failed to load occasions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOccasionAPI = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions`,
        data,
        { withCredentials: true }
      );

      // Navigate to the newly created occasion with query param to open modal
      const newOccasion = response.data;
      router.push(`/occasions/${newOccasion.id}?openAddModal=true`);
    } catch {
      alert("Failed to create occasion");
    }
  };

  const handleOccasionClick = (occasion: Occasion) => {
    // Navigate to occasion detail page
    router.push(`/occasions/${occasion.id}`);
  };

  const handleRename = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setIsRenameModalOpen(true);
  };

  const handleRenameOccasionAPI = async (newName: string) => {
    if (!selectedOccasion) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/${selectedOccasion.id}`,
        { name: newName },
        { withCredentials: true }
      );

      // Re-fetch occasions to maintain consistent sort order
      await fetchOccasions();
    } catch {
      alert("Failed to rename occasion");
    }
  };

  const handleChangeImage = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setIsChangeImageModalOpen(true);
  };

  const handleChangeImageAPI = async (imageType: string, previewImages: any[]) => {
    if (!selectedOccasion) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/${selectedOccasion.id}`,
        {
          imageLayout: imageType,
          previewImages: previewImages
        },
        { withCredentials: true }
      );

      // Re-fetch occasions to maintain consistent sort order
      await fetchOccasions();
    } catch {
      alert("Failed to change occasion image");
    }
  };

  const handleDelete = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOccasionAPI = async () => {
    if (!selectedOccasion) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/${selectedOccasion.id}`,
        { withCredentials: true }
      );

      // Remove occasion from local state
      setOccasions((prev) => prev.filter((o) => o.id !== selectedOccasion.id));
      setIsDeleteDialogOpen(false);
      setSelectedOccasion(null);
    } catch {
      alert("Failed to delete occasion");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading occasions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchOccasions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Occasions Grid */}
      {occasions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first occasion to start organizing your outfits
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Click the "+" button in the top right to get started
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
          {/* Occasion Cards */}
          <AnimatePresence mode="popLayout">
            {occasions.map((occasion) => (
              <motion.div
                key={occasion.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <OccasionCard
                  occasion={occasion}
                  onClick={() => handleOccasionClick(occasion)}
                  onRename={handleRename}
                  onChangeImage={handleChangeImage}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Occasion Modal */}
      <CreateOccasionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateOccasion={handleCreateOccasionAPI}
      />

      {/* Rename Occasion Modal */}
      <RenameOccasionModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSelectedOccasion(null);
        }}
        onRename={handleRenameOccasionAPI}
        currentName={selectedOccasion?.name || ""}
      />

      {/* Change Occasion Image Modal */}
      <ChangeOccasionImageModal
        isOpen={isChangeImageModalOpen}
        onClose={() => {
          setIsChangeImageModalOpen(false);
          setSelectedOccasion(null);
        }}
        onChangeImage={handleChangeImageAPI}
        occasionName={selectedOccasion?.name || ""}
        occasionId={selectedOccasion?.id || ""}
        currentImageLayout={selectedOccasion?.imageLayout}
        currentPreviewImages={selectedOccasion?.previewImages}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setSelectedOccasion(null);
        }}
        onConfirm={handleDeleteOccasionAPI}
        title="Delete Occasion"
        description={`Are you sure you want to delete "${selectedOccasion?.name}"? This will remove the occasion but keep your outfits. Your outfits will still be accessible from the Outfits tab.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
});

OccasionsView.displayName = "OccasionsView";

export default OccasionsView;
