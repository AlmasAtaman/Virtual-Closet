"use client"

import { useState, useEffect } from "react"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "../contexts/ThemeContext"

interface ColorPickerProps {
  onColorChange?: (color: string | null) => void
}

export default function ColorPicker({ onColorChange }: ColorPickerProps) {
  const { customColor, applyCustomTheme, resetCustomTheme, resolvedTheme } = useTheme()
  const [selectedColor, setSelectedColor] = useState(customColor || "#3b82f6")
  const [customColorInput, setCustomColorInput] = useState(customColor || "#3b82f6")
  const [isOpen, setIsOpen] = useState(false)

  // Predefined color palette optimized for chrome theme
  const presetColors = [
    "#3b82f6", // Blue (default chrome)
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#a855f7", // Violet
    "#64748b", // Slate
    "#dc2626", // Red-600
    "#059669", // Emerald-600
    "#7c3aed", // Violet-600
  ]

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setCustomColorInput(color)
    applyCustomTheme(color)
    onColorChange?.(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color)
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      handleColorSelect(color)
    }
  }

  const handleReset = () => {
    resetCustomTheme()
    setSelectedColor("#3b82f6")
    setCustomColorInput("#3b82f6")
    onColorChange?.(null)
  }

  useEffect(() => {
    if (customColor) {
      setSelectedColor(customColor)
      setCustomColorInput(customColor)
    }
  }, [customColor])

  const getThemeDescription = () => {
    switch (resolvedTheme) {
      case "chrome":
        return "Chrome theme with custom color accent"
      case "dark":
        return "Dark theme with custom color tint"
      case "light":
        return "Light theme with custom color tint"
      default:
        return "Custom color theme"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent" aria-label="Customize theme color">
          <Palette className="h-4 w-4" />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background"
            style={{ backgroundColor: selectedColor }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Choose Theme Color</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {getThemeDescription()}. {resolvedTheme === "chrome" ? "Best experience with Chrome theme!" : ""}
            </p>
          </div>

          {/* Preset Colors */}
          <div>
            <Label className="text-xs text-muted-foreground">Preset Colors</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="w-6 h-6 rounded-md border-2 border-border hover:scale-110 transition-transform relative"
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color}`}
                >
                  {selectedColor === color && (
                    <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <Label htmlFor="custom-color" className="text-xs text-muted-foreground">
              Custom Color
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="custom-color"
                type="color"
                value={customColorInput}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-8 p-0 border-0 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={customColorInput}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 text-xs"
              />
            </div>
          </div>

          {/* Theme Recommendation */}
          {resolvedTheme !== "chrome" && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Switch to Chrome theme for the best color customization experience!
              </p>
            </div>
          )}

          {/* Reset Button */}
          <Button variant="outline" size="sm" onClick={handleReset} className="w-full bg-transparent">
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
