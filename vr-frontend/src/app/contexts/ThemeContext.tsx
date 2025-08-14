"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  getStoredTheme,
  getStoredCustomColor,
  setStoredTheme,
  setStoredCustomColor,
  removeStoredCustomColor,
  STORAGE_KEYS,
} from "../utils/storage"

type Theme = "light" | "dark" | "chrome" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark" | "chrome"
  customColor: string | null
  setCustomColor: (color: string | null) => void
  applyCustomTheme: (color: string) => void
  resetCustomTheme: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const generateChromeThemeColors = (baseColor: string) => {
  // Convert hex to HSL for better color manipulation
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return [h * 360, s * 100, l * 100]
  }

  const [h] = hexToHsl(baseColor)

  // Generate chrome-style theme using the user's hue but maintaining chrome structure
  return {
    // Chrome theme structure with custom hue
    background: `oklch(0.35 0.025 ${h})`,
    foreground: `oklch(0.95 0.01 ${h})`,
    card: `oklch(0.42 0.025 ${h})`,
    cardForeground: `oklch(0.92 0.01 ${h})`,
    popover: `oklch(0.42 0.025 ${h})`,
    popoverForeground: `oklch(0.92 0.01 ${h})`,
    primary: `oklch(0.6 0.12 ${h - 20})`, // Slightly shifted hue for accent
    primaryForeground: `oklch(0.98 0 0)`,
    secondary: `oklch(0.45 0.025 ${h})`,
    secondaryForeground: `oklch(0.88 0.01 ${h})`,
    muted: `oklch(0.48 0.025 ${h})`,
    mutedForeground: `oklch(0.7 0.015 ${h})`,
    accent: `oklch(0.5 0.025 ${h})`,
    accentForeground: `oklch(0.85 0.01 ${h})`,
    destructive: `oklch(0.65 0.2 20)`, // Keep destructive as red-orange
    destructiveForeground: `oklch(0.95 0.01 ${h})`,
    border: `oklch(0.55 0.025 ${h})`,
    input: `oklch(0.48 0.025 ${h})`,
    ring: `oklch(0.6 0.12 ${h - 20})`,
    // Chart colors with varied hues
    chart1: `oklch(0.65 0.12 ${h - 20})`,
    chart2: `oklch(0.7 0.1 ${h + 60})`,
    chart3: `oklch(0.75 0.08 ${h + 120})`,
    chart4: `oklch(0.68 0.15 ${h - 160})`,
    chart5: `oklch(0.72 0.12 ${h - 180})`,
    // Sidebar colors
    sidebar: `oklch(0.38 0.025 ${h})`,
    sidebarForeground: `oklch(0.9 0.01 ${h})`,
    sidebarPrimary: `oklch(0.6 0.12 ${h - 20})`,
    sidebarPrimaryForeground: `oklch(0.98 0 0)`,
    sidebarAccent: `oklch(0.5 0.025 ${h})`,
    sidebarAccentForeground: `oklch(0.85 0.01 ${h})`,
    sidebarBorder: `oklch(0.55 0.025 ${h})`,
    sidebarRing: `oklch(0.6 0.12 ${h - 20})`,
  }
}

