"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (data: { name: string; description?: string }) => Promise<void>;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsLoading(true);

    try {
      await onCreateFolder({
        name: name.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible">
        <VisuallyHidden>
          <DialogTitle>Create Folder</DialogTitle>
        </VisuallyHidden>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Folder
          </h2>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="folder-name"
              type="text"
              placeholder='Like "Places to Go" or "Recipes to Make"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3 bg-black dark:bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: isLoading || !name.trim() ? undefined : '#000' }}
          >
            {isLoading ? "Creating..." : "Create"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
