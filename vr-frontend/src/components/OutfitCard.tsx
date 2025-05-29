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
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit }) => {
    return (
        <div className="border rounded-lg p-6 shadow-sm bg-gray-700 text-white flex flex-col min-h-64">
            {/* TODO: Display outfit name or other metadata if available */}
            {/* <h3 className="text-lg font-semibold mb-2">{outfit.name || `Outfit ${outfit.id.substring(0, 6)}`}</h3> */}
            <h3 className="text-lg font-semibold mb-4 text-center">Outfit {outfit.id.substring(0, 6)}</h3> {/* Added mb-4 and text-center */}

            <div className="flex flex-wrap gap-3 justify-center flex-grow items-center">
                {outfit.clothingItems.map(item => (
                    <div key={item.id} className="w-20 h-20 flex-shrink-0 rounded overflow-hidden border border-gray-600">
                        <img 
                            src={item.url}
                            alt={item.name || 'Clothing Item'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
            {/* TODO: Display other outfit metadata here if available */}
        </div>
    );
};

export default OutfitCard; 