const generateThemeColors = (baseColor: string, theme: "light" | "dark" | "chrome") => {
  // For chrome theme, use the special chrome color generation
  if (theme === "chrome") {
    return generateChromeThemeColors(baseColor)
  }

  // Convert hex to HSL for better color manipulation
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return [h * 360, s * 100, l * 100]
  }

  const [h, s, l] = hexToHsl(baseColor)

  // Generate color palette based on the base color for light/dark themes
  if (theme === "dark") {
    return {
      background: `oklch(${Math.max(0.08, l / 100 - 0.85)} ${Math.min(s / 100, 0.01)} ${h})`,
      foreground: `oklch(0.98 0.005 ${h})`,
      card: `oklch(${Math.max(0.11, l / 100 - 0.8)} ${Math.min(s / 100, 0.012)} ${h})`,
      cardForeground: `oklch(0.95 0.005 ${h})`,
      popover: `oklch(${Math.max(0.11, l / 100 - 0.8)} ${Math.min(s / 100, 0.012)} ${h})`,
      popoverForeground: `oklch(0.95 0.005 ${h})`,
      primary: `oklch(0.65 0.15 ${h - 20})`,
      primaryForeground: `oklch(0.98 0 0)`,
      secondary: `oklch(${Math.max(0.13, l / 100 - 0.75)} ${Math.min(s / 100, 0.012)} ${h})`,
      secondaryForeground: `oklch(0.9 0.005 ${h})`,
      muted: `oklch(${Math.max(0.13, l / 100 - 0.75)} ${Math.min(s / 100, 0.012)} ${h})`,
      mutedForeground: `oklch(0.65 0.01 ${h})`,
      accent: `oklch(${Math.max(0.13, l / 100 - 0.75)} ${Math.min(s / 100, 0.012)} ${h})`,
      accentForeground: `oklch(0.9 0.005 ${h})`,
      border: `oklch(${Math.max(0.16, l / 100 - 0.7)} ${Math.min(s / 100, 0.012)} ${h})`,
      input: `oklch(${Math.max(0.13, l / 100 - 0.75)} ${Math.min(s / 100, 0.012)} ${h})`,
      ring: `oklch(0.65 0.15 ${h - 20})`,
    }
  } else {
    // Light theme
    return {
      background: `oklch(${Math.min(0.98, l / 100 + 0.3)} ${Math.min(s / 100, 0.02)} ${h})`,
      foreground: `oklch(0.145 0 0)`,
      card: `oklch(${Math.min(1, l / 100 + 0.35)} ${Math.min(s / 100, 0.01)} ${h})`,
      cardForeground: `oklch(0.145 0 0)`,
      popover: `oklch(${Math.min(1, l / 100 + 0.35)} ${Math.min(s / 100, 0.01)} ${h})`,
      popoverForeground: `oklch(0.145 0 0)`,
      primary: `oklch(0.205 0 0)`,
      primaryForeground: `oklch(0.985 0 0)`,
      secondary: `oklch(${Math.min(0.95, l / 100 + 0.25)} ${Math.min(s / 100, 0.03)} ${h})`,
      secondaryForeground: `oklch(0.205 0 0)`,
      muted: `oklch(${Math.min(0.95, l / 100 + 0.25)} ${Math.min(s / 100, 0.03)} ${h})`,
      mutedForeground: `oklch(0.556 0 0)`,
      accent: `oklch(${Math.min(0.92, l / 100 + 0.2)} ${Math.min(s / 100, 0.04)} ${h})`,
      accentForeground: `oklch(0.205 0 0)`,
      border: `oklch(${Math.min(0.9, l / 100 + 0.15)} ${Math.min(s / 100, 0.02)} ${h})`,
      input: `oklch(${Math.min(0.9, l / 100 + 0.15)} ${Math.min(s / 100, 0.02)} ${h})`,
      ring: `oklch(0.708 0 0)`,
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "chrome">("light")
  const [customColor, setCustomColor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const storedTheme = getStoredTheme()
        const storedCustomColor = getStoredCustomColor()

        setThemeState(storedTheme)
        if (storedCustomColor) {
          setCustomColor(storedCustomColor)
        }
      } catch (error) {
        console.warn("Error initializing theme:", error)
        // Fallback to defaults
        setThemeState("light")
        setCustomColor(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTheme()
  }, [])

  const applyCustomTheme = useCallback(
    (color: string) => {
      try {
        const root = document.documentElement
        const colors = generateThemeColors(color, resolvedTheme)

        // Apply the generated colors to CSS custom properties
        Object.entries(colors).forEach(([key, value]) => {
          const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase()
          root.style.setProperty(`--${cssVar}`, value)
        })

        setCustomColor(color)
        setStoredCustomColor(color)
      } catch (error) {
        console.error("Error applying custom theme:", error)
      }
    },
    [resolvedTheme],
  )

  const resetCustomTheme = useCallback(() => {
    try {
      const root = document.documentElement

      // Remove all custom color properties
      const colorProperties = [
        "background",
        "foreground",
        "card",
        "card-foreground",
        "popover",
        "popover-foreground",
        "primary",
        "primary-foreground",
        "secondary",
        "secondary-foreground",
        "muted",
        "muted-foreground",
        "accent",
        "accent-foreground",
        "destructive",
        "destructive-foreground",
        "border",
        "input",
        "ring",
        "chart-1",
        "chart-2",
        "chart-3",
        "chart-4",
        "chart-5",
        "sidebar",
        "sidebar-foreground",
        "sidebar-primary",
        "sidebar-primary-foreground",
        "sidebar-accent",
        "sidebar-accent-foreground",
        "sidebar-border",
        "sidebar-ring",
      ]

      colorProperties.forEach((prop) => {
        root.style.removeProperty(`--${prop}`)
      })

      setCustomColor(null)
      removeStoredCustomColor()
    } catch (error) {
      console.error("Error resetting custom theme:", error)
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.THEME && e.newValue) {
        const newTheme = e.newValue as Theme
        if (["light", "dark", "chrome", "system"].includes(newTheme)) {
          setThemeState(newTheme)
        }
      } else if (e.key === STORAGE_KEYS.CUSTOM_COLOR) {
        if (e.newValue) {
          setCustomColor(e.newValue)
        } else {
          setCustomColor(null)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const updateTheme = () => {
      let resolved: "light" | "dark" | "chrome" = "light"

      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      } else {
        resolved = theme as "light" | "dark" | "chrome"
      }

      setResolvedTheme(resolved)

      const root = window.document.documentElement
      root.classList.remove("light", "dark", "chrome")
      root.classList.add(resolved)

      setStoredTheme(theme)

      // Apply custom color after theme class is set
      if (customColor) {
        setTimeout(() => applyCustomTheme(customColor), 10)
      }
    }

    updateTheme()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", updateTheme)
      return () => mediaQuery.removeEventListener("change", updateTheme)
    }
  }, [theme, customColor, isLoading, applyCustomTheme])

  useEffect(() => {
    if (!isLoading && customColor) {
      applyCustomTheme(customColor)
    }
  }, [resolvedTheme, customColor, isLoading, applyCustomTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        customColor,
        setCustomColor,
        applyCustomTheme,
        resetCustomTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
