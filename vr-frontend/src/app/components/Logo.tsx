"use client"

import Image from "next/image"
import { useTheme } from "../contexts/ThemeContext"
import { useRouter, usePathname } from "next/navigation"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  theme?: "light" | "dark" | "chrome"
}

export function Logo({ width = 120, height = 40, className = "h-10 w-auto", theme = "light" }: LogoProps) {
  const logoSrc = theme === "dark" || theme === "chrome"
    ? "/VestkoWhite.png"
    : "/VestkoBlack.png"

  return (
    <Image
      src={logoSrc}
      alt="Vestko Logo"
      width={width}
      height={height}
      className={className}
    />
  )
}

// Theme-aware version for use within webapp
export function ThemedLogo({ width = 120, height = 40, className = "h-10 w-auto" }: Omit<LogoProps, "theme">) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogoClick = () => {
    if (pathname === "/dashboard") {
      // If already on dashboard, scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      // Otherwise, navigate to dashboard
      router.push("/dashboard")
    }
  }

  return (
    <div onClick={handleLogoClick} className="cursor-pointer">
      <Logo width={width} height={height} className={className} theme={resolvedTheme} />
    </div>
  )
}