"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

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

interface OutfitPreviewHorizontalProps {
  outfit: Outfit;
  containerWidth?: number;
  containerHeight?: number;
}

export default function OutfitPreviewHorizontal({
  outfit,
  containerWidth = 293,
  containerHeight = 192,
}: OutfitPreviewHorizontalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const renderOutfit = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!outfit.clothingItems || outfit.clothingItems.length === 0) {
        setIsRendering(false);
        return;
      }

      // Categorize items
      const tops: ClothingItem[] = [];
      const bottoms: ClothingItem[] = [];
      const outerwear: ClothingItem[] = [];
      const shoes: ClothingItem[] = [];

      outfit.clothingItems.forEach((item) => {
        const type = item.type?.toLowerCase() || "";
        if (type.includes("outerwear") || type.includes("jacket") || type.includes("coat")) {
          outerwear.push(item);
        } else if (type.includes("top") || type.includes("shirt") || type.includes("blouse")) {
          tops.push(item);
        } else if (type.includes("bottom") || type.includes("pants") || type.includes("jeans") || type.includes("skirt")) {
          bottoms.push(item);
        } else if (type.includes("shoes") || type.includes("footwear")) {
          shoes.push(item);
        } else {
          // Default: if no type, assume it's a top
          tops.push(item);
        }
      });

      // Horizontal layout strategy:
      // - If outerwear exists: outerwear on LEFT (40% width), bottoms on RIGHT (40% width), overlapping in middle
      // - If no outerwear: tops on LEFT (40% width), bottoms on RIGHT (40% width), overlapping in middle
      // - Items overlap by about 20% in the middle area

      const leftItem = outerwear.length > 0 ? outerwear[0] : tops.length > 0 ? tops[0] : null;
      const rightItem = bottoms.length > 0 ? bottoms[0] : null;

      if (!leftItem && !rightItem) {
        setIsRendering(false);
        return;
      }

      // Layout parameters
      const itemWidth = canvas.width * 0.5; // Each item takes 50% width
      const overlapAmount = canvas.width * 0.1; // 10% overlap

      const leftX = 0;
      const rightX = canvas.width - itemWidth + overlapAmount;

      // Load and draw items
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      try {
        // Draw right item first (so left item overlaps it)
        if (rightItem) {
          const img = await loadImage(rightItem.url);

          // Calculate scaling to fit within allocated space
          const scale = Math.min(itemWidth / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          // Center vertically within canvas
          const y = (canvas.height - scaledHeight) / 2;

          ctx.drawImage(img, rightX, y, scaledWidth, scaledHeight);
        }

        // Draw left item (overlaps right item)
        if (leftItem) {
          const img = await loadImage(leftItem.url);

          const scale = Math.min(itemWidth / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          const y = (canvas.height - scaledHeight) / 2;

          ctx.drawImage(img, leftX, y, scaledWidth, scaledHeight);
        }

        setIsRendering(false);
      } catch (error) {
        console.error("Error rendering outfit:", error);
        setIsRendering(false);
      }
    };

    renderOutfit();
  }, [outfit, containerWidth, containerHeight]);

  return (
    <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "contain" }}
      />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      )}
    </div>
  );
}
