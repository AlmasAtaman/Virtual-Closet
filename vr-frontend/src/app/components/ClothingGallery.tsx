"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, MoveRight, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clothing, FilterAttribute } from "./FilterSection";
import ClothingCard from "./ClothingCard";
import ClothingDetailModal from "./ClothingDetailModal";
import type { ClothingItem } from "../types/clothing";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";

type ClothingGalleryProps = {
  viewMode: "closet" | "wishlist";
  setViewMode: (mode: "closet" | "wishlist") => void;
  openUploadModal: () => void;
  searchQuery?: string;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  priceSort: "none" | "asc" | "desc";
  setPriceSort: (mode: "none" | "asc" | "desc") => void;
  priceRange: [number | null, number | null];
  clothingItems: ClothingItem[];
  setClothingItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
  isMultiSelecting: boolean;
  setIsMultiSelecting: React.Dispatch<React.SetStateAction<boolean>>;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
};


const ClothingGallery = forwardRef(
  ({ viewMode, setViewMode, openUploadModal, searchQuery = "", selectedTags, setSelectedTags, priceSort, setPriceSort, priceRange, clothingItems, setClothingItems, isMultiSelecting, setIsMultiSelecting, showFavoritesOnly, setShowFavoritesOnly,}: ClothingGalleryProps, ref ) => {
    const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [editForm, setEditForm] = useState({
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
    const [showFilters, setShowFilters] = useState(false);
    const [filterAcrossModes, setFilterAcrossModes] = useState(false);
    const [searchAcrossModes, setSearchAcrossModes] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [clickedItemRect, setClickedItemRect] = useState<DOMRect | null>(null);
    const [selectedTab, setSelectedTab] = useState<"general" | "details">("general");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);
    const [outfitsUsingSelectedItems, setOutfitsUsingSelectedItems] = useState<{count: number, outfits: any[]}>({count: 0, outfits: []});
    const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
    const [singleDeleteKey, setSingleDeleteKey] = useState<string | null>(null);
    const [outfitsUsingSingleItem, setOutfitsUsingSingleItem] = useState<{count: number, outfits: any[]}>({count: 0, outfits: []});

    // Define the filterable attributes
    const filterAttributes: FilterAttribute[] = [
      { key: "type", label: "Type" },
      { key: "occasion", label: "Occasion" },
      { key: "style", label: "Style" },
      { key: "fit", label: "Fit" },
      { key: "color", label: "Color" },
      { key: "material", label: "Material" },
      { key: "season", label: "Season" },
    ];

    // Helper function to safely convert price to number
    const getNumericPrice = (price: string | number | null | undefined): number | null => {
      if (price === null || price === undefined) return null;
      const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
      return isNaN(numPrice) ? null : numPrice;
    };

    // Calculate unique values for each attribute
    const uniqueAttributeValues: Record<string, string[]> = {};
    filterAttributes.forEach((attribute) => {
      uniqueAttributeValues[attribute.key] = Array.from(
        new Set(clothingItems.map((item) => item[attribute.key as keyof Clothing]).filter(Boolean)),
      ) as string[];
    });

    // Determine the items to search/filter based on searchAcrossModes and filterAcrossModes
    const baseItems =
      searchAcrossModes || filterAcrossModes ? clothingItems : clothingItems.filter((item) => item.mode === viewMode);

    const fetchImages = async () => {
      setIsLoading(true);
      try {
        // If either checkbox is checked, fetch all items
        if (searchAcrossModes || filterAcrossModes) {
          const [closetRes, wishlistRes] = await Promise.all([
            axios.get(`http://localhost:8000/api/images?mode=closet`, { withCredentials: true }),
            axios.get(`http://localhost:8000/api/images?mode=wishlist`, { withCredentials: true }),
          ]);

          const allItems = [...(closetRes.data.clothingItems || []), ...(wishlistRes.data.clothingItems || [])];
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
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async (key: string) => {
      setShowSingleDeleteDialog(false);
      try {
        setIsDeleting(true);
        await axios.delete(`http://localhost:8000/api/images/${encodeURIComponent(key)}`, {
          withCredentials: true,
        });
        setClothingItems((prev) => prev.filter((item) => item.key !== key));
        setSelectedItemIds((prev) => prev.filter((id) => id !== key));
        setSelectedItem(null);
      } catch (err) {
        console.error("Error deleting image:", err);
      } finally {
        setIsDeleting(false);
      }
    };

    const handleEdit = async () => {
      if (!selectedItem) return;

      const numericPrice = editForm.price !== "" ? Number.parseFloat(editForm.price) : undefined;

      const updated = {
        ...selectedItem,
        ...editForm,
        price: numericPrice,
      };
      try {
        console.log("Updating item with ID:", selectedItem.id, "with data:", editForm);

        await axios.patch(
          "http://localhost:8000/api/images/update",
          { id: selectedItem.id, ...editForm, price: numericPrice },
          { withCredentials: true },
        );

        setSelectedItem(updated);
        setClothingItems((prev) => prev.map((item) => (item.key === updated.key ? updated : item)));
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to update clothing item:", err);
        alert("Failed to save changes.");
      }
    };

    const handleMoveToCloset = async (item: Clothing) => {
      try {
        setIsMoving(true);
        const response = await axios.patch(
          `http://localhost:8000/api/images/move-to-closet/${item.id}`,
          {},
          { withCredentials: true },
        );

        // Remove the item from the current view
        setClothingItems((prev) => prev.filter((i) => i.id !== item.id));

        // Close the modal
        setSelectedItem(null);
      } catch (err) {
        console.error("Error moving item to closet:", err);
        alert("Failed to move item to closet");
      } finally {
        setIsMoving(false);
      }
    };

    // Fetch all outfits and count how many unique outfits contain any of the selected items
    const fetchOutfitsUsingSelectedItems = async (selectedIds: string[]) => {
      try {
        const res = await fetch("http://localhost:8000/api/outfits", { credentials: "include" });
        if (!res.ok) return { count: 0, outfits: [] };
        const data = await res.json();
        const outfits = data.outfits || [];
        // Find outfits that contain any of the selected items
        const usedIn = outfits.filter((outfit: any) =>
          Array.isArray(outfit.clothingItems) && outfit.clothingItems.some((ci: any) => selectedIds.includes(ci.id))
        );
        return { count: usedIn.length, outfits: usedIn };
      } catch (e) {
        return { count: 0, outfits: [] };
      }
    };

    const handleDeleteSelected = async () => {
      setShowMultiDeleteDialog(false);

      try {
        setIsDeleting(true);
        // Get the keys for the selected item IDs
        const itemsToDelete = clothingItems.filter((item) => selectedItemIds.includes(item.id));
        const keysToDelete = itemsToDelete.map((item) => item.key);

        // Send delete requests in parallel
        await Promise.all(
          keysToDelete.map((key) =>
            axios.delete(`http://localhost:8000/api/images/${encodeURIComponent(key)}`, { withCredentials: true }),
          ),
        );

        // Update frontend state
        setClothingItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)));
        setSelectedItemIds([]);
        setIsMultiSelecting(false); // Exit multi-select mode after deletion
      } catch (err) {
        console.error("Error deleting selected items:", err);
        alert("Failed to delete selected items.");
      } finally {
        setIsDeleting(false);
      }
    };

    const handleMoveSelectedToCloset = async () => {
      if (!confirm(`Are you sure you want to move ${selectedItemIds.length} item(s)?`)) {
        return;
      }

      try {
        setIsMoving(true);
        // Ensure we only attempt to move items currently displayed in the wishlist view
        const itemsToMove = clothingItems.filter(
          (item) => selectedItemIds.includes(item.id) && item.mode === "wishlist",
        );

        if (itemsToMove.length === 0) {
          alert("No wishlist items selected to move.");
          return;
        }

        // Send move requests in parallel
        await Promise.all(
          itemsToMove.map((item) =>
            axios.patch(`http://localhost:8000/api/images/move-to-closet/${item.id}`, {}, { withCredentials: true }),
          ),
        );

        // Update frontend state by removing moved items (from wishlist view)
        setClothingItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)));
        setSelectedItemIds([]);
        setIsMultiSelecting(false); // Exit multi-select mode after moving
      } catch (err) {
        console.error("Error moving selected items to closet:", err);
        alert("Failed to move selected items to closet.");
      } finally {
        setIsMoving(false);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        refresh: fetchImages,
        addClothingItem: (newItem: Clothing) => {
          console.log("ClothingGallery: addClothingItem called. newItem:", newItem, "current viewMode:", viewMode);
          if (newItem.mode === viewMode) {
            setClothingItems((prevItems) => [...prevItems, newItem]);
          }
        },
      }),
      [viewMode],
    );

    useEffect(() => {
      fetchImages();
    }, [viewMode, searchAcrossModes, filterAcrossModes]);

    const toggleTag = (tag: string) => {
      setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const fuse = new Fuse(baseItems, {
      keys: ["name", "type", "brand", "occasion", "style", "fit", "color", "material", "season"],
      threshold: 0.3,
    });

    const searchResults = searchQuery ? fuse.search(searchQuery).map((result) => result.item) : baseItems;

    const filteredItems = searchResults
      .filter((item) => {
        // Group selected tags by their attribute type
        const selectedTagsByCategory: Record<string, string[]> = {};
        selectedTags.forEach((tag) => {
          const attribute = filterAttributes.find((attr) => uniqueAttributeValues[attr.key]?.includes(tag));
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
            if (!itemValueForCategory || !selectedValuesInThisCategory.some((val) => val === itemValueForCategory)) {
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
      .filter((item) => {
        const itemPrice = getNumericPrice(item.price);
        // Exclude items with no valid price when price sorting is active
        if ((priceSort === "asc" || priceSort === "desc") && itemPrice === null) {
          return false;
        }
        return true;
      })
      .filter((item) => (showFavoritesOnly ? item.isFavorite : true))
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
      setIsMultiSelecting((prev) => !prev);
      if (isMultiSelecting) {
        setSelectedItemIds([]);
      }
    };

    const toggleItemSelection = (itemId: string) => {
      setSelectedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
    };

    // Toggle favorite handler
    const toggleFavorite = async (id: string, isFavorite: boolean) => {
      // Optimistically update UI
      setClothingItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isFavorite } : item
        )
      );
      try {
        await axios.patch(
          `http://localhost:8000/api/images/${id}/favorite`,
          { isFavorite },
          { withCredentials: true }
        );
        // No need to refetch, UI already updated
      } catch (err) {
        // Revert UI if error
        setClothingItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, isFavorite: !isFavorite } : item
          )
        );
        console.error("Failed to toggle favorite:", err);
      }
    };

    // Fetch outfits for a single item
    const fetchOutfitsUsingSingleItem = async (itemId: string) => {
      try {
        const res = await fetch("http://localhost:8000/api/outfits", { credentials: "include" });
        if (!res.ok) return { count: 0, outfits: [] };
        const data = await res.json();
        const outfits = data.outfits || [];
        const usedIn = outfits.filter((outfit: any) =>
          Array.isArray(outfit.clothingItems) && outfit.clothingItems.some((ci: any) => ci.id === itemId)
        );
        return { count: usedIn.length, outfits: usedIn };
      } catch (e) {
        return { count: 0, outfits: [] };
      }
    };

    return (
      <div className="space-y-6">

        {/* Multi-select Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMultiSelecting && selectedItemIds.length > 0 && (
              <span className="text-sm font-medium">{selectedItemIds.length} selected</span>
            )}
          </div>

          {isMultiSelecting && selectedItemIds.length > 0 && (
            <div className="flex gap-2">
              {viewMode === "wishlist" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMoveSelectedToCloset}
                  disabled={isMoving}
                  className="gap-2"
                >
                  {isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />}
                  Move to Closet
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  // Before showing dialog, fetch outfits using selected items
                  const result = await fetchOutfitsUsingSelectedItems(selectedItemIds);
                  setOutfitsUsingSelectedItems(result);
                  setShowMultiDeleteDialog(true);
                }}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
              <ConfirmDialog
                open={showMultiDeleteDialog}
                onOpenChange={setShowMultiDeleteDialog}
                title="Delete Selected Clothing Items"
                description={
                  outfitsUsingSelectedItems.count > 0
                    ? `${selectedItemIds.length} of the selected items are used in ${outfitsUsingSelectedItems.count} outfit${outfitsUsingSelectedItems.count > 1 ? 's' : ''}. Deleting them will leave empty spaces in those outfits. This action cannot be undone.`
                    : `Are you sure you want to delete ${selectedItemIds.length} item(s)? This action cannot be undone.`
                }
                onConfirm={handleDeleteSelected}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                confirmVariant="destructive"
              />
            </div>
          )}
        </div>

        {/* Clothing Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your wardrobe...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-4 rounded-full bg-muted p-6">
              <span className="text-4xl">👕</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">No items found</h3>
            <p className="text-center text-muted-foreground max-w-md mb-6">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your wardrobe is empty. Add some clothing items to get started."}
            </p>
            {viewMode === "closet" && !searchQuery && selectedTags.length === 0 && (
              <Button
                onClick={openUploadModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Item
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  layoutId={`clothing-card-${item.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  <ClothingCard
                    item={item}
                    onClick={(item, rect) => {
                      setClickedItemRect(rect);
                      setSelectedItem(item);
                      setEditForm({
                        name: item.name || "",
                        type: item.type || "",
                        brand: item.brand || "",
                        price: item.price?.toString() || "",
                        occasion: item.occasion || "",
                        style: item.style || "",
                        fit: item.fit || "",
                        color: item.color || "",
                        material: item.material || "",
                        season: item.season || "",
                        notes: item.notes || "",
                        sourceUrl: item.sourceUrl || "",
                      });
                      setIsEditing(false);
                    }}

                    isSelected={selectedItemIds.includes(item.id)}
                    isMultiSelecting={isMultiSelecting}
                    onToggleSelect={toggleItemSelection}
                    toggleFavorite={toggleFavorite}
                    viewMode={viewMode}
                    onDelete={async () => {
                      setSingleDeleteKey(item.key);
                      const result = await fetchOutfitsUsingSingleItem(item.id);
                      setOutfitsUsingSingleItem(result);
                      setShowSingleDeleteDialog(true);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <ClothingDetailModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => {
              setSelectedItem(null);
              setIsEditing(false);
              setClickedItemRect(null);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMoveToCloset={handleMoveToCloset}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            isDeleting={isDeleting}
            isMoving={isMoving}
            allItems={filteredItems}
            onToggleFavorite={toggleFavorite}
          />
        )}

        <ConfirmDialog
          open={showSingleDeleteDialog}
          onOpenChange={setShowSingleDeleteDialog}
          title="Delete Clothing Item"
          description={
            outfitsUsingSingleItem.count > 0
              ? `This item is used in ${outfitsUsingSingleItem.count} outfit${outfitsUsingSingleItem.count > 1 ? 's' : ''}. Deleting it will leave an empty space in those outfits. This action cannot be undone.`
              : "Are you sure you want to delete this item? This action cannot be undone."
          }
          onConfirm={() => singleDeleteKey && handleDelete(singleDeleteKey)}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="destructive"
        />

      </div>
    );
  },
);

ClothingGallery.displayName = "ClothingGallery";
export default ClothingGallery; 