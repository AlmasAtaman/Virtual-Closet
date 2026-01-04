"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check, Image as ImageIcon } from "lucide-react";
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
  selectedItemIds?: string[];
}

export default function SelectFromFolderModal({
  show,
  onClose,
  folderId,
  onSelectImage,
  selectedItemIds = [],
}: SelectFromFolderModalProps) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: ClothingItem) => {
    onSelectImage(item.url, item.id);
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
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Select Image
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
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Items Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                This folder doesn't have any items yet.
              </p>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
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
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
