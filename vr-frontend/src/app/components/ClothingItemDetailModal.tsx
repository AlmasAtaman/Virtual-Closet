"use client";

import React from 'react';
import Image from 'next/image';

interface ClothingItem {
    id: string;
    name?: string;
    url: string;
    type?: string;
    brand?: string;
    occasion?: string;
    season?: string;
    notes?: string;
    price?: number;
    key?: string; // Assuming key is needed for deletion
}

interface Outfit {
    id: string;
    outerwearOnTop?: boolean;
    clothingItems: ClothingItem[];
}

interface ClothingItemDetailModalProps {
    show: boolean;
    onCloseAction: () => void;
    item: ClothingItem | null;
    outfit: Outfit | null; // Pass the whole outfit to show other items
    onItemDeleted: (itemId: string, outfitId: string) => void; // Update handler to include outfitId
}

const ClothingItemDetailModal: React.FC<ClothingItemDetailModalProps> = ({
    show,
    onCloseAction,
    item,
    outfit,
    onItemDeleted,
}) => {
    if (!show || !item || !outfit) { // Ensure outfit is available
        return null;
    }

    const handleDelete = async () => {
        if (!item || !outfit) { // Double check item and outfit are available
            return;
        }

        if (confirm(`Are you sure you want to remove ${item.name || 'this item'} from this outfit?`)) {
            try {
                // Call the new backend endpoint to remove the item from the outfit
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/outfits/${outfit.id}/items/${item.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(`Failed to remove item from outfit: ${res.status} ${res.statusText} - ${errorData.message || 'Unknown error'}`);
                }

                // Call the handler to update the UI, passing both item and outfit IDs
                onItemDeleted(item.id, outfit.id);

            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                alert(`Error removing item from outfit: ${errorMessage}`);
            }
        }
    };

    // Placeholder for edit functionality
    const handleEdit = () => {
        alert("Edit functionality not yet implemented.");
        // TODO: Implement edit modal or inline editing
    };


    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            onClick={onCloseAction} // Close modal when clicking outside content
        >
            <div
                className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg max-w-sm w-full max-h-[90vh] overflow-y-auto text-white"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing modal
            >
                <h2 className="text-xl font-bold mb-4">Clothing Item Details</h2>

                {/* Item Image */}
                <div className="mb-4 flex justify-center">
                     <Image
                        src={item.url}
                        alt={item.name || 'Clothing Item'}
                        width={200}
                        height={200}
                        className="max-w-full max-h-48 object-contain rounded"
                        unoptimized
                    />
                </div>

                {/* Item Details (conditionally rendered) */}
                <div className="space-y-2 mb-4">
                    {item.name && <p><span className="font-semibold">Name:</span> {item.name}</p>}
                    {item.price != null && <p><span className="font-semibold">Price:</span> ${item.price.toFixed(2)}</p>}
                    {item.occasion && <p><span className="font-semibold">Occasion:</span> {item.occasion}</p>}
                    {item.season && <p><span className="font-semibold">Season:</span> {item.season}</p>}
                    {item.brand && <p><span className="font-semibold">Brand:</span> <span className="capitalize">{item.brand}</span></p>}
                    {item.type && <p><span className="font-semibold">Type:</span> <span className="capitalize">{item.type}</span></p>}
                    {item.notes && <p><span className="font-semibold">Notes:</span> {item.notes}</p>}
                </div>

                {/* Outfit Items */}
                {outfit && outfit.clothingItems.length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-semibold mb-2">Outfit Items:</h3>
                        <div className="flex flex-wrap gap-2">
                            {outfit.clothingItems.map(outfitItem => (
                                <div key={outfitItem.id} className="w-16 h-16 overflow-hidden rounded border border-gray-600">
                                    <Image
                                        src={outfitItem.url}
                                        alt={outfitItem.name || 'Outfit Item'}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                    <button
                        className="bg-blue-500 text-white px-4 py-3 sm:py-2 rounded hover:bg-blue-600 min-h-[44px] font-medium"
                        onClick={handleEdit}
                    >
                        Edit
                    </button>
                    <button
                        className="bg-red-500 text-white px-4 py-3 sm:py-2 rounded hover:bg-red-600 min-h-[44px] font-medium"
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                    <button
                        className="bg-gray-500 text-white px-4 py-3 sm:py-2 rounded hover:bg-gray-600 min-h-[44px] font-medium"
                        onClick={onCloseAction}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClothingItemDetailModal; 