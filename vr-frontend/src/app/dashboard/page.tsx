"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X, Check, Heart } from "lucide-react"
import LogOutButton from "../components/LogoutButton"
import { ThemeToggle } from "../components/ThemeToggle"
import UploadForm from "../components/UploadForm"
import { useRouter } from "next/navigation"
import ClothingGallery from "../components/ClothingGallery"
import type { ClothingItem } from "../types/clothing"

// Interface for ClothingGallery ref
interface ClothingGalleryRef {
  refresh: () => Promise<void>;
  addClothingItem: (newItem: ClothingItem) => void;
}
import { Logo } from "../components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FilterSection, { type FilterAttribute } from "../components/FilterSection"
import { Badge } from "@/components/ui/badge"


export default function Homepage() {
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const galleryRef = useRef<ClothingGalleryRef>(null)
  const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet")
  const [searchQuery, setSearchQuery] = useState("")

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
      setClothingItems((prevItems) => [newItem, ...prevItems])

      if (viewMode !== target) {
        setViewMode(target)
      }

      setShowModal(false)
    },
    [viewMode],
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-semibold tracking-tight">VrC</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/outfits")} variant="outline" className="gap-2">
              <span className="hidden sm:inline">View</span> Outfits
            </Button>
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-8 flex flex-col flex-1 min-h-0">
        {/* Tabs full width on top */}
        <div className="mb-6">
          <Tabs
            defaultValue={viewMode}
            onValueChange={(value) => setViewMode(value as "closet" | "wishlist")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg overflow-hidden shadow-sm border border-border dark:border-border/60">
              <TabsTrigger value="closet">My Closet</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Controls row: Search + Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search bar */}
          <motion.div
            layout
            layoutId="search-bar-container"
            transition={{ type: "spring", stiffness: 80, damping: 12 }}
            className="relative flex-1 min-w-0"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, type, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full pr-9 min-w-0"
            />
            <AnimatePresence mode="wait">
              {searchQuery && (
                <motion.button
                  key="clear-search-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Control buttons */}
          <div className="flex gap-2 items-center">
            {/* Show Favorites Only Toggle */}
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`p-2 rounded-full mr-2 transition-colors border ${
                showFavoritesOnly
                  ? "bg-red-100 dark:bg-red-900/30 chrome:bg-red-900/20 border-red-300 dark:border-red-700 chrome:border-red-600"
                  : "bg-slate-200 dark:bg-slate-700 chrome:bg-slate-600 border-border dark:border-border chrome:border-border"
              }`}
              aria-label={showFavoritesOnly ? "Show All" : "Show Favorites Only"}
            >
              <Heart
                className={
                  showFavoritesOnly
                    ? "fill-red-500 stroke-red-500"
                    : "stroke-black dark:stroke-white chrome:stroke-slate-200"
                }
              />
            </button>
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

            <Button
              variant={isMultiSelecting ? "destructive" : "outline"}
              onClick={() => setIsMultiSelecting((prev) => !prev)}
            >
              {isMultiSelecting ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </Button>
            <Button
              onClick={handleOpenUploadModal}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 dark:border dark:border-blue-400/50"
            >
              <Plus className="h-4 w-4" />
              Add Clothing
            </Button>
          </div>
        </div>

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