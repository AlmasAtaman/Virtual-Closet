"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Fuse from "fuse.js";

type ClothingGalleryProps = {
  viewMode: "closet" | "wishlist";
  setViewMode: (mode: "closet" | "wishlist") => void;
};

type Clothing = {
  id: string;
  key: string;
  url: string;
  name: string;
  type: string;
  brand: string;
  occasion?: string;
  style?: string;
  fit?: string;
  color?: string;
  material?: string;
  season?: string;
  notes?: string;
  mode?: "closet" | "wishlist";
  sourceUrl?: string;
};

type EditFormFields = {
  name: string;
  type: string;
  brand: string;
  occasion: string;
  style: string;
  fit: string;
  color: string;
  material: string;
  season: string;
  notes: string;
  sourceUrl: string;
};

const ClothingGallery = forwardRef(({ viewMode, setViewMode }: ClothingGalleryProps, ref) => {
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
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Define the filterable attributes
  const filterAttributes = [
    { key: 'type', label: 'Type' },
    { key: 'occasion', label: 'Occasion' },
    { key: 'style', label: 'Style' },
    { key: 'fit', label: 'Fit' },
    { key: 'color', label: 'Color' },
    { key: 'material', label: 'Material' },
    { key: 'season', label: 'Season' },
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
    if (!confirm(`Are you sure you want to move ${selectedItemIds.length} item(s) to your closet?`)) {
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

  const filteredItems = searchResults.filter((item) => {
    if (selectedTags.length === 0) return true;
    const itemTags = [
      item.type,
      item.occasion,
      item.style,
      item.fit,
      item.color,
      item.material,
      item.season,
    ].filter(Boolean);
    return selectedTags.every((tag) => itemTags.includes(tag));
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

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${viewMode === "closet" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
          onClick={() => setViewMode("closet")}
        >
          My Closet
        </button>
        <button
          className={`px-4 py-2 rounded ${viewMode === "wishlist" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
          onClick={() => setViewMode("wishlist")}
        >
          Wishlist
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filter
        </button>
        <button
          className={`px-4 py-2 rounded ${isMultiSelecting ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
          onClick={toggleMultiSelect}
        >
          {isMultiSelecting ? 'Cancel Selection' : 'Select Multiple'}
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-2">Your {viewMode === "closet" ? "Closet" : "Wishlist"}</h2>
      {clothingItems.length === 0 && (
        <p className="text-gray-500 text-center col-span-full">Your {viewMode} is empty. Upload something!</p>
      )}
      {selectedTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm text-gray-800"
            >
              <span>{tag}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTag(tag);
                }}
                className="ml-2 text-red-500 font-bold focus:outline-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter Options Section */}
      {showFilters && (
        <div className="mb-4 p-4 border rounded bg-gray-800">
          <h3 className="text-lg font-semibold mb-2">Filter Options</h3>
          {
            filterAttributes.map(attribute => {
              const uniqueValues = uniqueAttributeValues[attribute.key];
              return renderAttributeFilters(attribute.key as keyof Clothing, attribute.label, uniqueValues);
            })
          }
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or tag..."
          value={searchQuery}
          onChange={(e) => {
            const input = e.target.value;
            setSearchQuery(input);

            if (autocompleteEnabled && input) {
              // Autocomplete suggestions based on searchableItems
              const results = new Fuse(baseItems, { keys: ["name"] }).search(input).map(r => r.item.name);
              const unique = [...new Set(results)].slice(0, 5); // top 5
              setSuggestions(unique);
            } else {
              setSuggestions([]);
            }
          }}
          className="w-full p-2 rounded border border-gray-300 text-white bg-gray-900 placeholder-gray-400"
        />
      </div>

      <div className="flex justify-between items-center mt-1 mb-2">
        <label className="flex items-center space-x-2 text-gray-400">
          <input
            type="checkbox"
            checked={autocompleteEnabled}
            onChange={(e) => setAutocompleteEnabled(e.target.checked)}
          />
          <span className="text-sm">Enable Autocomplete</span>
        </label>

        {/* New checkbox for searching across modes */}
        <label className="flex items-center space-x-2 text-gray-400">
          <input
            type="checkbox"
            checked={searchAcrossModes}
            onChange={(e) => setSearchAcrossModes(e.target.checked)}
          />
          <span className="text-sm">Search All Items</span>
        </label>

         {/* New checkbox for filtering across modes */}
        <label className="flex items-center space-x-2 text-gray-400">
          <input
            type="checkbox"
            checked={filterAcrossModes}
            onChange={(e) => setFilterAcrossModes(e.target.checked)}
          />
          <span className="text-sm">Filter All Items</span>
        </label>
      </div>

      {autocompleteEnabled && suggestions.length > 0 && (
        <ul className="mb-4 bg-white border border-gray-300 rounded shadow text-sm text-black max-h-40 overflow-y-auto">
          {suggestions.map((sug, i) => (
            <li
              key={i}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setSearchQuery(sug);
                setSuggestions([]);
              }}
            >
              {sug}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">No results found.</p>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.key || item.url || index}
              className={`border rounded p-3 shadow cursor-pointer ${
                isMultiSelecting && selectedItemIds.includes(item.id) ? 'border-blue-500 border-2' : ''
              }`}
              onClick={() => isMultiSelecting ? toggleItemSelection(item.id) : setSelectedItem(item)}
            >
              {item.url ? (
                <img src={item.url} alt={item.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}
              <p className="font-medium mt-2">{item.name}</p>
              <p className="text-sm text-gray-600">{item.type}</p>
              <p className="text-sm text-gray-600">{item.brand}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {[item.type]
                  .filter((tag): tag is string => Boolean(tag))
                  .map((tag) => (
                    <button
                      key={`${item.key}-${tag}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTag(tag);
                      }}
                      className={`text-xs px-2 py-1 rounded-full border ${
                        selectedTags.includes(tag)
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
              <div className="mt-2 flex gap-2">
                {viewMode === "wishlist" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToCloset(item);
                    }}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Move to Closet
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.key);
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {selectedItem && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 text-white"
            onClick={() => {
              setSelectedItem(null);
              setIsEditing(false);
            }}
          >
            <div
              className="relative bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Arrow */}
              {!isEditing && (
                <button
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 text-3xl px-4 text-white hover:text-gray-400 z-10"
                  onClick={() => {
                    const currentIndex = clothingItems.findIndex(item => item.key === selectedItem.key);
                    if (currentIndex > 0) setSelectedItem(clothingItems[currentIndex - 1]);
                  }}
                >
                  ❮
                </button>
              )}

              {/* Right Arrow */}
              {!isEditing && (
                <button
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-3xl px-4 text-white hover:text-gray-400 z-10"
                  onClick={() => {
                    const currentIndex = clothingItems.findIndex(item => item.key === selectedItem.key);
                    if (currentIndex < clothingItems.length - 1)
                      setSelectedItem(clothingItems[currentIndex + 1]);
                  }}
                >
                  ❯
                </button>
              )}

              {/* Image Section */}
              <div className="w-1/2 bg-gray-800 p-4 flex justify-center items-center border-r border-gray-700">
                <img src={selectedItem.url} alt={selectedItem.name} className="max-h-[400px] rounded-lg" />
              </div>

              {/* Info Section */}
              <div className="w-1/2 p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Type"
                    />
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Brand"
                    />
                    <input
                      type="text"
                      value={editForm.occasion}
                      onChange={(e) => setEditForm({ ...editForm, occasion: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Occasion"
                    />
                    <input
                      type="text"
                      value={editForm.style}
                      onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Style"
                    />
                    <input
                      type="text"
                      value={editForm.fit}
                      onChange={(e) => setEditForm({ ...editForm, fit: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Fit"
                    />
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Color"
                    />
                    <input
                      type="text"
                      value={editForm.material}
                      onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Material"
                    />
                    <input
                      type="text"
                      value={editForm.season}
                      onChange={(e) => setEditForm({ ...editForm, season: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Season"
                    />
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Notes"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={editForm.sourceUrl || ""}
                      onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                      placeholder="Source URL"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
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
                        }}
                        className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold mb-2">{selectedItem.name}</h2>
                    {selectedItem.sourceUrl && <p><strong>Source URL:</strong> <a href={selectedItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{selectedItem.sourceUrl}</a></p>}
                    <p><strong>Type:</strong> {selectedItem.type}</p>
                    <p><strong>Brand:</strong> {selectedItem.brand}</p>
                    {selectedItem.occasion && <p><strong>Occasion:</strong> {selectedItem.occasion}</p>}
                    {selectedItem.style && <p><strong>Style:</strong> {selectedItem.style}</p>}
                    {selectedItem.fit && <p><strong>Fit:</strong> {selectedItem.fit}</p>}
                    {selectedItem.color && <p><strong>Color:</strong> {selectedItem.color}</p>}
                    {selectedItem.material && <p><strong>Material:</strong> {selectedItem.material}</p>}
                    {selectedItem.season && <p><strong>Season:</strong> {selectedItem.season}</p>}
                    {selectedItem.notes && <p><strong>Notes:</strong> {selectedItem.notes}</p>}
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  {!isEditing && selectedItem.mode === 'wishlist' && (
                    <button
                      className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => handleMoveToCloset(selectedItem)}
                    >
                      Move to Closet
                    </button>
                  )}
                  <button
                    className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      setIsEditing(true);
                      setEditForm({
                        name: selectedItem.name,
                        type: selectedItem.type,
                        brand: selectedItem.brand,
                        occasion: selectedItem.occasion || "",
                        style: selectedItem.style || "",
                        fit: selectedItem.fit || "",
                        color: selectedItem.color || "",
                        material: selectedItem.material || "",
                        season: selectedItem.season || "",
                        notes: selectedItem.notes || "",
                        sourceUrl: selectedItem.sourceUrl || "",
                      });
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={async () => {
                      const confirmDelete = confirm("Are you sure you want to delete this item?");
                      if (!confirmDelete) return;
                      try {
                        await axios.delete(
                          `http://localhost:8000/api/images/${encodeURIComponent(selectedItem.key)}`,
                          { withCredentials: true }
                        );
                        setClothingItems((prev) => prev.filter((item) => item.key !== selectedItem.key));
                        setSelectedItem(null);
                      } catch (err) {
                        console.error("Error deleting item:", err);
                        alert("Failed to delete item.");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Action buttons for multiple selection */}
      {isMultiSelecting && selectedItemIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
          {viewMode === 'wishlist' && (
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700"
              onClick={handleMoveSelectedToCloset}
            >
              Move Selected to Closet ({selectedItemIds.length})
            </button>
          )}
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedItemIds.length})
          </button>
        </div>
      )}
    </div>
  );
})

export default ClothingGallery;
export type ViewMode = "closet" | "wishlist";
