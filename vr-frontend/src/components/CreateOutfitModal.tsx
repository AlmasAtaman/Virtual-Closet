"use client";

import { useState, useEffect } from 'react';

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

    useEffect(() => {
        if (show) {
            fetchClothingItems();
        }
    }, [show]); // Fetch items when modal opens

    const fetchClothingItems = async () => {
        setLoadingClothing(true);
        try {


            const res = await fetch('http://localhost:8000/api/images', { 
                credentials: 'include' // Include cookies for authentication
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch clothing items: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            const allItems: ClothingItem[] = data.clothingItems || []; // Assuming the response has a clothingItems array

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
                        // Optionally handle items with types not in your defined categories
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
        if (category === "top") {
            setSelectedTop(item);
        } else if (category === "bottom") {
            setSelectedBottom(item);
        } else if (category === "outerwear") {
            setSelectedOuterwear(item);
        }
        setViewingCategory("none"); // Go back to the main form after selection
    };

    // Move reset logic here so it runs on any close
    const handleCloseModal = () => {
        // Reset form state - only reset clothing selections
        setSelectedTop(null);
        setSelectedBottom(null);
        setSelectedOuterwear(null);
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
                    {loadingClothing ? (
                        <p>Loading tops...</p>
                    ) : clothingItems.tops.length === 0 ? (
                        <p>No tops available.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {clothingItems.tops.map(item => (
                                <div key={item.id} className="cursor-pointer border rounded p-1 text-center"
                                     onClick={() => handleSelectItem(item, "top")}>
                                    {/* TODO: Display item image */}
                                    <img src={item.url} alt={item.name || 'Top Image'} className="w-full h-20 object-cover rounded mb-1" />
                                    <p className="text-sm truncate text-gray-300">{item.name || 'Unnamed Top'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setViewingCategory("none")} className="mt-4 px-4 py-2 bg-gray-300 rounded">Back</button>
                </div>
            );
        } else if (viewingCategory === "bottom") {
             return (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Select a Bottom</h4>
                     {loadingClothing ? (
                        <p>Loading bottoms...</p>
                    ) : clothingItems.bottoms.length === 0 ? (
                        <p>No bottoms available.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {clothingItems.bottoms.map(item => (
                                <div key={item.id} className="cursor-pointer border rounded p-1 text-center"
                                     onClick={() => handleSelectItem(item, "bottom")}>
                                     {/* TODO: Display item image */}
                                    <img src={item.url} alt={item.name || 'Bottom Image'} className="w-full h-20 object-cover rounded mb-1" />
                                    <p className="text-sm truncate text-gray-300">{item.name || 'Unnamed Bottom'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                     <button onClick={() => setViewingCategory("none")} className="mt-4 px-4 py-2 bg-gray-300 rounded">Back</button>
                </div>
            );
        } else if (viewingCategory === "outerwear") {
             return (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Select Outerwear (Optional)</h4>
                     {loadingClothing ? (
                        <p>Loading outerwear...</p>
                    ) : clothingItems.outerwear.length === 0 ? (
                        <p>No outerwear available.</p>
                    ) : (
                         <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {clothingItems.outerwear.map(item => (
                                <div key={item.id} className="cursor-pointer border rounded p-1 text-center"
                                     onClick={() => handleSelectItem(item, "outerwear")}>
                                      {/* TODO: Display item image */}
                                    <img src={item.url} alt={item.name || 'Outerwear Image'} className="w-full h-20 object-cover rounded mb-1" />
                                    <p className="text-sm truncate text-gray-300">{item.name || 'Unnamed Outerwear'}</p>
                                </div>
                            ))}
                        </div>
                    )}
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
                        
                        {/* Flex container for the outfit layout (Outerwear left, Tops/Bottoms right) */}
                        {/* Adjusted alignment and gap for visual balance */}
                        {/* Further refined gap and item sizing for sketch match */}
                        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6"> {/* Adjusted horizontal gap and items alignment */}
                            
                            {/* Outerwear Section (Left) */}
                            {/* Increased size and conditional styling */}
                            <button 
                                className={`flex-shrink-0 w-48 h-64 flex flex-col justify-center items-center rounded-md overflow-hidden transition-all duration-200 ${selectedOuterwear ? 'border-none p-0' : 'border border-gray-600 hover:bg-gray-700 p-4'}`} // Conditional border/padding, adjusted size
                                onClick={() => setViewingCategory("outerwear")}
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
                            <div className="flex flex-col flex-grow gap-3 w-56 lg:w-64"> {/* Adjusted vertical gap, adjusted fixed width for the column */}
                                {/* Top Section */}
                                {/* Adjusted size and conditional styling */}
                                <button 
                                    className={`w-full h-56 flex flex-col justify-center items-center rounded-md overflow-hidden transition-all duration-200 ${selectedTop ? 'border-none p-0' : 'border border-gray-600 hover:bg-gray-700 p-4'}`} // Conditional border/padding, increased size
                                    onClick={() => setViewingCategory("top")}
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
                                    onClick={() => setViewingCategory("bottom")}
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
                
                {renderModalContent()}
               
            </div>
        </div>
    );
} 