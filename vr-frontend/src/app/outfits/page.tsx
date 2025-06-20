"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, Loader2, FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateOutfitModal from "../components/CreateOutfitModal";
import OutfitCard from "../components/OutfitCard";
import LogoutButton from "../components/LogoutButton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

interface Occasion {
    id: string;
    name: string;
    outfits: Outfit[];
}

export default function OutfitsPage() {
    const router = useRouter();
    const [showCreateOutfitModal, setShowCreateOutfitModal] = useState(false);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loadingOutfits, setLoadingOutfits] = useState(true);
    const [viewMode, setViewMode] = useState<'outfits' | 'occasions'>('outfits');
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [loadingOccasions, setLoadingOccasions] = useState(false);
    const [showCreateOccasion, setShowCreateOccasion] = useState(false);
    const [newOccasionName, setNewOccasionName] = useState("");
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignOccasionId, setAssignOccasionId] = useState<string | null>(null);
    const [assignSelected, setAssignSelected] = useState<string[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [folderDetail, setFolderDetail] = useState<Occasion | null>(null);
    const [createStep, setCreateStep] = useState<1 | 2>(1);
    const [newOccasionId, setNewOccasionId] = useState<string | null>(null);
    const [createAssignSelected, setCreateAssignSelected] = useState<string[]>([]);

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

    const fetchOccasions = useCallback(async () => {
        setLoadingOccasions(true);
        try {
            const res = await fetch("http://localhost:8000/api/occasions", {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch occasions");
            const data = await res.json();
            setOccasions(data.occasions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOccasions(false);
        }
    }, []);

    useEffect(() => {
        if (viewMode === 'outfits') fetchOutfits();
        else fetchOccasions();
    }, [viewMode, fetchOutfits, fetchOccasions]);

    const handleOutfitCreated = () => {
        fetchOutfits();
    };

    const handleCreateOccasion = async () => {
        if (!newOccasionName.trim()) return;
        try {
            const res = await fetch("http://localhost:8000/api/occasions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: newOccasionName.trim() })
            });
            if (!res.ok) throw new Error("Failed to create occasion");
            const occasion = await res.json();
            setNewOccasionId(occasion.id);
            setCreateStep(2);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateAssign = async () => {
        if (!newOccasionId) return;
        try {
            await fetch("http://localhost:8000/api/occasions/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ occasionId: newOccasionId, outfitIds: createAssignSelected })
            });
            setShowCreateOccasion(false);
            setNewOccasionName("");
            setCreateStep(1);
            setNewOccasionId(null);
            setCreateAssignSelected([]);
            fetchOccasions();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteOccasion = async (id: string) => {
        if (!window.confirm("Delete this occasion folder?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/occasions/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete occasion");
            fetchOccasions();
        } catch (e) {
            console.error(e);
        }
    };

    // Open assign modal for an occasion
    const openAssignModal = (occasion: Occasion) => {
        setAssignOccasionId(occasion.id);
        setAssignSelected(occasion.outfits.map(o => o.id));
        setAssignModalOpen(true);
    };
    // Save assignments
    const handleAssignSave = async () => {
        if (!assignOccasionId) return;
        setAssignLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/occasions/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ occasionId: assignOccasionId, outfitIds: assignSelected })
            });
            if (!res.ok) throw new Error("Failed to assign outfits");
            setAssignModalOpen(false);
            setAssignOccasionId(null);
            fetchOccasions();
        } catch (e) {
            console.error(e);
        } finally {
            setAssignLoading(false);
        }
    };

    // Open folder detail view
    const openFolderDetail = (occasion: Occasion) => {
        setFolderDetail(occasion);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Dashboard Header */}
            <header className="border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Image src="/VrClogo.png" alt="VrC Logo" width={32} height={32} className="h-8 w-8" />
                        <span className="text-xl font-semibold tracking-tight">VrC</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Removed the 'View Outfits' button that was here */}
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Back to Closet Navigation Button */}
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

                {/* Toggle between Outfits and Occasions */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant={viewMode === 'outfits' ? 'default' : 'outline'}
                        onClick={() => setViewMode('outfits')}
                    >
                        Outfits
                    </Button>
                    <Button
                        variant={viewMode === 'occasions' ? 'default' : 'outline'}
                        onClick={() => setViewMode('occasions')}
                    >
                        Occasions
                    </Button>
                </div>

                {/* Outfits or Occasions grid */}
                {viewMode === 'outfits' ? (
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
                                className="h-[32rem] cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
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
                ) : folderDetail ? (
                    <div>
                        <Button variant="ghost" className="mb-4" onClick={() => setFolderDetail(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Folders
                        </Button>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <FolderPlus className="w-6 h-6" /> {folderDetail.name}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {folderDetail.outfits.length === 0 ? (
                                <div className="col-span-full text-center text-slate-400">No outfits in this folder.</div>
                            ) : (
                                folderDetail.outfits.map((outfit) => (
                                    <Card key={outfit.id} className="p-2 flex flex-col items-center">
                                        <div className="w-28 h-28 rounded-lg overflow-hidden mb-2 border">
                                            {outfit.clothingItems[0]?.url ? (
                                                <img src={outfit.clothingItems[0].url} alt="Outfit" className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-center truncate w-full">{outfit.name || `Outfit #${outfit.id.slice(-4)}`}</span>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                    >
                        {/* Add Occasion Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Card
                                className="h-48 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center"
                                onClick={() => setShowCreateOccasion(true)}
                            >
                                <CardContent className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <FolderPlus className="w-10 h-10 mb-2" />
                                    <h3 className="text-base font-semibold mb-1">Create New Occasion</h3>
                                </CardContent>
                            </Card>
                        </motion.div>
                        {/* Loading State */}
                        {loadingOccasions && (
                            <motion.div className="col-span-full flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span className="text-lg">Loading occasions...</span>
                            </motion.div>
                        )}
                        {/* Empty State */}
                        {!loadingOccasions && occasions.length === 0 && (
                            <motion.div className="col-span-full text-center py-12">
                                <div className="text-slate-400 dark:text-slate-500 mb-4">
                                    <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <FolderPlus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">No occasions yet</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Create your first occasion folder</p>
                                </div>
                            </motion.div>
                        )}
                        {/* Occasion Cards */}
                        <AnimatePresence>
                            {!loadingOccasions && occasions.length > 0 && occasions.map((occasion, idx) => (
                                <motion.div
                                    key={occasion.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -3 }}
                                >
                                    <Card className="h-48 relative group flex flex-col items-center justify-between p-3 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openFolderDetail(occasion)}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-2 right-2 z-10 opacity-60 hover:opacity-100"
                                            onClick={e => { e.stopPropagation(); handleDeleteOccasion(occasion.id); }}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                        <div className="font-semibold text-base mb-1 flex items-center gap-2 w-full truncate">
                                            <span className="truncate">{occasion.name}</span>
                                        </div>
                                        <div className="flex -space-x-3 mb-1">
                                            {occasion.outfits.slice(0, 3).map((outfit) => (
                                                <div key={outfit.id} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow">
                                                    {outfit.clothingItems[0]?.url ? (
                                                        <img src={outfit.clothingItems[0].url} alt="Outfit" className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                                                    )}
                                                </div>
                                            ))}
                                            {occasion.outfits.length === 0 && (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400 border">Empty</div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{occasion.outfits.length} outfit{occasion.outfits.length !== 1 ? 's' : ''}</span>
                                        <Button size="sm" variant="outline" className="w-full mt-1" onClick={e => { e.stopPropagation(); openAssignModal(occasion); }}>
                                            Assign Outfits
                                        </Button>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
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

            {/* Create Occasion Modal (two-step) */}
            <AnimatePresence>
                {showCreateOccasion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-lg">
                            {createStep === 1 ? (
                                <>
                                    <h3 className="text-lg font-semibold mb-4">Create New Occasion</h3>
                                    <Input
                                        placeholder="Occasion name"
                                        value={newOccasionName}
                                        onChange={e => setNewOccasionName(e.target.value)}
                                        className="mb-4"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="ghost" onClick={() => { setShowCreateOccasion(false); setNewOccasionName(""); setCreateStep(1); }}>Cancel</Button>
                                        <Button onClick={handleCreateOccasion} disabled={!newOccasionName.trim()}>Create</Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold mb-4">Add Outfits to Occasion</h3>
                                    <div className="mb-4 text-sm text-slate-500">Select outfits to add to your new occasion folder.</div>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                        {outfits.length === 0 ? (
                                            <div className="col-span-full text-slate-400 text-center">No outfits available</div>
                                        ) : (
                                            outfits.map((outfit) => (
                                                <button
                                                    type="button"
                                                    key={outfit.id}
                                                    className={cn(
                                                        "relative w-16 h-16 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all",
                                                        createAssignSelected.includes(outfit.id)
                                                            ? "border-blue-500 ring-2 ring-blue-300"
                                                            : "border-slate-200 hover:border-blue-300"
                                                    )}
                                                    onClick={() => setCreateAssignSelected(sel => sel.includes(outfit.id) ? sel.filter(id => id !== outfit.id) : [...sel, outfit.id])}
                                                >
                                                    {outfit.clothingItems[0]?.url ? (
                                                        <img src={outfit.clothingItems[0].url} alt="Outfit" className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                                                    )}
                                                    {createAssignSelected.includes(outfit.id) && (
                                                        <span className="absolute top-1 right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">✓</span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="ghost" onClick={() => { setShowCreateOccasion(false); setNewOccasionName(""); setCreateStep(1); setNewOccasionId(null); setCreateAssignSelected([]); }}>Cancel</Button>
                                        <Button onClick={handleCreateAssign}>Finish</Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assign Outfits Modal (outfits grid selection) */}
            <AnimatePresence>
                {assignModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-lg">
                            <h3 className="text-lg font-semibold mb-4">Assign Outfits to Occasion</h3>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                {outfits.length === 0 ? (
                                    <div className="col-span-full text-slate-400 text-center">No outfits available</div>
                                ) : (
                                    outfits.map((outfit) => (
                                        <button
                                            type="button"
                                            key={outfit.id}
                                            className={cn(
                                                "relative w-16 h-16 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all",
                                                assignSelected.includes(outfit.id)
                                                    ? "border-blue-500 ring-2 ring-blue-300"
                                                    : "border-slate-200 hover:border-blue-300"
                                            )}
                                            onClick={() => setAssignSelected(sel => sel.includes(outfit.id) ? sel.filter(id => id !== outfit.id) : [...sel, outfit.id])}
                                        >
                                            {outfit.clothingItems[0]?.url ? (
                                                <img src={outfit.clothingItems[0].url} alt="Outfit" className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                                            )}
                                            {assignSelected.includes(outfit.id) && (
                                                <span className="absolute top-1 right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">✓</span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setAssignModalOpen(false)} disabled={assignLoading}>Cancel</Button>
                                <Button onClick={handleAssignSave} disabled={assignLoading}>
                                    {assignLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 