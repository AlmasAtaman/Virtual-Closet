"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClothingItem } from "../types/clothing";
import { FilterIcon } from "./icons/FilterIcon";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { ColorSwatches } from "./icons/ColorSwatches";
import { CustomCheckbox } from "./CustomCheckbox";
import { SUBCATEGORIES } from "../constants/clothing";

export type Clothing = ClothingItem;

export type FilterAttribute = {
  key: string;
  label: string;
};

type FilterSectionProps = {
  clothingItems: Clothing[];
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  filterAttributes: FilterAttribute[];
  uniqueAttributeValues: Record<string, string[]>;
  priceSort: "none" | "asc" | "desc";
  setPriceSort: (mode: "none" | "asc" | "desc") => void;
  priceRange: [number | null, number | null];
  setPriceRange: React.Dispatch<React.SetStateAction<[number | null, number | null]>>;
  showFavoritesOnly?: boolean;
  setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
};

// Main clothing categories shown by default
const MAIN_CLOTHING_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Bags",
  "Jumpsuits",
  "Underwear",
];

// Season options as per design
const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

// Color options with their swatch components
const COLOR_OPTIONS = [
  { name: "Beige", component: ColorSwatches.Beige },
  { name: "Black", component: ColorSwatches.Black },
  { name: "Blue", component: ColorSwatches.Blue },
  { name: "Brown", component: ColorSwatches.Brown },
  { name: "Green", component: ColorSwatches.Green },
  { name: "Grey", component: ColorSwatches.Grey },
  { name: "Orange", component: ColorSwatches.Orange },
  { name: "Pink", component: ColorSwatches.Pink },
  { name: "Purple", component: ColorSwatches.Purple },
  { name: "Red", component: ColorSwatches.Red },
  { name: "Silver", component: ColorSwatches.Silver },
  { name: "Tan", component: ColorSwatches.Tan },
  { name: "White", component: ColorSwatches.White },
  { name: "Yellow", component: ColorSwatches.Yellow },
];

