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
        // Add timeout to prevent indefinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (res.ok) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
          return
        }
      } catch (error) {
        // Error occurred (timeout or network issue), user is not authenticated
        console.log("Auth check failed:", error)
      }

      // No authentication found, show landing page
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <LandingPage />
}
