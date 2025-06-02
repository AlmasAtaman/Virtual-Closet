"use client";

import { useState, useEffect } from 'react';
import ClothingItemSelectModal from './ClothingItemSelectModal';

interface CreateOutfitModalProps {
    show: boolean;
    onClose: () => void;
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

export default function CreateOutfitModal({ show, onClose, onOutfitCreated }: CreateOutfitModalProps) {
    const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
    const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
    const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null);

    const [clothingItems, setClothingItems] = useState<CategorizedClothing>({ tops: [], bottoms: [], outerwear: [] });
    const [loadingClothing, setLoadingClothing] = useState(true);
    const [viewingCategory, setViewingCategory] = useState<"none" | "top" | "bottom" | "outerwear">("none");
    const [showTopSelectModal, setShowTopSelectModal] = useState(false);
    const [showBottomSelectModal, setShowBottomSelectModal] = useState(false);
    const [showOuterwearSelectModal, setShowOuterwearSelectModal] = useState(false);

    useEffect(() => {
        if (show) {
            fetchClothingItems();
        }
    }, [show]); // Fetch items when modal opens

    const fetchClothingItems = async () => {
        setLoadingClothing(true);
        try {
            // Fetch closet items
            const closetRes = await fetch('http://localhost:8000/api/images?mode=closet', {
                credentials: 'include'
            });
            if (!closetRes.ok) {
                throw new Error(`Failed to fetch closet items: ${closetRes.status} ${closetRes.statusText}`);
            }
            const closetData = await closetRes.json();
            const closetItems: ClothingItem[] = (closetData.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'closet' }));

            // Fetch wishlist items
            const wishlistRes = await fetch('http://localhost:8000/api/images?mode=wishlist', {
                credentials: 'include'
            });
            if (!wishlistRes.ok) {
                throw new Error(`Failed to fetch wishlist items: ${wishlistRes.status} ${wishlistRes.statusText}`);
            }
            const wishlistData = await wishlistRes.json();
            const wishlistItems: ClothingItem[] = (wishlistData.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'wishlist' }));

            const allItems = [...closetItems, ...wishlistItems];

            // Categorize items based on type (using your examples)
            const categorized = allItems.reduce<CategorizedClothing>((acc, item) => {
                if (item.type) {
                    const lowerCaseType = item.type.toLowerCase();
                    if (['t-shirt', 'dress'].includes(lowerCaseType)) {
                        acc.tops.push(item);
                    } else if (['pants', 'skirt', 'shorts'].includes(lowerCaseType)) {
                        acc.bottoms.push(item);
                    } else if (['jacket', 'sweater'].includes(lowerCaseType)) {
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
        return selectedTop !== null && selectedBottom !== null;
    };

    const handleCreateOutfit = async () => {
        if (!isFormValid()) {
            alert('Please select at least a top and a bottom.');
            return;
        }
        const newOutfitData = {
            clothingItems: [
                selectedTop?.id,
                selectedBottom?.id,
                selectedOuterwear?.id,
            ].filter(Boolean), // Filter out null/undefined ids
        };
        // console.log('Creating outfit:', newOutfitData); // Removed console log

        try {

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
        onClose(); // Call the original onClose prop
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Close modal only if the click is on the overlay itself
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
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
                    
                    {/* Clothing Item Selection Area - Adjusted Layout and Sizing */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-4 text-center">Select Clothing Items</h4>
                        
                        {/* Display wishlist warning if any selected item is from wishlist */}
                        {(selectedTop?.mode === 'wishlist' || selectedBottom?.mode === 'wishlist' || selectedOuterwear?.mode === 'wishlist') && (
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
                            disabled={!isFormValid()}
                        >
                            Create Outfit
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" id="my-modal" onClick={handleOverlayClick}> {/* Centered the modal using flexbox and added padding */}
            {/* Increased modal width and adjusted positioning */}
            {/* Adjusted width: max-w-2xl on larger screens, full width on smaller, removed absolute top */}
            <div className="relative bg-gray-800 text-white rounded-md shadow-lg p-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl" onClick={e => e.stopPropagation()}> {/* Adjusted padding and max-width, stopped propagation on modal content */}
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold leading-6 text-white">{viewingCategory === "none" ? "Create New Outfit" : "Select Clothing"}</h3>
                     {viewingCategory !== "none" && (
                        <button 
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setViewingCategory("none")}
                        >
                           ← Back
                        </button>
                    )}
                 </div>
                
                {/* Render the appropriate modal content based on viewingCategory */}
                {renderModalContent()}

                {/* Render ClothingItemSelectModals */}
                <ClothingItemSelectModal
                    isOpen={showOuterwearSelectModal}
                    onClose={() => setShowOuterwearSelectModal(false)}
                    clothingItems={[...(clothingItems.outerwear || []), { id: 'none', url: '', name: 'Select None', mode: 'closet' }]} // Add 'Select None' option and ensure array
                    onSelectItem={(item) => {
                        setSelectedOuterwear(item);
                        setShowOuterwearSelectModal(false);
                    }}
                    viewMode={clothingItems.outerwear.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist'}
                    selectedCategory='outerwear' // Pass the category
                />

                <ClothingItemSelectModal
                    isOpen={showTopSelectModal}
                    onClose={() => setShowTopSelectModal(false)}
                    clothingItems={[...(clothingItems.tops || []), { id: 'none', url: '', name: 'Select None', mode: 'closet' }]} // Add 'Select None' option and ensure array
                    onSelectItem={(item) => {
                        setSelectedTop(item);
                        setShowTopSelectModal(false);
                    }}
                    viewMode={clothingItems.tops.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist'}
                    selectedCategory='top' // Pass the category
                />

                <ClothingItemSelectModal
                    isOpen={showBottomSelectModal}
                    onClose={() => setShowBottomSelectModal(false)}
                    clothingItems={[...(clothingItems.bottoms || []), { id: 'none', url: '', name: 'Select None', mode: 'closet' }]} // Add 'Select None' option and ensure array
                    onSelectItem={(item) => {
                        setSelectedBottom(item);
                        setShowBottomSelectModal(false);
                    }}
                    viewMode={clothingItems.bottoms.filter(item => item.mode === 'closet').length > 0 ? 'closet' : 'wishlist'}
                    selectedCategory='bottom' // Pass the category
                />

            </div>
        </div>
    );
} 