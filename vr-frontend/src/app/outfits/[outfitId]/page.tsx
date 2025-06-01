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
    const [filteredSelectItems, setFilteredSelectItems] = useState<ClothingItem[]>([]);
    const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const outfitRes = await axios.get(`http://localhost:8000/api/outfits/${outfitId}`, {
                    withCredentials: true,
                });
                setOutfit(outfitRes.data.outfit);
                setEditedOutfit(outfitRes.data.outfit);

                const clothingRes = await axios.get('http://localhost:8000/api/images/', {
                    withCredentials: true,
                });
                setAllClothingItems(clothingRes.data.clothingItems || []);

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

    const handleOpenSelectModal = (indexOrCategory: number | 'outerwear' | 'top' | 'bottom') => {
        let category: 'outerwear' | 'top' | 'bottom' | null = null;
        let itemType: string | undefined;

        if (typeof indexOrCategory === 'number') {
            if (!editedCategorizedItems) return;

            const allEditedItems = [
                editedCategorizedItems.outerwear,
                editedCategorizedItems.top,
                editedCategorizedItems.bottom,
                ...editedCategorizedItems.others,
            ].filter(item => item !== undefined) as ClothingItem[];

            if (allEditedItems.length <= indexOrCategory) return;

            const itemToReplace = allEditedItems[indexOrCategory];
            itemType = itemToReplace.type;
            setItemIndexToReplace(indexOrCategory);
            setCategoryToFill(null);

        } else {
            category = indexOrCategory;
            itemType = undefined;
            setItemIndexToReplace(null);
            setCategoryToFill(category);
        }

        const filteredList = allClothingItems.filter(item => {
            if (category) {
                return getItemCategory(item) === category;
            } else if (itemType) {
                return item.type?.toLowerCase() === itemType?.toLowerCase();
            } else {
                return false;
            }
        });
        
        if (category) {
            const noneOption: ClothingItem = {
                id: 'none',
                name: 'Select None',
                url: '',
                type: category,
            };
            setFilteredSelectItems([noneOption, ...filteredList]);
        } else {
             setFilteredSelectItems(filteredList);
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

        if (itemIndexToReplace !== null) {
            const allEditedItems = [
                updatedCategorizedItems.outerwear,
                updatedCategorizedItems.top,
                updatedCategorizedItems.bottom,
                ...updatedCategorizedItems.others,
            ].filter(item => item !== undefined) as ClothingItem[];

             if (itemIndexToReplace < allEditedItems.length) {
                const itemToReplace = allEditedItems[itemIndexToReplace];
                const category = getItemCategory(itemToReplace);

                if (category !== 'others') {
                     if (selectedItem.id === 'none') {
                         updatedCategorizedItems[category] = undefined;
                     } else {
                        updatedCategorizedItems[category] = selectedItem;
                     }
                } else {
                     if (selectedItem.id === 'none') {
                          updatedCategorizedItems.others = updatedCategorizedItems.others.filter(item => item.id !== itemToReplace.id);
                     } else {
                          const othersIndex = updatedCategorizedItems.others.findIndex(item => item.id === itemToReplace.id);
                          if(othersIndex !== -1) {
                             updatedCategorizedItems.others[othersIndex] = selectedItem;
                          }
                     }
                }
             }

        } else if (categoryToFill !== null) {
            if (selectedItem.id === 'none') {
                updatedCategorizedItems[categoryToFill] = undefined;
            } else {
                updatedCategorizedItems[categoryToFill] = selectedItem;
            }
        } else {
            return;
        }

        setEditedCategorizedItems(updatedCategorizedItems);
        handleCloseSelectModal();
    };

    const categorizeOutfitItems = (items: ClothingItem[]): CategorizedOutfitItems => {
        const categorized: CategorizedOutfitItems = { others: [] };
        items.forEach(item => {
            const category = getItemCategory(item);
            if (category === 'outerwear' && !categorized.outerwear) {
                categorized.outerwear = item;
            } else if (category === 'top' && !categorized.top) {
                categorized.top = item;
            } else if (category === 'bottom' && !categorized.bottom) {
                categorized.bottom = item;
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
                                                    handleOpenSelectModal(mainItemsCount + index);
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
                             <div className="flex flex-wrap gap-2">
                                 {itemsToDisplay.map((item, index) => (
                                      <div
                                          key={item.id}
                                          className="w-16 h-16 overflow-hidden rounded border border-gray-600 cursor-pointer hover:border-blue-500"
                                           onClick={() => handleOpenModal(index)}
                                      >
                                          <img
                                              src={item.url}
                                              alt={item.name || 'Clothing Item'}
                                              className="w-full h-full object-cover"
                                          />
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
                    clothingItems={filteredSelectItems}
                    onSelectItem={handleSelectItemForOutfit}
                />
            )}
        </div>
    );
} 