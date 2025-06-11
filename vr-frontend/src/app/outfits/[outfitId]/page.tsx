"use client";

import type React from "react";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  AlertTriangle,
  Shirt,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LogoutButton from "../../components/LogoutButton";
import ClothingModal from "../../components/ClothingModal";
import ClothingItemSelectModal from "../../components/ClothingItemSelectModal";
import Image from "next/image";

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
  mode: "closet" | "wishlist";
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
  const [selectModalCategory, setSelectModalCategory] = useState<"outerwear" | "top" | "bottom" | null>(null);
  const [editedCategorizedItems, setEditedCategorizedItems] = useState<CategorizedOutfitItems | null>(null);
  const [itemToReplaceFromOthers, setItemToReplaceFromOthers] = useState<ClothingItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [outfitRes, wishlistRes, closetRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/outfits/${outfitId}`, { withCredentials: true }),
          axios.get("http://localhost:8000/api/images?mode=wishlist", { withCredentials: true }),
          axios.get("http://localhost:8000/api/images?mode=closet", { withCredentials: true }),
        ]);

        const closetItems: ClothingItem[] = (closetRes.data.clothingItems || []).map((item: ClothingItem) => ({
          ...item,
          mode: "closet",
        }));
        const wishlistItems: ClothingItem[] = (wishlistRes.data.clothingItems || []).map((item: ClothingItem) => ({
          ...item,
          mode: "wishlist",
        }));
        const allItems = [...closetItems, ...wishlistItems];
        setAllClothingItems(allItems);

        const outfitClothingItemsWithMode = (outfitRes.data.outfit.clothingItems || [])
          .map((itemObject: { id: string }) => allItems.find((item: ClothingItem) => item.id === itemObject.id))
          .filter((item: ClothingItem | undefined): item is ClothingItem => item !== undefined) as ClothingItem[];

        const outfitWithFullItems = {
          ...outfitRes.data.outfit,
          clothingItems: outfitClothingItemsWithMode,
        };

        setOutfit(outfitWithFullItems);
        setEditedOutfit(outfitWithFullItems);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
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

    if (confirm(`Are you sure you want to delete this outfit${outfit.name ? `: ${outfit.name}` : ""}?`)) {
      try {
        await axios.delete(`http://localhost:8000/api/outfits/${outfit.id}`, {
          withCredentials: true,
        });
        router.push("/outfits");
      } catch (err: any) {
        console.error("Error deleting outfit:", err);
        alert(`Failed to delete outfit: ${err.message || "Unknown error"}`);
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
      ].filter((item) => item !== undefined) as ClothingItem[];

      const outfitData = {
        ...editedOutfit,
        price: editedOutfit.price || editedOutfit.totalPrice,
        clothingItems: clothingItemsToSave.map((item) => item.id),
      };

      const res = await axios.put(`http://localhost:8000/api/outfits/${outfit.id}`, outfitData, {
        withCredentials: true,
      });

      const updatedOutfitWithFullItems = {
        ...res.data.outfit,
        clothingItems: clothingItemsToSave,
      };

      setOutfit(updatedOutfitWithFullItems);
      setEditedOutfit(updatedOutfitWithFullItems);
      setEditedCategorizedItems(categorizeOutfitItems(clothingItemsToSave));
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating outfit:", err);
      alert(`Failed to update outfit: ${err.message || "Unknown error"}`);
    }
  };

  const handleCancelEdit = () => {
    setEditedOutfit(outfit || {});
    if (outfit) {
      setEditedCategorizedItems(categorizeOutfitItems(outfit.clothingItems));
    }
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedOutfit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedOutfit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenModal = (index: number) => {
    setSelectedItemIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getItemCategory = (item: ClothingItem): "top" | "bottom" | "outerwear" | "others" => {
    const type = item.type?.toLowerCase() || "";
    if (["t-shirt", "dress", "shirt", "blouse"].includes(type)) {
      return "top";
    } else if (["pants", "skirt", "shorts", "jeans", "leggings"].includes(type)) {
      return "bottom";
    } else if (["jacket", "sweater", "coat", "hoodie", "cardigan"].includes(type)) {
      return "outerwear";
    } else {
      return "others";
    }
  };

  const handleOpenSelectModal = (param: "outerwear" | "top" | "bottom" | ClothingItem) => {
    if (typeof param === "string") {
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
    setSelectModalCategory(null);
    setItemToReplaceFromOthers(null);
  };

  const handleSelectItemForOutfit = (selectedItem: ClothingItem) => {
    if (!editedCategorizedItems) return;

    const updatedCategorizedItems = { ...editedCategorizedItems };

    if (itemToReplaceFromOthers) {
      if (selectedItem.id === "none") {
        updatedCategorizedItems.others = updatedCategorizedItems.others.filter(
          (item) => item.id !== itemToReplaceFromOthers.id,
        );
      } else {
        updatedCategorizedItems.others = updatedCategorizedItems.others.map((item) =>
          item.id === itemToReplaceFromOthers.id ? selectedItem : item,
        );
      }
      setItemToReplaceFromOthers(null);
    } else if (selectModalCategory) {
      if (selectedItem.id === "none") {
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
    items.forEach((item) => {
      const category = getItemCategory(item);
      if (category === "outerwear" || category === "top" || category === "bottom") {
        categorized[category] = item;
      } else {
        categorized.others.push(item);
      }
    });
    return categorized;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading outfit details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Outfit not found</h2>
          <p className="text-slate-600 dark:text-slate-400">The outfit you're looking for doesn't exist.</p>
        </motion.div>
      </div>
    );
  }

  const itemsToDisplay =
    isEditing && editedCategorizedItems
      ? ([
          editedCategorizedItems.outerwear,
          editedCategorizedItems.top,
          editedCategorizedItems.bottom,
          ...editedCategorizedItems.others,
        ].filter((item) => item !== undefined) as ClothingItem[])
      : outfit?.clothingItems || [];

  const categorizedItemsForDisplay: CategorizedOutfitItems =
    isEditing && editedCategorizedItems ? editedCategorizedItems : categorizeOutfitItems(outfit.clothingItems);

  const wishlistItems = itemsToDisplay.filter((item) => item.mode === "wishlist");

  // Categorize items for the preview (same as OutfitCard)
  const categorizedItems = {
    tops: outfit.clothingItems.filter((item) =>
      ["t-shirt", "dress", "shirt", "blouse"].includes(item.type?.toLowerCase() || ""),
    ),
    bottoms: outfit.clothingItems.filter((item) =>
      ["pants", "skirt", "shorts", "jeans", "leggings"].includes(item.type?.toLowerCase() || ""),
    ),
    outerwear: outfit.clothingItems.filter((item) =>
      ["jacket", "sweater", "coat", "hoodie", "cardigan"].includes(item.type?.toLowerCase() || ""),
    ),
    others: outfit.clothingItems.filter(
      (item) =>
        ![
          "t-shirt",
          "dress",
          "shirt",
          "blouse",
          "pants",
          "skirt",
          "shorts",
          "jeans",
          "leggings",
          "jacket",
          "sweater",
          "coat",
          "hoodie",
          "cardigan",
        ].includes(item.type?.toLowerCase() || ""),
    ),
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
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back to Outfits Navigation Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button onClick={() => router.push("/outfits")} variant="outline" className="group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Outfits
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outfit Visual - Using same layout as OutfitCard */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shirt className="w-5 h-5" />
                  <span>Outfit Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 flex items-center justify-center rounded-xl">
                  {/* Outfit Image Collage - Same as OutfitCard */}
                  <div className="relative w-44 h-80 mx-auto">
                    {/* Bottom (pants) */}
                    {categorizedItems.bottoms[0] && (
                      <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        src={categorizedItems.bottoms[0].url}
                        alt="Bottom"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 z-10"
                      />
                    )}

                    {/* Top (shirt) */}
                    {categorizedItems.tops[0] && (
                      <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        src={categorizedItems.tops[0].url}
                        alt="Top"
                        className="absolute bottom-[8.4rem] left-1/2 -translate-x-1/2 w-36 z-20"
                      />
                    )}

                    {/* Outerwear */}
                    {categorizedItems.outerwear[0] && (
                      <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        src={categorizedItems.outerwear[0].url}
                        alt="Outerwear"
                        className="absolute bottom-[9rem] left-[40%] w-[8rem] z-5"
                      />
                    )}

                    {/* Others/Accessories indicator */}
                    {categorizedItems.others.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute top-2 right-2"
                      >
                        <Badge variant="outline" className="text-xs">
                          +{categorizedItems.others.length} accessories
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  {/* Fallback if no images */}
                  {categorizedItems.tops.length === 0 &&
                    categorizedItems.bottoms.length === 0 &&
                    categorizedItems.outerwear.length === 0 && (
                      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <div className="text-center">
                          <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No items</p>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Outfit Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Main Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Outfit Information</CardTitle>
                  {!isEditing && (
                    <div className="flex space-x-2">
                      <Button onClick={handleEditOutfit} variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button onClick={handleDeleteOutfit} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Name
                      </label>
                      <Input
                        name="name"
                        value={editedOutfit.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter outfit name"
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Price
                      </label>
                      <Input
                        type="number"
                        name="price"
                        value={editedOutfit.price || editedOutfit.totalPrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Occasion
                      </label>
                      <Select
                        value={editedOutfit.occasion || ""}
                        onValueChange={(value: string) => handleSelectChange("occasion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select occasion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Party">Party</SelectItem>
                          <SelectItem value="Athletic">Athletic</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Season
                      </label>
                      <Select
                        value={editedOutfit.season || ""}
                        onValueChange={(value: string) => handleSelectChange("season", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="Winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-h-[128px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                      <Textarea
                        name="notes"
                        value={editedOutfit.notes || ""}
                        onChange={handleInputChange}
                        placeholder="Add any notes about this outfit..."
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button onClick={handleSaveEdit} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Name
                      </label>
                      <span className="block h-10 flex items-center px-3 rounded-md border border-input bg-background text-slate-900 dark:text-white shadow-sm">
                        {outfit.name || "None"}
                      </span>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Price
                      </label>
                      <span className="block h-10 flex items-center px-3 rounded-md border border-input bg-background text-green-600 dark:text-green-400 font-semibold shadow-sm">
                        ${(outfit.price || outfit.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Occasion
                      </label>
                      <Badge variant="secondary" className="h-10 flex items-center px-3 border border-input bg-background shadow-sm">
                        {outfit.occasion || "None"}
                      </Badge>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Season
                      </label>
                      <Badge variant="outline" className="h-10 flex items-center px-3 border border-input bg-background shadow-sm">
                        {outfit.season || "None"}
                      </Badge>
                    </div>

                    <div className="min-h-[128px]">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg min-h-[96px]">
                        {outfit.notes || "None"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clothing Items Display */}
            {!isEditing && itemsToDisplay.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Clothing Items ({itemsToDisplay.length})</span>
                    <Badge variant="outline">{itemsToDisplay.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {itemsToDisplay.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          className="h-20 cursor-pointer hover:shadow-md transition-shadow relative"
                          onClick={() => handleOpenModal(index)}
                        >
                          <CardContent className="h-full flex items-center justify-center p-1">
                            <img
                              src={item.url || "/placeholder.svg"}
                              alt={item.name || "Clothing Item"}
                              className="w-full h-full object-contain"
                            />
                            {item.mode === "wishlist" && (
                              <Badge className="absolute -top-1 -right-1 text-xs bg-amber-500">W</Badge>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wishlist Warning */}
            {wishlistItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 mt-6">
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                            <div className="space-y-1">
                                <p className="font-medium">Some items are from your wishlist:</p>
                                {wishlistItems.map((item) => (
                                    <p key={item.id} className="text-sm">
                                        • {item.name || "Unnamed item"}
                                    </p>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <ClothingModal
            isOpen={isModalOpen}
            onCloseAction={handleCloseModal}
            clothingItems={outfit.clothingItems || []}
            initialItemIndex={selectedItemIndex}
          />
        )}

        {isSelectModalOpen && (
          <ClothingItemSelectModal
            isOpen={isSelectModalOpen}
            onCloseAction={handleCloseSelectModal}
            clothingItems={allClothingItems}
            onSelectItem={handleSelectItemForOutfit}
            viewMode={
              selectModalCategory
                ? allClothingItems.filter(
                    (item) => item.mode === "closet" && getItemCategory(item) === selectModalCategory,
                  ).length > 0
                  ? "closet"
                  : "wishlist"
                : "closet"
            }
            selectedCategory={selectModalCategory}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 