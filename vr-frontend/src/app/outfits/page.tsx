"use client";

import LogOutButton from "../components/LogoutButton";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import CreateOutfitModal from '../../components/CreateOutfitModal';
import OutfitCard from '../../components/OutfitCard';

interface ClothingItem {
    id: string;
    name?: string;
    url: string;
    type?: string;
}

interface Outfit {
    id: string;
    clothingItems: ClothingItem[];
}

export default function OutfitsPage() {
    const router = useRouter();
    const [showCreateOutfitModal, setShowCreateOutfitModal] = useState(false);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loadingOutfits, setLoadingOutfits] = useState(true);

    const fetchOutfits = useCallback(async () => {
        setLoadingOutfits(true);
        try {
            const res = await fetch('http://localhost:8000/api/outfits', {
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch outfits: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setOutfits(data.outfits || []);

        } catch (error) {
            console.error('Error fetching outfits:', error);
        } finally {
            setLoadingOutfits(false);
        }
    }, []);

    useEffect(() => {
        fetchOutfits();
    }, [fetchOutfits]);

    const handleOutfitCreated = () => {
        fetchOutfits();
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Your Outfits</h1>
                <LogOutButton />
            </div>
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    ← Back to Closet/Wishlist
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 flex flex-col justify-center items-center"
                    onClick={() => setShowCreateOutfitModal(true)}
                >
                    <div className="text-4xl font-light">+</div>
                    <div className="text-lg">Add Outfit</div>
                </div>

                {loadingOutfits && <p>Loading outfits...</p>}

                {!loadingOutfits && outfits.length === 0 && (
                    <p>No outfits created yet.</p>
                )}
                {!loadingOutfits && outfits.length > 0 && (
                    outfits.map(outfit => (
                        <OutfitCard key={outfit.id} outfit={outfit} />
                    ))
                )}
            </div>

            <CreateOutfitModal 
                show={showCreateOutfitModal} 
                onClose={() => setShowCreateOutfitModal(false)} 
                onOutfitCreated={handleOutfitCreated}
            />
        </div>
    );
} 