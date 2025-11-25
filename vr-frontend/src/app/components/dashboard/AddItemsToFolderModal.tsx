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
}

export default function AddItemsToFolderModal({
  isOpen,
  onClose,
  folderName,
  folderId,
}: AddItemsToFolderModalProps) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchClothingItems();
    }
  }, [isOpen]);

  const fetchClothingItems = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/images`,
        { withCredentials: true }
      );
      setClothingItems(response.data.clothingItems || []);
    } catch (error) {
      console.error("Error fetching clothing items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (itemId: string) => {
    try {
      setAddingItems((prev) => new Set(prev).add(itemId));
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${folderId}/items`,
        { clothingId: itemId },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error adding item to folder:", error);
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

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
                Save some items to your new board
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
            ) : clothingItems.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">No items found</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {clothingItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="relative cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleAddItem(item.id)}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                      <Image
                        src={item.url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold">
                          {addingItems.has(item.id) ? "Adding..." : "Save"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
