"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "chrome" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark" | "chrome"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "chrome">("light")

  useEffect(() => {
    const stored = localStorage.getItem("vrc-theme") as Theme
    if (stored && ["light", "dark", "chrome", "system"].includes(stored)) {
      setThemeState(stored)
    } else {
      setThemeState("light") // Default to light as requested
    }
  }, [])

  useEffect(() => {
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
      
      localStorage.setItem("vrc-theme", theme)
    }

    updateTheme()
    
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", updateTheme)
      return () => mediaQuery.removeEventListener("change", updateTheme)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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