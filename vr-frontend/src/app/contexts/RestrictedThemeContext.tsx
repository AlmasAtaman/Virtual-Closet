"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type RestrictedTheme = "light" | "dark" | "system"

interface RestrictedThemeContextType {
  theme: RestrictedTheme
  setTheme: (theme: RestrictedTheme) => void
  resolvedTheme: "light" | "dark"
  isLoading: boolean
}

const RestrictedThemeContext = createContext<RestrictedThemeContextType | undefined>(undefined)

export function RestrictedThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<RestrictedTheme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [isLoading, setIsLoading] = useState(true)

  // Initialize theme from localStorage (public pages only)
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Use a different storage key for public pages
        const stored = localStorage.getItem("vrc-public-theme") as RestrictedTheme
        if (stored && ["light", "dark", "system"].includes(stored)) {
          setThemeState(stored)
        }
      } catch (error) {
        console.warn("Error initializing public theme:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTheme()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const updateTheme = () => {
      let resolved: "light" | "dark" = "light"

      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      } else {
        resolved = theme as "light" | "dark"
      }

      setResolvedTheme(resolved)

      // Only apply theme to public pages container, not the whole document
// Override document root theme for public pages AND apply to container
// Only apply theme to public container, don't touch document root
const publicRoot = document.querySelector('.public-theme-root')

// Apply restricted theme to public container
if (publicRoot) {
  publicRoot.classList.remove("light", "dark")
  publicRoot.classList.add(resolved)
}
      // Store theme preference
      try {
        localStorage.setItem("vrc-public-theme", theme)
      } catch (error) {
        console.warn("Error storing public theme:", error)
      }
    }

    updateTheme()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", updateTheme)
      return () => mediaQuery.removeEventListener("change", updateTheme)
    }
  }, [theme, isLoading])

  const setTheme = useCallback((newTheme: RestrictedTheme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <RestrictedThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        isLoading,
      }}
    >
      <div className="public-theme-root light">
        {children}
      </div>
    </RestrictedThemeContext.Provider>
  )
}

export function useRestrictedTheme() {
  const context = useContext(RestrictedThemeContext)
  if (context === undefined) {
    throw new Error("useRestrictedTheme must be used within a RestrictedThemeProvider")
  }
  return context
}