"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';

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

interface ClothingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clothingItems: ClothingItem[];
    initialItemIndex: number;
}

const ClothingModal: React.FC<ClothingModalProps> = ({
    isOpen,
    onClose,
    clothingItems,
    initialItemIndex,
}) => {
    const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
    const currentItem = clothingItems[currentItemIndex];

    useEffect(() => {
        setCurrentItemIndex(initialItemIndex);
    }, [initialItemIndex, clothingItems]);

    if (!isOpen || !currentItem) {
        return null;
    }

    const handlePrev = () => {
        setCurrentItemIndex(prevIndex =>
            prevIndex === 0 ? clothingItems.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentItemIndex(prevIndex =>
            prevIndex === clothingItems.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full relative text-white" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>

                <h2 className="text-xl font-bold mb-4 text-center">{currentItem.name || 'Clothing Item'}</h2>

                <img
                    src={currentItem.url}
                    alt={currentItem.name || 'Clothing Item'}
                    className="w-full h-auto object-contain rounded mb-4 max-h-[80vh]"
                />

                <div className="space-y-2 text-sm">
                    {currentItem.type && <p><span className="font-semibold">Type:</span> {currentItem.type}</p>}
                    {currentItem.brand && <p><span className="font-semibold">Brand:</span> {currentItem.brand}</p>}
                    {currentItem.occasion && <p><span className="font-semibold">Occasion:</span> {currentItem.occasion}</p>}
                    {currentItem.season && <p><span className="font-semibold">Season:</span> {currentItem.season}</p>}
                    {currentItem.price != null && <p><span className="font-semibold">Price:</span> ${currentItem.price.toFixed(2)}</p>}
                    {currentItem.notes && <p><span className="font-semibold">Notes:</span> {currentItem.notes}</p>}
                </div>

                {clothingItems.length > 1 && (
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={handlePrev}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} /> Previous
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                            Next <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClothingModal;