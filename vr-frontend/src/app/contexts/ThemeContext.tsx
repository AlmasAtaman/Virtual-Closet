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


const generateThemeColors = (baseColor: string, theme: "light" | "dark" | "chrome") => {
  // Colors are only applied to light theme - other themes ignore custom colors
  if (theme !== "light") {
    return {}
  }

  // Convert hex to HSL for better color manipulation
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0
    const l = (max + min) / 2

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

  // Light theme with custom colors
  return {
    background: `oklch(0.96 ${Math.min(s / 100, 0.04)} ${h})`,
    foreground: `oklch(0.145 0 0)`,
    card: `oklch(0.98 ${Math.min(s / 100, 0.03)} ${h})`,
    cardForeground: `oklch(0.145 0 0)`,
    popover: `oklch(${Math.min(1, l / 100 + 0.35)} ${Math.min(s / 100, 0.01)} ${h})`,
    popoverForeground: `oklch(0.145 0 0)`,
    primary: `oklch(0.205 0 0)`,
    primaryForeground: `oklch(0.985 0 0)`,
    secondary: `oklch(0.94 ${Math.min(s / 100, 0.03)} ${h})`,
    secondaryForeground: `oklch(0.205 0 0)`,
    muted: `oklch(0.94 ${Math.min(s / 100, 0.03)} ${h})`,
    mutedForeground: `oklch(0.556 0 0)`,
    accent: `oklch(${Math.min(0.92, l / 100 + 0.2)} ${Math.min(s / 100, 0.04)} ${h})`,
    accentForeground: `oklch(0.205 0 0)`,
    border: `oklch(${Math.min(0.9, l / 100 + 0.15)} ${Math.min(s / 100, 0.02)} ${h})`,
    input: `oklch(${Math.min(0.9, l / 100 + 0.15)} ${Math.min(s / 100, 0.02)} ${h})`,
    ring: `oklch(0.708 0 0)`,
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
        const webappRoot = document.querySelector('.webapp-theme-root') as HTMLElement
        if (!webappRoot) return
        const colors = generateThemeColors(color, resolvedTheme)

        // Apply the generated colors to CSS custom properties
        Object.entries(colors).forEach(([key, value]) => {
          const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase()
          webappRoot.style.setProperty(`--${cssVar}`, value)
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
    const webappRoot = document.querySelector('.webapp-theme-root') as HTMLElement
    if (!webappRoot) return

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
      webappRoot.style.removeProperty(`--${prop}`)
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

    // CHANGED: Apply theme only to webapp container, not document root
    const webappRoot = document.querySelector('.webapp-theme-root')
    if (webappRoot) {
      webappRoot.classList.remove("light", "dark", "chrome")
      webappRoot.classList.add(resolved)
    }

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
      <div className="webapp-theme-root light">
        {children}
      </div>
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
