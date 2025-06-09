"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

type FilterAttribute = {
  key: keyof Clothing;
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
};

const FilterSection: React.FC<FilterSectionProps> = ({
  clothingItems,
  selectedTags,
  setSelectedTags,
  filterAttributes,
  uniqueAttributeValues,
  priceSort,
  setPriceSort,
  priceRange,
  setPriceRange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialOpenSections: Record<string, boolean> = {
      priceSort: true,
      priceRange: true,
      type: true,
      advancedFilters: false,
    };
    // Initialize all advanced filter sub-sections to be open by default
    filterAttributes.filter(attr => attr.key !== 'type').forEach(attr => {
      initialOpenSections[attr.key as string] = true;
    });
    return initialOpenSections;
  });

  // Filter out 'type' from filterAttributes for advanced filters section
  const advancedFilterAttributes = filterAttributes.filter(attr => attr.key !== 'type');

  useEffect(() => {
    console.log("uniqueAttributeValues:", uniqueAttributeValues);
    console.log("advancedFilterAttributes:", advancedFilterAttributes);
  }, [uniqueAttributeValues, advancedFilterAttributes]);

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const priceRanges = [
    { label: "Under $10", range: [0, 10] },
    { label: "$10 - $20", range: [10, 20] },
    { label: "$20 - $40", range: [20, 40] },
    { label: "$40 - $60", range: [40, 60] },
    { label: "$60 - $100", range: [60, 100] },
    { label: "Over $100", range: [100, Infinity] }
  ];

  const seasonOptions = [
    { label: 'Spring', icon: '🌸' },
    { label: 'Summer', icon: '☀️' },
    { label: 'Fall', icon: '🍂' },
    { label: 'Winter', icon: '❄️' },
  ];

  const getIcon = (key: keyof Clothing, value: string) => {
    switch (key) {
      case 'type':
        switch (value) {
          case 'T-shirt': return '👕';
          case 'Jacket': return '🧥';
          case 'Pants': return '👖';
          case 'Shoes': return '👟';
          case 'Hat': return '🧢';
          case 'Sweater': return '🧶';
          case 'Shorts': return '🩳';
          case 'Dress': return '👗';
          case 'Skirt': return ' skirt';
          default: return '👚';
        }
      case 'occasion':
        switch (value) {
          case 'Casual': return '😎';
          case 'Formal': return '🤵';
          case 'Party': return '🥳';
          case 'Athletic': return '🏃';
          default: return '✨';
        }
      case 'fit':
        switch (value) {
          case 'Slim Fit': return '📏';
          case 'Regular Fit': return '👕';
          case 'Oversized Fit': return ' 🐘';
          case 'Crop Fit': return '✂️';
          case 'Skinny': return '👖';
          case 'Tapered': return ' 🔻';
          default: return '📐';
        }
      case 'material':
        switch (value) {
          case 'Cotton': return '☁️';
          case 'Linen': return '🎋';
          case 'Denim': return '👖';
          case 'Leather': return '🐄';
          case 'Knit': return '🧶';
          case 'Polyester': return '♻️';
          default: return '🧵';
        }
      case 'season':
        switch (value) {
          case 'Spring': return '🌸';
          case 'Summer': return '☀️';
          case 'Fall': return '🍂';
          case 'Winter': return '❄️';
          default: return '📅';
        }
      default: return '🏷️';
    }
  };

  const mapColorToCss = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      black: "#000000",
      white: "#FFFFFF",
      red: "#EF4444",
      blue: "#3B82F6",
      green: "#22C55E",
      yellow: "#EAB308",
      purple: "#A855F7",
      orange: "#F97316",
      pink: "#EC4899",
      gray: "#6B7280",
      brown: "#8B4513",
      cyan: "#06B6D4",
      teal: "#14B8A6",
      maroon: "#800000",
      silver: "#C0C0C0",
      gold: "#FFD700",
    };
    return colorMap[colorName.toLowerCase()] || colorName.toLowerCase(); 
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

  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setPriceSort("none");
    setPriceRange([null, null]);

    // Also reset advanced filter sections to be open by default on clear
    setOpenSections(() => {
      const initialOpenSections: Record<string, boolean> = {
        priceSort: true,
        priceRange: true,
        type: true,
        advancedFilters: false,
      };
      filterAttributes.filter(attr => attr.key !== 'type').forEach(attr => {
        initialOpenSections[attr.key as string] = true;
      });
      return initialOpenSections;
    });
  };

  const handleApplyFilters = () => {
    setIsOpen(false);
    // The filtering logic is already applied in ClothingGallery based on selectedTags, priceSort, priceRange
  };

  return (
    <div className="relative">
      {/* Filter Button (always visible) */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span>🔍</span>
        <span>Filter & Sort</span>
      </button>

      {/* Selected Tags (collapsed state) */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {selectedTags.map((tag) => {
            let attributeKey: keyof Clothing | undefined;
            for (const attr of filterAttributes) {
              if (uniqueAttributeValues[attr.key]?.includes(tag)) {
                attributeKey = attr.key;
                break;
              }
            }
            return (
              <div
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {/* {attributeKey && <span className="mr-1">{getIcon(attributeKey, tag)}</span>} */}
                <span>{tag}</span>
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card shadow-lg z-50 flex flex-col"
            ref={filterRef}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filter & Sort</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllFilters}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* Price Sorting */}
              <div className="border-b pb-4 last:border-b-0">
                <button
                  onClick={() => toggleSection('priceSort')}
                  className="flex items-center justify-between w-full py-2 text-md font-medium"
                >
                  <span>SORT BY</span>
                  <span>{openSections.priceSort ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {openSections.priceSort && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1 mt-2">
                        {[
                          { value: "none", label: "None" },
                          { value: "asc", label: "Price (low - high)" },
                          { value: "desc", label: "Price (high - low)" },
                        ].map((option) => (
                          <li key={option.value}>
                            <button
                              onClick={() => setPriceSort(option.value as "none" | "asc" | "desc")}
                              className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${priceSort === option.value ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center ${priceSort === option.value ? 'bg-blue-600 border-blue-600' : ''}`}>
                                  {priceSort === option.value && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span>{option.label}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range */}
              <div className="border-b pb-4 last:border-b-0">
                <button
                  onClick={() => toggleSection('priceRange')}
                  className="flex items-center justify-between w-full py-2 text-md font-medium"
                >
                  <span>PRICE RANGE</span>
                  <span>{openSections.priceRange ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {openSections.priceRange && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1 mt-2">
                        {priceRanges.map((range) => (
                          <li key={range.label}>
                            <button
                              onClick={() => {
                                if (priceRange[0] === range.range[0] && priceRange[1] === range.range[1]) {
                                  setPriceRange([null, null]);
                                } else {
                                  setPriceRange(range.range as [number, number]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${priceRange[0] === range.range[0] && priceRange[1] === range.range[1] ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center ${priceRange[0] === range.range[0] && priceRange[1] === range.range[1] ? 'bg-blue-600 border-blue-600' : ''}`}>
                                  {priceRange[0] === range.range[0] && priceRange[1] === range.range[1] && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span>{range.label}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Type Filter */}
              <div className="border-b pb-4 last:border-b-0">
                <button
                  onClick={() => toggleSection('type')}
                  className="flex items-center justify-between w-full py-2 text-md font-medium"
                >
                  <span>TYPE</span>
                  <span>{openSections.type ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {openSections.type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1 mt-2">
                        {uniqueAttributeValues.type?.map((value) => (
                          <li key={value}>
                            <button
                              onClick={() => toggleTag(value)}
                              className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${selectedTags.includes(value) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center ${selectedTags.includes(value) ? 'bg-blue-600 border-blue-600' : ''}`}>
                                  {selectedTags.includes(value) && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span>{value}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced Filters Section */}
              <div className="border-b pb-4 last:border-b-0">
                <button
                  onClick={() => toggleSection('advancedFilters')}
                  className="flex items-center justify-between w-full py-2 text-md font-medium"
                >
                  <span>ADVANCED FILTERS</span>
                  <span>{openSections.advancedFilters ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {openSections.advancedFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 mt-2">
                        {advancedFilterAttributes.map((attribute) => {
                          const uniqueValues = uniqueAttributeValues[attribute.key];
                          if (uniqueValues.length === 0) return null;

                          return (
                            <div key={attribute.key} className="border-b pb-4 last:border-b-0">
                              <button
                                onClick={() => toggleSection(attribute.key as string)}
                                className="flex items-center justify-between w-full py-2 text-md font-medium"
                              >
                                <span>{attribute.label.toUpperCase()}</span>
                                <span>{openSections[attribute.key as string] ? '▲' : '▼'}</span>
                              </button>
                              <AnimatePresence>
                                {openSections[attribute.key as string] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                  >
                                    {attribute.key === 'color' ? (
                                      <div className="grid grid-cols-5 gap-2 mt-2">
                                        {uniqueValues.map((value) => (
                                          <button
                                            key={value}
                                            onClick={() => toggleTag(value)}
                                            className={`w-8 h-8 rounded-full border ${selectedTags.includes(value) ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                                            style={{ backgroundColor: mapColorToCss(value), borderColor: value.toLowerCase() === 'white' ? '#ccc' : 'transparent' }}
                                            title={value}
                                          >
                                            {selectedTags.includes(value) && (
                                              <span className="text-white text-xs flex items-center justify-center h-full">✓</span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    ) : attribute.key === 'season' ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mt-2">
                                        {seasonOptions.map((option) => (
                                          <button
                                            key={option.label}
                                            onClick={() => toggleTag(option.label)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-md text-sm font-medium border aspect-square transition-colors ${selectedTags.includes(option.label) ? 'bg-blue-100 border-blue-600 shadow' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                          >
                                            <span className={`text-xl mb-1 ${selectedTags.includes(option.label) ? 'text-blue-800' : 'grayscale text-gray-700'}`}>{option.icon}</span>
                                            {selectedTags.includes(option.label) && <span className={`mt-1 ${selectedTags.includes(option.label) ? 'text-blue-800' : 'text-gray-700'}`}>✓</span>}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <ul className="space-y-1 mt-2">
                                        {uniqueValues.map((value) => (
                                          <li key={value}>
                                            <button
                                              onClick={() => toggleTag(value)}
                                              className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${selectedTags.includes(value) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                                            >
                                              <div className="flex items-center">
                                                <div className={`w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center ${selectedTags.includes(value) ? 'bg-blue-600 border-blue-600' : ''}`}>
                                                  {selectedTags.includes(value) && <span className="text-white text-xs">✓</span>}
                                                </div>
                                                <span>{value}</span>
                                              </div>
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                        {advancedFilterAttributes.every(attr => uniqueAttributeValues[attr.key]?.length === 0) && (
                          <p className="text-center text-muted-foreground text-sm py-4">
                            Must fill out advanced details on clothing in order to be able to have these options.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t flex justify-between gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Apply ({selectedTags.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterSection; 