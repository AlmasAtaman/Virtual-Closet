"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Loader2, Plus, Search } from "lucide-react";
import axios from "axios";
import { Folder } from "../types/clothing";
import Image from "next/image";
import { createPortal } from "react-dom";
import CreateFolderModal from "./dashboard/CreateFolderModal";

interface AddToFolderDropdownProps {
  clothingItemId: string;
  onAddToFolder?: (folderId: string) => void;
  icon?: "plus" | "folderPlus";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddToFolderDropdown({
  clothingItemId,
  onAddToFolder,
  icon = "folderPlus",
  open: controlledOpen,
  onOpenChange,
}: AddToFolderDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Wrapper to update both local and parent state
  const updateOpenState = (newState: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newState);
    }
    onOpenChange?.(newState);
  };
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentlyAddedTo, setRecentlyAddedTo] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [addedFolderIds, setAddedFolderIds] = useState<Set<string>>(new Set());

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

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 360;
    const viewportWidth = window.innerWidth;

    let left = rect.left;

    // If dropdown would overflow right edge, align to right of button
    if (left + dropdownWidth > viewportWidth - 20) {
      left = rect.right - dropdownWidth;
    }

    // Ensure it doesn't go off screen
    left = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10));

    setButtonPosition({
      top: rect.bottom + 8,
      left: left
    });
  };

  // Update position on scroll/resize to keep modal with the button
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      // Don't update position if scrolling inside the modal
      const target = e.target as HTMLElement;
      if (target.closest('[data-folder-dropdown]')) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);

    // Initial position update
    updatePosition();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
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
      setRecentlyAddedTo(response.data.recentlyAddedTo || []);
    } catch {
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

      // Track that we've added this item to this folder
      setAddedFolderIds((prev) => new Set([...prev, folderId]));

      // Update recently added-to folders
      const addedFolder = folders.find(f => f.id === folderId);
      if (addedFolder) {
        setRecentlyAddedTo((prev) => {
          const filtered = prev.filter(f => f.id !== folderId);
          return [addedFolder, ...filtered].slice(0, 3);
        });
      }

      // Call callback if provided
      if (onAddToFolder) {
        onAddToFolder(folderId);
      }
    } catch {
      // Show error feedback
    } finally {
      setAddingToFolder(null);
    }
  };

  const handleCreateFolder = async (data: { name: string; description?: string }) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders`,
        { ...data, isPublic: false },
        { withCredentials: true }
      );

      const newFolder = response.data.folder;
      setFolders((prev) => [newFolder, ...prev]);
      // Add to recently added-to since we're about to add an item to it
      setRecentlyAddedTo((prev) => {
        const filtered = prev.filter(f => f.id !== newFolder.id);
        return [newFolder, ...filtered].slice(0, 3);
      });

      // Close create modal
      setIsCreateModalOpen(false);

      // Automatically add the item to the new folder
      // We pass a synthetic event since we're calling it programmatically
      const syntheticEvent = { stopPropagation: () => { } } as React.MouseEvent;
      handleAddToFolder(newFolder.id, syntheticEvent);
    } catch {
      // You might want to add error handling state here
    }
  };

  const isItemInFolder = (folder: Folder) => {
    // Check both the folder's previewItems and our local tracking of added folders
    return folder.previewItems.some(item => item.id === clothingItemId) || addedFolderIds.has(folder.id);
  };

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter recently added-to folders based on search query
  const filteredRecentlyAddedTo = recentlyAddedTo.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Only show top choices if we have recently added-to folders and no search query
  const showTopChoices = filteredRecentlyAddedTo.length > 0 && searchQuery === "";
  const topChoices = showTopChoices ? filteredRecentlyAddedTo : [];
  const allBoards = filteredFolders;

  return (
    <>
      <button
        ref={buttonRef}
        className={`p-1 rounded-full hover:scale-110 transition-all duration-300 cursor-pointer relative ${isOpen ? 'z-[10000]' : 'z-50'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!isOpen) {
            // We are opening it, so calculate position immediately
            // We can't rely on the effect because it runs after render
            // But we can call the same logic logic here or just set isOpen and let the effect handle it?
            // The effect runs after render, so there might be a flash.
            // Better to calculate here.

            // Wait, we can't call updatePosition() here easily because it relies on buttonRef.current which is set,
            // but updatePosition is defined in the component scope.
            // Yes we can call it.

            // Actually, let's just set isOpen(!isOpen).
            // If we are opening (isOpen is false -> true), the effect will run and set position.
            // BUT, if we want to avoid FOUC (flash of unpositioned content), we should set position state here too.
            // Since updatePosition uses state setters, we can just call it?
            // No, updatePosition relies on buttonRef.current.

            // Let's manually calculate here to be safe and fast, or just call updatePosition if we hoist it?
            // We defined updatePosition inside the component, so we can call it.
            // But updatePosition checks !buttonRef.current.

            // Let's just duplicate the logic slightly or trust the effect?
            // The effect runs after paint usually.
            // So we should set state here.

            const rect = e.currentTarget.getBoundingClientRect();
            const dropdownWidth = 360;
            const viewportWidth = window.innerWidth;

            let left = rect.left;

            if (left + dropdownWidth > viewportWidth - 20) {
              left = rect.right - dropdownWidth;
            }

            left = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10));

            setButtonPosition({
              top: rect.bottom + 8,
              left: left
            });
          }

          const newState = !isOpen;
          updateOpenState(newState);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-label="Add to folder"
        type="button"
      >
        <div
          className="transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          {icon === "plus" ? (
            <Plus className={`w-6 h-6 ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`} />
          ) : (
            <FolderPlus className={`w-6 h-6 ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`} />
          )}
        </div>
      </button>

      {mounted && isOpen && createPortal(
        <AnimatePresence>
          <div key="folder-modal" data-folder-dropdown>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                updateOpenState(false);
              }}
            />

            {/* Pinterest-style Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[9999] w-[360px] bg-background dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                top: buttonPosition?.top ? `${buttonPosition.top}px` : '50%',
                left: buttonPosition?.left ? `${buttonPosition.left}px` : '50%',
                transform: !buttonPosition ? 'translate(-50%, -50%)' : 'none',
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onWheel={(e) => {
                e.stopPropagation();
              }}
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
                                    <Image
                                      src={folder.previewItems[0].url}
                                      alt=""
                                      fill
                                      className="object-cover"
                                      sizes="44px"
                                    />
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
                                  <Image
                                    src={folder.previewItems[0].url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="44px"
                                  />
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
                    <div className="sticky bottom-0 bg-background dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOpenState(false);
                          setIsCreateModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 text-left font-semibold text-gray-900 dark:text-white text-sm">
                          Create folder
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

      {mounted && createPortal(
        <CreateFolderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateFolder={handleCreateFolder}
        />,
        document.body
      )}
    </>
  );
}
