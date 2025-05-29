"use client";

import LogOutButton from "../components/LogoutButton";
import { useRouter } from "next/navigation";

export default function OutfitsPage() {
    const router = useRouter();

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
            {/* Outfit display area goes here */}
        </div>
    );
} 