const FilterSection: React.FC<FilterSectionProps> = ({
  clothingItems,
  selectedTags,
  setSelectedTags,
  // filterAttributes,
  // uniqueAttributeValues,
  priceSort,
  setPriceSort,
  priceRange,
  // setPriceRange,
  showFavoritesOnly = false,
  setShowFavoritesOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [clothingTypeSearch, setClothingTypeSearch] = useState("");

  // Extract unique tags from actual clothing items
  const actualTags = Array.from(new Set(
    clothingItems.flatMap(item => item.tags || [])
  )).filter(tag => tag && tag.trim() !== '').sort();

  // Extract unique clothing types (subcategories) from actual clothing items
  const userClothingTypes = Array.from(new Set(
    clothingItems.map(item => item.type?.toLowerCase()).filter(type => type && type.trim() !== '')
  )).sort();

  // Track which sections are expanded - all open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: true,
    clothingType: true,
    color: true,
    season: true,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeFiltersCount = (
    selectedTags.length +
    (priceSort !== "none" ? 1 : 0) +
    (priceRange[0] !== null || priceRange[1] !== null ? 1 : 0) +
    (showFavoritesOnly ? 1 : 0)
  );

  // Filter clothing types based on search
  // When search is empty: show main categories
  // When searching: search through user's actual clothing types, matching only types that START with the search term
  const filteredClothingTypes = clothingTypeSearch.trim()
    ? userClothingTypes.filter((type) =>
        type.toLowerCase().startsWith(clothingTypeSearch.toLowerCase())
      )
    : MAIN_CLOTHING_CATEGORIES;

  // Get selected items for each category
  const getSelectedSort = () => {
    const selected = [];
    if (showFavoritesOnly) selected.push("Favorites");
    if (priceSort === "asc") selected.push("Price: Low To High");
    if (priceSort === "desc") selected.push("Price: High To Low");
    return selected;
  };

  const getSelectedClothingTypes = () => {
    return MAIN_CLOTHING_CATEGORIES.filter(type => selectedTags.includes(type.toLowerCase()));
  };

  const getSelectedColors = () => {
    return COLOR_OPTIONS.filter(color => selectedTags.includes(color.name.toLowerCase())).map(c => c.name);
  };

  const getSelectedSeasons = () => {
    return SEASONS.filter(season => selectedTags.includes(season.toLowerCase()));
  };

  // Helper to format selection summary
  const formatSelectionSummary = (items: string[]) => {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]}, ${items[1]}`;
    return `${items[0]}, ${items[1]}, +${items.length - 2}`;
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="relative p-2 hover:bg-gray-100 transition-colors"
      >
        <FilterIcon size={20} />
      </Button>

      {/* Filter Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar - Much Wider for Aritzia style */}
            <motion.div
              ref={filterRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-[450px] bg-background dark:bg-gray-900 shadow-2xl z-[70] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b-2 border-gray-300 dark:border-slate-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activeFiltersCount === 0 ? "No Filters Selected" : `${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''} Selected`}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 underline"
                >
                  Done
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {/* Sort Section */}
                <div className="border-b-2 border-gray-300 dark:border-slate-600">
                  <button
                    onClick={() => toggleSection("sort")}
                    className="w-full flex items-center justify-between px-8"
                    style={{
                      paddingTop: '1.5rem',
                      paddingBottom: '1.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="text-sm font-normal text-gray-900 dark:text-white">Sort</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getSelectedSort().length > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatSelectionSummary(getSelectedSort())}
                        </span>
                      )}
                      <ChevronDownIcon
                        size={18}
                        className={`transition-transform duration-200 ${openSections.sort ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openSections.sort && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-visible"
                      >
                        <div className="space-y-4 px-8 pb-5">
                          {/* Favorites Option */}
                          <label
                            className="flex items-center gap-3 cursor-pointer group w-full"
                            onClick={() => setShowFavoritesOnly?.(!showFavoritesOnly)}
                          >
                            <CustomCheckbox
                              checked={showFavoritesOnly}
                              onCheckedChange={(checked) => setShowFavoritesOnly?.(checked)}
                              className="w-[18px] h-[18px] rounded-[4px] border-2 border-gray-400 flex-shrink-0"
                              style={{
                                minWidth: '18px',
                                minHeight: '18px',
                                backgroundColor: showFavoritesOnly ? '#000' : '#fff',
                                borderColor: showFavoritesOnly ? '#000' : '#9ca3af',
                              }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Favorites</span>
                          </label>

                          {/* Price: Low to High */}
                          <label
                            className="flex items-center gap-3 cursor-pointer group w-full"
                            onClick={() => setPriceSort(priceSort === "asc" ? "none" : "asc")}
                          >
                            <CustomCheckbox
                              checked={priceSort === "asc"}
                              onCheckedChange={(checked) => setPriceSort(checked ? "asc" : "none")}
                              className="w-[18px] h-[18px] rounded-[4px] border-2 border-gray-400 flex-shrink-0"
                              style={{
                                minWidth: '18px',
                                minHeight: '18px',
                                backgroundColor: priceSort === "asc" ? '#000' : '#fff',
                                borderColor: priceSort === "asc" ? '#000' : '#9ca3af',
                              }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Price: Low To High</span>
                          </label>

                          {/* Price: High to Low */}
                          <label
                            className="flex items-center gap-3 cursor-pointer group w-full"
                            onClick={() => setPriceSort(priceSort === "desc" ? "none" : "desc")}
                          >
                            <CustomCheckbox
                              checked={priceSort === "desc"}
                              onCheckedChange={(checked) => setPriceSort(checked ? "desc" : "none")}
                              className="w-[18px] h-[18px] rounded-[4px] border-2 border-gray-400 flex-shrink-0"
                              style={{
                                minWidth: '18px',
                                minHeight: '18px',
                                backgroundColor: priceSort === "desc" ? '#000' : '#fff',
                                borderColor: priceSort === "desc" ? '#000' : '#9ca3af',
                              }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Price: High To Low</span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clothing Type Section */}
                <div className="border-b-2 border-gray-300 dark:border-slate-600">
                  <button
                    onClick={() => toggleSection("clothingType")}
                    className="w-full flex items-center justify-between px-8"
                    style={{
                      paddingTop: '1.5rem',
                      paddingBottom: '1.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="text-sm font-normal text-gray-900 dark:text-white">Clothing Type</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getSelectedClothingTypes().length > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatSelectionSummary(getSelectedClothingTypes())}
                        </span>
                      )}
                      <ChevronDownIcon
                        size={18}
                        className={`transition-transform duration-200 ${openSections.clothingType ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openSections.clothingType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-visible"
                      >
                        <div className="space-y-4 px-8 pb-5">
                          {/* Search Input */}
                          <div className="mb-4">
                            <div className="relative">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search"
                                value={clothingTypeSearch}
                                onChange={(e) => setClothingTypeSearch(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && clothingTypeSearch.trim()) {
                                    // Apply the search term as a filter tag
                                    const searchTerm = clothingTypeSearch.trim().toLowerCase();
                                    if (!selectedTags.includes(searchTerm)) {
                                      toggleTag(searchTerm);
                                    }
                                    setClothingTypeSearch('');
                                  }
                                }}
                                className="pl-10 h-10 text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">
                              Press Enter to find specific label
                            </p>
                          </div>

                          {/* Clothing Type Checkboxes */}
                          {filteredClothingTypes.map((type) => {
                            // Normalize the tag for comparison (actual tags are already lowercase)
                            const normalizedType = type.toLowerCase();
                            const isChecked = selectedTags.includes(normalizedType);
                            return (
                              <label
                                key={type}
                                className="flex items-center gap-3 cursor-pointer group w-full"
                                onClick={() => toggleTag(normalizedType)}
                              >
                                <CustomCheckbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleTag(normalizedType)}
                                  className="w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0"
                                  style={{
                                    minWidth: '18px',
                                    minHeight: '18px',
                                    backgroundColor: isChecked ? '#000' : '#fff',
                                    borderColor: isChecked ? '#000' : '#9ca3af',
                                  }}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 capitalize">{type}</span>
                              </label>
                            );
                          })}
                          {filteredClothingTypes.length === 0 && (
                            <p className="text-sm text-gray-500 py-2">No results found</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Color Section */}
                <div className="border-b-2 border-gray-300 dark:border-slate-600">
                  <button
                    onClick={() => toggleSection("color")}
                    className="w-full flex items-center justify-between px-8"
                    style={{
                      paddingTop: '1.5rem',
                      paddingBottom: '1.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="text-sm font-normal text-gray-900 dark:text-white">Color</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getSelectedColors().length > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatSelectionSummary(getSelectedColors())}
                        </span>
                      )}
                      <ChevronDownIcon
                        size={18}
                        className={`transition-transform duration-200 ${openSections.color ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openSections.color && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-visible"
                      >
                        <div className="space-y-4 px-8 pb-5">
                          {COLOR_OPTIONS.map((color) => {
                            const SwatchComponent = color.component;
                            const isChecked = selectedTags.includes(color.name.toLowerCase());
                            return (
                              <label
                                key={color.name}
                                className="flex items-center gap-3 cursor-pointer group w-full"
                                onClick={() => toggleTag(color.name.toLowerCase())}
                              >
                                <CustomCheckbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleTag(color.name.toLowerCase())}
                                  className="w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0"
                                  style={{
                                    minWidth: '18px',
                                    minHeight: '18px',
                                    backgroundColor: isChecked ? '#000' : '#fff',
                                    borderColor: isChecked ? '#000' : '#9ca3af',
                                  }}
                                />
                                <SwatchComponent size={32} />
                                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{color.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Season Section */}
                <div>
                  <button
                    onClick={() => toggleSection("season")}
                    className="w-full flex items-center justify-between px-8"
                    style={{
                      paddingTop: '1.5rem',
                      paddingBottom: '1.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className="text-sm font-normal text-gray-900 dark:text-white">Season</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getSelectedSeasons().length > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatSelectionSummary(getSelectedSeasons())}
                        </span>
                      )}
                      <ChevronDownIcon
                        size={18}
                        className={`transition-transform duration-200 ${openSections.season ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openSections.season && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-visible"
                      >
                        <div className="space-y-4 px-8 pb-5">
                          {SEASONS.map((season) => {
                            const isChecked = selectedTags.includes(season.toLowerCase());
                            return (
                              <label
                                key={season}
                                className="flex items-center gap-3 cursor-pointer group w-full"
                                onClick={() => toggleTag(season.toLowerCase())}
                              >
                                <CustomCheckbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleTag(season.toLowerCase())}
                                  className="w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0"
                                  style={{
                                    minWidth: '18px',
                                    minHeight: '18px',
                                    backgroundColor: isChecked ? '#000' : '#fff',
                                    borderColor: isChecked ? '#000' : '#9ca3af',
                                  }}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{season}</span>
                              </label>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer with Done Button */}
              <div className="border-t-2 border-gray-300 dark:border-slate-600 p-8">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 py-4 rounded-sm text-sm font-medium"
                  style={{ backgroundColor: '#000', color: '#fff' }}
                >
                  View {activeFiltersCount > 0 ? 'Filtered' : 'All'} Items
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterSection;
