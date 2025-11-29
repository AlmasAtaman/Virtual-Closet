"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ClothingCard from "@/app/components/ClothingCard";
import ClothingDetailModal from "@/app/components/ClothingDetailModal";
import { DashboardSidebar } from "@/app/components/DashboardSidebar";
import AddItemsToFolderModal from "@/app/components/dashboard/AddItemsToFolderModal";
import { GridSelectIcon } from "@/app/components/icons/GridSelectIcon";
import { useTheme } from "@/app/contexts/ThemeContext";
import FilterSection, { type FilterAttribute } from "@/app/components/FilterSection";
import type { ClothingItem } from "@/app/types/clothing";

interface Folder {
  id: string;
  name: string;
  description?: string;
  items: ClothingItem[];
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [filterAttributes, setFilterAttributes] = useState<FilterAttribute[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    } catch (error) {
      console.error("Error fetching folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (folderId) {
      fetchFolder();
    }
  }, [folderId]);

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
  const uniqueAttributeValues: Record<string, string[]> = (() => {
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
  })();

  // Filter and search items
  const filteredItems = (folder?.items || []).filter((item) => {
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

    // Tag filter
    if (selectedTags.length > 0) {
      const itemTags = item.tags || [];
      const hasTag = selectedTags.some((tag) => itemTags.includes(tag));
      if (!hasTag) return false;
    }

    // Attribute filters
    for (const attr of filterAttributes) {
      if (attr.selectedValues.length > 0) {
        const itemValue = String(item[attr.key as keyof ClothingItem] || "");
        if (!attr.selectedValues.includes(itemValue)) {
          return false;
        }
      }
    }

    // Price range filter
    if (item.price !== null && item.price !== undefined) {
      if (item.price < priceRange[0] || item.price > priceRange[1]) {
        return false;
      }
    }

    return true;
  }) || [];

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
  const handleItemClick = (item: ClothingItem, rect: DOMRect) => {
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
          } catch (error) {
            // Silently ignore 404 errors (item already removed)
            if (error.response?.status !== 404) {
              console.error(`Error removing item ${itemId}:`, error);
            }
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
    } catch (err) {
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
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Sidebar */}
      <DashboardSidebar
        onThemeToggle={toggleTheme}
        onSettingsClick={() => router.push("/settings")}
      />

      {/* Main Content with left margin for sidebar on desktop */}
      <main className="md:ml-[60px] md:w-[calc(100%-60px)] w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Back Arrow & Title - Left */}
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/dashboard")}
                  className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                    clothingItems={folder?.items || []}
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
                  className={`p-2 rounded-lg transition-colors ${
                    isMultiSelecting
                      ? "bg-black dark:bg-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMultiSelecting(!isMultiSelecting)}
                >
                  <GridSelectIcon
                    size={20}
                    className={isMultiSelecting ? "text-white dark:text-black" : ""}
                  />
                </motion.button>

                {/* Add Items to Folder */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsAddItemsModalOpen(true)}
                >
                  <Plus size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-auto">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
