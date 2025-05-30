"use client";

import React from 'react';

interface ClothingItem {
    id: string;
    name?: string;
    url: string;
    type?: string;
}

interface OutfitCardProps {
    outfit: {
        id: string;
        clothingItems: ClothingItem[];
        // Add other optional metadata fields if your backend returns them
        // name?: string;
        // season?: string;
        // occasion?: string;
        // totalPrice?: number;
    };
    // Removed onItemClick as we will navigate on card click
    // onItemClick: (item: ClothingItem, outfit: OutfitCardProps['outfit']) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit /* Removed onItemClick from destructuring */ }) => {
    // Categorize clothing items
    const categorizedItems: {
        top: ClothingItem | undefined;
        bottom: ClothingItem | undefined;
        outerwear: ClothingItem | undefined;
    } = {
        top: outfit.clothingItems.find(item => ['t-shirt', 'dress'].includes(item.type?.toLowerCase() || '')),
        bottom: outfit.clothingItems.find(item => ['pants', 'skirt', 'shorts'].includes(item.type?.toLowerCase() || '')),
        outerwear: outfit.clothingItems.find(item => ['jacket', 'sweater'].includes(item.type?.toLowerCase() || '')),
    };

    return (
        // Added cursor-pointer and onClick handler to the main div
        <div 
            className="border rounded-lg p-4 shadow-sm bg-gray-700 text-white flex flex-col items-center cursor-pointer"
            onClick={() => window.location.href = `/outfits/${outfit.id}`} // Navigate to the new outfit detail page
        >
            {/* Removed outfit ID heading */}
            {/* <h3 className="text-lg font-semibold mb-4 text-center">Outfit {outfit.id.substring(0, 6)}</h3> */}

            {/* Outfit display area - vertical stack, relative for absolute positioning of outerwear */}
            {/* Adjusted vertical gap and width */}
            <div className="flex flex-col items-center w-full relative space-y-1">

                {/* Outerwear - positioned absolutely to slightly overlap */}
                {/* Adjusted top positioning and size for subtle overlap */}
                {categorizedItems.outerwear && (
                    // Removed cursor-pointer and onClick handler
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-11/12 h-11/12 z-10 flex justify-center items-center">
                         <img
                            src={categorizedItems.outerwear.url}
                            alt={categorizedItems.outerwear.name || 'Outerwear'}
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                {/* Top and Bottom - stacked vertically */}
                {/* Removed mt-16, adjusted spacing and width */}
                <div className="flex flex-col items-center w-full space-y-1 mt-8">
                    {categorizedItems.top && (
                        // Removed cursor-pointer and onClick handler
                         <div className="w-full h-48 flex justify-center items-center overflow-hidden rounded">
                            <img
                                src={categorizedItems.top.url}
                                alt={categorizedItems.top.name || 'Top'}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {categorizedItems.bottom && (
                        // Removed cursor-pointer and onClick handler
                         <div className="w-full h-60 flex justify-center items-center overflow-hidden rounded">
                            <img
                                src={categorizedItems.bottom.url}
                                alt={categorizedItems.bottom.name || 'Bottom'}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Render other items if necessary (optional, based on how outfits are structured) */}
                {/* If an outfit can have more than one of each type, this would need adjustment */}

            </div>
            {/* TODO: Display other outfit metadata here if available */}
        </div>
    );
};

export default OutfitCard; 