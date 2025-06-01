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
}

interface ClothingItemSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    clothingItems: ClothingItem[];
    onSelectItem: (selectedItem: ClothingItem) => void;
}

const ClothingItemSelectModal: React.FC<ClothingItemSelectModalProps> = ({
    isOpen,
    onClose,
    clothingItems,
    onSelectItem,
}) => {
    const [filterText, setFilterText] = useState('');
    const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);

    useEffect(() => {
        setFilteredItems(clothingItems.filter(item =>
            item.name?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.type?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.brand?.toLowerCase().includes(filterText.toLowerCase()) ||
            ''.includes(filterText.toLowerCase())
        ));
    }, [filterText, clothingItems]);

    if (!isOpen) {
        return null;
    }

    const handleItemClick = (item: ClothingItem) => {
        onSelectItem(item);
        onClose();
    };

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

                <input
                    type="text"
                    placeholder="Search by name, type, or brand..."
                    className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.id} className="cursor-pointer" onClick={() => handleItemClick(item)}>
                            {item.id === 'none' ? (
                                <div className="w-full h-32 flex items-center justify-center border border-gray-600 rounded text-gray-400 text-center text-sm p-2">
                                    {item.name}
                                </div>
                            ) : (
                                <img
                                    src={item.url}
                                    alt={item.name || 'Clothing Item'}
                                    className="w-full h-32 object-cover rounded"
                                />
                            )}
                            
                            {! (item.id === 'none') && (
                                <p className="text-center text-sm mt-1 truncate">{item.name || 'Unnamed'}</p>
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