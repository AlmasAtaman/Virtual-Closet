"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Loader2, Plus, Search } from "lucide-react";
import axios from "axios";
import { Folder } from "../types/clothing";
import Image from "next/image";
import { createPortal } from "react-dom";

interface AddToFolderDropdownProps {
  clothingItemId: string;
  onAddToFolder?: (folderId: string) => void;
  icon?: "plus" | "folderPlus";
}

export default function AddToFolderDropdown({
  clothingItemId,
  onAddToFolder,
  icon = "folderPlus",
}: AddToFolderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // For SSR safety - only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch folders when dropdown opens
  useEffect(() => {
    if (isOpen && folders.length === 0) {
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update position on scroll to keep modal with the button
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const handleScroll = () => {
      // Re-get the button position on scroll
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setButtonPosition({
          top: rect.bottom + 8,
          left: rect.left
        });
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders`,
        { withCredentials: true }
      );
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setAddingToFolder(folderId);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${folderId}/items`,
        { clothingId: clothingItemId },
        { withCredentials: true }
      );

      // Call callback if provided
      if (onAddToFolder) {
        onAddToFolder(folderId);
      }

      // Close dropdown after successful add
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } catch (error) {
      console.error("Error adding item to folder:", error);
      // Show error feedback
    } finally {
      setAddingToFolder(null);
    }
  };

  const isItemInFolder = (folder: Folder) => {
    return folder.previewItems.some(item => item.id === clothingItemId);
  };

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate folders into top choices and all boards
  // Only show top choices if there are 3 or more boards
  const showTopChoices = filteredFolders.length >= 3;
  const topChoices = showTopChoices ? filteredFolders.slice(0, 2) : [];
  const allBoards = filteredFolders;

  return (
    <>
      <button
        ref={buttonRef}
        className="p-1 rounded-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer z-50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          // Get button position for dropdown placement
          const rect = e.currentTarget.getBoundingClientRect();
          setButtonPosition({
            top: rect.bottom + 8, // 8px below the button
            left: rect.left
          });

          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-label="Add to folder"
        type="button"
      >
        {icon === "plus" ? (
          <Plus className="text-gray-500 dark:text-gray-300 w-6 h-6" />
        ) : (
          <FolderPlus className="text-gray-500 dark:text-gray-300 w-6 h-6" />
        )}
      </button>

      {mounted && isOpen && createPortal(
        <AnimatePresence>
          <div key="folder-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />

            {/* Pinterest-style Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[9999] w-[360px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                top: buttonPosition?.top ? `${buttonPosition.top}px` : '50%',
                left: buttonPosition?.left ? `${buttonPosition.left}px` : '50%',
                transform: !buttonPosition ? 'translate(-50%, -50%)' : 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[360px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : folders.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No folders yet. Create one to get started!
                  </div>
                ) : (
                  <>
                    {/* Top Choices Section */}
                    {topChoices.length > 0 && (
                      <div className="px-4 pb-3">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Top choices
                        </h3>
                        <div className="space-y-1">
                          {topChoices.map((folder) => {
                            const inFolder = isItemInFolder(folder);
                            const isAdding = addingToFolder === folder.id;

                            return (
                              <button
                                key={folder.id}
                                onClick={(e) => !inFolder && handleAddToFolder(folder.id, e)}
                                disabled={inFolder || isAdding}
                                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {/* Folder Preview */}
                                <div className="flex-shrink-0 w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                  {folder.previewItems.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-0.5 h-full p-0.5">
                                      {folder.previewItems.slice(0, 4).map((item, idx) => (
                                        <div key={idx} className="relative bg-gray-300 dark:bg-gray-600 rounded-sm overflow-hidden">
                                          <Image
                                            src={item.url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="22px"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>

                                {/* Folder Info */}
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {folder.name}
                                  </div>
                                </div>

                                {/* Save Button */}
                                {inFolder ? (
                                  <div className="px-3.5 py-1.5 bg-white dark:bg-white text-black text-xs font-semibold rounded-full border border-gray-300">
                                    Saved
                                  </div>
                                ) : isAdding ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : (
                                  <div className="px-3.5 py-1.5 bg-black dark:bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors">
                                    Save
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* All Boards Section */}
                    <div className="px-4 pb-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        All boards
                      </h3>
                      <div className="space-y-1">
                        {allBoards.map((folder) => {
                          const inFolder = isItemInFolder(folder);
                          const isAdding = addingToFolder === folder.id;

                          return (
                            <button
                              key={folder.id}
                              onClick={(e) => !inFolder && handleAddToFolder(folder.id, e)}
                              disabled={inFolder || isAdding}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {/* Folder Preview */}
                              <div className="flex-shrink-0 w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                {folder.previewItems.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-0.5 h-full p-0.5">
                                    {folder.previewItems.slice(0, 4).map((item, idx) => (
                                      <div key={idx} className="relative bg-gray-300 dark:bg-gray-600 rounded-sm overflow-hidden">
                                        <Image
                                          src={item.url}
                                          alt=""
                                          fill
                                          className="object-cover"
                                          sizes="22px"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              {/* Folder Info */}
                              <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {folder.name}
                                </div>
                              </div>

                              {/* Save Button */}
                              {inFolder ? (
                                <div className="px-3.5 py-1.5 bg-white dark:bg-white text-black text-xs font-semibold rounded-full border border-gray-300">
                                  Saved
                                </div>
                              ) : isAdding ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : (
                                <div className="px-3.5 py-1.5 bg-black dark:bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors">
                                  Save
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Create Board Button */}
                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open create folder modal
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 text-left font-semibold text-gray-900 dark:text-white text-sm">
                          Create board
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
