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
  } | null
  onLogout?: () => void
}

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const pathname = usePathname()

  const navItems = [
    { label: "Find Teammates", href: "/discover", icon: Compass, badge: "Match" },
    { label: "Browse Teams", href: "/teams", icon: Users },
    { label: "Events & Hackathons", href: "/events", icon: Calendar },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Applications", href: "/applications", icon: FileText },
    { label: "Invitations", href: "/invitations", icon: Mail },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: (user?.unreadNotificationsCount ?? 0) > 0 ? `${user?.unreadNotificationsCount}` : undefined,
    },
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
                <span className="font-bold text-lg tracking-tight">Team Discovery</span>
              </SheetTitle>
              {user && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </span>
                  <Badge
                    variant={isVerified ? "success" : "outline"}
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {isVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              )}
            </SheetHeader>

            <div className="p-4 pb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  setIsSearchOpen(true)
                }}
                className="w-full justify-start gap-2 h-9 text-xs text-muted-foreground"
              >
                <Search className="size-4" />
                <span>Search platform...</span>
              </Button>
            </div>

            <nav className="p-4 space-y-1" aria-label="Mobile Navigation">
            {navItems.map((item) => {
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
                      ? "bg-primary text-primary-foreground font-semibold"
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

            {isVerified && (
              <div className="pt-2">
                <Button
                  asChild
                  className="w-full justify-start gap-2 h-9"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/teams/create">
                    <PlusCircle className="size-4" />
                    <span>Create Team</span>
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-border/60 space-y-1 bg-muted/30">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <User className="size-4" />
            <span>Profile & Skills</span>
          </Link>
          {!isVerified && (
            <Link
              href="/verify"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
            >
              <ShieldCheck className="size-4" />
              <span>Verify Account</span>
            </Link>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <GlobalSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
  </>
  )
}
