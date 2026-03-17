"use client"

import { useAuth } from "@/lib/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { User, Settings, LogOut, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminUserProfile() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user.fullName) {
      const parts = user.fullName.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0][0].toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  // Get role display
  const getRoleDisplay = () => {
    switch (user.role) {
      case "admin":
        return { label: "Admin", color: "bg-red-500" }
      case "instructor":
        return { label: "Instructor", color: "bg-blue-500" }
      case "student":
        return { label: "Student", color: "bg-green-500" }
      default:
        return { label: user.role, color: "bg-gray-500" }
    }
  }

  const roleDisplay = getRoleDisplay()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.fullName || user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        {/* User info header */}
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.fullName || user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1">
                {user.fullName || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">{user.email}</p>
              <Badge
                variant="secondary"
                className={`mt-1 ${roleDisplay.color} text-white text-[10px] px-1.5 py-0`}
              >
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                {roleDisplay.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu items */}
        <DropdownMenuItem onClick={() => router.push("/admin/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
