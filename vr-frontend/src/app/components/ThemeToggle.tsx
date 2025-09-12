"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Layers, Monitor, Palette, Check } from "lucide-react"
import { useTheme } from "../contexts/ThemeContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, customColor, applyCustomTheme, resetCustomTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(customColor || "#3b82f6")
  const [customColorInput, setCustomColorInput] = useState(customColor || "#3b82f6")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    exit: { scale: 0, rotate: 180 },
  }

  const themeOptions: Array<{ value: "light" | "dark" | "chrome" | "system"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "chrome", label: "Chrome", icon: Layers },
    { value: "system", label: "System", icon: Monitor },
  ]

  // Predefined color palette that accounts for theme desaturation
  // These colors are chosen to look good AFTER being converted to muted backgrounds
  const presetColors = [
    "#3b82f6", // Blue (default) - becomes nice blue-gray
    "#dc2626", // Red - becomes warm red-brown
    "#059669", // Green - becomes sage green
    "#d97706", // Orange - becomes warm amber
    "#7c3aed", // Purple - becomes lavender-gray
    "#db2777", // Pink - becomes rose-gray
    "#0891b2", // Cyan - becomes cool blue-gray
    "#65a30d", // Lime - becomes olive green
    "#ea580c", // Orange-red - becomes terracotta
    "#4338ca", // Indigo - becomes deep blue-gray
    "#0d9488", // Teal - becomes blue-green
    "#9333ea", // Violet - becomes purple-gray
    "#475569", // Slate - becomes neutral gray
    "#b91c1c", // Deep red - becomes rich burgundy
    "#047857", // Emerald - becomes forest green
    "#6d28d9", // Deep violet - becomes royal purple
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowColorPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (customColor) {
      setSelectedColor(customColor)
      setCustomColorInput(customColor)
    }
  }, [customColor])

  const getCurrentIcon = () => {
    switch (resolvedTheme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "chrome":
        return <Layers className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const handleColorSelect = (color: string) => {
    // Always switch to light mode when selecting a color
    setTheme('light')
    setSelectedColor(color)
    setCustomColorInput(color)
    applyCustomTheme(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color)
    
    // Normalize the color - add # if missing
    let normalizedColor = color.trim()
    if (normalizedColor && !normalizedColor.startsWith('#')) {
      normalizedColor = '#' + normalizedColor
    }
    
    // Validate the normalized color (with or without #)
    if (normalizedColor.match(/^#[0-9A-F]{6}$/i)) {
      handleColorSelect(normalizedColor)
    }
  }

  const handleReset = () => {
    resetCustomTheme()
    setSelectedColor("#3b82f6")
    setCustomColorInput("#3b82f6")
  }

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

  // Helper function to calculate hue from hex color
  const getHueFromHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    if (max !== min) {
      const d = max - min
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return h * 360
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedTheme}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {getCurrentIcon()}
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">Toggle theme</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`absolute right-0 mt-2 rounded-md border border-border bg-popover shadow-lg z-50 ${
              showColorPicker ? 'w-80' : 'w-40'
            }`}
          >
            <div className="py-1">
              {!showColorPicker ? (
                <>
                  {/* Theme Options */}
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setTheme(value)
                        // Reset custom colors when switching themes
                        if (customColor) {
                          resetCustomTheme()
                          setSelectedColor("#3b82f6")
                          setCustomColorInput("#3b82f6")
                        }
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                        theme === value && !customColor ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      {theme === value && !customColor && <span className="ml-auto">•</span>}
                    </button>
                  ))}
                  
                  {/* Color Picker Button - Always show when no custom colors are applied */}
                  {!customColor && (
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => setShowColorPicker(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Palette className="h-4 w-4" />
                        Colors
                        <div
                          className="ml-auto w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: selectedColor }}
                        />
                      </button>
                    </div>
                  )}
                  
                  {/* Reset Colors Button - Only show when custom color is applied */}
                  {customColor && (
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => setShowColorPicker(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-accent text-accent-foreground"
                      >
                        <Palette className="h-4 w-4" />
                        Colors
                        <div
                          className="ml-auto w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: customColor }}
                        />
                        <span className="ml-1">•</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Color Picker Content */
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Choose Theme Color</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getThemeDescription()}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowColorPicker(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
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

                  {/* Color Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Background Preview</Label>
                    <div 
                      className="w-full h-8 rounded-md border border-border mt-2 flex items-center justify-center text-xs text-foreground/80"
                      style={{ 
                        backgroundColor: resolvedTheme === 'light' 
                          ? `oklch(0.96 0.04 ${getHueFromHex(selectedColor)})`
                          : resolvedTheme === 'dark'
                          ? `oklch(0.08 0.01 ${getHueFromHex(selectedColor)})`
                          : `oklch(0.35 0.025 ${getHueFromHex(selectedColor)})`
                      }}
                    >
                      Background Preview
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
                        placeholder="3b82f6 or #3b82f6"
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset} 
                    className="w-full bg-transparent"
                  >
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}