"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
}

export default function RenameOccasionModal({
  isOpen,
  onClose,
  onRename,
  currentName,
}: RenameOccasionModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  // Update name when currentName changes
  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim() === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      await onRename(name.trim());
      onClose();
    } catch (err) {
      console.error("Failed to rename occasion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible">
        <VisuallyHidden>
          <DialogTitle>Rename Occasion</DialogTitle>
        </VisuallyHidden>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Rename Occasion
          </h2>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="occasion-rename" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="occasion-rename"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Rename Button */}
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3 bg-black dark:bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: isLoading || !name.trim() ? undefined : '#000' }}
          >
            {isLoading ? "Renaming..." : "Rename"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
