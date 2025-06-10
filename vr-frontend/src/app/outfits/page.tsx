"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateOutfitModal from "../components/CreateOutfitModal";
import OutfitCard from "../components/OutfitCard";
import LogoutButton from "../components/LogoutButton";

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
    clothingItems: ClothingItem[];
    name?: string;
    occasion?: string;
    season?: string;
    notes?: string;
    price?: number;
}

export default function OutfitsPage() {
    const router = useRouter();
    const [showCreateOutfitModal, setShowCreateOutfitModal] = useState(false);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loadingOutfits, setLoadingOutfits] = useState(true);

    const fetchOutfits = useCallback(async () => {
        setLoadingOutfits(true);
        try {
            const res = await fetch("http://localhost:8000/api/outfits", {
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch outfits: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setOutfits(data.outfits || []);
        } catch (error) {
            console.error("Error fetching outfits:", error);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-8"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Your Outfits</h1>
                        <p className="text-slate-600 dark:text-slate-400">Create and manage your perfect outfit combinations</p>
                    </div>
                    <LogoutButton />
                </motion.div>

                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <Button onClick={() => router.push("/dashboard")} variant="outline" className="group">
                        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Back to Closet
                    </Button>
                </motion.div>

                {/* Outfits Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {/* Add Outfit Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <Card
                            className="h-80 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                            onClick={() => setShowCreateOutfitModal(true)}
                        >
                            <CardContent className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }} className="mb-4">
                                    <Plus className="w-12 h-12" />
                                </motion.div>
                                <h3 className="text-lg font-semibold mb-2">Create New Outfit</h3>
                                <p className="text-sm text-center opacity-75">Mix and match your clothing items</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Loading State */}
                    {loadingOutfits && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full flex items-center justify-center py-12"
                        >
                            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-lg">Loading your outfits...</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!loadingOutfits && outfits.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-full text-center py-12"
                        >
                            <div className="text-slate-400 dark:text-slate-500 mb-4">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Plus className="w-12 h-12" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No outfits yet</h3>
                                <p className="text-slate-500 dark:text-slate-400">Create your first outfit to get started</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Outfit Cards */}
                    <AnimatePresence>
                        {!loadingOutfits &&
                            outfits.length > 0 &&
                            outfits.map((outfit, index) => (
                                <motion.div
                                    key={outfit.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <OutfitCard outfit={outfit} />
                                </motion.div>
                            ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            <AnimatePresence>
                {showCreateOutfitModal && (
                    <CreateOutfitModal
                        show={showCreateOutfitModal}
                        onCloseAction={() => setShowCreateOutfitModal(false)}
                        onOutfitCreated={handleOutfitCreated}
                    />
                )}
            </AnimatePresence>
        </div>
    );
} 