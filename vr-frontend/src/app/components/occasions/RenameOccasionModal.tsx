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

        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 -right-12 z-50 w-8 h-8 rounded-full bg-white dark:bg-background border border-gray-200 dark:border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-accent/50 transition-all shadow-sm hover:shadow-md pointer-events-auto opacity-90 hover:opacity-100"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-foreground/70" />
        </button>

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
