"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import Image from "next/image";
import type { ClothingItem } from "@/app/types/clothing";

interface AddItemsToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  folderId: string;
  existingItemIds?: string[];
  pendingRemovals?: string[];
  onUnmarkRemovals?: (itemIds: string[]) => void;
}

export default function AddItemsToFolderModal({
  isOpen,
  onClose,
  folderName,
  folderId,
  existingItemIds = [],
  pendingRemovals = [],
  onUnmarkRemovals,
}: AddItemsToFolderModalProps) {
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  // Track changes made during THIS modal session
  const [sessionChanges, setSessionChanges] = useState<Map<string, 'add' | 'remove'>>(new Map());

  // Fetch all clothing items when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllItems();
      // Reset session changes when modal reopens
      setSessionChanges(new Map());
    }
  }, [isOpen]);

  const fetchAllItems = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/images`,
        { withCredentials: true }
      );
      setAllItems(response.data.clothingItems || []);
    } catch (error) {
      console.error("Error fetching clothing items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    const currentChange = sessionChanges.get(itemId);
    const isPendingRemoval = pendingRemovals.includes(itemId);

    try {
      setProcessingItems((prev) => new Set(prev).add(itemId));

      if (currentChange === 'add') {
        // User is un-doing an add - remove from folder
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${folderId}/items/${itemId}`,
          { withCredentials: true }
        );
        // Remove from session changes
        setSessionChanges((prev) => {
          const next = new Map(prev);
          next.delete(itemId);
          return next;
        });
      } else if (isPendingRemoval) {
        // Item is marked for removal in folder view - just track that we're un-marking it
        // Don't make API call because item is still in folder database
        setSessionChanges((prev) => new Map(prev).set(itemId, 'remove'));
        // Notify parent to remove from pending removals
        if (onUnmarkRemovals) {
          onUnmarkRemovals([itemId]);
        }
      } else {
        // New action - add to folder
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${folderId}/items`,
          { clothingId: itemId },
          { withCredentials: true }
        );
        // Track as added
        setSessionChanges((prev) => new Map(prev).set(itemId, 'add'));
      }
    } catch (error) {
      console.error("Error toggling item:", error);
    } finally {
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Determine which items to display
  const displayItems = allItems.filter((item) => {
    const inFolderAtOpen = existingItemIds.includes(item.id);
    const markedForRemoval = pendingRemovals.includes(item.id);
    const sessionChange = sessionChanges.get(item.id);

    // Hide if it was pending removal but user clicked to un-mark it
    if (sessionChange === 'remove') {
      return false;
    }

    // Show if user added it this session (keep visible with "Added" button)
    if (sessionChange === 'add') {
      return true;
    }

    // Show if: NOT in folder at open OR was marked for removal
    return !inFolderAtOpen || markedForRemoval;
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
          className="relative w-[90vw] max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Save some items to your folder
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {folderName}
            </p>
          </div>

          {/* Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading items...</div>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">No items found</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayItems.map((item) => {
                  const sessionChange = sessionChanges.get(item.id);
                  const isProcessing = processingItems.has(item.id);
                  const showAsAdded = sessionChange === 'add';

                  return (
                    <motion.div
                      key={item.id}
                      className="relative cursor-pointer group"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => !isProcessing && handleToggleItem(item.id)}
                    >
                      <div className={`aspect-[3/4] rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-gray-800`}>
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                        {/* Overlay on hover or when processing */}
                        <div
                          className={`absolute inset-0 bg-black/40 ${
                            isProcessing
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          } transition-opacity flex items-center justify-center`}
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
