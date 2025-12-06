export interface ClothingItem {
  id: string
  key: string // Used for S3 object key
  url: string // The primary URL for the image
  image?: string // Alias for url, used for consistency with some components
  name: string
  type: string // Subcategory (e.g., "t-shirt", "jeans", "sneakers")
  category?: string // Main category (tops/bottoms/outerwear/dresses/shoes/accessories/bags)
  brand?: string
  price?: number
  mode: "closet" | "wishlist"
  sourceUrl?: string // Original URL if scraped from web
  color?: string
  season?: string
  notes?: string
  tags?: string[] // Style tags (e.g., casual, elegant, sporty) - max 3
  size?: string // Clothing size (e.g., "S", "M", "L", "28", "10")
  purchaseDate?: string // When item was added to wardrobe
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
  // Note: Backend analytics fields (viewCount, outfitCount, lastViewedAt, etc.)
  // are NOT included in frontend types as they're never shown in UI
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

export interface FolderPreviewItem {
  id: string
  url: string
  name: string
}

export interface Folder {
  id: string
  name: string
  description?: string | null
  isPublic: boolean
  imageLayout?: string | null
  previewImages?: any
  createdAt: string
  updatedAt: string
  itemCount: number
  previewItems: FolderPreviewItem[]
}
