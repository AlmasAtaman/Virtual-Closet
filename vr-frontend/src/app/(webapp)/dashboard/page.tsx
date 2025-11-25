"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X, Folder, FolderOpen } from "lucide-react"
import UploadForm from "../../components/UploadForm"
import { useRouter } from "next/navigation"
import ClothingGallery from "../../components/ClothingGallery"
import FoldersView from "../../components/dashboard/FoldersView"
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
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet")
  const [displayMode, setDisplayMode] = useState<"grid" | "folders">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchBar, setShowSearchBar] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchBar])

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
          {/* 3-Section Segmented Control Toggle Bar with Notched Design */}
          <div className="relative w-full mb-6 flex items-center justify-center gap-0">
            {/* Left Half: Wishlist Section */}
            <div className="flex-1 bg-[#E5E5E5] border-2 border-gray-300 rounded-l-full border-r-0 py-0.5 pl-0.5">
              <button
                onClick={() => {
                  setViewMode('wishlist');
                  setDisplayMode('grid');
                }}
                className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${viewMode === 'wishlist' && displayMode === 'grid'
                    ? 'bg-white text-black shadow-sm rounded-l-full'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Wishlist
              </button>
            </div>

            {/* Center: Circular Folder Button (Sticks Out) */}
            <div className="relative z-10 -mx-3">
              <button
                onClick={() => setDisplayMode(displayMode === "grid" ? "folders" : "grid")}
                className={`w-14 h-14 flex items-center justify-center rounded-full border-[3px] border-gray-300 transition-all duration-200 shadow-md ${displayMode === "folders"
                    ? "bg-white text-gray-900"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                aria-label="Toggle Folders View"
              >
                {displayMode === "folders" ? (
                  <FolderOpen size={24} />
                ) : (
                  <Folder size={24} />
                )}
              </button>
            </div>

            {/* Right Half: Closet Section */}
            <div className="flex-1 bg-[#E5E5E5] border-2 border-gray-300 rounded-r-full border-l-0 py-0.5 pr-0.5">
              <button
                onClick={() => {
                  setViewMode('closet');
                  setDisplayMode('grid');
                }}
                className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${viewMode === 'closet' && displayMode === 'grid'
                    ? 'bg-white text-black shadow-sm rounded-r-full'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Closet
              </button>
            </div>
          </div>

          {/* Category Header with Action Buttons */}
          <div className="flex items-center justify-end mb-6">
            {/* Action Buttons */}
            <div className="flex items-center gap-3 relative">
              {/* Search Bar with integrated icon */}
              <motion.div
                initial={false}
                animate={{
                  width: showSearchBar ? 350 : 40,
                  backgroundColor: showSearchBar ? "#ffffff" : "transparent",
                  borderColor: showSearchBar ? "#d1d5db" : "transparent",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`relative h-10 flex items-center rounded-full border overflow-hidden ${!showSearchBar ? "hover:bg-gray-100 cursor-pointer border-transparent" : "border-gray-300"
                  }`}
                onClick={() => {
                  if (!showSearchBar) setShowSearchBar(true);
                }}
              >
                <motion.div
                  animate={{
                    left: showSearchBar ? 12 : "50%",
                    x: showSearchBar ? 0 : "-50%",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute top-1/2 -translate-y-1/2 z-10 text-gray-400 pointer-events-none"
                >
                  <Search className="w-5 h-5" />
                </motion.div>

                <motion.input
                  ref={searchInputRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showSearchBar ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) {
                      setShowSearchBar(false);
                    }
                  }}
                  className={`w-full h-full pl-10 pr-10 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 ${!showSearchBar ? "pointer-events-none" : ""
                    }`}
                />

                <AnimatePresence>
                  {showSearchBar && searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Filter */}
              <div className="[&_button]:p-2 [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-gray-700 [&_button]:hover:bg-gray-100 [&_button]:shadow-none">
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

              {/* Grid Select */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMultiSelecting(!isMultiSelecting)}
              >
                <GridSelectIcon size={20} />
              </motion.button>

              {/* Add */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={handleOpenUploadModal}
              >
                <Plus size={20} />
              </motion.button>
            </div>
          </div>

          {/* Gallery Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${displayMode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {displayMode === "grid" && (selectedTags.length > 0 || priceSort !== "none") && (
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

              {displayMode === "grid" ? (
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
              ) : (
                <FoldersView viewMode={viewMode} />
              )}
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