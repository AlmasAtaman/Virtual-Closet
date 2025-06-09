"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import Dropdown from "./Dropdown";
import FilterSection from "./FilterSection";

type ClothingGalleryProps = {
  viewMode: "closet" | "wishlist";
  setViewMode: (mode: "closet" | "wishlist") => void;
  openUploadModal: () => void;
};

type Clothing = {
  id: string;
  key: string;
  url: string;
  name: string;
  type: string;
  brand: string;
  price?: number | string | null;
  occasion?: string;
  style?: string;
  fit?: string;
  color?: string;
  material?: string;
  season?: string;
  notes?: string;
  mode?: "closet" | "wishlist";
  sourceUrl?: string;
  tags?: string[];
};

type EditFormFields = {
  name: string;
  type: string;
  brand: string;
  price: string;
  occasion: string;
  style: string;
  fit: string;
  color: string;
  material: string;
  season: string;
  notes: string;
  sourceUrl: string;
};

const ClothingGallery = forwardRef(({ viewMode, setViewMode, openUploadModal }: ClothingGalleryProps, ref) => {
  const [clothingItems, setClothingItems] = useState<Clothing[]>([]);
  const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<EditFormFields>({
    name: "",
    type: "",
    brand: "",
    price: "",
    occasion: "",
    style: "",
    fit: "",
    color: "",
    material: "",
    season: "",
    notes: "",
    sourceUrl: "",
  });
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAcrossModes, setFilterAcrossModes] = useState(false);
  const [searchAcrossModes, setSearchAcrossModes] = useState(false);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [clickedItemRect, setClickedItemRect] = useState<DOMRect | null>(null);
  const [selectedTab, setSelectedTab] = useState<'general' | 'details'>('general');
  
  // Define the filterable attributes
  const filterAttributes: { key: keyof Clothing; label: string; }[] = [
    { key: 'type', label: 'Type' },
    { key: 'occasion', label: 'Occasion' },
    { key: 'style', label: 'Style' },
    { key: 'fit', label: 'Fit' },
    { key: 'color', label: 'Color' },
    { key: 'material', label: 'Material' },
    { key: 'season', label: 'Season' },
  ];

  // Helper function to safely convert price to number
  const getNumericPrice = (price: string | number | null | undefined): number | null => {
    if (price === null || price === undefined) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? null : numPrice;
  };

  // Add price range options
  const priceRanges = [
    { label: "Under $10", range: [0, 10] },
    { label: "$10 - $20", range: [10, 20] },
    { label: "$20 - $40", range: [20, 40] },
    { label: "$40 - $60", range: [40, 60] },
    { label: "$60 - $100", range: [60, 100] },
    { label: "Over $100", range: [100, Infinity] }
  ];

  // Helper function to render filter options for a single attribute
  const renderAttributeFilters = (attributeKey: keyof Clothing, attributeLabel: string, uniqueValues: string[]) => {
    if (uniqueValues.length === 0) return null; // Don't show category if no items have this attribute

    return (
      <div key={attributeKey} className="mb-3">
        <h4 className="text-md font-medium mb-1">{attributeLabel}</h4>
        <div className="flex flex-wrap gap-2">
          {uniqueValues.map(value => (
            <button
              key={value}
              onClick={() => toggleTag(value)}
              className={`px-3 py-1 rounded-full text-sm border ${selectedTags.includes(value) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Calculate unique values for each attribute
  const uniqueAttributeValues: Record<string, string[]> = {};
  filterAttributes.forEach(attribute => {
    uniqueAttributeValues[attribute.key] = Array.from(new Set(clothingItems.map(item => item[attribute.key as keyof Clothing]).filter(Boolean))) as string[];
  });

  // Determine the items to search/filter based on searchAcrossModes and filterAcrossModes
  const baseItems = (searchAcrossModes || filterAcrossModes) ? clothingItems : clothingItems.filter(item => item.mode === viewMode);

  const fetchImages = async () => {
    try {
      // If either checkbox is checked, fetch all items
      if (searchAcrossModes || filterAcrossModes) {
        const [closetRes, wishlistRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/images?mode=closet`, { withCredentials: true }),
          axios.get(`http://localhost:8000/api/images?mode=wishlist`, { withCredentials: true })
        ]);
        
        const allItems = [
          ...(closetRes.data.clothingItems || []),
          ...(wishlistRes.data.clothingItems || [])
        ];
        setClothingItems(allItems);
      } else {
        // Otherwise, fetch only items for current view mode
        const res = await axios.get(`http://localhost:8000/api/images?mode=${viewMode}`, {
          withCredentials: true,
        });
        setClothingItems(res.data.clothingItems || []);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/images/${encodeURIComponent(key)}`, {
        withCredentials: true,
      });
      setClothingItems((prev) => prev.filter((item) => item.key !== key));
      setSelectedItemIds(prev => prev.filter(id => id !== key));
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;

    const updated = { ...selectedItem, ...editForm };
    try {
      console.log("Updating item with ID:", selectedItem.id, "with data:", editForm);

      await axios.patch(
        "http://localhost:8000/api/images/update",
        { id: selectedItem.id, ...editForm },
        { withCredentials: true }
      );

      setSelectedItem(updated);
      setClothingItems(prev =>
        prev.map(item => item.key === updated.key ? updated : item)
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update clothing item:", err);
      alert("Failed to save changes.");
    }
  };

  const handleMoveToCloset = async (item: Clothing) => {
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/images/move-to-closet/${item.id}`,
        {},
        { withCredentials: true }
      );

      // Remove the item from the current view
      setClothingItems((prev) => prev.filter((i) => i.id !== item.id));

      // Close the modal
      setSelectedItem(null);

      // Show success message
      alert("Item moved to closet successfully!");
    } catch (err) {
      console.error("Error moving item to closet:", err);
      alert("Failed to move item to closet");
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItemIds.length} item(s)?`)) {
      return;
    }

    try {
      // Get the keys for the selected item IDs
      const itemsToDelete = clothingItems.filter(item => selectedItemIds.includes(item.id));
      const keysToDelete = itemsToDelete.map(item => item.key);

      // Send delete requests in parallel
      await Promise.all(keysToDelete.map(key =>
        axios.delete(`http://localhost:8000/api/images/${encodeURIComponent(key)}`, { withCredentials: true })
      ));

      // Update frontend state
      setClothingItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
      setSelectedItemIds([]);
      setIsMultiSelecting(false); // Exit multi-select mode after deletion

      alert(`${selectedItemIds.length} item(s) deleted successfully!`);
    } catch (err) {
      console.error("Error deleting selected items:", err);
      alert("Failed to delete selected items.");
    }
  };

  const handleMoveSelectedToCloset = async () => {
    if (!confirm(`Are you sure you want to move ${selectedItemIds.length} item(s)?`)) {
      return;
    }

    try {
      // Ensure we only attempt to move items currently displayed in the wishlist view
      const itemsToMove = clothingItems.filter(item => selectedItemIds.includes(item.id) && item.mode === 'wishlist');

      if (itemsToMove.length === 0) {
        alert("No wishlist items selected to move.");
        return;
      }

      // Send move requests in parallel
      await Promise.all(itemsToMove.map(item =>
        axios.patch(`http://localhost:8000/api/images/move-to-closet/${item.id}`, {}, { withCredentials: true })
      ));

      // Update frontend state by removing moved items (from wishlist view)
      setClothingItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
      setSelectedItemIds([]);
      setIsMultiSelecting(false); // Exit multi-select mode after moving

      alert(`${itemsToMove.length} item(s) moved to closet successfully!`);
    } catch (err) {
      console.error("Error moving selected items to closet:", err);
      alert("Failed to move selected items to closet.");
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchImages,
    addClothingItem: (newItem: Clothing) => {
      console.log("ClothingGallery: addClothingItem called. newItem:", newItem, "current viewMode:", viewMode);
      if (newItem.mode === viewMode) {
        setClothingItems(prevItems => [...prevItems, newItem]);
      }
    },
  }), [fetchImages, viewMode]);

  useEffect(() => {
    fetchImages();
  }, [viewMode, searchAcrossModes, filterAcrossModes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const fuse = new Fuse(baseItems, {
    keys: [
      "name", "type", "brand",
      "occasion", "style", "fit",
      "color", "material", "season"
    ],
    threshold: 0.3,
  });

  const searchResults = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : baseItems;

  const filteredItems = searchResults
    .filter((item) => {
      // Group selected tags by their attribute type
      const selectedTagsByCategory: Record<string, string[]> = {};
      selectedTags.forEach(tag => {
        const attribute = filterAttributes.find(attr => uniqueAttributeValues[attr.key]?.includes(tag));
        if (attribute) {
          if (!selectedTagsByCategory[attribute.key]) {
            selectedTagsByCategory[attribute.key] = [];
          }
          selectedTagsByCategory[attribute.key].push(tag);
        }
      });

      // Apply filtering logic: AND across categories, OR within categories
      for (const attributeKey in selectedTagsByCategory) {
        const selectedValuesInThisCategory = selectedTagsByCategory[attributeKey];
        if (selectedValuesInThisCategory.length > 0) {
          const itemValueForCategory = item[attributeKey as keyof Clothing];
          if (!itemValueForCategory || !selectedValuesInThisCategory.some(val => val === itemValueForCategory)) {
            return false; // Item does not match any selected tag in this category
          }
        }
      }

      // Price range filtering
      if (priceRange[0] !== null || priceRange[1] !== null) {
        const itemPrice = getNumericPrice(item.price);
        if (itemPrice === null) return false;
        
        if (priceRange[0] !== null && itemPrice < priceRange[0]) return false;
        if (priceRange[1] !== null && itemPrice > priceRange[1]) return false;
      }

      return true;
    })
    .filter(item => {
      const itemPrice = getNumericPrice(item.price);
      // Exclude items with no valid price when price sorting is active
      if ((priceSort === "asc" || priceSort === "desc") && itemPrice === null) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (priceSort === "none") return 0;
      
      const priceA = getNumericPrice(a.price);
      const priceB = getNumericPrice(b.price);
      
      // If either price is null, move that item to the end
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      
      return priceSort === "asc" ? priceA - priceB : priceB - priceA;
    });

  const toggleMultiSelect = () => {
    setIsMultiSelecting(prev => !prev);
    if (isMultiSelecting) {
      setSelectedItemIds([]);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Helper function to safely format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return "";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return "";
    return `$${numPrice.toFixed(2)}`;
  };

  const currentIndex = selectedItem ? clothingItems.findIndex(
    (item) => item.key === selectedItem.key
  ) : -1;
  const lastIndex = clothingItems.length - 1;

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name or tag..."
            value={searchQuery}
            onChange={(e) => {
              const input = e.target.value;
              setSearchQuery(input);

              if (autocompleteEnabled && input) {
                const results = new Fuse(baseItems, { keys: ["name"] }).search(input).map(r => r.item.name);
                const unique = [...new Set(results)].slice(0, 5);
                setSuggestions(unique);
              } else {
                setSuggestions([]);
              }
            }}
            className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  onClick={() => {
                    setSearchQuery(sug);
                    setSuggestions([]);
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleMultiSelect}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isMultiSelecting
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary border border-secondary"
            }`}
          >
            <span>{isMultiSelecting ? "✕" : "✓"}</span>
            <span>
              {isMultiSelecting
                ? `Cancel Selection (${selectedItemIds.length})`
                : "Select Multiple"}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
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

      {/* Selected Tags - These are now handled within FilterSection */}
      {/* {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              <span>{tag}</span>
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )} */}

      {/* Clothing Grid */}
      <AnimatePresence initial={false}>
        <motion.div
          key={viewMode} // Key change triggers animation
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <span className="text-2xl text-gray-500">👕</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">No items found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedTags.length > 0
                  ? "Try adjusting your search or filters"
                  : "Add some clothing items to get started"}
              </p>
              {viewMode === 'closet' && (
                <button
                  onClick={openUploadModal}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>➕</span>
                  <span>Add Your First Item</span>
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.key || item.url}
                className={`group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md group-hover:scale-[1.02] ${
                  isMultiSelecting && selectedItemIds.includes(item.id)
                    ? "ring-4 ring-primary ring-offset-2"
                    : ""
                }`}
              >
                <div
                  className="aspect-square cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    if (isMultiSelecting) {
                      toggleItemSelection(item.id);
                    } else {
                      // Capture the bounding rect of the clicked element
                      setClickedItemRect(e.currentTarget.getBoundingClientRect());
                      setSelectedItem(item);
                      setIsEditing(false);
                    }
                  }}
                >
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <span className="text-2xl">👕</span>
                    </div>
                  )}
                  {isMultiSelecting && selectedItemIds.includes(item.id) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-4xl">✓</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-1 font-medium">{item.name}</h3>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {[item.type, item.brand]
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                  {(isEditing || formatPrice(item.price)) && (
                    <p className="text-sm font-medium text-primary">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Multi-select Actions */}
      {isMultiSelecting && selectedItemIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 gap-4 rounded-lg border bg-card p-4 shadow-lg">
          {viewMode === "wishlist" && (
            <button
              onClick={handleMoveSelectedToCloset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Move to Closet ({selectedItemIds.length})
            </button>
          )}
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
          >
            Delete Selected ({selectedItemIds.length})
          </button>
        </div>
      )}

      {/* Item Modal */}
      <AnimatePresence>
      {selectedItem && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            setSelectedItem(null);
            setIsEditing(false);
            setClickedItemRect(null);
            setSelectedTab('general');
            e.stopPropagation();
          }}
        >
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] h-[500px] overflow-y-auto rounded-lg bg-card shadow-lg flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col md:flex-row flex-grow">
              {/* Image Section */}
              <div className="relative w-[400px] bg-muted p-6 flex items-center justify-center overflow-hidden">
                {selectedItem.url ? (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.name}
                    className="h-full w-full object-contain rounded"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-2xl">👕</span>
                  </div>
                )}
                {!isEditing && (
                  <>
                    {currentIndex > 0 && (
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(clothingItems[currentIndex - 1]);
                        }}
                      >
                        ❮
                      </button>
                    )}
                    {currentIndex < lastIndex && (
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(clothingItems[currentIndex + 1]);
                        }}
                      >
                        ❯
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Info Section */}
              <div className="flex flex-col flex-grow px-6 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(null);
                  }}
                  className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  ✕
                </button>

                <div className="flex flex-col flex-grow h-0 overflow-y-auto pr-2">
                  <h2 className="text-2xl font-semibold mb-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-2xl font-semibold w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Enter name"
                      />
                    ) : (
                      selectedItem.name
                    )}
                  </h2>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.sourceUrl}
                      onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Add source URL"
                    />
                  ) : (
                    selectedItem.sourceUrl && (
                      <a
                        href={selectedItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm hover:underline"
                      >
                        <span className="text-muted-foreground">Website: </span>
                        <span className="text-blue-500">{selectedItem.sourceUrl}</span>
                      </a>
                    )
                  )}

                  {/* Tab Navigation */}
                  <div className="flex border-b">
                    <button
                      className={`py-2 px-4 text-sm font-medium ${selectedTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTab('general');
                      }}
                    >
                      General Info
                    </button>
                    <button
                      className={`py-2 px-4 text-sm font-medium ${selectedTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTab('details');
                      }}
                    >
                      Style & Details
                    </button>
                  </div>

                  {selectedTab === 'general' && (
                    <div className="space-y-4 pt-4">
                      {!(selectedItem.type || selectedItem.brand || formatPrice(selectedItem.price) || selectedItem.notes) && !isEditing ? (
                        <div className="col-span-full text-center text-muted-foreground py-8">
                          Click Edit to fill this Section Out!
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-y-2 gap-x-4 sm:grid-cols-2">
                            {/* Type */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Type:</dt>
                              {isEditing ? (
                                <Dropdown
                                  options={["T-shirt", "Jacket", "Pants", "Shoes", "Hat", "Sweater", "Shorts", "Dress", "Skirt"]}
                                  value={editForm.type}
                                  onChange={(value) => setEditForm({ ...editForm, type: value })}
                                  placeholder="Select Type"
                                />
                              ) : (
                                selectedItem.type && <dd className="text-base text-foreground">{selectedItem.type}</dd>
                              )}
                            </div>
                            {/* Brand */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Brand:</dt>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.brand}
                                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  placeholder="Enter brand"
                                />
                              ) : (
                                selectedItem.brand && <dd className="text-base text-foreground">{selectedItem.brand}</dd>
                              )}
                            </div>
                            {/* Price */}
                            {(isEditing || formatPrice(selectedItem.price)) && (
                              <div className="flex flex-col">
                                <dt className="text-sm font-semibold text-muted-foreground">Price:</dt>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Enter price"
                                  />
                                ) : (
                                  <dd className="text-base text-foreground">{formatPrice(selectedItem.price)}</dd>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Notes Section - Always present as a box, content changes based on selectedItem.notes */}
                          <div className="border border-border rounded-md p-4 mt-4 bg-secondary/10">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes:</h4>
                            {isEditing ? (
                              <div className="flex flex-col">
                                <textarea
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  placeholder="Add notes"
                                  rows={3}
                                  maxLength={100}
                                />
                                <p className="text-right text-xs text-muted-foreground mt-1">
                                  {editForm.notes.length}/100
                                </p>
                              </div>
                            ) : (
                              selectedItem.notes ? (
                                <p className="text-base text-foreground whitespace-pre-wrap break-words overflow-hidden overflow-ellipsis break-all max-w-full">
                                  {selectedItem.notes}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No notes added.</p>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selectedTab === 'details' && (
                    <div className="space-y-4 pt-4">
                      <div className="grid gap-y-2 gap-x-4 sm:grid-cols-2">
                        {((selectedItem.occasion || selectedItem.style || selectedItem.fit || selectedItem.color || selectedItem.material || selectedItem.season) || isEditing) ? (
                          <>
                            {/* Occasion */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Occasion:</dt>
                              {isEditing ? (
                                <Dropdown
                                  options={["Casual", "Formal", "Party", "Athletic"]}
                                  value={editForm.occasion}
                                  onChange={(value) => setEditForm({ ...editForm, occasion: value })}
                                  placeholder="Select Occasion"
                                />
                              ) : (
                                selectedItem.occasion && <dd className="text-base text-foreground">{selectedItem.occasion}</dd>
                              )}
                            </div>
                            {/* Style */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Style:</dt>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.style}
                                  onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  placeholder="Enter style"
                                />
                              ) : (
                                selectedItem.style && <dd className="text-base text-foreground">{selectedItem.style}</dd>
                              )}
                            </div>
                            {/* Fit */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Fit:</dt>
                              {isEditing ? (
                                <Dropdown
                                  options={["Slim Fit", "Regular Fit", "Oversized Fit", "Crop Fit", "Skinny", "Tapered"]}
                                  value={editForm.fit}
                                  onChange={(value) => setEditForm({ ...editForm, fit: value })}
                                  placeholder="Select Fit"
                                />
                              ) : (
                                selectedItem.fit && <dd className="text-base text-foreground">{selectedItem.fit}</dd>
                              )}
                            </div>
                            {/* Color */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Color:</dt>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.color}
                                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  placeholder="Enter color"
                                />
                              ) : (
                                selectedItem.color && <dd className="text-base text-foreground">{selectedItem.color}</dd>
                              )}
                            </div>
                            {/* Material */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Material:</dt>
                              {isEditing ? (
                                <Dropdown
                                  options={["Cotton", "Linen", "Denim", "Leather", "Knit", "Polyester"]}
                                  value={editForm.material}
                                  onChange={(value) => setEditForm({ ...editForm, material: value })}
                                  placeholder="Select Material"
                                />
                              ) : (
                                selectedItem.material && <dd className="text-base text-foreground">{selectedItem.material}</dd>
                              )}
                            </div>
                            {/* Season */}
                            <div className="flex flex-col">
                              <dt className="text-sm font-semibold text-muted-foreground">Season:</dt>
                              {isEditing ? (
                                <Dropdown
                                  options={["Spring", "Summer", "Fall", "Winter"]}
                                  value={editForm.season}
                                  onChange={(value) => setEditForm({ ...editForm, season: value })}
                                  placeholder="Select Season"
                                />
                              ) : (
                                selectedItem.season && <dd className="text-base text-foreground">{selectedItem.season}</dd>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-full text-center text-muted-foreground">
                            Click Edit to fill this Section Out!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(false);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit();
                        }}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedItem.mode === "wishlist" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToCloset(selectedItem);
                          }}
                          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        >
                          Move to Closet
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setEditForm({
                            name: selectedItem.name,
                            type: selectedItem.type,
                            brand: selectedItem.brand,
                            price: selectedItem.price?.toString() || "",
                            occasion: selectedItem.occasion || "",
                            style: selectedItem.style || "",
                            fit: selectedItem.fit || "",
                            color: selectedItem.color || "",
                            material: selectedItem.material || "",
                            season: selectedItem.season || "",
                            notes: selectedItem.notes || "",
                            sourceUrl: selectedItem.sourceUrl || "",
                          });
                          setSelectedTab('general');
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(selectedItem.key);
                        }}
                        className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
})

export default ClothingGallery;
export type ViewMode = "closet" | "wishlist"; 