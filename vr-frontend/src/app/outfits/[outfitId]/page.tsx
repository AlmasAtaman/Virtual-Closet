"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, use, useCallback } from 'react';
import axios from 'axios';
import LogOutButton from '../../components/LogoutButton';
import ClothingModal from '../../components/ClothingModal';
import ClothingItemSelectModal from '../../components/ClothingItemSelectModal';

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

interface CategorizedOutfitItems {
    outerwear?: ClothingItem;
    top?: ClothingItem;
    bottom?: ClothingItem;
    others: ClothingItem[];
}

interface Outfit {
    id: string;
    name?: string;
    occasion?: string;
    season?: string;
    notes?: string;
    price?: number;
    totalPrice?: number;
    clothingItems: ClothingItem[];
}

interface OutfitDetailPageProps {
    params: Promise<{ outfitId: string }>;
}

export default function OutfitDetailPage({ params }: OutfitDetailPageProps) {
    const router = useRouter();
    const { outfitId } = use(params);
    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedOutfit, setEditedOutfit] = useState<Partial<Outfit>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);

    const [allClothingItems, setAllClothingItems] = useState<ClothingItem[]>([]);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [itemIndexToReplace, setItemIndexToReplace] = useState<number | null>(null);
    const [categoryToFill, setCategoryToFill] = useState<'outerwear' | 'top' | 'bottom' | null>(null);
    const [selectModalCategory, setSelectModalCategory] = useState<'outerwear' | 'top' | 'bottom' | null>(null);
    const [filteredSelectItems, setFilteredSelectItems] = useState<ClothingItem[]>([]);
    const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null);
    const [itemToReplaceFromOthers, setItemToReplaceFromOthers] = useState<ClothingItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const outfitRes = await axios.get(`http://localhost:8000/api/outfits/${outfitId}`, {
                    withCredentials: true,
                });
                console.log("→ Raw outfit data from backend:", outfitRes.data.outfit);

                const wishlistRes = await axios.get('http://localhost:8000/api/images?mode=wishlist', {
                    withCredentials: true,
                });
                const closetRes = await axios.get('http://localhost:8000/api/images?mode=closet', {
                    withCredentials: true,
                });

                const closetItems: ClothingItem[] = (closetRes.data.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'closet' }));
                const wishlistItems: ClothingItem[] = (wishlistRes.data.clothingItems || []).map((item: ClothingItem) => ({ ...item, mode: 'wishlist' }));

                const allItems = [...closetItems, ...wishlistItems];
                setAllClothingItems(allItems);

                // Map the outfit's clothing item IDs to full item objects including the mode
                console.log("→ Outfit item IDs before mapping:", outfitRes.data.outfit.clothingItems);
                console.log("→ IDs available in allItems:", allItems.map(item => item.id));
                const outfitClothingItemsWithMode = (outfitRes.data.outfit.clothingItems || [])
                    .map((itemObject: { id: string }) => allItems.find((item: ClothingItem) => item.id === itemObject.id))
                    .filter((item: ClothingItem | undefined): item is ClothingItem => item !== undefined) as ClothingItem[]; // Ensure only valid items are included and refine type
                console.log("→ Outfit items after mapping and filtering:", outfitClothingItemsWithMode.map(i => `${i.name} (${i.mode})`));

                const outfitWithFullItems = {
                    ...outfitRes.data.outfit,
                    clothingItems: outfitClothingItemsWithMode,
                };

                setOutfit(outfitWithFullItems);
                setEditedOutfit(outfitWithFullItems); // Also update editedOutfit with full items

            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        if (outfitId) {
            fetchData();
        }
    }, [outfitId]);

    const handleDeleteOutfit = async () => {
        if (!outfit) return;

        if (confirm(`Are you sure you want to delete this outfit${outfit.name ? `: ${outfit.name}` : ''}?`)) {
            try {
                await axios.delete(`http://localhost:8000/api/outfits/${outfit.id}`, {
                    withCredentials: true,
                });
                alert('Outfit deleted successfully!');
                router.push('/outfits');
            } catch (err: any) {
                console.error('Error deleting outfit:', err);
                alert(`Failed to delete outfit: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const handleEditOutfit = () => {
        setIsEditing(true);
        if (outfit) {
            setEditedCategorizedItems(categorizeOutfitItems(outfit.clothingItems));
        }
    };

    const handleSaveEdit = async () => {
        if (!outfit || !editedCategorizedItems) return;

        try {
            const clothingItemsToSave = [
                editedCategorizedItems.outerwear,
                editedCategorizedItems.top,
                editedCategorizedItems.bottom,
                ...editedCategorizedItems.others,
            ].filter(item => item !== undefined) as ClothingItem[];

            const outfitData = {
                ...editedOutfit,
                price: editedOutfit.price || editedOutfit.totalPrice,
                clothingItems: clothingItemsToSave.map(item => item.id)
            };

            const res = await axios.put(`http://localhost:8000/api/outfits/${outfit.id}`, outfitData, {
                withCredentials: true,
            });
            setOutfit(res.data.outfit);
            setEditedOutfit(res.data.outfit);
            setEditedCategorizedItems(categorizeOutfitItems(res.data.outfit.clothingItems));
            setIsEditing(false);
            alert('Outfit updated successfully!');
        } catch (err: any) {
            console.error('Error updating outfit:', err);
            alert(`Failed to update outfit: ${err.message || 'Unknown error'}`);
        }
    };

    const handleCancelEdit = () => {
        setEditedOutfit(outfit || {});
        if (outfit) {
            setEditedCategorizedItems(categorizeOutfitItems(outfit.clothingItems));
        }
        setIsEditing(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedOutfit(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOpenModal = (index: number) => {
        setSelectedItemIndex(index);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

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

    const handleOpenSelectModal = (param: 'outerwear' | 'top' | 'bottom' | ClothingItem) => {
        if (typeof param === 'string') {
            setSelectModalCategory(param);
            setItemToReplaceFromOthers(null);
        } else {
            setSelectModalCategory(null);
            setItemToReplaceFromOthers(param);
        }
        setIsSelectModalOpen(true);
    };

    const handleCloseSelectModal = () => {
        setIsSelectModalOpen(false);
        setItemIndexToReplace(null);
        setCategoryToFill(null);
        setFilteredSelectItems([]);
    };

    const handleSelectItemForOutfit = (selectedItem: ClothingItem) => {
        if (!editedCategorizedItems) return;

        let updatedCategorizedItems = { ...editedCategorizedItems };

        if (itemToReplaceFromOthers) {
            if (selectedItem.id === 'none') {
                updatedCategorizedItems.others = updatedCategorizedItems.others.filter(
                    item => item.id !== itemToReplaceFromOthers.id
                );
            } else {
                updatedCategorizedItems.others = updatedCategorizedItems.others.map(item => 
                    item.id === itemToReplaceFromOthers.id ? selectedItem : item
                );
            }
            setItemToReplaceFromOthers(null);
        } else if (selectModalCategory) {
            if (selectedItem.id === 'none') {
                 updatedCategorizedItems[selectModalCategory] = undefined;
            } else {
                 updatedCategorizedItems[selectModalCategory] = selectedItem;
            }
            setSelectModalCategory(null);
        }

        setEditedCategorizedItems(updatedCategorizedItems);
        handleCloseSelectModal();
    };

    const categorizeOutfitItems = (items: ClothingItem[]): CategorizedOutfitItems => {
        const categorized: CategorizedOutfitItems = { others: [] };
        items.forEach(item => {
            const category = getItemCategory(item);
            if (category === 'outerwear' || category === 'top' || category === 'bottom') {
                categorized[category] = item;
            } else {
                categorized.others.push(item);
            }
        });
        return categorized;
    };

    if (loading) {
        return <div className="container mx-auto p-4 text-white">Loading outfit...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
    }

    if (!outfit) {
        return <div className="container mx-auto p-4 text-white">Outfit not found.</div>;
    }

    const itemsToDisplay = isEditing && editedCategorizedItems ? 
        [editedCategorizedItems.outerwear, editedCategorizedItems.top, editedCategorizedItems.bottom, ...editedCategorizedItems.others].filter(item => item !== undefined) as ClothingItem[]
        : outfit?.clothingItems || [];

    const categorizedItemsForDisplay: {
        top?: ClothingItem;
        bottom?: ClothingItem;
        outerwear?: ClothingItem;
        others: ClothingItem[];
    } = isEditing && editedCategorizedItems ? editedCategorizedItems : {
        top: outfit?.clothingItems.find(item => ['t-shirt', 'dress', 'shirt', 'blouse'].includes(item.type?.toLowerCase() || '')),
        bottom: outfit?.clothingItems.find(item => ['pants', 'skirt', 'shorts', 'jeans', 'leggings'].includes(item.type?.toLowerCase() || '')),
        outerwear: outfit?.clothingItems.find(item => ['jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(item.type?.toLowerCase() || '')),
        others: outfit?.clothingItems.filter(item => ![/* list all categorized types here */ 't-shirt', 'dress', 'shirt', 'blouse', 'pants', 'skirt', 'shorts', 'jeans', 'leggings', 'jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(item.type?.toLowerCase() || '')) || [],
    };

    return (
        <div className="container mx-auto p-4 text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Outfit Details</h1>
                <LogOutButton />
            </div>
            <div className="mb-8">
                <button
                    onClick={() => router.push('/outfits')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    ← Back to Outfits
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center relative">
                    <h3 className="text-xl font-semibold mb-4">Outfit Visual</h3>
                    <div className="flex flex-col items-center w-full space-y-4">
                        {categorizedItemsForDisplay.outerwear && (
                            <img src={categorizedItemsForDisplay.outerwear.url} alt="Outerwear" className="w-2/3 h-auto object-contain rounded" />
                        )}
                        {categorizedItemsForDisplay.top && (
                            <img src={categorizedItemsForDisplay.top.url} alt="Top" className="w-2/3 h-auto object-contain rounded" />
                        )}
                        {categorizedItemsForDisplay.bottom && (
                            <img src={categorizedItemsForDisplay.bottom.url} alt="Bottom" className="w-2/3 h-auto object-contain rounded" />
                        )}
                        {categorizedItemsForDisplay.others.map(item => (
                            <img key={item.id} src={item.url} alt={item.name || 'Item'} className="w-1/3 h-auto object-contain rounded" />
                        ))}
                    </div>
                </div>

                <div>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2">Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editedOutfit.name || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Price:</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editedOutfit.price || editedOutfit.totalPrice || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Occasion:</label>
                                <select
                                    name="occasion"
                                    value={editedOutfit.occasion || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                >
                                    <option value="">Select Occasion</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Formal">Formal</option>
                                    <option value="Party">Party</option>
                                    <option value="Athletic">Athletic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2">Season:</label>
                                <select
                                    name="season"
                                    value={editedOutfit.season || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                >
                                    <option value="">Select Season</option>
                                    <option value="Spring">Spring</option>
                                    <option value="Summer">Summer</option>
                                    <option value="Fall">Fall</option>
                                    <option value="Winter">Winter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2">Notes:</label>
                                <textarea
                                    name="notes"
                                    value={editedOutfit.notes || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleSaveEdit}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {outfit.name && <h2 className="text-xl font-bold mb-4">Name: {outfit.name}</h2>}
                            <div className="space-y-2 mb-4">
                                {(outfit.price != null || outfit.totalPrice != null) && (
                                    <p>
                                        <span className="font-semibold">Price:</span> ${(outfit.price || outfit.totalPrice || 0).toFixed(2)}
                                    </p>
                                )}
                                {outfit.occasion && <p><span className="font-semibold">Occasion:</span> {outfit.occasion}</p>}
                                {outfit.season && <p><span className="font-semibold">Season:</span> {outfit.season}</p>}
                                {outfit.notes && <p><span className="font-semibold">Notes:</span> {outfit.notes}</p>}
                            </div>

                            <div className="flex space-x-4 mt-6">
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    onClick={handleEditOutfit}
                                >
                                    Edit
                                </button>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    onClick={handleDeleteOutfit}
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}

                    {isEditing && editedCategorizedItems && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Clothing Items:</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div
                                    className="w-24 h-24 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500 flex items-center justify-center text-gray-400"
                                    onClick={() => handleOpenSelectModal('outerwear')}
                                >
                                    {editedCategorizedItems.outerwear ? (
                                        <img
                                            src={editedCategorizedItems.outerwear.url}
                                            alt={editedCategorizedItems.outerwear.name || 'Outerwear'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>+ Add Outerwear</span>
                                    )}
                                </div>

                                <div
                                    className="w-24 h-24 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500 flex items-center justify-center text-gray-400"
                                    onClick={() => handleOpenSelectModal('top')}
                                >
                                    {editedCategorizedItems.top ? (
                                        <img
                                            src={editedCategorizedItems.top.url}
                                            alt={editedCategorizedItems.top.name || 'Top'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>+ Add Top</span>
                                    )}
                                </div>

                                <div
                                    className="w-24 h-24 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500 flex items-center justify-center text-gray-400"
                                    onClick={() => handleOpenSelectModal('bottom')}
                                >
                                    {editedCategorizedItems.bottom ? (
                                        <img
                                            src={editedCategorizedItems.bottom.url}
                                            alt={editedCategorizedItems.bottom.name || 'Bottom'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>+ Add Bottom</span>
                                    )}
                                </div>
                            </div>

                            {editedCategorizedItems.others.length > 0 && (
                                <div className="mt-4">
                                     <h4 className="font-semibold mb-2">Other Items:</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {editedCategorizedItems.others.map((item, index) => (
                                              <div
                                                  key={item.id}
                                                  className="w-16 h-16 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500"
                                                  onClick={() => {
                                                    const mainItemsCount = (editedCategorizedItems.outerwear ? 1 : 0) +
                                                                           (editedCategorizedItems.top ? 1 : 0) +
                                                                           (editedCategorizedItems.bottom ? 1 : 0);
                                                    handleOpenSelectModal(item);
                                                  }}
                                              >
                                                  <img
                                                      src={item.url}
                                                      alt={item.name || 'Item'}
                                                      className="w-full h-full object-cover"
                                                  />
                                              </div>
                                         ))}
                                     </div>
                                </div>
                             )}
                        </div>
                     )}

                     {!isEditing && itemsToDisplay && itemsToDisplay.length > 0 && (
                        <div className="mb-4">
                             <h3 className="font-semibold mb-2">Clothing Items:</h3>

                            {/* New multi-line wishlist warnings */}
                            <div className="mb-4 space-y-1">
                            {itemsToDisplay
                                .filter(item => item.mode === 'wishlist')
                                .map(item => (
                                <p key={item.id} className="text-red-500 text-sm text-left">
                                    {item.name} is from your wishlist.
                                </p>
                                ))}
                            </div>


                            <div className="flex flex-wrap gap-4">
                                {itemsToDisplay.map((item, index) => (
                                    <div key={item.id} className="flex flex-col items-center space-y-1">
                                        <div
                                            className="w-16 h-16 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500"
                                            onClick={() => handleOpenModal(index)}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name || 'Clothing Item'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                     )}
                </div>
            </div>

            <ClothingModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                clothingItems={outfit.clothingItems || []}
                initialItemIndex={selectedItemIndex}
            />

            {isSelectModalOpen && (
                <ClothingItemSelectModal
                    isOpen={isSelectModalOpen}
                    onClose={handleCloseSelectModal}
                    clothingItems={allClothingItems}
                    onSelectItem={handleSelectItemForOutfit}
                    viewMode={selectModalCategory ? 
                                (allClothingItems.filter(item => item.mode === 'closet' && getItemCategory(item) === selectModalCategory).length > 0 ? 'closet' : 'wishlist')
                                : 'closet'
                              }
                    selectedCategory={selectModalCategory}
                />
            )}
        </div>
    );
} 