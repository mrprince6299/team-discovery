"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Compass,
  Users,
  Calendar,
  LayoutDashboard,
  Bell,
  PlusCircle,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MobileNav } from "@/components/layout/mobile-nav"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { cn } from "@/lib/utils"

export interface UserSession {
  id: string
  name: string | null
  email: string
  verificationStatus: string
  avatarUrl?: string | null
  unreadNotificationsCount?: number
}

interface NavbarProps {
  user?: UserSession | null
  onLogout?: () => Promise<void> | void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  const navLinks = [
    { label: "Find Teammates", href: "/discover", icon: Compass },
    { label: "Browse Teams", href: "/teams", icon: Users },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ]

  const isVerified = user?.verificationStatus === "APPROVED"
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Nav & Brand Logo */}
        <div className="flex items-center gap-4">
          <MobileNav user={user} onLogout={onLogout} />
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              TD
            </span>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight">Team Discovery</span>
              <span className="text-[10px] text-muted-foreground leading-none font-medium">Find Teammates Fast</span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions & Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Instant Search Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="h-8 gap-2 text-xs font-normal text-muted-foreground border-border/80 hover:text-foreground"
            aria-label="Global Search (Press Cmd+K to search)"
          >
            <Search className="size-3.5" />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border">
              ⌘K
            </kbd>
          </Button>

          {user ? (
            <>
              {/* Create Team CTA (Verified only) */}
              {isVerified && (
                <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5 shadow-xs">
                  <Link href="/teams/create">
                    <PlusCircle className="size-4" />
                    <span>Create Team</span>
                  </Link>
                </Button>
              )}

              {/* Notification Bell */}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                aria-label={`Notifications${(user.unreadNotificationsCount ?? 0) > 0 ? ` (${user.unreadNotificationsCount} unread)` : ""}`}
              >
                <Link href="/notifications">
                  <Bell className="size-4" />
                  {(user.unreadNotificationsCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                      {user.unreadNotificationsCount! > 99 ? "99+" : user.unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* User Avatar Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-9 rounded-full p-0 ring-offset-background hover:ring-2 hover:ring-ring/50">
                    <Avatar className="size-9">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "Student"}</p>
                      <p className="text-xs text-muted-foreground leading-none truncate">{user.email}</p>
                      <div className="pt-1">
                        <Badge
                          variant={isVerified ? "success" : "outline"}
                          className="text-[10px] uppercase font-semibold tracking-wider"
                        >
                          {isVerified ? "Verified Account" : "Pending Verification"}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <UserIcon className="size-4" />
                        <span>Profile & Skills</span>
                      </Link>
                    </DropdownMenuItem>
                    {!isVerified && (
                      <DropdownMenuItem asChild>
                        <Link href="/verify" className="flex items-center gap-2 cursor-pointer text-amber-600">
                          <ShieldCheck className="size-4" />
                          <span>Verify Account</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="size-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {onLogout && (
                    <DropdownMenuItem
                      onClick={() => onLogout()}
                      variant="destructive"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
