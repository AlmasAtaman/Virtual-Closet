"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import OutfitCard from "../OutfitCard";

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

interface AddOutfitsToOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  occasionName: string;
  occasionId: string;
  existingOutfitIds?: string[];
  pendingRemovals?: string[];
  onUnmarkRemovals?: (outfitIds: string[]) => void;
}

export default function AddOutfitsToOccasionModal({
  isOpen,
  onClose,
  occasionName,
  occasionId,
  existingOutfitIds = [],
  pendingRemovals = [],
  onUnmarkRemovals,
}: AddOutfitsToOccasionModalProps) {
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingOutfits, setProcessingOutfits] = useState<Set<string>>(new Set());
  // Track changes made during THIS modal session
  const [sessionChanges, setSessionChanges] = useState<Map<string, 'add' | 'remove'>>(new Map());

  // Fetch all outfits when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllOutfits();
      // Reset session changes when modal reopens
      setSessionChanges(new Map());
    }
  }, [isOpen]);

  const fetchAllOutfits = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/outfits`,
        { withCredentials: true }
      );
      setAllOutfits(response.data.outfits || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOutfit = async (outfitId: string) => {
    const currentChange = sessionChanges.get(outfitId);
    const isPendingRemoval = pendingRemovals.includes(outfitId);
    const isInOccasion = existingOutfitIds.includes(outfitId);

    try {
      setProcessingOutfits((prev) => new Set(prev).add(outfitId));

      if (currentChange === 'add') {
        // User is un-doing an add - remove from occasion
        // Get current outfit IDs in the occasion
        const currentOutfitIds = [...existingOutfitIds];
        const indexToRemove = currentOutfitIds.indexOf(outfitId);
        if (indexToRemove > -1) {
          currentOutfitIds.splice(indexToRemove, 1);
        }
        // Also add any outfits that were added this session (except the one we're removing)
        sessionChanges.forEach((change, id) => {
          if (change === 'add' && id !== outfitId && !currentOutfitIds.includes(id)) {
            currentOutfitIds.push(id);
          }
        });

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/assign`,
          {
            occasionId: occasionId,
            outfitIds: currentOutfitIds,
          },
          { withCredentials: true }
        );
        // Remove from session changes
        setSessionChanges((prev) => {
          const next = new Map(prev);
          next.delete(outfitId);
          return next;
        });
      } else if (isPendingRemoval) {
        // Item is marked for removal in occasion view - just track that we're un-marking it
        setSessionChanges((prev) => new Map(prev).set(outfitId, 'remove'));
        // Notify parent to remove from pending removals
        if (onUnmarkRemovals) {
          onUnmarkRemovals([outfitId]);
        }
      } else {
        // New action - add to occasion
        // Get current outfit IDs
        const currentOutfitIds = [...existingOutfitIds, outfitId];
        // Also add any outfits that were added this session
        sessionChanges.forEach((change, id) => {
          if (change === 'add' && !currentOutfitIds.includes(id)) {
            currentOutfitIds.push(id);
          }
        });

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/occasions/assign`,
          {
            occasionId: occasionId,
            outfitIds: currentOutfitIds,
          },
          { withCredentials: true }
        );
        // Track as added
        setSessionChanges((prev) => new Map(prev).set(outfitId, 'add'));
      }
    } catch {
    } finally {
      setProcessingOutfits((prev) => {
        const next = new Set(prev);
        next.delete(outfitId);
        return next;
      });
    }
  };

  // Determine which outfits to display
  const displayOutfits = allOutfits.filter((outfit) => {
    const inOccasionAtOpen = existingOutfitIds.includes(outfit.id);
    const markedForRemoval = pendingRemovals.includes(outfit.id);
    const sessionChange = sessionChanges.get(outfit.id);

    // Hide if it was pending removal but user clicked to un-mark it
    if (sessionChange === 'remove') {
      return false;
    }

    // Show if user added it this session (keep visible with "Added" button)
    if (sessionChange === 'add') {
      return true;
    }

    // Show if: NOT in occasion at open OR was marked for removal
    return !inOccasionAtOpen || markedForRemoval;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-[90vw] max-w-5xl max-h-[90vh] bg-background dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Save some outfits to your occasion
              </h2>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {occasionName}
            </p>
          </div>

          {/* Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading outfits...</div>
              </div>
            ) : displayOutfits.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">No outfits found</div>
              </div>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, 280px)', justifyContent: 'start' }}>
                {displayOutfits.map((outfit) => {
                  const sessionChange = sessionChanges.get(outfit.id);
                  const isProcessing = processingOutfits.has(outfit.id);
                  const showAsAdded = sessionChange === 'add';

                  return (
                    <motion.div
                      key={outfit.id}
                      className="w-[280px] relative cursor-pointer group"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => !isProcessing && handleToggleOutfit(outfit.id)}
                    >
                      <div className="pointer-events-none">
                        <OutfitCard
                          outfit={outfit}
                          hideFooter={true}
                          hideHeader={true}
                        />
                      </div>
                      {/* Overlay on hover or when processing */}
                      <div
                        className={`absolute inset-0 bg-black/40 ${
                          isProcessing
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        } transition-opacity flex items-center justify-center rounded-xl pointer-events-none z-50`}
                      >
                        <div
                          className={`${
                            showAsAdded
                              ? "bg-white text-black"
                              : "bg-black text-white"
                          } px-4 py-2 rounded-full font-semibold`}
                        >
                          {isProcessing
                            ? "..."
                            : showAsAdded
                            ? "Saved"
                            : "Save"}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-black text-white rounded-full hover:bg-black/90 transition-colors font-semibold"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
