"use client"

import { useEffect, useState, useRef } from "react";
import LogOutButton from "../components/LogoutButton";
import UploadModal from "../components/UploadModal";
import { useRouter } from "next/navigation";
import ClothingGallery from "../components/ClothingGallery";
import Image from "next/image";



export default function Homepage(){
    const [ username, setUsername ] = useState<string | null >(null);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const galleryRef = useRef<any>(null);
    const [viewMode, setViewMode] = useState<"closet" | "wishlist">("closet");

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
                setUsername(data.username); // check if /me route makes it correct
            }

            setLoading(false);
        };

        checkAuth();
    }, [router]);

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
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <span>➕</span>
                        <span>Add Clothing</span>
                    </button>
                </div>

                {/* Gallery Section */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <ClothingGallery ref={galleryRef} viewMode={viewMode} setViewMode={setViewMode} />
                </div>
            </main>

            <UploadModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onUploadComplete={(target, newItem) => {
                    setShowModal(false);
                    console.log("Dashboard: onUploadComplete received - target:", target, "newItem:", newItem);
                    setViewMode(target);
                    console.log("Dashboard: viewMode after setViewMode:", viewMode);
                    galleryRef.current?.addClothingItem(newItem);
                }}
                currentViewMode={viewMode}
            />
        </div>
    );
}


