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
  LogOut,
  User,
  ShieldCheck,
  Menu,
  Bell,
  Search,
  ArrowLeft,
  Layers,
  BarChart3,
  Sparkles,
  Flag,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { cn } from "@/lib/utils"
import { isUserEligibleForCoreFeatures } from "@/lib/policies"

interface MobileNavProps {
  user?: {
    name?: string | null
    email?: string | null
    verificationStatus?: string | null
    avatarUrl?: string | null
    unreadNotificationsCount?: number
    isAdmin?: boolean
  } | null
  onLogout?: () => void
}

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const pathname = usePathname()
  const isAdminConsole = pathname.startsWith("/admin")

  const studentNavItems = [
    { label: "Find Teammates", href: "/discover", icon: Compass, badge: "Match" },
    { label: "Browse Teams", href: "/teams", icon: Users },
    { label: "Events & Hackathons", href: "/events", icon: Calendar },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Applications", href: "/applications", icon: FileText },
    { label: "Invitations", href: "/invitations", icon: Mail },
    { label: "My Reports", href: "/reports", icon: Flag },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: (user?.unreadNotificationsCount ?? 0) > 0 ? `${user?.unreadNotificationsCount}` : undefined,
    },
  ]

  const adminNavItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Teams", href: "/admin/teams", icon: Layers },
    { label: "Events & Hackathons", href: "/admin/events", icon: Calendar },
    { label: "Verification", href: "/admin/verify", icon: ShieldCheck },
    { label: "Reports & Moderation", href: "/admin/reports", icon: ShieldAlert },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Skills & Roles", href: "/admin/taxonomy", icon: Sparkles },
  ]

  const isVerified = isUserEligibleForCoreFeatures(user?.verificationStatus)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col justify-between">
          <div>
            <SheetHeader className="p-6 border-b border-border/60 text-left">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  TD
                </span>
                <span className="font-bold text-lg tracking-tight">
                  {isAdminConsole ? "Admin Console" : "Team Discovery"}
                </span>
              </SheetTitle>
              {user && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </span>
                  <Badge
                    variant={user.isAdmin ? "outline" : isVerified ? "success" : "outline"}
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {user.isAdmin ? "Admin" : isVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              )}
            </SheetHeader>

            {isAdminConsole ? (
              /* Admin Specific Navigation */
              <div className="p-4 space-y-4">
                <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Administration
                </div>
                <nav className="space-y-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

                <div className="pt-4 border-t border-border/60">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/dashboard">
                      <ArrowLeft className="size-3.5" />
                      <span>Switch to Student Platform</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              /* Student Navigation */
              <div className="p-4 space-y-4">
                {/* Search Bar Trigger on Mobile */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    setIsSearchOpen(true)
                  }}
                  className="w-full justify-start gap-2 text-xs font-normal text-muted-foreground border-border/80"
                >
                  <Search className="size-3.5" />
                  <span>Search skills, users, teams...</span>
                </Button>

                {isVerified && (
                  <Button asChild className="w-full justify-start gap-2 shadow-xs" size="sm">
                    <Link href="/teams/create" onClick={() => setOpen(false)}>
                      <PlusCircle className="size-4" />
                      <span>Create Team</span>
                    </Link>
                  </Button>
                )}

                <div className="space-y-1">
                  <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Menu
                  </div>
                  <nav className="space-y-1">
                    {studentNavItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-secondary text-foreground font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
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

                {user?.isAdmin && (
                  <div className="pt-2 border-t border-border/60">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs text-primary font-semibold"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/admin">
                        <ShieldCheck className="size-4" />
                        <span>Admin Console</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border/60 space-y-2">
            {user ? (
              <>
                <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <User className="size-4" />
                    <span>My Profile</span>
                  </Link>
                </Button>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setOpen(false)
                      onLogout()
                    }}
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </Button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login" onClick={() => setOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup" onClick={() => setOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <GlobalSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
