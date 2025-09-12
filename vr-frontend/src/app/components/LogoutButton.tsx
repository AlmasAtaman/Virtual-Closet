"use client"

import { useRouter } from "next/navigation"
import axios from "axios"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LogOutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/signout`, {}, { withCredentials: true })
    } catch (error) {
      console.error("Error signing out on backend:", error)
    }
    router.push("/login")
  }

  return (
    <Button onClick={handleLogout} variant="ghost" className="gap-2">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  )
}