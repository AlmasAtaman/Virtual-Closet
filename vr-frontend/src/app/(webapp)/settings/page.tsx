"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Lock, Trash2, User, Shield, ChevronRight, CreditCard, Receipt, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardSidebar } from "../../components/DashboardSidebar"

interface User {
  id: string
  username: string
  email: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  // Change Email State
  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete Account State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          credentials: "include",
        })

        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
          setLoading(false)
          return
        }
      } catch {
        // Error occurred, redirect to login
      }

      // No authentication found
      router.push("/login")
    }

    checkAuth()
  }, [router])

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMessage("")
    setEmailSuccess(false)

    if (!newEmail || !emailPassword) {
      setEmailMessage("Please fill in all fields.")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setEmailMessage("Please enter a valid email address.")
      return
    }

    setEmailLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newEmail, password: emailPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        setEmailMessage(data.message || "Email updated successfully!")
        setEmailSuccess(true)
        setNewEmail("")
        setEmailPassword("")
        // Update local user state
        if (user) {
          setUser({ ...user, email: data.email })
        }
      } else {
        setEmailMessage(data.message || "Failed to update email.")
        setEmailSuccess(false)
      }
    } catch {
      setEmailMessage("An unexpected error occurred. Please try again.")
      setEmailSuccess(false)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage("")
    setPasswordSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all fields.")
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.")
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        setPasswordMessage(data.message || "Password updated successfully!")
        setPasswordSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordMessage(data.message || "Failed to update password.")
        setPasswordSuccess(false)
      }
    } catch {
      setPasswordMessage("An unexpected error occurred. Please try again.")
      setPasswordSuccess(false)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleEditPersonalInfo = () => {
    router.push("/settings/edit")
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setDeleteMessage("Please type DELETE to confirm.")
      return
    }

    setDeleteLoading(true)
    setDeleteMessage("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/account`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        setDeleteMessage("Account deleted successfully. Redirecting...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setDeleteMessage(data.message || "Failed to delete account.")
        setDeleteLoading(false)
      }
    } catch {
      setDeleteMessage("An unexpected error occurred. Please try again.")
      setDeleteLoading(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardSidebar onSettingsClick={() => router.push("/settings")} />

      {/* Main Content - Spotify Style Layout */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 lg:px-8 md:pl-[100px] py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Account</h1>
        </div>

        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-base font-semibold mb-4 text-muted-foreground">Account</h2>

          {/* Edit Personal Info Button */}
          <button
            onClick={handleEditPersonalInfo}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User size={24} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium">Edit personal info</p>
                <p className="text-sm text-muted-foreground">{user?.username} • {user?.email}</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </motion.section>

        {/* Subscription Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-base font-semibold mb-4 text-muted-foreground">Subscription</h2>

          {/* Manage Subscription Button */}
          <button
            disabled
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors group opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Shield size={24} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium">Manage your subscription</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground" />
          </button>

          <Separator className="my-4" />

          {/* Cancel Subscription Button */}
          <button
            disabled
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors group opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Trash2 size={24} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium">Cancel subscription</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground" />
          </button>
        </motion.section>

        {/* Payment Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-base font-semibold mb-4 text-muted-foreground">Payment</h2>

          {/* Order History Button */}
          <button
            disabled
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors group opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Receipt size={24} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium">Order history</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground" />
          </button>

          <Separator className="my-4" />

          {/* Saved Payment Cards Button */}
          <button
            disabled
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors group opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CreditCard size={24} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium">Saved payment cards</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground" />
          </button>
        </motion.section>

        {/* Delete Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-8"
        >
          <Separator className="my-8" />

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-destructive/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 size={24} className="text-destructive" />
              </div>
              <div className="text-left">
                <p className="font-medium text-destructive">Delete account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-destructive group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.section>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be lost forever.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              To confirm deletion, please type <span className="font-bold">DELETE</span> below:
            </p>
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              disabled={deleteLoading}
              className={deleteConfirmation === "DELETE" ? "border-destructive" : ""}
            />
            {deleteMessage && (
              <p className={`text-sm ${deleteMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                {deleteMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation("")
                setDeleteMessage("")
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
