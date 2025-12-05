"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface ClothingItem {
  id: string;
  name?: string;
  url: string;
  type?: string;
}

interface SelectFromFolderModalProps {
  show: boolean;
  onClose: () => void;
  folderId: string;
  onSelectImage: (imageUrl: string, itemId: string) => void;
}

export default function SelectFromFolderModal({
  show,
  onClose,
  folderId,
  onSelectImage,
}: SelectFromFolderModalProps) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (show && folderId) {
      fetchFolderItems();
    }
  }, [show, folderId]);

  const fetchFolderItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${folderId}/items`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch folder items");

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch folder items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItemId(item.id);
    onSelectImage(item.url, item.id);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select from Folder
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading items...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No items in this folder yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedItemId === item.id
                      ? "ring-2 ring-black dark:ring-white"
                      : ""
                  }`}
                  onClick={() => handleSelectItem(item)}
                >
                  <CardContent className="p-2">
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.name || "Clothing item"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {selectedItemId === item.id && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    {item.name && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
