"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LandingPage from "../components/LandingPage"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: "include",
        })

        if (res.ok) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
          return
        }
      } catch {
        // Error occurred, user is not authenticated
      }

      // No authentication found, show landing page
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Show nothing while checking authentication
  if (loading) return null

  return <LandingPage />
}
