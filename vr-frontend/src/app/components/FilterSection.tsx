"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClothingItem } from "../types/clothing";

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
};

const FilterSection: React.FC<FilterSectionProps> = ({
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
      category: true,
      type: true,
      tags: true,
      advancedFilters: false,
    };
    filterAttributes
      .filter((attr) => attr.key !== "type" && attr.key !== "category" && attr.key !== "tags")
      .forEach((attr) => {
        initialOpenSections[attr.key as string] = true;
      });
    return initialOpenSections;
  });

  const advancedFilterAttributes = filterAttributes.filter((attr) => attr.key !== "type" && attr.key !== "category" && attr.key !== "tags");

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

  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setPriceSort("none");
    setPriceRange([null, null]);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : Number(value);
    setPriceRange(prev => type === 'min' ? [numValue, prev[1]] : [prev[0], numValue]);
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
        className="relative overflow-hidden group transition-all duration-300"
      >
        <Filter className="w-5 h-5" />
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
                <h2 className="text-xl font-bold">Filter & Sort</h2>
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
                          <div className="p-4 space-y-4">
                            {/* Sort Options */}
                            {[{
                              value: "none", label: "Default"
                            },
                            {
                              value: "asc", label: "Price: Low to High"
                            },
                            {
                              value: "desc", label: "Price: High to Low"
                            }].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setPriceSort(priceSort === option.value ? "none" as const : option.value as "asc" | "desc")}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                  priceSort === option.value
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span className="font-medium">{option.label}</span>
                                {priceSort === option.value && (
                                  <span className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
                                )}
                              </button>
                            ))}

                            {/* Custom Price Range */}
                            <div className="space-y-2 pt-2 border-t">
                              <Label className="text-sm text-muted-foreground">Custom Price Range</Label>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange[0] ?? ''}
                                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                                    min="0"
                                    className="h-9"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange[1] ?? ''}
                                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                                    min="0"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Category Filter */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("category")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">CATEGORY</span>
                      <motion.div animate={{ rotate: openSections.category ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.category && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-3">
                            {uniqueAttributeValues.category?.map((value) => (
                              <label key={value} className="flex items-center gap-3 cursor-pointer select-none py-2 text-base font-medium">
                                <Checkbox
                                  checked={selectedTags.includes(value)}
                                  onCheckedChange={() => toggleTag(value)}
                                  className="border border-gray-400"
                                />
                                <span className="capitalize">{value}</span>
                              </label>
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
                      <span className="font-semibold text-sm tracking-wide">TYPE</span>
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
                          <div className="p-4 space-y-3">
                            {uniqueAttributeValues.type?.map((value) => (
                              <label key={value} className="flex items-center gap-3 cursor-pointer select-none py-2 text-base font-medium">
                                <Checkbox
                                  checked={selectedTags.includes(value)}
                                  onCheckedChange={() => toggleTag(value)}
                                  className="border border-gray-400"
                                />
                                <span className="capitalize">{value}</span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Style Tags Filter */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleSection("tags")}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-sm tracking-wide">STYLE TAGS</span>
                      <motion.div animate={{ rotate: openSections.tags ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openSections.tags && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-3">
                            {uniqueAttributeValues.tags?.map((value) => (
                              <label key={value} className="flex items-center gap-3 cursor-pointer select-none py-2 text-base font-medium">
                                <Checkbox
                                  checked={selectedTags.includes(value)}
                                  onCheckedChange={() => toggleTag(value)}
                                  className="border border-gray-400"
                                />
                                <span className="capitalize">{value}</span>
                              </label>
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
                      <span className="text-lg font-bold mb-2">ADVANCED FILTERS</span>
                      <motion.div animate={{ rotate: openSections.advancedFilters ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                          <div className="p-6 space-y-6">
                            {advancedFilterAttributes.map((attribute) => {
                              const uniqueValues = uniqueAttributeValues[attribute.key];
                              if (uniqueValues.length === 0) return null;
                              return (
                                <div key={attribute.key} className="space-y-3">
                                  <h4 className="text-base font-semibold mb-1 text-muted-foreground uppercase tracking-wide">
                                    {attribute.label}
                                  </h4>
                                  <div className="space-y-3">
                                    {uniqueValues.map((value) => (
                                      <label key={value} className="flex items-center gap-3 cursor-pointer select-none py-2 text-base font-medium">
                                        <Checkbox
                                          checked={selectedTags.includes(value)}
                                          onCheckedChange={() => toggleTag(value)}
                                          className="border border-gray-400"
                                        />
                                        <span>{value}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
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