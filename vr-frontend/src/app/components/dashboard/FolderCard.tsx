"use client";

import React from "react";
import { motion } from "framer-motion";
import { Folder as FolderType } from "@/app/types/clothing";
import Image from "next/image";

interface FolderCardProps {
  folder: FolderType;
  onClick: () => void;
}

export default function FolderCard({ folder, onClick }: FolderCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden">
        {/* Preview Grid */}
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 p-2">
          {folder.previewItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 h-full">
              {folder.previewItems.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-white dark:bg-gray-600 rounded-lg overflow-hidden"
                >
                  <Image
                    src={item.url}
                    alt={item.name || "Clothing item"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
              {/* Fill empty slots with placeholders */}
              {Array.from({ length: Math.max(0, 4 - folder.previewItems.length) }).map(
                (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="bg-gray-200 dark:bg-gray-600 rounded-lg"
                  />
                )
              )}
            </div>
          ) : (
            // Empty folder placeholder
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <svg
                  className="mx-auto h-16 w-16 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <p className="text-sm">Empty folder</p>
              </div>
            </div>
          )}
        </div>

        {/* Folder Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
            {folder.name}
          </h3>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{folder.itemCount} {folder.itemCount === 1 ? "item" : "items"}</span>
            <span>{formatDate(folder.updatedAt)}</span>
          </div>
          {folder.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {folder.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
