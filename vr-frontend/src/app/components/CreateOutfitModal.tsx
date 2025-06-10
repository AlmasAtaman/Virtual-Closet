"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import ClothingItemSelectModal from './ClothingItemSelectModal';

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
    // Add other categories if needed
}

export default function CreateOutfitModal({ show, onCloseAction, onOutfitCreated }: CreateOutfitModalProps) {
    const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
    const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
    const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null);

    const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [] });
    const [loadingClothing, setLoadingClothing] = useState(true);
    const [viewingCategory, setViewingCategory] = useState<"none" | "top" | "bottom" | "outerwear">("none");
    const [showTopSelectModal, setShowTopSelectModal] = useState(false);
    const [showBottomSelectModal, setShowBottomSelectModal] = useState(false);
    const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false);
    const [randomizeFromCloset, setRandomizeFromCloset] = useState(true);
    const [randomizeFromWishlist, setRandomizeFromWishlist] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

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
                    } else {
                        console.warn(`Unknown clothing type: ${item.type}`);
                    }
                }
                return acc;
            }, { tops: [], bottoms: [], outerwear: [] });

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
        return [selectedTop, selectedBottom, selectedOuterwear].some((item) => item && item.mode === 'wishlist');
    };

    const handleCreateOutfit = async () => {
        if (!isFormValid()) {
            alert('Please select at least a top and a bottom.');
            return;
        }
        setIsCreating(true);
        try {
            const newOutfitData = {
                clothingItems: [
                    selectedTop?.id,
                    selectedBottom?.id,
                    selectedOuterwear?.id,
                ].filter(Boolean), // Filter out null/undefined ids
            };
            // console.log('Creating outfit:', newOutfitData); // Removed console log

            const res = await fetch('http://localhost:8000/api/outfits', { // Assuming POST /api/outfits is the endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOutfitData),
                credentials: 'include', // Include cookies for authentication
            });

            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(`Failed to create outfit: ${res.status} ${res.statusText} - ${errorData.message || 'Unknown error'}`);
            }

            const createdOutfit = await res.json(); // Assuming the backend returns the created outfit
            console.log('Outfit created successfully:', createdOutfit);

            // Close modal and potentially refresh outfit list on the outfits page
            handleCloseModal(); // Use the combined close handler
            onOutfitCreated();

        } catch (error: any) {
            console.error('Error creating outfit:', error);
            alert(`Error creating outfit: ${error.message}`); // Show error to user
            // Keep modal open on error for user to retry/adjust
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectItem = (item: ClothingItem, category: "top" | "bottom" | "outerwear") => {
        if (item.id === 'none') {
            // Handle 'Select None' option
            if (category === "top") {
                setSelectedTop(null);
            } else if (category === "bottom") {
                setSelectedBottom(null);
            } else if (category === "outerwear") {
                setSelectedOuterwear(null);
            }
        } else {
            // Handle selecting a regular clothing item
            if (category === "top") {
                setSelectedTop(item);
            } else if (category === "bottom") {
                setSelectedBottom(item);
            } else if (category === "outerwear") {
                setSelectedOuterwear(item);
            }
        }
        setViewingCategory("none"); // Go back to the main form after selection
    };

    // Move reset logic here so it runs on any close
    const handleCloseModal = () => {
        // Reset form state - only reset clothing selections
        setSelectedTop(null);
        setSelectedBottom(null);
        setSelectedOuterwear(null);
        // Reset modal visibility states
        setShowTopSelectModal(false);
        setShowBottomSelectModal(false);
        setShowOuterwearSelectModal(false);
        setViewingCategory("none");
        onCloseAction(); // Call the original onCloseAction prop
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Close modal only if the click is on the overlay itself
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    // Helper to get random item from array
    const getRandomItem = <T,>(arr: T[]): T | null => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    const handleRandomize = () => {
        // Filter items by selected sources
        const sources: ('closet' | 'wishlist')[] = [];
        if (randomizeFromCloset) sources.push('closet');
        if (randomizeFromWishlist) sources.push('wishlist');
        if (sources.length === 0) return; // No sources selected

        const filterBySource = (items: ClothingItem[]): ClothingItem[] => items.filter((item: ClothingItem) => sources.includes(item.mode));
        const tops = filterBySource(clothingItems.tops);
        const bottoms = filterBySource(clothingItems.bottoms);
        const outerwear = filterBySource(clothingItems.outerwear);

        setSelectedTop(getRandomItem(tops));
        setSelectedBottom(getRandomItem(bottoms));
        setSelectedOuterwear(getRandomItem(outerwear));
    };

    if (!show) {
        return null;
    }

    // Render modal content based on viewingCategory state
    const renderModalContent = () => {
        if (viewingCategory === "top") {
            return (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Select a Top</h4>
                    {/* The ClothingItemSelectModal will handle the view mode toggle and item display */}
                    {/* Old inline item list removed */}
                    <button onClick={() => setViewingCategory("none")} className="mt-4 px-4 py-2 bg-gray-300 rounded">Back</button>
                </div>
            );
        } else if (viewingCategory === "bottom") {
             return (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Select a Bottom</h4>
                    {/* The ClothingItemSelectModal will handle the view mode toggle and item display */}
                    {/* Old inline item list removed */}
                     <button onClick={() => setViewingCategory("none")} className="mt-4 px-4 py-2 bg-gray-300 rounded">Back</button>
                </div>
            );
        } else if (viewingCategory === "outerwear") {
             return (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Select Outerwear (Optional)</h4>
                    {/* The ClothingItemSelectModal will handle the view mode toggle and item display */}
                    {/* Old inline item list removed */}
                     <button onClick={() => setViewingCategory("none")} className="mt-4 px-4 py-2 bg-gray-300 rounded">Back</button>
                </div>
            );
        } else {
            // Main outfit creation form
            return (
                 <div className="mt-4 space-y-6">
                    {/* Randomize Button and Checkboxes */}
                    <div className="flex flex-col items-center mb-4">
                        <button
                            className="px-6 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            onClick={handleRandomize}
                        >
                            Randomize Outfit
                        </button>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={randomizeFromCloset}
                                    onChange={e => setRandomizeFromCloset(e.target.checked)}
                                    className="mr-2 accent-blue-600"
                                />
                                Closet
                            </label>
                            <label className="flex items-center text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={randomizeFromWishlist}
                                    onChange={e => setRandomizeFromWishlist(e.target.checked)}
                                    className="mr-2 accent-blue-600"
                                />
                                Wishlist
                            </label>
                        </div>
                    </div>
                    
                    {/* Clothing Item Selection Area - Adjusted Layout and Sizing */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-4 text-center">Select Clothing Items</h4>
                        
                        {/* Display wishlist warning if any selected item is from wishlist */}
                        {hasWishlistItems() && (
                            <p className="text-red-500 text-center mb-4">Note: One or more selected items are from your wishlist.</p>
                        )}

                        {/* Flex container for the outfit layout (Outerwear left, Tops/Bottoms right) */}
                        {/* Adjusted alignment and gap for visual balance */}
                        {/* Further refined gap and item sizing for sketch match */}
                        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4"> {/* Adjusted horizontal gap and items alignment */}
                            
                            {/* Outerwear Section (Left) */}
                            {/* Increased size and conditional styling */}
                            <button 
                                className={`flex-shrink-0 w-48 h-64 flex flex-col justify-center items-center rounded-md overflow-hidden transition-all duration-200 ${selectedOuterwear ? 'border-none p-0' : 'border border-gray-600 hover:bg-gray-700 p-4'}`} // Conditional border/padding, adjusted size
                                onClick={() => {
                                    const initialMode = clothingItems.outerwear.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist';
                                    setShowOuterwearSelectModal(true);
                                }}
                                disabled={loadingClothing}
                            >
                                {selectedOuterwear ? (
                                    <img src={selectedOuterwear.url} alt={selectedOuterwear.name || 'Selected Outerwear'} className="w-full h-full object-contain rounded" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <p>Outerwear</p>
                                        <p className="text-sm">(Optional)</p>
                                    </div>
                                )}
                                
                            </button>

                            {/* Top and Bottom Sections (Right Column) */}
                            {/* Adjusted gap and width for column */}
                            {/* Reduced vertical gap and adjusted item heights for sketch match */}
                            <div className="flex flex-col flex-grow gap-2 w-56 lg:w-64"> {/* Adjusted vertical gap, adjusted fixed width for the column */}
                                {/* Top Section */}
                                {/* Adjusted size and conditional styling */}
                                <button 
                                    className={`w-full h-56 flex flex-col justify-center items-center rounded-md overflow-hidden transition-all duration-200 ${selectedTop ? 'border-none p-0' : 'border border-gray-600 hover:bg-gray-700 p-4'}`} // Conditional border/padding, increased size
                                    onClick={() => {
                                        const initialMode = clothingItems.tops.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist';
                                        setShowTopSelectModal(true);
                                    }}
                                    disabled={loadingClothing}
                                >
                                    {selectedTop ? (
                                        <img src={selectedTop.url} alt={selectedTop.name || 'Selected Top'} className="w-full h-full object-contain rounded" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                             <p>Tops</p>
                                            <p className="text-sm">Select Top</p>
                                        </div>
                                    )}
                                </button>

                                {/* Bottom Section */}
                                {/* Adjusted size and conditional styling */}
                                <button 
                                    className={`w-full h-56 flex flex-col justify-center items-center rounded-md overflow-hidden transition-all duration-200 ${selectedBottom ? 'border-none p-0' : 'border border-gray-600 hover:bg-gray-700 p-4'}`} // Conditional border/padding, increased size
                                    onClick={() => {
                                        const initialMode = clothingItems.bottoms.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist';
                                        setShowBottomSelectModal(true);
                                    }}
                                     disabled={loadingClothing}
                                >
                                    {selectedBottom ? (
                                        <img src={selectedBottom.url} alt={selectedBottom.name || 'Selected Bottom'} className="w-full h-full object-contain rounded" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <p>Bottoms</p>
                                            <p className="text-sm">Select Bottom</p>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                         {loadingClothing && <p className="mt-4 text-center">Loading clothing items...</p>}
                    </div>

                    {/* Action Buttons */}
                    {/* Adjusted spacing and positioning */}
                    <div className="flex justify-center items-center mt-6">
                        <button 
                            id="create-outfit-btn"
                            className={`px-6 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${!isFormValid() && 'opacity-50 cursor-not-allowed'}`}
                            onClick={handleCreateOutfit}
                            disabled={!isFormValid() || isCreating}
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
                        </button>
                        <button 
                            id="cancel-btn"
                            className="ml-4 px-6 py-2 bg-gray-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            );
        }
    };

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
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Outfit</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">Mix and match your favorite pieces</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Randomize Section */}
                        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Surprise Me!</h3>
                                    </div>
                                    <Button
                                        onClick={handleRandomize}
                                        disabled={!randomizeFromCloset && !randomizeFromWishlist}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        <Shuffle className="w-4 h-4 mr-2" />
                                        Randomize
                                    </Button>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="closet"
                                            checked={randomizeFromCloset}
                                            onCheckedChange={(checked: boolean) => setRandomizeFromCloset(checked)}
                                        />
                                        <label htmlFor="closet" className="text-sm text-slate-700 dark:text-slate-300">
                                            From Closet
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="wishlist"
                                            checked={randomizeFromWishlist}
                                            onCheckedChange={(checked: boolean) => setRandomizeFromWishlist(checked)}
                                        />
                                        <label htmlFor="wishlist" className="text-sm text-slate-700 dark:text-slate-300">
                                            From Wishlist
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Wishlist Warning */}
                        {hasWishlistItems() && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                                        Some selected items are from your wishlist and may not be available.
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}

                        {/* Outfit Builder */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Outerwear */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card
                                    className={`h-80 cursor-pointer transition-all duration-300 ${
                                        selectedOuterwear
                                            ? "ring-2 ring-blue-500 shadow-lg"
                                            : "border-dashed border-2 hover:border-slate-400 dark:hover:border-slate-500"
                                    }`}
                                    onClick={() => setShowOuterwearSelectModal(true)}
                                >
                                    <CardContent className="h-full flex flex-col items-center justify-center p-4">
                                        {selectedOuterwear ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={selectedOuterwear.url || "/placeholder.svg"}
                                                    alt={selectedOuterwear.name || "Outerwear"}
                                                    className="w-full h-full object-contain"
                                                />
                                                {selectedOuterwear.mode === "wishlist" && (
                                                    <Badge className="absolute top-2 right-2 bg-amber-500">Wishlist</Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500 dark:text-slate-400">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="text-2xl">🧥</span>
                                                </div>
                                                <h3 className="font-medium mb-1">Outerwear</h3>
                                                <p className="text-sm opacity-75">Optional</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Top */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card
                                    className={`h-80 cursor-pointer transition-all duration-300 ${
                                        selectedTop
                                            ? "ring-2 ring-green-500 shadow-lg"
                                            : "border-dashed border-2 hover:border-slate-400 dark:hover:border-slate-500"
                                    }`}
                                    onClick={() => setShowTopSelectModal(true)}
                                >
                                    <CardContent className="h-full flex flex-col items-center justify-center p-4">
                                        {selectedTop ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={selectedTop.url || "/placeholder.svg"}
                                                    alt={selectedTop.name || "Top"}
                                                    className="w-full h-full object-contain"
                                                />
                                                {selectedTop.mode === "wishlist" && (
                                                    <Badge className="absolute top-2 right-2 bg-amber-500">Wishlist</Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500 dark:text-slate-400">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="text-2xl">👕</span>
                                                </div>
                                                <h3 className="font-medium mb-1">Top</h3>
                                                <p className="text-sm opacity-75">Required</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Bottom */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card
                                    className={`h-80 cursor-pointer transition-all duration-300 ${
                                        selectedBottom
                                            ? "ring-2 ring-purple-500 shadow-lg"
                                            : "border-dashed border-2 hover:border-slate-400 dark:hover:border-slate-500"
                                    }`}
                                    onClick={() => setShowBottomSelectModal(true)}
                                >
                                    <CardContent className="h-full flex flex-col items-center justify-center p-4">
                                        {selectedBottom ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={selectedBottom.url || "/placeholder.svg"}
                                                    alt={selectedBottom.name || "Bottom"}
                                                    className="w-full h-full object-contain"
                                                />
                                                {selectedBottom.mode === "wishlist" && (
                                                    <Badge className="absolute top-2 right-2 bg-amber-500">Wishlist</Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500 dark:text-slate-400">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="text-2xl">👖</span>
                                                </div>
                                                <h3 className="font-medium mb-1">Bottom</h3>
                                                <p className="text-sm opacity-75">Required</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
                    }}
                    viewMode={clothingItems.bottoms.filter((item) => item.mode === "closet").length > 0 ? "closet" : "wishlist"}
                    selectedCategory="bottom"
                />
            </motion.div>
        </AnimatePresence>
    );
} 