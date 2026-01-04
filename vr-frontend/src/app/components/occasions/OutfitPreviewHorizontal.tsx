"use client";

import React, { useEffect, useRef, useState } from "react";
// import Image from "next/image";

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
      // - If outerwear exists: outerwear > top > bottom (layered on top of each other, overlapping)
      // - If no outerwear: top > bottom (layered on top of each other, overlapping, centered)
      // - Items should be close together and overlapping significantly

      const hasOuterwear = outerwear.length > 0;
      const hasTop = tops.length > 0;
      const hasBottom = bottoms.length > 0;

      if (!hasOuterwear && !hasTop && !hasBottom) {
        setIsRendering(false);
        return;
      }

      // Layout parameters - items should overlap significantly
      const itemWidth = canvas.width * 0.6; // Each item takes 60% of canvas width
      const overlapPercentage = 0.35; // 35% overlap between items

      // Load and draw items
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          // Remove crossOrigin to avoid CORS issues with S3
          // img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      try {
        // Collect items to draw in order: outerwear, top, bottom (left to right, bottom layer first)
        const itemsToDraw: ClothingItem[] = [];
        if (hasOuterwear) itemsToDraw.push(outerwear[0]);
        if (hasTop) itemsToDraw.push(tops[0]);
        if (hasBottom) itemsToDraw.push(bottoms[0]);

        if (itemsToDraw.length === 0) {
          setIsRendering(false);
          return;
        }

        // Calculate total width needed
        const totalOverlap = (itemsToDraw.length - 1) * (itemWidth * overlapPercentage);
        const totalWidth = itemsToDraw.length * itemWidth - totalOverlap;

        // Start x position to center the entire group
        let currentX = (canvas.width - totalWidth) / 2;

        // Draw each item with overlap
        for (const item of itemsToDraw) {
          const img = await loadImage(item.url);

          // Calculate scaling to fit within allocated space
          const scale = Math.min(itemWidth / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          // Center vertically within canvas
          const y = (canvas.height - scaledHeight) / 2;

          // Center horizontally within allocated itemWidth
          const xOffset = (itemWidth - scaledWidth) / 2;

          ctx.drawImage(img, currentX + xOffset, y, scaledWidth, scaledHeight);

          // Move to next position with overlap
          currentX += itemWidth - (itemWidth * overlapPercentage);
        }

        setIsRendering(false);
      } catch {
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
