"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OutfitPreviewHorizontal from "./OutfitPreviewHorizontal";

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

interface Outfit {
  id: string;
  name?: string;
  occasion?: string;
  season?: string;
  notes?: string;
  price?: number;
  totalPrice?: number;
  outerwearOnTop?: boolean;
  clothingItems: ClothingItem[];
  isFavorite?: boolean;
  createdAt?: string;
  imageUrl?: string;
}

interface SelectFromOccasionModalProps {
  show: boolean;
  onClose: () => void;
  occasionId: string;
  onSelectImage: (imageUrl: string, outfitId: string) => void;
  selectedOutfitIds?: string[];
}

export default function SelectFromOccasionModal({
  show,
  onClose,
  occasionId,
  onSelectImage,
  selectedOutfitIds = [],
}: SelectFromOccasionModalProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && occasionId) {
      fetchOccasionOutfits();
    }
  }, [show, occasionId]);

  const fetchOccasionOutfits = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/${occasionId}/outfits`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch occasion outfits");

      const data = await response.json();
      setOutfits(data.outfits || []);
    } catch (error) {
      console.error("Failed to fetch occasion outfits:", error);
      setOutfits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    // For outfits, we can use either the imageUrl or pass empty string if only clothingItems exist
    // The parent component will handle rendering via OutfitPreviewHorizontal
    const imageUrl = outfit.imageUrl || "";
    onSelectImage(imageUrl, outfit.id);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Select Outfit
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : outfits.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Outfits Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                This occasion doesn't have any outfits yet.
              </p>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, 293px)', justifyContent: 'start' }}>
              {outfits.map((outfit) => {
                const isSelected = selectedOutfitIds.includes(outfit.id);
                return (
                  <div
                    key={outfit.id}
                    className={`cursor-pointer transition-all hover:shadow-lg rounded-2xl overflow-hidden ${
                      isSelected
                        ? "ring-2 ring-black dark:ring-white"
                        : ""
                    } relative w-[293px] h-48 bg-white dark:bg-gray-900`}
                    onClick={() => handleSelectOutfit(outfit)}
                  >
                    <OutfitPreviewHorizontal
                      outfit={outfit}
                      containerWidth={293}
                      containerHeight={192}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl z-10 pointer-events-none">
                        <Check className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
