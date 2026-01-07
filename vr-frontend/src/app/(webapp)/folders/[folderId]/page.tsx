"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { X, ArrowLeft, Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ClothingCard from "@/app/components/ClothingCard";
import ClothingDetailModal from "@/app/components/ClothingDetailModal";
import { DashboardSidebar } from "@/app/components/DashboardSidebar";
import AddItemsToFolderModal from "@/app/components/dashboard/AddItemsToFolderModal";
import { useTheme } from "@/app/contexts/ThemeContext";
import FilterSection, { type FilterAttribute } from "@/app/components/FilterSection";
import type { ClothingItem } from "@/app/types/clothing";
import Image from "next/image";

interface Folder {
  id: string;
  name: string;
  description?: string;
  items: ClothingItem[];
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = params.folderId as string;
  const { toggleTheme } = useTheme();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const pendingRemovalsRef = useRef<Set<string>>(new Set());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [selectedModes, setSelectedModes] = useState<("closet" | "wishlist")[]>(["closet", "wishlist"]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize filter attributes (exactly like dashboard)
  const filterAttributes: FilterAttribute[] = useMemo(() => [
    { key: "type", label: "Type" },
    { key: "occasion", label: "Occasion" },
    { key: "style", label: "Style" },
    { key: "fit", label: "Fit" },
    { key: "color", label: "Color" },
    { key: "material", label: "Material" },
    { key: "season", label: "Season" },
  ], []);

  // Create axios instance with credentials
  const createAuthenticatedAxios = () => {
    return axios.create({
      withCredentials: true,
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    });
  };

  // Fetch folder details
  const fetchFolder = async () => {
    try {
      setIsLoading(true);
      const response = await createAuthenticatedAxios().get(
        `/api/folders/${folderId}`
      );
      setFolder(response.data.folder);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (folderId) {
      fetchFolder();
    }
  }, [folderId]);

  // Check for openAddModal query parameter
  useEffect(() => {
    const openModal = searchParams.get("openAddModal");
    if (openModal === "true" && folder) {
      setIsAddItemsModalOpen(true);
      // Clean up the URL by removing the query parameter
      router.replace(`/folders/${folderId}`);
    }
  }, [searchParams, folder, folderId, router]);

  // Reset selections when multi-select is toggled off
  useEffect(() => {
    if (!isMultiSelecting) {
      setSelectedItemIds([]);
    }
  }, [isMultiSelecting]);

  // Auto-focus search input when search bar opens
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  // Compute unique attribute values for filters
  const uniqueAttributeValues: Record<string, string[]> = useMemo(() => {
    const values: Record<string, string[]> = {};
    filterAttributes.forEach((attr) => {
      values[attr.key] = Array.from(
        new Set(
          (folder?.items || [])
            .map((item) => item[attr.key as keyof ClothingItem])
            .filter(Boolean)
        )
      ) as string[];
    });
    return values;
  }, [folder?.items, filterAttributes]);

  // Filter and search items
  const filteredItems = (folder?.items || []).filter((item) => {
    // Mode filter (closet/wishlist)
    if (selectedModes.length > 0 && !selectedModes.includes(item.mode)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableFields = [
        item.name,
        item.category,
        item.brand,
        item.color,
        item.season,
        item.notes,
        ...(item.tags || []),
      ];
      const matches = searchableFields.some(
        (field) => field && field.toLowerCase().includes(query)
      );
      if (!matches) return false;
    }

    // Attribute filter (type, color, season, and style tags)
    if (selectedTags.length > 0) {
      const itemAttributes = [
        item.type?.toLowerCase(),
        item.color?.toLowerCase(),
        item.season?.toLowerCase(),
        ...(item.tags || []).map(tag => tag.toLowerCase())
      ].filter(Boolean);

      const hasMatch = selectedTags.some((tag) =>
        itemAttributes.includes(tag.toLowerCase())
      );
      if (!hasMatch) return false;
    }

    // Price range filter
    if (priceRange[0] !== null && priceRange[1] !== null) {
      if (item.price !== null && item.price !== undefined) {
        if (item.price < priceRange[0] || item.price > priceRange[1]) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (priceSort === "asc") {
      return (a.price || 0) - (b.price || 0);
    } else if (priceSort === "desc") {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });


  // Handle clothing item click
  const handleItemClick = (item: ClothingItem) => {
    const index = folder?.items.findIndex(i => i.id === item.id) ?? -1;
    setSelectedItem(item);
    setSelectedIndex(index);
  };

  // Handle toggle select
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedIndex(-1);
  };

  // Navigate to next/previous item
  const handleNext = () => {
    if (folder && selectedIndex < folder.items.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedItem(folder.items[nextIndex]);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedItem(folder!.items[prevIndex]);
    }
  };

  // Toggle pending removal (optimistic, doesn't actually remove from folder)
  const handleTogglePendingRemoval = (itemId: string) => {
    setPendingRemovals((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId); // Un-mark for removal
        pendingRemovalsRef.current.delete(itemId);
      } else {
        next.add(itemId); // Mark for removal
        pendingRemovalsRef.current.add(itemId);
      }
      return next;
    });
  };

  // Handle unmarking items from pending removals (called from modal)
  const handleUnmarkRemovals = (itemIds: string[]) => {
    setPendingRemovals((prev) => {
      const next = new Set(prev);
      itemIds.forEach((id) => {
        next.delete(id);
        pendingRemovalsRef.current.delete(id);
      });
      return next;
    });
  };

  // Clean up pending removals when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Remove all pending items from database when leaving the page
      if (pendingRemovalsRef.current.size > 0) {
        const itemsToRemove = Array.from(pendingRemovalsRef.current);
        itemsToRemove.forEach(async (itemId) => {
          try {
            await createAuthenticatedAxios().delete(
              `/api/folders/${folderId}/items/${itemId}`
            );
          } catch {
            // Silently ignore 404 errors (item already removed)
          }
        });
      }
    };
  }, [folderId]);

  // Toggle favorite
  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!folder) return;

    // Optimistic update
    setFolder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, isFavorite } : item
        ),
      };
    });

    // Also update selectedItem if it matches
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) =>
        prev ? { ...prev, isFavorite } : prev
      );
    }

    try {
      await createAuthenticatedAxios().patch(`/api/images/${id}/favorite`, {
        isFavorite,
      });
    } catch {
      // Revert on error
      setFolder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === id ? { ...item, isFavorite: !isFavorite } : item
          ),
        };
      });
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) =>
          prev ? { ...prev, isFavorite: !isFavorite } : prev
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading folder...</p>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Folder not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

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
          {/* Header with Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {/* Back Arrow & Title - Left */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard?view=folders")}
                className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons - Right */}
            <div className="flex items-center gap-3 relative">
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
                <FilterSection
                  clothingItems={folder?.items || []}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  filterAttributes={filterAttributes}
                  uniqueAttributeValues={uniqueAttributeValues}
                  priceSort={priceSort}
                  setPriceSort={setPriceSort}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedModes={selectedModes}
                  setSelectedModes={setSelectedModes}
                />

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

                {/* Add Items to Folder */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                  onClick={() => setIsAddItemsModalOpen(true)}
                >
                  <Plus size={20} />
                </motion.button>
              </div>
            </div>


          {/* Content Grid */}
          {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">Loading folder...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              {folder?.items?.length === 0
                ? "No items in this folder yet. Click the + button to add items!"
                : "No items match your search or filters"}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {folder && <span>Total items in folder: {folder.items?.length || 0}</span>}
            </div>
          </div>
        ) : (
          /* Grid layout */
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
            {sortedItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                toggleFavorite={toggleFavorite}
                onClick={handleItemClick}
                isMultiSelecting={isMultiSelecting}
                isSelected={selectedItemIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
                viewMode="wishlist"
                showAsSaved={true}
                isPendingRemoval={pendingRemovals.has(item.id)}
                onTogglePendingRemoval={handleTogglePendingRemoval}
              />
            ))}
          </div>
        )}

        {/* Floating Multi-Select Action Bar */}
        <AnimatePresence>
          {isMultiSelecting && selectedItemIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-card rounded-full shadow-lg border border-border px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedItemIds.length} item{selectedItemIds.length > 1 ? "s" : ""} selected
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      // Remove selected items from folder
                      await Promise.all(
                        selectedItemIds.map((itemId) =>
                          createAuthenticatedAxios().delete(
                            `/api/folders/${folderId}/items/${itemId}`
                          )
                        )
                      );

                      // Clear selections
                      setSelectedItemIds([]);
                      setIsMultiSelecting(false);

                      // Refresh folder
                      await fetchFolder();
                    } catch {
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors border border-red-200 dark:border-red-800"
                >
                  Unsave from Folder
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Clothing Detail Modal */}
        {selectedItem && (
          <ClothingDetailModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={handleCloseModal}
            onToggleFavorite={toggleFavorite}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={folder ? selectedIndex < folder.items.length - 1 : false}
            hasPrev={selectedIndex > 0}
          />
        )}

        {/* Add Items to Folder Modal */}
        <AddItemsToFolderModal
          isOpen={isAddItemsModalOpen}
          onClose={() => {
            setIsAddItemsModalOpen(false);
            // Clear pending removals and refresh folder when modal closes
            setPendingRemovals(new Set());
            pendingRemovalsRef.current.clear();
            fetchFolder();
          }}
          folderName={folder?.name || ""}
          folderId={folderId}
          existingItemIds={
            folder?.items
              .filter((item) => !pendingRemovals.has(item.id))
              .map((item) => item.id) || []
          }
          pendingRemovals={Array.from(pendingRemovals)}
          onUnmarkRemovals={handleUnmarkRemovals}
        />
      </main>
    </div>
  );
}
