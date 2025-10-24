export interface ClothingItem {
  id: string
  key: string // Used for S3 object key
  url: string // The primary URL for the image
  image?: string // Alias for url, used for consistency with some components
  name: string
  type: string
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
  sourceUrl?: string // Original URL if scraped from web
  occasion?: string
  style?: string
  fit?: string
  color?: string
  material?: string
  season?: string
  notes?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  isFavorite: boolean
  // Optimistic loading fields
  processingStatus?: "pending" | "processing" | "completed" | "failed"
  processingError?: string
  originalImageUrl?: string // Original image URL before processing (for preview during processing)
  // Layout fields for outfit positioning
  x?: number
  y?: number
  scale?: number
  left?: number
  bottom?: number
  width?: number
}

export interface ScrapedProduct {
  name: string
  brand?: string
  price?: number
  currency?: string
  description?: string
  images: string[] // Array of image URLs
  sourceUrl: string
  // Potentially other scraped fields
}

export interface OutfitClothingItem extends ClothingItem {
  // Layout positioning data for this item in the outfit
  x: number
  y: number
  scale: number
  left: number
  bottom: number
  width: number
}
