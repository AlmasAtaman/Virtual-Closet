"use client"

import { useEffect, useState, useRef, useCallback, useMemo  } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X, Check } from "lucide-react"
import LogOutButton from "../components/LogoutButton"
import UploadForm from "../components/UploadForm"
import { useRouter } from "next/navigation"
import ClothingGallery from "../components/ClothingGallery"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ClothingItem } from "../types/clothing"
import FilterSection, { Clothing, FilterAttribute } from "../components/FilterSection";

export default function Homepage() {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const galleryRef = useRef<any>(null)
  const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet")
  const [searchQuery, setSearchQuery] = useState("")

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);


  const filterAttributes: FilterAttribute[] = [
  { key: "type", label: "Type" },
  { key: "occasion", label: "Occasion" },
  { key: "style", label: "Style" },
  { key: "fit", label: "Fit" },
  { key: "color", label: "Color" },
  { key: "material", label: "Material" },
  { key: "season", label: "Season" },
];


  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);

  const uniqueAttributeValues: Record<string, string[]> = useMemo(() => {
    const values: Record<string, string[]> = {};
    filterAttributes.forEach((attr) => {
      values[attr.key] = Array.from(
        new Set(clothingItems.map((item) => item[attr.key as keyof ClothingItem]).filter(Boolean))
      ) as string[];
    });
    return values;
  }, [clothingItems]);



  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const handleUploadComplete = useCallback(
    (target: "closet" | "wishlist", newItem: ClothingItem) => {
      setShowModal(false)
      console.log("Dashboard: onUploadComplete received - target:", target, "newItem:", newItem)
      setViewMode(target)
      console.log("Dashboard: viewMode after setViewMode:", viewMode)
      galleryRef.current?.addClothingItem(newItem)
    },
    [galleryRef, viewMode],
  )

  const handleOpenUploadModal = useCallback(() => {
    setShowModal(true)
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("http://localhost:8000/api/auth/me", {
        credentials: "include",
      })

      if (!res.ok) {
        router.push("/login")
      } else {
        const data = await res.json()
        setUsername(data.username)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Conditional return statements must come AFTER all hooks have been called.
  if (!hasMounted || loading) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/VrClogo.png" alt="VrC Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight">VrC</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/outfits")} variant="outline" className="gap-2">
              <span className="hidden sm:inline">View</span> Outfits
            </Button>
            <LogOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Tabs full width on top */}
        <div className="mb-6">
          <Tabs
            defaultValue={viewMode}
            onValueChange={(value) => setViewMode(value as "closet" | "wishlist")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg overflow-hidden shadow-sm">
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
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, type, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full pr-9"
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
          <div className="flex gap-2">
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
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
          >

          {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <AnimatePresence>
              {selectedTags.map((tag) => (  
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedTags([])}
            >
              Clear all
            </motion.button>
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
        priceRange={priceRange}
        clothingItems={clothingItems}
        setClothingItems={setClothingItems}
        isMultiSelecting={isMultiSelecting}
        setIsMultiSelecting={setIsMultiSelecting}
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