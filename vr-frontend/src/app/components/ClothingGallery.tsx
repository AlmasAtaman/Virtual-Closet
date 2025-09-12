"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MoveRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clothing, FilterAttribute } from "./FilterSection";
import ClothingCard from "./ClothingCard";
import ClothingDetailModal from "./ClothingDetailModal";
import type { ClothingItem } from "../types/clothing";
import { ConfirmDialog } from "@/components/ui/dialog";

// Type definitions for outfit-related API responses
interface OutfitUsageInfo {
  count: number;
  outfits: OutfitInfo[];
}

interface OutfitInfo {
  id: string;
  name?: string;
  clothingItems: Array<{
    id: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// Type for axios error responses
interface AxiosError {
  response?: {
    status: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type ClothingGalleryProps = {
  viewMode: "closet" | "wishlist";
  setViewMode: (mode: "closet" | "wishlist") => void;
  openUploadModal: () => void;
  searchQuery?: string;
  selectedTags: string[];
  priceSort: "none" | "asc" | "desc";
  setPriceSort: (mode: "none" | "asc" | "desc") => void;
  priceRange: [number | null, number | null];
  clothingItems: ClothingItem[];
  setClothingItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
  isMultiSelecting: boolean;
  setIsMultiSelecting: React.Dispatch<React.SetStateAction<boolean>>;
  showFavoritesOnly: boolean;
};

const ClothingGallery = forwardRef(
  ({ viewMode, openUploadModal, searchQuery = "", selectedTags, priceRange, clothingItems, setClothingItems, isMultiSelecting, setIsMultiSelecting, showFavoritesOnly, priceSort }: ClothingGalleryProps, ref ) => {

    // Create an axios instance with credentials (uses cookies automatically)
    const createAuthenticatedAxios = () => {
      return axios.create({
        withCredentials: true, // This will include cookies automatically for our unified auth
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      });
    };

    const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);
    const [outfitsUsingSelectedItems, setOutfitsUsingSelectedItems] = useState<OutfitUsageInfo>({count: 0, outfits: []});
    const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [clickedItemRect, setClickedItemRect] = useState<DOMRect | null>(null);
    const [outfitsUsingSingleItem, setOutfitsUsingSingleItem] = useState<OutfitUsageInfo>({count: 0, outfits: []});
    const [singleDeleteKey, setSingleDeleteKey] = useState<string | null>(null);

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

    // Configuration for cross-mode search and filtering
    const searchAcrossModes = false; // Set to true if you want to search across both closet and wishlist
    const filterAcrossModes = false; // Set to true if you want to filter across both closet and wishlist
    
    // Determine the items to search/filter based on searchAcrossModes and filterAcrossModes
    const baseItems =
      searchAcrossModes || filterAcrossModes ? clothingItems : clothingItems.filter((item) => item.mode === viewMode);

    const fetchImages = useCallback(async () => {
      setIsLoading(true);
      try {
        const authAxios = createAuthenticatedAxios();
        
        // If either checkbox is checked, fetch all items
        if (searchAcrossModes || filterAcrossModes) {
          const [closetRes, wishlistRes] = await Promise.all([
            authAxios.get(`/api/images?mode=closet`),
            authAxios.get(`/api/images?mode=wishlist`),
          ]);

          const allItems = [...(closetRes.data.clothingItems || []), ...(wishlistRes.data.clothingItems || [])];
          setClothingItems(allItems);
        } else {
          // Otherwise, fetch only items for current view mode
          const res = await authAxios.get(`/api/images?mode=${viewMode}`);
          setClothingItems(res.data.clothingItems || []);
        }
      } catch (err: unknown) {
        const axiosError = err as AxiosError;
        console.error("Error fetching images:", axiosError);
        // If 401, might need to redirect to login
        if (axiosError.response?.status === 401) {
        }
      } finally {
        setIsLoading(false);
      }
    }, [viewMode, setClothingItems, searchAcrossModes, filterAcrossModes]);

    const handleDelete = async (key: string) => {
      setShowSingleDeleteDialog(false);
      try {
        setIsDeleting(true);
        const authAxios = createAuthenticatedAxios();
        await authAxios.delete(`/api/images/${encodeURIComponent(key)}`);
        setClothingItems((prev) => prev.filter((item) => item.key !== key));
        setSelectedItemIds((prev) => prev.filter((id) => id !== key));
        setSelectedItem(null);
        setSingleDeleteKey(null);
      } catch (err) {
        console.error("Error deleting image:", err);
      } finally {
        setIsDeleting(false);
      }
    };

    const handleDeleteClick = async (item: ClothingItem) => {
      // Fetch outfits using this single item
      const result = await fetchOutfitUsingSingleItem([item.id]);
      setOutfitsUsingSingleItem(result);
      setSingleDeleteKey(item.key);
      setShowSingleDeleteDialog(true);
    };

    const fetchOutfitUsingSingleItem = async (itemIds: string[]) => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits`, { credentials: "include" });
        if (!res.ok) return { count: 0, outfits: [] };
        const data = await res.json();
        const outfits = data.outfits || [];
        // Find outfits that contain the specific item
        const usedIn = outfits.filter((outfit: OutfitInfo) =>
          Array.isArray(outfit.clothingItems) && outfit.clothingItems.some((ci) => itemIds.includes(ci.id))
        );
        return { count: usedIn.length, outfits: usedIn };
      } catch {
        return { count: 0, outfits: [] };
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

        await createAuthenticatedAxios().patch(
          "/api/images/update",
          { id: selectedItem.id, ...editForm, price: numericPrice }
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
        await createAuthenticatedAxios().patch(
          `/api/images/move-to-closet/${item.id}`,
          {}
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits`, { credentials: "include" });
        if (!res.ok) return { count: 0, outfits: [] };
        const data = await res.json();
        const outfits = data.outfits || [];
        // Find outfits that contain any of the selected items
        const usedIn = outfits.filter((outfit: OutfitInfo) =>
          Array.isArray(outfit.clothingItems) && outfit.clothingItems.some((ci) => selectedIds.includes(ci.id))
        );
        return { count: usedIn.length, outfits: usedIn };
      } catch {
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
            createAuthenticatedAxios().delete(`/api/images/${encodeURIComponent(key)}`)
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
            createAuthenticatedAxios().patch(`/api/images/move-to-closet/${item.id}`, {})
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
          if (newItem.mode === viewMode) {
            setClothingItems((prevItems) => [...prevItems, newItem]);
          }
        },
      }),
      [viewMode, fetchImages, setClothingItems],
    );

    useEffect(() => {
      fetchImages();
    }, [fetchImages]);


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
        await createAuthenticatedAxios().patch(
          `/api/images/${id}/favorite`,
          { isFavorite }
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


    return (
      <div className="space-y-6 flex flex-col flex-1">

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
          <div className="flex flex-col min-h-[60vh] flex-1">
            <Card className="flex flex-col items-center justify-center py-12 px-4 h-full min-h-[60vh] flex-1">
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
          </div>
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
            onDelete={(key: string) => {
              const item = clothingItems.find(i => i.key === key);
              if (item) handleDeleteClick(item);
            }}
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