export interface ClothingItem {
  id: string;
  key: string; // Used for S3 object key
  url: string; // The primary URL for the image
  image?: string; // Alias for url, used for consistency with some components
  name: string;
  type: string;
  brand?: string;
  price?: number;
  mode: "closet" | "wishlist";
  sourceUrl?: string; // Original URL if scraped from web
  occasion?: string;
  style?: string;
  fit?: string;
  color?: string;
  material?: string;
  season?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isFavorite: boolean;
}

export interface ScrapedProduct {
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
  description?: string;
  images: string[]; // Array of image URLs
  sourceUrl: string;
  // Potentially other scraped fields
} 