"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, Lock, Trash2, User, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThemedLogo as Logo } from "../../components/Logo"
import { ThemeToggle } from "../../components/ThemeToggle"
import LogOutButton from "../../components/LogoutButton"

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
              Closet
            </Button>
            <Button onClick={() => router.push("/outfits")} variant="outline" className="gap-2">
              Outfits
            </Button>
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto px-4 lg:px-6 xl:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <Separator />

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                  <p className="text-lg font-semibold mt-1">{user?.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg font-semibold mt-1">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Change Email
              </CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Current Email</Label>
                  <Input
                    id="current-email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">New Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={emailLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">Confirm Password</Label>
                  <Input
                    id="email-password"
                    type="password"
                    placeholder="Enter your password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    disabled={emailLoading}
                  />
                </div>
                {emailMessage && (
                  <p className={`text-sm ${emailSuccess ? "text-green-600" : "text-red-600"}`}>
                    {emailMessage}
                  </p>
                )}
                <Button type="submit" disabled={emailLoading} className="w-full md:w-auto">
                  {emailLoading ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                {passwordMessage && (
                  <p className={`text-sm ${passwordSuccess ? "text-green-600" : "text-red-600"}`}>
                    {passwordMessage}
                  </p>
                )}
                <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You are currently on the free plan
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Upgrade (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm font-medium text-destructive">Warning</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone. All your clothing items, outfits, occasions, and account data will be permanently deleted.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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
