"use client"

import * as React from "react"
import { Navbar, type UserSession } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { isUserEligibleForCoreFeatures } from "@/lib/policies"

interface AppShellProps {
  children: React.ReactNode
  user?: UserSession | null
  onLogout?: () => Promise<void> | void
  showSidebar?: boolean
  className?: string
}

export function AppShell({
  children,
  user,
  onLogout,
  showSidebar = true,
  className,
}: AppShellProps) {
  const isVerified = isUserEligibleForCoreFeatures(user?.verificationStatus)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top Sticky Navigation */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Layout Body */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {showSidebar && user && (
          <Sidebar isVerified={isVerified} />
        )}

        {/* Content Container */}
        <main
          className={cn(
            "flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
