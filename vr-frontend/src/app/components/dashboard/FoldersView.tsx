"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import FolderCard from "./FolderCard";
import CreateFolderModal from "./CreateFolderModal";
import RenameFolderModal from "./RenameFolderModal";
import ChangeFolderImageModal from "./ChangeFolderImageModal";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Folder } from "@/app/types/clothing";
import axios from "axios";

interface FoldersViewProps {
  viewMode: "closet" | "wishlist";
}

export interface FoldersViewRef {
  createFolder: () => void;
}

const FoldersView = forwardRef<FoldersViewRef, FoldersViewProps>(({ viewMode }, ref) => {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isChangeImageModalOpen, setIsChangeImageModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  // Expose createFolder method via ref
  useImperativeHandle(ref, () => ({
    createFolder: () => {
      setIsCreateModalOpen(true);
    }
  }));

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders`,
        { withCredentials: true }
      );
      setFolders(response.data.folders || []);
    } catch (err) {
      console.error("Error fetching folders:", err);
      setError("Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolderAPI = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders`,
        { ...data, isPublic: false },
        { withCredentials: true }
      );

      // Navigate to the newly created folder with query param to open modal
      const newFolder = response.data.folder;
      router.push(`/folders/${newFolder.id}?openAddModal=true`);
    } catch (err) {
      console.error("Error creating folder:", err);
      alert("Failed to create folder");
    }
  };

  const handleFolderClick = (folder: Folder) => {
    // Navigate to folder detail page
    router.push(`/folders/${folder.id}`);
  };

  const handleRename = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsRenameModalOpen(true);
  };

  const handleRenameFolderAPI = async (newName: string) => {
    if (!selectedFolder) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${selectedFolder.id}`,
        { name: newName },
        { withCredentials: true }
      );

      // Update folder in local state
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id ? { ...f, name: newName } : f
        )
      );
    } catch (err) {
      console.error("Error renaming folder:", err);
      alert("Failed to rename folder");
    }
  };

  const handleChangeImage = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsChangeImageModalOpen(true);
  };

  const handleChangeImageAPI = async (imageType: string) => {
    if (!selectedFolder) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${selectedFolder.id}`,
        { imageLayout: imageType },
        { withCredentials: true }
      );

      // Update folder in local state
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id ? { ...f, imageLayout: imageType } : f
        )
      );
    } catch (err) {
      console.error("Error changing folder image:", err);
      alert("Failed to change folder image");
    }
  };

  const handleDelete = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteFolderAPI = async () => {
    if (!selectedFolder) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders/${selectedFolder.id}`,
        { withCredentials: true }
      );

      // Remove folder from local state
      setFolders((prev) => prev.filter((f) => f.id !== selectedFolder.id));
      setIsDeleteDialogOpen(false);
      setSelectedFolder(null);
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert("Failed to delete folder");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading folders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchFolders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Folders Grid */}
      {folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first folder to start organizing your items
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Click the "Create" button in the top right to get started
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {/* Folder Cards */}
          <AnimatePresence mode="popLayout">
            {folders.map((folder) => (
              <motion.div
                key={folder.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FolderCard
                  folder={folder}
                  onClick={() => handleFolderClick(folder)}
                  onRename={handleRename}
                  onChangeImage={handleChangeImage}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolderAPI}
      />

      {/* Rename Folder Modal */}
      <RenameFolderModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSelectedFolder(null);
        }}
        onRename={handleRenameFolderAPI}
        currentName={selectedFolder?.name || ""}
      />

      {/* Change Folder Image Modal */}
      <ChangeFolderImageModal
        isOpen={isChangeImageModalOpen}
        onClose={() => {
          setIsChangeImageModalOpen(false);
          setSelectedFolder(null);
        }}
        onChangeImage={handleChangeImageAPI}
        folderName={selectedFolder?.name || ""}
        folderId={selectedFolder?.id || ""}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setSelectedFolder(null);
        }}
        onConfirm={handleDeleteFolderAPI}
        title="Delete Folder"
        description={`Are you sure you want to delete "${selectedFolder?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
});

FoldersView.displayName = "FoldersView";

export default FoldersView;
