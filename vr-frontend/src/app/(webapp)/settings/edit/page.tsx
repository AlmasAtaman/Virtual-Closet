"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "../../../components/DashboardSidebar"

interface User {
  id: string
  username: string
  email: string
}

export default function EditPersonalInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const [editUsername, setEditUsername] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: "include",
        })

        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
          setEditUsername(userData.username)
          setEditEmail(userData.email)
          setLoading(false)
          return
        }
      } catch {
        // Error occurred, redirect to login
      }

      router.push("/login")
    }

    checkAuth()
  }, [router])

  const handleSaveProfile = async () => {
    setSaveMessage("")
    setSaveSuccess(false)

    if (!editUsername || !editEmail) {
      setSaveMessage("Username and email are required.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editEmail)) {
      setSaveMessage("Please enter a valid email address.")
      return
    }

    setSaveLoading(true)

    try {
      if (editUsername !== user?.username) {
        const usernameRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/username`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ newUsername: editUsername }),
        })

        if (!usernameRes.ok) {
          const data = await usernameRes.json()
          setSaveMessage(data.message || "Failed to update username.")
          setSaveLoading(false)
          return
        }
      }

      if (editEmail !== user?.email) {
        const emailRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/email`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ newEmail: editEmail, password: editPassword }),
        })

        if (!emailRes.ok) {
          const data = await emailRes.json()
          setSaveMessage(data.message || "Failed to update email.")
          setSaveLoading(false)
          return
        }
      }

      if (editPassword) {
        const passwordRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ currentPassword: "", newPassword: editPassword }),
        })

        if (!passwordRes.ok) {
          const data = await passwordRes.json()
          setSaveMessage(data.message || "Failed to update password.")
          setSaveLoading(false)
          return
        }
      }

      setSaveMessage("Profile updated successfully!")
      setSaveSuccess(true)

      setTimeout(() => {
        router.push("/settings")
      }, 1500)
    } catch {
      setSaveMessage("An unexpected error occurred. Please try again.")
      setSaveSuccess(false)
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <DashboardSidebar onSettingsClick={() => router.push("/settings")} />

      {/* Main Content - Spotify Style */}
      <main className="flex-1 flex items-center justify-center md:ml-[70px] pb-24">
        <div className="w-full max-w-3xl px-8 lg:px-12">
          {/* Back button and title */}
          <div className="mb-16 flex items-center gap-6">
            <button
              onClick={() => router.push("/settings")}
              className="w-12 h-12 rounded-full bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/80 flex items-center justify-center transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={28} className="text-white dark:text-black" />
            </button>
            <h1 className="text-5xl font-bold tracking-tight">Edit personal info</h1>
          </div>

          <div className="space-y-10">
            {/* Username Field */}
            <div className="space-y-3">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={saveLoading}
                className="bg-background border-border text-foreground h-14 text-lg"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={saveLoading}
                className="bg-background border-border text-foreground h-14 text-lg"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                disabled={saveLoading}
                placeholder="Enter new password (optional)"
                className="bg-background border-border text-foreground h-14 text-lg"
              />
              <p className="text-sm text-muted-foreground pt-1">
                Leave blank to keep your current password
              </p>
            </div>

            {saveMessage && (
              <p className={`text-base ${saveSuccess ? "text-green-600" : "text-red-600"}`}>
                {saveMessage}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8">
              <Button
                variant="ghost"
                onClick={() => router.push("/settings")}
                disabled={saveLoading}
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="bg-primary hover:bg-primary/90 min-w-[140px] h-12 px-8 text-base"
              >
                {saveLoading ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
