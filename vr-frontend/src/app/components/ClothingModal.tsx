"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ClothingItem {
  id: string
  name?: string
  url: string
  type?: string
  brand?: string
  occasion?: string
  season?: string
  notes?: string
  price?: number
  key?: string
}

interface ClothingModalProps {
  isOpen: boolean
  onCloseAction: () => void
  clothingItems: ClothingItem[]
  initialItemIndex: number
}

const ClothingModal: React.FC<ClothingModalProps> = ({ isOpen, onCloseAction, clothingItems, initialItemIndex }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex)
  const currentItem = clothingItems[currentItemIndex]

  useEffect(() => {
    setCurrentItemIndex(initialItemIndex)
  }, [initialItemIndex, clothingItems])

  if (!isOpen || !currentItem) {
    return null
  }

  const handlePrev = () => {
    setCurrentItemIndex((prevIndex) => (prevIndex === 0 ? 0 : prevIndex - 1))
  }

  const handleNext = () => {
    setCurrentItemIndex((prevIndex) =>
      prevIndex === clothingItems.length - 1 ? clothingItems.length - 1 : prevIndex + 1,
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onCloseAction}>
      <div
        className="bg-gray-800 p-6 rounded-lg max-w-lg w-full relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCloseAction} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">{currentItem.name || "Clothing Item"}</h2>

        <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden rounded mb-4 flex items-center justify-center">
          <img
            src={currentItem.url || "/placeholder.svg"}
            alt={currentItem.name || "Clothing Item"}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Navigation Arrows Overlay */}
        {clothingItems.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-between px-2 sm:px-4 z-20">
            {currentItemIndex > 0 && (
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {currentItemIndex < clothingItems.length - 1 && (
              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {currentItem.type && (
            <p>
              <span className="font-semibold">Type:</span> {currentItem.type}
            </p>
          )}
          {currentItem.brand && (
            <p>
              <span className="font-semibold">Brand:</span> {currentItem.brand}
            </p>
          )}
          {currentItem.occasion && (
            <p>
              <span className="font-semibold">Occasion:</span> {currentItem.occasion}
            </p>
          )}
          {currentItem.season && (
            <p>
              <span className="font-semibold">Season:</span> {currentItem.season}
            </p>
          )}
          {typeof currentItem.price === "number" && currentItem.price != null && (
            <p>
              <span className="font-semibold">Price:</span> ${currentItem.price.toFixed(2)}
            </p>
          )}
          {currentItem.notes && (
            <p>
              <span className="font-semibold">Notes:</span> {currentItem.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClothingModal
