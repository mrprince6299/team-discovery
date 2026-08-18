"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Compass,
  Users,
  Calendar,
  LayoutDashboard,
  FileText,
  Mail,
  PlusCircle,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isVerified?: boolean
  className?: string
}

export function Sidebar({ isVerified = false, className }: SidebarProps) {
  const pathname = usePathname()

  const mainLinks = [
    { label: "Find Teammates", href: "/discover", icon: Compass, badge: "Role Match" },
    { label: "Browse Teams", href: "/teams", icon: Users },
    { label: "Events & Hackathons", href: "/events", icon: Calendar },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ]

  const workflowLinks = [
    { label: "My Applications", href: "/applications", icon: FileText },
    { label: "Invitations", href: "/invitations", icon: Mail },
  ]

  return (
    <aside
      className={cn(
        "hidden lg:flex w-64 flex-col justify-between border-r border-border/80 bg-background/50 p-4 shrink-0",
        className
      )}
      aria-label="Sidebar Navigation"
    >
      <div className="space-y-6">
        {/* Quick Action */}
        {isVerified && (
          <div>
            <Button asChild className="w-full justify-start gap-2 shadow-xs" size="sm">
              <Link href="/teams/create">
                <PlusCircle className="size-4" />
                <span>Create Team</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Discovery & Explore */}
        <div>
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explore
          </div>
          <nav className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "exact"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Team Workflow */}
        <div>
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recruitment & Matching
          </div>
          <nav className="space-y-1">
            {workflowLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Verification Notice if Unverified */}
      {!isVerified && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="size-4" />
            <span>Verification Required</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/90">
            Submit your student details to unlock team recruitment.
          </p>
          <Button asChild size="xs" variant="outline" className="mt-2.5 w-full bg-background">
            <Link href="/verify">Verify Now</Link>
          </Button>
        </div>
      )}
    </aside>
  )
}
