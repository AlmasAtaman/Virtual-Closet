"use client"

import Image from "next/image"
import { useTheme } from "../contexts/ThemeContext"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 32, height = 32, className = "h-8 w-8" }: LogoProps) {
  const { resolvedTheme } = useTheme()
  
  const logoSrc = resolvedTheme === "dark" || resolvedTheme === "chrome" 
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