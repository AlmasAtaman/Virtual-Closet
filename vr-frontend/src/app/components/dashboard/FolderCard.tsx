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
  // Get first 3 preview items
  const displayItems = folder.previewItems.slice(0, 3);

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="overflow-hidden">
        {/* Preview Grid - Pinterest style: Only outer container has rounded corners */}
        <div className="aspect-[3/2] rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="flex gap-[2px] h-full p-[2px]">
            {/* Left side - First item (takes 2/3 width, full height, NO rounded corners) */}
            <div className="relative w-2/3 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {displayItems[0] ? (
                <Image
                  src={displayItems[0].url}
                  alt={displayItems[0].name || "Clothing item"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : null}
            </div>

            {/* Right side - Two items stacked (each takes 1/3 width, NO rounded corners) */}
            <div className="flex flex-col gap-[2px] w-1/3">
              {/* Top right - Second item */}
              <div className="relative flex-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {displayItems[1] ? (
                  <Image
                    src={displayItems[1].url}
                    alt={displayItems[1].name || "Clothing item"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 15vw"
                  />
                ) : null}
              </div>

              {/* Bottom right - Third item */}
              <div className="relative flex-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {displayItems[2] ? (
                  <Image
                    src={displayItems[2].url}
                    alt={displayItems[2].name || "Clothing item"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 15vw"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Folder Info */}
        <div className="pt-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {folder.name}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
