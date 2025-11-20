"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import FolderCard from "./FolderCard";
import CreateFolderModal from "./CreateFolderModal";
import { Folder } from "@/app/types/clothing";
import axios from "axios";

interface FoldersViewProps {
  viewMode: "closet" | "wishlist";
}

export default function FoldersView({ viewMode }: FoldersViewProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

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

  const handleCreateFolder = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/folders`,
        { ...data, isPublic: false },
        { withCredentials: true }
      );

      // Add new folder to the list
      setFolders((prev) => [response.data.folder, ...prev]);
    } catch (err) {
      console.error("Error creating folder:", err);
      throw new Error("Failed to create folder");
    }
  };

  const handleFolderClick = (folder: Folder) => {
    // TODO: Navigate to folder details view or open folder items modal
    console.log("Clicked folder:", folder);
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {/* Create Button Card */}
        <motion.div
          className="cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Create
              </p>
            </div>
          </div>
        </motion.div>

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
              <FolderCard folder={folder} onClick={() => handleFolderClick(folder)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {folders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first folder to start organizing your items
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Create Your First Folder
            </button>
          </div>
        </motion.div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
