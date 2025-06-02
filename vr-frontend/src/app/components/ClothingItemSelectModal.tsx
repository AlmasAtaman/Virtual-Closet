"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

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
    key?: string;
    mode: 'closet' | 'wishlist';
}

// Helper function to determine the broad category of an item based on its type
const getItemCategory = (item: ClothingItem): 'top' | 'bottom' | 'outerwear' | 'others' => {
    const type = item.type?.toLowerCase() || '';
    if (['t-shirt', 'dress', 'shirt', 'blouse'].includes(type)) {
        return 'top';
    } else if (['pants', 'skirt', 'shorts', 'jeans', 'leggings'].includes(type)) {
        return 'bottom';
    } else if (['jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(type)) {
        return 'outerwear';
    } else {
        return 'others';
    }
};

interface ClothingItemSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    clothingItems: ClothingItem[];
    onSelectItem: (selectedItem: ClothingItem) => void;
    viewMode: 'closet' | 'wishlist';
    selectedCategory: 'outerwear' | 'top' | 'bottom' | null;
}

const ClothingItemSelectModal: React.FC<ClothingItemSelectModalProps> = ({
    isOpen,
    onClose,
    clothingItems,
    onSelectItem,
    viewMode,
    selectedCategory,
}) => {
    const [filterText, setFilterText] = useState('');
    const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
    const [currentModalViewMode, setCurrentModalViewMode] = useState<'closet' | 'wishlist'>(viewMode);

    useEffect(() => {
        if (!clothingItems) return;
    
        console.log("→ Current View Mode:", currentModalViewMode);
        console.log("→ Items passed to modal:", clothingItems.map(i => `${i.name} (${i.mode})`));
        console.log("→ Mode values of passed items:", clothingItems.map(i => i.mode));
    
        // Filter by category first, then by mode
        const itemsFilteredByCategory = selectedCategory ?
            clothingItems.filter(item => {
                const category = getItemCategory(item);
                console.log(`  Checking item: ${item.name} (Type: ${item.type}, Category: ${category}, Mode: ${item.mode}). Matches selectedCategory (${selectedCategory})? ${category === selectedCategory}`);
                return category === selectedCategory;
            }) :
            clothingItems; // If no category selected, use all items

        console.log("→ Filtered items after category match:", itemsFilteredByCategory.map(i => `${i.name} (${i.mode})`));

        const itemsToFilter = itemsFilteredByCategory.filter(item => item.mode?.toLowerCase() === currentModalViewMode);
    
        console.log("→ Filtered items after mode match:", itemsToFilter.map(i => i.name));
    
        setFilteredItems(itemsToFilter.filter(item =>
            item.name?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.type?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.brand?.toLowerCase().includes(filterText.toLowerCase()) ||
            ''.includes(filterText.toLowerCase())
        ));
    }, [filterText, clothingItems, currentModalViewMode, selectedCategory]);
    

    if (!isOpen) {
        return null;
    }

    const handleItemClick = (item: ClothingItem) => {
        onSelectItem(item);
        onClose();
    };

    // Prepend a 'None' option if a category is selected
    let itemsToShow = filteredItems;
    if (selectedCategory) {
        itemsToShow = [
            {
                id: 'none',
                name: 'None (Clear selection)',
                url: '',
                mode: currentModalViewMode,
                type: selectedCategory,
            } as ClothingItem,
            ...filteredItems,
        ];
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl max-h-[90vh] w-full relative text-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>

                <h2 className="text-xl font-bold mb-4">Select Clothing Item</h2>

                <div className="flex justify-center mb-4">
                    <button
                        className={`px-4 py-2 rounded-l ${currentModalViewMode === 'closet' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setCurrentModalViewMode('closet')}
                    >
                        Closet
                    </button>
                    <button
                        className={`px-4 py-2 rounded-r ${currentModalViewMode === 'wishlist' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setCurrentModalViewMode('wishlist')}
                    >
                        Wishlist
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search by name, type, or brand..."
                    className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {itemsToShow.map(item => (
                        <div key={item.id} className="cursor-pointer" onClick={() => handleItemClick(item)}>
                            {item.id === 'none' ? (
                                <div className="w-full h-32 flex items-center justify-center border border-gray-600 rounded text-gray-400 text-center text-sm p-2 bg-gray-900 hover:bg-gray-700 transition">
                                    {item.name}
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={item.url}
                                        alt={item.name || 'Clothing Item'}
                                        className="w-full h-32 object-cover rounded"
                                    />
                                    <p className="text-center text-sm mt-1 truncate">{item.name || 'Unnamed'}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                {filteredItems.length === 0 && <p className="text-center">No items found matching your search.</p>}
            </div>
        </div>
    );
};

export default ClothingItemSelectModal; 