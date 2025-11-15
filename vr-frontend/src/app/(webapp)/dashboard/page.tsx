"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X, Folder } from "lucide-react"
import UploadForm from "../../components/UploadForm"
import { useRouter } from "next/navigation"
import ClothingGallery from "../../components/ClothingGallery"
import type { ClothingItem } from "../../types/clothing"

// Interface for ClothingGallery ref
interface ClothingGalleryRef {
  refresh: () => Promise<void>;
  addClothingItem: (newItem: ClothingItem) => void;
}
import FilterSection, { type FilterAttribute } from "../../components/FilterSection"
import { Badge } from "@/components/ui/badge"
import { DashboardSidebar } from "../../components/DashboardSidebar"
import { GridSelectIcon } from "../../components/icons/GridSelectIcon"
import { useTheme } from "../../contexts/ThemeContext"


export default function Homepage() {
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const galleryRef = useRef<ClothingGalleryRef>(null)
  const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet")
  const [searchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  const toggleTheme = useCallback(() => {
    const themeOrder: Array<"light" | "dark" | "chrome"> = ["light", "dark", "chrome"]
    const currentIndex = themeOrder.indexOf(theme as "light" | "dark" | "chrome")
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }, [theme, setTheme])

  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none")
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null])
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filterAttributes: FilterAttribute[] = useMemo(() => [
    { key: "type", label: "Type" },
    { key: "occasion", label: "Occasion" },
    { key: "style", label: "Style" },
    { key: "fit", label: "Fit" },
    { key: "color", label: "Color" },
    { key: "material", label: "Material" },
    { key: "season", label: "Season" },
  ], [])
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])

  const uniqueAttributeValues: Record<string, string[]> = useMemo(() => {
    const values: Record<string, string[]> = {}
    filterAttributes.forEach((attr) => {
      values[attr.key] = Array.from(
        new Set(clothingItems.map((item) => item[attr.key as keyof ClothingItem]).filter(Boolean)),
      ) as string[]
    })
    return values
  }, [clothingItems, filterAttributes])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const handleUploadComplete = useCallback(
    (target: "closet" | "wishlist", newItem: ClothingItem) => {
      // Switch to target tab first to ensure correct filtering
      setViewMode(target)

      // Then add the item
      setClothingItems((prevItems) => [newItem, ...prevItems])

      setShowModal(false)
    },
    [],
  )

  const handleOpenUploadModal = useCallback(() => {
    setShowModal(true)
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: "include",
        });
        
        if (res.ok) {
          // User is authenticated, just set loading to false
          setLoading(false);
          return;
        }
      } catch {
        // Error occurred, redirect to login
      }
      
      // No authentication found.
      router.push("/login");
    };
    
    checkAuth();
  }, [router]);

  // Conditional return statements must come AFTER all hooks have been called.
  if (!hasMounted || loading) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Sidebar */}
      <DashboardSidebar
        onThemeToggle={toggleTheme}
        onSettingsClick={() => router.push("/settings")}
      />

      {/* Main Content with left margin for sidebar on desktop */}
      <main className="md:ml-[60px] md:w-[calc(100%-60px)] w-full flex flex-col flex-1 min-h-0">
        {/* Content Area */}
        <div className="flex-1 px-6 py-6 overflow-auto">
          {/* Top Section: Segmented Control Toggle + Folder Icon + Action Buttons */}
          <div className="flex items-center justify-between mb-8">
            {/* Left: Wishlist/Closet Segmented Control */}
            <div className="flex items-center gap-4">
              {/* Segmented Control Toggle */}
              <div className="inline-flex items-center bg-[#E5E5E5] rounded-full p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('wishlist')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'wishlist'
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wishlist
                </button>
                <button
                  onClick={() => setViewMode('closet')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'closet'
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Closet
                </button>
              </div>

              {/* Folder Icon */}
              <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <Folder size={20} />
              </button>
            </div>

            {/* Right: Action Icons */}
            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Search size={20} />
              </motion.button>

              {/* Filter - using FilterSection component which has its own button */}
              <div className="[&_button]:p-2 [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-gray-600 [&_button]:hover:text-gray-900 [&_button]:hover:bg-gray-100 [&_button]:shadow-none">
                <FilterSection
                  clothingItems={clothingItems}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  filterAttributes={filterAttributes}
                  uniqueAttributeValues={uniqueAttributeValues}
                  priceSort={priceSort}
                  setPriceSort={setPriceSort}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                />
              </div>

              {/* Grid Select Icon */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMultiSelecting(!isMultiSelecting)}
              >
                <GridSelectIcon size={20} />
              </motion.button>

              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={handleOpenUploadModal}
              >
                <Plus size={20} />
              </motion.button>
            </div>
          </div>

          {/* Category Header */}
          <h2 className="text-2xl font-semibold mb-6 border-b-2 border-black inline-block pb-1">
            All
          </h2>

          {/* Gallery Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 min-h-0"
            >
            {/* Selected Tags */}
            {(selectedTags.length > 0 || priceSort !== "none") && (
              <div className="flex flex-wrap items-center gap-2 mt-4 mb-2">
                {/* Always show priceSort badge first if active */}
                {priceSort !== "none" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="group cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 pr-1"
                      onClick={() => setPriceSort("none")}
                    >
                      <span className="mr-1">{priceSort === "asc" ? "Price: Low → High" : "Price: High → Low"}</span>
                      <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  </motion.div>
                )}

                {/* Then show selected tags */}
                {selectedTags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: (index + 1) * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="group cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 pr-1"
                      onClick={() => toggleTag(tag)}
                    >
                      <span className="mr-1">{tag}</span>
                      <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  </motion.div>
                ))}

                {/* Clear all */}
                {(selectedTags.length > 0 || priceSort !== "none") && (
                  <button
                    onClick={() => {
                      setSelectedTags([])
                      setPriceSort("none")
                    }}
                    className="text-xs text-muted-foreground hover:text-primary underline ml-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            <ClothingGallery
              ref={galleryRef}
              viewMode={viewMode}
              setViewMode={setViewMode}
              openUploadModal={handleOpenUploadModal}
              searchQuery={debouncedQuery}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              priceSort={priceSort}
              setPriceSort={setPriceSort}
              priceRange={priceRange}
              clothingItems={clothingItems}
              setClothingItems={setClothingItems}
              isMultiSelecting={isMultiSelecting}
              setIsMultiSelecting={setIsMultiSelecting}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
            />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <UploadForm
        isOpen={showModal}
        onCloseAction={handleCloseModal}
        onUploadComplete={handleUploadComplete}
        currentViewMode={viewMode}
      />
    </div>
  )
}