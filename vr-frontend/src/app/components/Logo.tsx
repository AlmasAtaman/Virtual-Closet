"use client"

import Image from "next/image"
import { useTheme } from "../contexts/ThemeContext"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  theme?: "light" | "dark" | "chrome"
}

export function Logo({ width = 32, height = 32, className = "h-8 w-8", theme = "light" }: LogoProps) {
  const logoSrc = theme === "dark" || theme === "chrome"
    ? "/DarkModeVrCLogo.png"
    : "/VrClogo.png"

  return (
    <Image
      src={logoSrc}
      alt="VrC Logo"
      width={width}
      height={height}
      className={className}
    />
  )
}

// Theme-aware version for use within webapp
export function ThemedLogo({ width = 32, height = 32, className = "h-8 w-8" }: Omit<LogoProps, "theme">) {
  const { resolvedTheme } = useTheme()

  return <Logo width={width} height={height} className={className} theme={resolvedTheme} />
}