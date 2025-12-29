"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOccasion: (data: { name: string; description?: string }) => Promise<void>;
}

export default function CreateOccasionModal({
  isOpen,
  onClose,
  onCreateOccasion,
}: CreateOccasionModalProps) {
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
      await onCreateOccasion({
        name: name.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to create occasion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 border border-border rounded-lg [&>button.absolute.right-4.top-4]:hidden overflow-visible">
        <VisuallyHidden>
          <DialogTitle>Create Occasion</DialogTitle>
        </VisuallyHidden>

        {/* Custom Close Button - Outside modal, top-right */}
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
            Create Occasion
          </h2>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="occasion-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="occasion-name"
              type="text"
              placeholder='Like "Summer Vacation" or "Work Meetings"'
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
