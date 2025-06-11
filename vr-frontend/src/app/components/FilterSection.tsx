"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClothingItem } from "../types/clothing";

export type Clothing = ClothingItem;

export type FilterAttribute = {
  key: keyof ClothingItem;
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
    filterAttributes
      .filter((attr) => attr.key !== "type")
      .forEach((attr) => {
        initialOpenSections[attr.key as string] = true;
      });
    return initialOpenSections;
  });

  const advancedFilterAttributes = filterAttributes.filter((attr) => attr.key !== "type");

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const priceRanges = [
    { label: "Under $10", range: [0, 10], icon: "💸" },
    { label: "$10 - $20", range: [10, 20], icon: "💵" },
    { label: "$20 - $40", range: [20, 40], icon: "💴" },
    { label: "$40 - $60", range: [40, 60], icon: "💶" },
    { label: "$60 - $100", range: [60, 100], icon: "💷" },
    { label: "Over $100", range: [100, Number.POSITIVE_INFINITY], icon: "💎" },
  ];

  const seasonOptions = [
    { label: "Spring", icon: "🌸", color: "from-green-400 to-blue-400" },
    { label: "Summer", icon: "☀️", color: "from-yellow-400 to-orange-400" },
    { label: "Fall", icon: "🍂", color: "from-orange-400 to-red-400" },
    { label: "Winter", icon: "❄️", color: "from-blue-400 to-purple-400" },
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      "T-shirt": "👕",
      Jacket: "🧥",
      Pants: "👖",
      Shoes: "👟",
      Hat: "🧢",
      Sweater: "🧶",
      Shorts: "🩳",
      Dress: "👗",
      Skirt: "👗",
    };
    return icons[type] || "👚";
  };

  const mapColorToCss = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      black: "#1f2937",
      white: "#f9fafb",
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      yellow: "#eab308",
      purple: "#a855f7",
      orange: "#f97316",
      pink: "#ec4899",
      gray: "#6b7280",
      brown: "#8b4513",
      cyan: "#06b6d4",
      teal: "#14b8a6",
      maroon: "#800000",
      silver: "#c0c0c0",
      gold: "#ffd700",
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
  };

  const activeFiltersCount = (
    selectedTags.length +
    (priceSort !== "none" ? 1 : 0) +
    (priceRange[0] !== null || priceRange[1] !== null ? 1 : 0)
  );

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="relative overflow-hidden group transition-all duration-300 hover:shadow-md"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Filter className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
        <span className="font-medium">Filter & Sort</span>
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {activeFiltersCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Selected Tags */}
      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2 mt-4"
          >
            {selectedTags.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                transition={{ delay: index * 0.05 }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              ref={filterRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-background/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-l"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-background to-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Filter & Sort</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Sort Section */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("priceSort")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">SORT BY</span>
                      <motion.div animate={{ rotate: openSections.priceSort ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.priceSort && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-2">
                            {[{
                              value: "none", label: "Default", icon: "🔄" 
                            },
                            {
                              value: "asc", label: "Price: Low to High", icon: "📈" 
                            },
                            {
                              value: "desc", label: "Price: High to Low", icon: "📉" 
                            },
                            ].map((option) => (
                              <motion.button
                                key={option.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setPriceSort(option.value as "none" | "asc" | "desc")}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                  priceSort === option.value
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span className="text-lg">{option.icon}</span>
                                <span className="font-medium">{option.label}</span>
                                {priceSort === option.value && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-2 h-2 bg-primary-foreground rounded-full"
                                  />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Price Range Section */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("priceRange")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">PRICE RANGE</span>
                      <motion.div
                        animate={{ rotate: openSections.priceRange ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.priceRange && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-2">
                            {priceRanges.map((range, index) => (
                              <motion.button
                                key={range.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (priceRange[0] === range.range[0] && priceRange[1] === range.range[1]) {
                                    setPriceRange([null, null]);
                                  } else {
                                    setPriceRange(range.range as [number, number]);
                                  }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                  priceRange[0] === range.range[0] && priceRange[1] === range.range[1]
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span className="text-lg">{range.icon}</span>
                                <span className="font-medium">{range.label}</span>
                                {priceRange[0] === range.range[0] && priceRange[1] === range.range[1] && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-2 h-2 bg-primary-foreground rounded-full"
                                  />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Type Filter */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("type")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">CLOTHING TYPE</span>
                      <motion.div animate={{ rotate: openSections.type ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.type && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-2">
                            {uniqueAttributeValues.type?.map((value, index) => (
                              <motion.button
                                key={value}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleTag(value)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                  selectedTags.includes(value)
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span className="text-lg">{getTypeIcon(value)}</span>
                                <span className="font-medium">{value}</span>
                                {selectedTags.includes(value) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-2 h-2 bg-primary-foreground rounded-full"
                                  />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Advanced Filters */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("advancedFilters")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">ADVANCED FILTERS</span>
                      <motion.div
                        animate={{ rotate: openSections.advancedFilters ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.advancedFilters && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-4">
                            {advancedFilterAttributes.map((attribute) => {
                              const uniqueValues = uniqueAttributeValues[attribute.key];
                              if (uniqueValues.length === 0) return null;

                              return (
                                <div key={attribute.key} className="space-y-2">
                                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                    {attribute.label}
                                  </h4>

                                  {attribute.key === "color" ? (
                                    <div className="grid grid-cols-6 gap-2">
                                      {uniqueValues.map((value, index) => (
                                        <motion.button
                                          key={value}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: index * 0.05 }}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => toggleTag(value)}
                                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                            selectedTags.includes(value)
                                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                                              : "hover:scale-105"
                                          }`}
                                          style={{
                                            backgroundColor: mapColorToCss(value),
                                            borderColor: value.toLowerCase() === "white" ? "#e5e7eb" : "transparent",
                                          }}
                                          title={value}
                                        >
                                          {selectedTags.includes(value) && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                                            >
                                              ✓
                                            </motion.div>
                                          )}
                                        </motion.button>
                                      ))}
                                    </div>
                                  ) : attribute.key === "season" ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {seasonOptions.map((option, index) => (
                                        <motion.button
                                          key={option.label}
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: index * 0.1 }}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => toggleTag(option.label)}
                                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                                            selectedTags.includes(option.label)
                                              ? "border-primary bg-primary/10 shadow-md"
                                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                                          }`}
                                        >
                                          <span className="text-2xl mb-1">{option.icon}</span>
                                          <span className="text-xs font-medium">{option.label}</span>
                                          {selectedTags.includes(option.label) && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"
                                            />
                                          )}
                                        </motion.button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {uniqueValues.map((value, index) => (
                                        <motion.button
                                          key={value}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.05 }}
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => toggleTag(value)}
                                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                                            selectedTags.includes(value)
                                              ? "bg-primary text-primary-foreground shadow-md"
                                              : "hover:bg-muted"
                                          }`}
                                        >
                                          <span className="font-medium text-sm">{value}</span>
                                          {selectedTags.includes(value) && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="ml-auto w-2 h-2 bg-primary-foreground rounded-full"
                                            />
                                          )}
                                        </motion.button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {advancedFilterAttributes.every(
                              (attr) => uniqueAttributeValues[attr.key]?.length === 0,
                            ) && (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  Add advanced details to your clothing items to unlock more filtering options!
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="border-t bg-gradient-to-r from-background to-muted/20 p-6">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                  size="lg"
                >
                  <span className="font-medium">Apply Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground">
                      {activeFiltersCount}
                    </Badge>
                  )}
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