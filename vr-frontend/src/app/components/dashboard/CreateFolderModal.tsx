"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Loader2 } from "lucide-react";

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
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onCreateFolder({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible">
        <VisuallyHidden>
          <DialogTitle>Create New Folder</DialogTitle>
        </VisuallyHidden>

        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 -right-12 z-50 w-8 h-8 rounded-full bg-white dark:bg-background border border-gray-200 dark:border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-accent/50 transition-all shadow-sm hover:shadow-md pointer-events-auto opacity-90 hover:opacity-100"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-foreground/70" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Create New Folder
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize your clothing items into custom folders
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Folder Name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-sm font-medium">
                Folder Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="folder-name"
                type="text"
                placeholder="e.g., Summer Outfits, Favorites, Work Attire"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                className="w-full"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {name.length}/50 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="folder-description" className="text-sm font-medium">
                Description <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="folder-description"
                placeholder="Add a description for this folder..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description.length}/200 characters
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
