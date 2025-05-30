"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LogOutButton from '../../components/LogoutButton';

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

interface Outfit {
    id: string;
    name?: string;
    occasion?: string;
    season?: string;
    notes?: string;
    price?: number;
    clothingItems: ClothingItem[];
}

interface OutfitDetailPageProps {
    params: { outfitId: string };
}

export default function OutfitDetailPage({ params }: OutfitDetailPageProps) {
    const router = useRouter();
    const { outfitId } = params;
    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOutfit = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:8000/api/outfits/${outfitId}`, {
                    withCredentials: true,
                });
                setOutfit(res.data.outfit);
            } catch (err: any) {
                console.error('Error fetching outfit:', err);
                setError(err.message || 'Failed to fetch outfit');
            } finally {
                setLoading(false);
            }
        };

        if (outfitId) {
            fetchOutfit();
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
                router.push('/outfits'); // Navigate back to the outfits list
            } catch (err: any) {
                console.error('Error deleting outfit:', err);
                alert(`Failed to delete outfit: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const handleEditOutfit = () => {
        alert('Edit functionality not yet implemented.');
        // TODO: Implement outfit editing
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

    // Categorize clothing items for display
    const categorizedItems: {
        top?: ClothingItem;
        bottom?: ClothingItem;
        outerwear?: ClothingItem;
        others: ClothingItem[]; // For any items not categorized as top, bottom, or outerwear
    } = {
        top: outfit.clothingItems.find(item => ['t-shirt', 'dress', 'shirt', 'blouse'].includes(item.type?.toLowerCase() || '')),
        bottom: outfit.clothingItems.find(item => ['pants', 'skirt', 'shorts', 'jeans', 'leggings'].includes(item.type?.toLowerCase() || '')),
        outerwear: outfit.clothingItems.find(item => ['jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(item.type?.toLowerCase() || '')),
        others: outfit.clothingItems.filter(item => ![/* list all categorized types here */ 't-shirt', 'dress', 'shirt', 'blouse', 'pants', 'skirt', 'shorts', 'jeans', 'leggings', 'jacket', 'sweater', 'coat', 'hoodie', 'cardigan'].includes(item.type?.toLowerCase() || '')),
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
                {/* Left Column: Outfit Image Stack */}
                <div className="flex flex-col items-center relative">
                     {/* Reuse the stacking/layering logic from OutfitCard if desired, or simplify */}
                     {/* For simplicity, let's stack them vertically for now */}
                     {/* Adjust sizing and spacing as needed */}
                    <h3 className="text-xl font-semibold mb-4">Outfit Visual</h3>
                    <div className="flex flex-col items-center w-full space-y-4">
                         {categorizedItems.outerwear && (
                             <img src={categorizedItems.outerwear.url} alt="Outerwear" className="w-2/3 h-auto object-contain rounded" />
                         )}
                         {categorizedItems.top && (
                             <img src={categorizedItems.top.url} alt="Top" className="w-2/3 h-auto object-contain rounded" />
                         )}
                         {categorizedItems.bottom && (
                             <img src={categorizedItems.bottom.url} alt="Bottom" className="w-2/3 h-auto object-contain rounded" />
                         )}
                         {/* Display other items if any */} 
                         {categorizedItems.others.map(item => (
                              <img key={item.id} src={item.url} alt={item.name || 'Item'} className="w-1/3 h-auto object-contain rounded" />
                         ))}
                    </div>
                </div>

                {/* Right Column: Outfit Details */}
                <div>
                    {outfit.name && <h2 className="text-xl font-bold mb-4">Name: {outfit.name}</h2>}

                    <div className="space-y-2 mb-4">
                        {outfit.price != null && <p><span className="font-semibold">Price:</span> ${outfit.price.toFixed(2)}</p>}
                        {outfit.occasion && <p><span className="font-semibold">Occasion:</span> {outfit.occasion}</p>}
                        {outfit.season && <p><span className="font-semibold">Season:</span> {outfit.season}</p>}
                        {outfit.notes && <p><span className="font-semibold">Notes:</span> {outfit.notes}</p>}
                    </div>

                    {/* Clothing Items Section */}
                    {outfit.clothingItems.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Clothing Items:</h3>
                            <div className="flex flex-wrap gap-2">
                                {outfit.clothingItems.map(item => (
                                    <div key={item.id} className="w-16 h-16 overflow-hidden rounded border border-gray-600">
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

                    {/* Action Buttons */}
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
                </div>
            </div>
        </div>
    );
} 