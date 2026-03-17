"use client"

import type React from "react"
import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { NotificationBell } from "./notification-bell"
import { AdminUserProfile } from "./admin-user-profile"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Logo } from "@/components/layout/logo"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex relative">
      {/* Desktop sidebar - fixed position */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar />
          </div>
        </>
      )}

      <main className="flex-1 w-full lg:ml-[280px] relative z-10">
        {/* Desktop header - fixed at top */}
        <div className="hidden lg:flex sticky top-0 z-20 items-center justify-end h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <NotificationBell />
            <AdminUserProfile />
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <AdminUserProfile />
          </div>
        </div>
        
        <div className="p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
