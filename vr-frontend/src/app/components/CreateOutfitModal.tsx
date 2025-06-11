"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Check, AlertTriangle, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ClothingItemSelectModal from './ClothingItemSelectModal';
import OutfitDetailsStep from './OutfitDetailsStep';

interface CreateOutfitModalProps {
    show: boolean;
    onCloseAction: () => void;
    // TODO: Add a prop to trigger outfit list refresh on parent page if needed
    onOutfitCreated: () => void;
}

// Define types for clothing items based on your schema
interface ClothingItem {
    id: string;
    name?: string;
    url: string; 
    type?: string; 
    mode: "closet" | "wishlist";
}

interface CategorizedClothing {
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    outerwear: ClothingItem[];
    shoes: ClothingItem[];
    // Add other categories if needed
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
    const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
    const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
    const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null);
    const [selectedShoe, setSelectedShoe] = useState<ClothingItem | null>(null);

    const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [], shoes: [] });
    const [loadingClothing, setLoadingClothing] = useState(true);
    const [showTopSelectModal, setShowTopSelectModal] = useState(false);
    const [showBottomSelectModal, setShowBottomSelectModal] = useState(false);
    const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false);
    const [showShoeSelectModal, setShowShoeSelectModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    const [showDetailsStep, setShowDetailsStep] = useState(false);
    const [createdOutfitId, setCreatedOutfitId] = useState<string | null>(null);
    const [createdOutfitItems, setCreatedOutfitItems] = useState<ClothingItem[]>([]);

    useEffect(() => {
        if (show) {
            fetchClothingItems();
        }
    }, [show]); // Fetch items when modal opens

    const fetchClothingItems = async () => {
        setLoadingClothing(true);
        try {
            const [closetRes, wishlistRes] = await Promise.all([
                fetch('http://localhost:8000/api/images?mode=closet', { credentials: 'include' }),
                fetch('http://localhost:8000/api/images?mode=wishlist', { credentials: 'include' }),
            ]);

            if (!closetRes.ok || !wishlistRes.ok) {
                throw new Error('Failed to fetch clothing items');
            }

            const [closetData, wishlistData] = await Promise.all([closetRes.json(), wishlistRes.json()]);

            const closetItems: ClothingItem[] = (closetData.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'closet' }));
            const wishlistItems: ClothingItem[] = (wishlistData.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'wishlist' }));
            const allItems = [...closetItems, ...wishlistItems];

            const categorized = allItems.reduce<CategorizedClothing>((acc, item) => {
                if (item.type) {
                    const lowerCaseType = item.type.toLowerCase();
                    if (['t-shirt', 'dress', 'shirt', 'blouse'].includes(lowerCaseType)) {
                        acc.tops.push(item);
                    } else if (['pants', 'skirt', 'shorts', 'jeans', 'leggings'].includes(lowerCaseType)) {
                        acc.bottoms.push(item);
                    } else if (['jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(lowerCaseType)) {
                        acc.outerwear.push(item);
                    } else if (['shoes'].includes(lowerCaseType)) {
                        acc.shoes.push(item);
                    } else {
                        console.warn(`Unknown clothing type: ${item.type}`);
                    }
                }
                return acc;
            }, { tops: [], bottoms: [], outerwear: [], shoes: [] });

            setClothingItems(categorized);
        } catch (error) {
            console.error('Failed to fetch clothing items:', error);
        } finally {
            setLoadingClothing(false);
        }
    };

    const isFormValid = () => {
        return (
            selectedTop !== null &&
            selectedTop.id !== 'none' &&
            selectedBottom !== null &&
            selectedBottom.id !== 'none'
        );
    };

    const hasWishlistItems = () => {
        return [selectedTop, selectedBottom, selectedOuterwear, selectedShoe].some((item) => item && item.mode === 'wishlist');
    };

    const handleCreateOutfit = async () => {
        if (!isFormValid()) {
            alert('Please select at least a top and a bottom.');
            return;
        }
        setIsCreating(true);
        try {
            const selectedItems = [selectedTop, selectedBottom, selectedOuterwear, selectedShoe].filter(
                Boolean,
            ) as ClothingItem[];
            const newOutfitData = {
                clothingItems: selectedItems.map((item) => item.id),
            };

            const res = await fetch('http://localhost:8000/api/outfits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOutfitData),
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    `Failed to create outfit: ${res.status} ${res.statusText} - ${errorData.message || 'Unknown error'}`,
                );
            }

            const createdOutfit = await res.json();
            console.log('Outfit created successfully:', createdOutfit);

            // Store the created outfit info and show details step
            setCreatedOutfitId(createdOutfit.outfit?.id || createdOutfit.id);
            setCreatedOutfitItems(selectedItems);
            setShowDetailsStep(true);
        } catch (error: any) {
            console.error('Error creating outfit:', error);
            alert(`Error creating outfit: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDetailsComplete = () => {
        handleCloseModal();
        onOutfitCreated();
    };

    const handleDetailsSkip = () => {
        handleCloseModal();
        onOutfitCreated();
    };

    const handleCloseModal = () => {
        // Reset form state - only reset clothing selections
        setSelectedTop(null);
        setSelectedBottom(null);
        setSelectedOuterwear(null);
        setSelectedShoe(null);
        // Reset modal visibility states
        setShowTopSelectModal(false);
        setShowBottomSelectModal(false);
        setShowOuterwearSelectModal(false);
        setShowShoeSelectModal(false);
        // Reset details step state
        setShowDetailsStep(false);
        setCreatedOutfitId(null);
        setCreatedOutfitItems([]);
        setAnimationKey(0);
        onCloseAction(); // Call the original onCloseAction prop
    };

    const getRandomItem = <T,>(arr: T[]): T | null => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    const handleRandomize = () => {
        // Always randomize from both closet and wishlist
        const sources: ('closet' | 'wishlist')[] = ['closet', 'wishlist'];

        const filterBySource = (items: ClothingItem[]): ClothingItem[] => items.filter((item: ClothingItem) => sources.includes(item.mode));
        const tops = filterBySource(clothingItems.tops);
        const bottoms = filterBySource(clothingItems.bottoms);
        const outerwear = filterBySource(clothingItems.outerwear);
        const shoes = filterBySource(clothingItems.shoes);

        setSelectedTop(getRandomItem(tops));
        setSelectedBottom(getRandomItem(bottoms));
        setSelectedOuterwear(getRandomItem(outerwear));
        setSelectedShoe(getRandomItem(shoes));

        // Trigger animation
        setAnimationKey((prev) => prev + 1);
    };

    if (!show) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleCloseModal}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Outfit</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                onClick={handleRandomize}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Shuffle className="w-4 h-4 mr-2" />
                                Randomize
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Outfit Builder - Vertical Stack Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Side - Outfit Preview */}
                            <div className="order-2 lg:order-1">
                                <Card className="h-[500px]">
                                    <CardContent className="h-full p-6">
                                        <div className="h-full relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
                                            {/* Outfit Preview - Same layout as OutfitCard */}
                                            <motion.div
                                                key={animationKey}
                                                className="relative w-44 h-80 mx-auto"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {/* Bottom (pants) */}
                                                {selectedBottom && (
                                                    <motion.img
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                        src={selectedBottom.url}
                                                        alt="Bottom"
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 z-10"
                                                    />
                                                )}

                                                {/* Top (shirt) */}
                                                {selectedTop && (
                                                    <motion.img
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.2 }}
                                                        src={selectedTop.url}
                                                        alt="Top"
                                                        className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-36 z-20"
                                                    />
                                                )}

                                                {/* Outerwear */}
                                                {selectedOuterwear && (
                                                    <motion.img
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        src={selectedOuterwear.url}
                                                        alt="Outerwear"
                                                        className="absolute bottom-[9rem] left-[40%] w-[8rem] z-5"
                                                    />
                                                )}

                                                {/* Shoe */}
                                                {selectedShoe && (
                                                    <motion.img
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        src={selectedShoe.url}
                                                        alt="Shoe"
                                                        className="absolute bottom-[9rem] left-[60%] w-[8rem] z-5"
                                                    />
                                                )}

                                                {/* Empty state */}
                                                {!selectedTop && !selectedBottom && !selectedOuterwear && !selectedShoe && (
                                                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                                                        <div className="text-center">
                                                            <p className="text-lg font-semibold mb-2">No items selected</p>
                                                            <p className="text-sm">Select items to preview</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Side - Item Selection */}
                            <div className="order-1 lg:order-2 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Your Pieces</h3>

                                {/* Outerwear Selection */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all duration-300 ${
                                            selectedOuterwear
                                                ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20"
                                                : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                        }`}
                                        onClick={() => setShowOuterwearSelectModal(true)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    {selectedOuterwear ? (
                                                        <img
                                                            src={selectedOuterwear.url || "/placeholder.svg"}
                                                            alt={selectedOuterwear.name || "Outerwear"}
                                                            className="w-full h-full object-contain rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl text-slate-400">🧥</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                                        {selectedOuterwear ? selectedOuterwear.name || "Selected Outerwear" : "Outerwear"}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {selectedOuterwear ? "Click to change" : "Optional - Click to select"}
                                                    </p>
                                                    {selectedOuterwear?.mode === "wishlist" && (
                                                        <Badge className="mt-1 bg-amber-500">Wishlist</Badge>
                                                    )}
                                                </div>
                                                {!selectedOuterwear && <Plus className="w-5 h-5 text-slate-400" />}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Top Selection */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all duration-300 ${
                                            selectedTop
                                                ? "ring-2 ring-green-500 shadow-lg bg-green-50 dark:bg-green-900/20"
                                                : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                                        }`}
                                        onClick={() => setShowTopSelectModal(true)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    {selectedTop ? (
                                                        <img
                                                            src={selectedTop.url || "/placeholder.svg"}
                                                            alt={selectedTop.name || "Top"}
                                                            className="w-full h-full object-contain rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl text-slate-400">👕</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                                        {selectedTop ? selectedTop.name || "Selected Top" : "Top"}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {selectedTop ? "Click to change" : "Required - Click to select"}
                                                    </p>
                                                    {selectedTop?.mode === "wishlist" && <Badge className="mt-1 bg-amber-500">Wishlist</Badge>}
                                                </div>
                                                {!selectedTop && <Plus className="w-5 h-5 text-slate-400" />}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Bottom Selection */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all duration-300 ${
                                            selectedBottom
                                                ? "ring-2 ring-purple-500 shadow-lg bg-purple-50 dark:bg-purple-900/20"
                                                : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                                        }`}
                                        onClick={() => setShowBottomSelectModal(true)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    {selectedBottom ? (
                                                        <img
                                                            src={selectedBottom.url || "/placeholder.svg"}
                                                            alt={selectedBottom.name || "Bottom"}
                                                            className="w-full h-full object-contain rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl text-slate-400">👖</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                                        {selectedBottom ? selectedBottom.name || "Selected Bottom" : "Bottom"}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {selectedBottom ? "Click to change" : "Required - Click to select"}
                                                    </p>
                                                    {selectedBottom?.mode === "wishlist" && <Badge className="mt-1 bg-amber-500">Wishlist</Badge>}
                                                </div>
                                                {!selectedBottom && <Plus className="w-5 h-5 text-slate-400" />}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Shoe Selection */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all duration-300 ${
                                            selectedShoe
                                                ? "ring-2 ring-pink-500 shadow-lg bg-pink-50 dark:bg-pink-900/20"
                                                : "border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-900/10"
                                        }`}
                                        onClick={() => setShowShoeSelectModal(true)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    {selectedShoe ? (
                                                        <img
                                                            src={selectedShoe.url || "/placeholder.svg"}
                                                            alt={selectedShoe.name || "Shoe"}
                                                            className="w-full h-full object-contain rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl text-slate-400">👟</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                                        {selectedShoe ? selectedShoe.name || "Selected Shoe" : "Shoe"}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {selectedShoe ? "Click to change" : "Optional - Click to select"}
                                                    </p>
                                                    {selectedShoe?.mode === "wishlist" && <Badge className="mt-1 bg-pink-500">Wishlist</Badge>}
                                                </div>
                                                {!selectedShoe && <Plus className="w-5 h-5 text-slate-400" />}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {isFormValid() ? (
                                <div className="flex items-center text-green-600 dark:text-green-400">
                                    <Check className="w-4 h-4 mr-1" />
                                    Ready to create
                                </div>
                            ) : (
                                "Select at least a top and bottom"
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateOutfit}
                                disabled={!isFormValid() || isCreating}
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                            >
                                {isCreating ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                            className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                                        />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Outfit"
                                )}
                            </Button>
                        </div>
                    </div>
                    {/* Outfit Details Step */}
                    {showDetailsStep && createdOutfitId && (
                        <OutfitDetailsStep
                            show={showDetailsStep}
                            outfitId={createdOutfitId}
                            clothingItems={createdOutfitItems}
                            onComplete={handleDetailsComplete}
                            onSkip={handleDetailsSkip}
                        />
                    )}
                </motion.div>

                {/* Selection Modals */}
                <ClothingItemSelectModal
                    isOpen={showOuterwearSelectModal}
                    onCloseAction={() => setShowOuterwearSelectModal(false)}
                    clothingItems={[
                        ...clothingItems.outerwear,
                        { id: "none", url: "", name: "Select None", mode: "closet" as const },
                    ]}
                    onSelectItem={(item) => {
                        setSelectedOuterwear(item.id === "none" ? null : item)
                        setShowOuterwearSelectModal(false)
                        setAnimationKey((prev) => prev + 1)
                    }}
                    viewMode={clothingItems.outerwear.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
                    selectedCategory="outerwear"
                />

                <ClothingItemSelectModal
                    isOpen={showTopSelectModal}
                    onCloseAction={() => setShowTopSelectModal(false)}
                    clothingItems={clothingItems.tops}
                    onSelectItem={(item) => {
                        setSelectedTop(item)
                        setShowTopSelectModal(false)
                        setAnimationKey((prev) => prev + 1)
                    }}
                    viewMode={clothingItems.tops.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
                    selectedCategory="top"
                />

                <ClothingItemSelectModal
                    isOpen={showBottomSelectModal}
                    onCloseAction={() => setShowBottomSelectModal(false)}
                    clothingItems={clothingItems.bottoms}
                    onSelectItem={(item) => {
                        setSelectedBottom(item)
                        setShowBottomSelectModal(false)
                        setAnimationKey((prev) => prev + 1)
                    }}
                    viewMode={clothingItems.bottoms.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
                    selectedCategory="bottom"
                />

                <ClothingItemSelectModal
                    isOpen={showShoeSelectModal}
                    onCloseAction={() => setShowShoeSelectModal(false)}
                    clothingItems={clothingItems.shoes}
                    onSelectItem={(item) => {
                        setSelectedShoe(item)
                        setShowShoeSelectModal(false)
                        setAnimationKey((prev) => prev + 1)
                    }}
                    viewMode={clothingItems.shoes.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
                    selectedCategory="shoe"
                />
            </motion.div>
        </AnimatePresence>
    );
} 