"use client"

import React, { useState, useRef, useEffect } from "react"
import { Moon, Sun, Monitor, Chrome } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../contexts/ThemeContext"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    exit: { scale: 0, rotate: 180 },
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "chrome", label: "Chrome", icon: Chrome },
    { value: "system", label: "System", icon: Monitor },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getCurrentIcon = () => {
    switch (resolvedTheme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "chrome":
        return <Chrome className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
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
            className="absolute right-0 mt-2 w-40 rounded-md border border-border bg-popover shadow-lg z-50"
          >
            <div className="py-1">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value as any)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                    theme === value ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {theme === value && (
                    <motion.div
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                      layoutId="activeTheme"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SimpleThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  const cycleTheme = () => {
    switch (resolvedTheme) {
      case "light":
        setTheme("dark")
        break
      case "dark":
        setTheme("chrome")
        break
      case "chrome":
        setTheme("light")
        break
      default:
        setTheme("light")
    }
  }

  const getCurrentIcon = () => {
    switch (resolvedTheme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "chrome":
        return <Chrome className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className={`relative h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center justify-center ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={resolvedTheme}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {getCurrentIcon()}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Cycle theme</span>
    </button>
  )
}