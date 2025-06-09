"use client"

import { useEffect, useState, useRef, useCallback } from "react";
import LogOutButton from "../components/LogoutButton";
import UploadForm from "../components/UploadForm"; // Correctly importing UploadForm
import { useRouter } from "next/navigation";
import ClothingGallery from "../components/ClothingGallery";
import Image from "next/image";
import type { ClothingItem } from "../types/clothing";

export default function Homepage(){
    const [ username, setUsername ] = useState<string | null >(null);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const galleryRef = useRef<any>(null);
    const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet");

    // ALL REACT HOOKS (useState, useRef, useEffect, useCallback) MUST BE DECLARED AT THE TOP LEVEL
    // AND CALLED UNCONDITIONALLY ON EVERY RENDER.
    // This is the correct placement to avoid "Rules of Hooks" errors.

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, []);

    const handleUploadComplete = useCallback((target: "closet" | "wishlist", newItem: ClothingItem) => {
        setShowModal(false);
        console.log("Dashboard: onUploadComplete received - target:", target, "newItem:", newItem);
        setViewMode(target);
        console.log("Dashboard: viewMode after setViewMode:", viewMode);
        galleryRef.current?.addClothingItem(newItem);
    }, [galleryRef, viewMode]);

    const handleOpenUploadModal = useCallback(() => {
        setShowModal(true);
    }, []);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const res = await fetch("http://localhost:8000/api/auth/me", {
                credentials: "include"
            });

            if (!res.ok) {
                router.push("/login");
            } else {
                const data = await res.json();
                setUsername(data.username);
            }

            setLoading(false);
        };

        checkAuth();
    }, [router]);

    // Conditional return statements must come AFTER all hooks have been called.
    if (!hasMounted || loading) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section */}
            <header className="border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/VrClogo.png"
                            alt="VrC Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <span className="text-xl font-semibold tracking-tight">VrC</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/outfits')}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <span>👔</span>
                            <span>View Outfits</span>
                        </button>
                        <LogOutButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container px-4 py-6">
                {/* Action Bar */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* <h2 className="text-2xl font-semibold tracking-tight">Your Virtual Closet</h2> */}
                        <div className="h-6 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode("closet")}
                                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "closet"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                            >
                                My Closet
                            </button>
                            <button
                                onClick={() => setViewMode("wishlist")}
                                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "wishlist"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                            >
                                Wishlist
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenUploadModal} // Using the memoized function here
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <span>➕</span>
                        <span>Add Clothing</span>
                    </button>
                </div>

                {/* Gallery Section */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <ClothingGallery
                        ref={galleryRef}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        openUploadModal={handleOpenUploadModal} // Passing the memoized function
                    />
                </div>
            </main>

            <UploadForm
                isOpen={showModal}
                onCloseAction={handleCloseModal} // Using the memoized function
                onUploadComplete={handleUploadComplete} // Using the memoized function
                currentViewMode={viewMode}
            />
        </div>
    );
}