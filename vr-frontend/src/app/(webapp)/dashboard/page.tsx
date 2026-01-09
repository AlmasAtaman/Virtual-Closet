"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Search, Folder, FolderOpen } from "lucide-react"
import UploadForm from "../../components/UploadForm"
import { useRouter, useSearchParams } from "next/navigation"
import ClothingGallery from "../../components/ClothingGallery"
import FoldersView, { type FoldersViewRef } from "../../components/dashboard/FoldersView"
import type { ClothingItem } from "../../types/clothing"

// Interface for ClothingGallery ref
interface ClothingGalleryRef {
  refresh: () => Promise<void>;
  addClothingItem: (newItem: ClothingItem) => void;
}
import FilterSection, { type FilterAttribute } from "../../components/FilterSection"
import { DashboardSidebar } from "../../components/DashboardSidebar"
import { useTheme } from "../../contexts/ThemeContext"
import Image from "next/image"


export default function Homepage() {
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const galleryRef = useRef<ClothingGalleryRef>(null)
  const foldersViewRef = useRef<FoldersViewRef>(null)
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

  // Check for view and section parameters in URL
  useEffect(() => {
    const view = searchParams.get("view")
    const section = searchParams.get("section")

    if (view === "folders") {
      setDisplayMode("folders")
    }

    if (section === "wishlist" || section === "closet") {
      setViewMode(section)
      setDisplayMode("grid")
    }
  }, [searchParams])

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
    { key: "category", label: "Category" },
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <div className="flex-1 bg-muted border-2 border-border rounded-l-full border-r-0 py-0.5 pl-0.5">
              <button
                onClick={() => {
                  setViewMode('wishlist');
                  setDisplayMode('grid');
                  router.push('?section=wishlist', { scroll: false });
                }}
                className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${viewMode === 'wishlist' && displayMode === 'grid'
                    ? 'bg-card text-foreground shadow-sm rounded-l-full'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                Wishlist
              </button>
            </div>

            {/* Center: Circular Folder Button (Sticks Out) */}
            <div className="relative z-10 -mx-3">
              <button
                onClick={() => {
                  const newMode = displayMode === "grid" ? "folders" : "grid";
                  setDisplayMode(newMode);
                  if (newMode === "folders") {
                    router.push('?view=folders', { scroll: false });
                  } else {
                    router.push(`?section=${viewMode}`, { scroll: false });
                  }
                }}
                className={`w-14 h-14 flex items-center justify-center rounded-full border-[3px] border-border transition-all duration-200 shadow-md ${displayMode === "folders"
                    ? "bg-card text-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
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
            <div className="flex-1 bg-muted border-2 border-border rounded-r-full border-l-0 py-0.5 pr-0.5">
              <button
                onClick={() => {
                  setViewMode('closet');
                  setDisplayMode('grid');
                  router.push('?section=closet', { scroll: false });
                }}
                className={`w-full py-1.5 px-6 text-sm font-medium transition-all duration-200 text-center ${viewMode === 'closet' && displayMode === 'grid'
                    ? 'bg-card text-foreground shadow-sm rounded-r-full'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                Closet
              </button>
            </div>
          </div>

          {/* Category Header with Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Filter tags display */}
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              {displayMode === "grid" && (selectedTags.length > 0 || showFavoritesOnly || priceSort !== "none") && (
                <>
                  {/* Active filter tags */}
                  {showFavoritesOnly && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-full flex items-center gap-1.5"
                    >
                      <span>Favorites</span>
                      <button
                        onClick={() => setShowFavoritesOnly(false)}
                        className="hover:bg-accent rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}

                  {priceSort !== "none" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-full flex items-center gap-1.5"
                    >
                      <span>{priceSort === "asc" ? "Price: Low to High" : "Price: High to Low"}</span>
                      <button
                        onClick={() => setPriceSort("none")}
                        className="hover:bg-accent rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}

                  {selectedTags.map((tag) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-full flex items-center gap-1.5 capitalize"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                        className="hover:bg-accent rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Clear All button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedTags([]);
                      setShowFavoritesOnly(false);
                      setPriceSort("none");
                      setPriceRange([null, null]);
                    }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-full hover:bg-primary/90 transition-colors"
                  >
                    Clear All
                  </motion.button>
                </>
              )}
            </div>

            {/* Right side - Action Buttons */}
            <div className={`flex items-center gap-3 relative ${displayMode === "folders" ? "mr-8" : ""}`}>
              {displayMode === "folders" ? (
                /* Folders View - Only Create Button */
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                  onClick={() => {
                    foldersViewRef.current?.createFolder();
                  }}
                >
                  Create
                </motion.button>
              ) : (
                /* Grid View - All Action Buttons */
                <>
                  {/* Search Bar with integrated icon */}
                  <motion.div
                    initial={false}
                    animate={{
                      width: showSearchBar ? 350 : 40,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`relative h-10 flex items-center rounded-full border overflow-hidden ${!showSearchBar ? "hover:bg-accent cursor-pointer border-transparent bg-transparent" : "border-border bg-card"
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
                      className="absolute top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none"
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
                      className={`w-full h-full pl-10 pr-10 bg-transparent border-none focus:outline-none text-sm text-foreground placeholder-muted-foreground ${!showSearchBar ? "pointer-events-none" : ""
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
                        >
                          <X size={14} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Filter */}
                  <div className="[&_button]:p-2 [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-foreground [&_button]:hover:bg-accent [&_button]:shadow-none">
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
                      showFavoritesOnly={showFavoritesOnly}
                      setShowFavoritesOnly={setShowFavoritesOnly}
                    />
                  </div>

                  {/* Grid Select */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMultiSelecting(!isMultiSelecting)}
                  >
                    <Image
                      src={isMultiSelecting ? "/multiSelect.PNG" : "/multi.PNG"}
                      alt="Multi-select"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </motion.button>

                  {/* Add */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                    onClick={handleOpenUploadModal}
                  >
                    <Plus size={20} />
                  </motion.button>
                </>
              )}
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
                <FoldersView ref={foldersViewRef} viewMode={viewMode} />
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