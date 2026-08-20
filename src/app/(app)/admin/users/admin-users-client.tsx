"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Search,
  Building,
  GraduationCap,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Clock,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TechIcon } from "@/components/common/tech-icon"

interface UserItem {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  bio: string | null
  year: number | null
  verificationStatus: string
  availability: string
  createdAt: Date
  college: string
  department: string
  program: string
  branch: string
  collegeEmail: string | null
  erp: string | null
  primaryRole: string
  isAdmin: boolean
  readinessPercentage: number
  isVerificationReady: boolean
  skills: Array<{ name: string; level: string; isCustom: boolean }>
  interests: string[]
  activeTeams: Array<{ id: string; name: string }>
}

interface AdminUsersClientProps {
  initialUsers: UserItem[]
  initialCounts: {
    totalStudents: number
    verified: number
    pending: number
    admins: number
  }
}

export function AdminUsersClient({ initialUsers, initialCounts }: AdminUsersClientProps) {
  const [users] = useState<UserItem[]>(initialUsers)
  const [counts] = useState(initialCounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "ALL") {
        if (u.isAdmin) return false
      } else if (statusFilter === "VERIFIED") {
        if (u.isAdmin || u.verificationStatus !== "APPROVED") return false
      } else if (statusFilter === "PENDING") {
        if (u.isAdmin || u.verificationStatus !== "PENDING") return false
      } else if (statusFilter === "ADMIN") {
        if (!u.isAdmin) return false
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = u.name.toLowerCase().includes(q)
        const matchUsername = u.username.toLowerCase().includes(q)
        const matchEmail = u.collegeEmail?.toLowerCase().includes(q) || false
        const matchCollege = u.college.toLowerCase().includes(q)
        const matchDept = u.department.toLowerCase().includes(q)
        const matchRole = u.primaryRole.toLowerCase().includes(q)
        const matchSkill = u.skills.some((s) => s.name.toLowerCase().includes(q))
        if (!matchName && !matchUsername && !matchEmail && !matchCollege && !matchDept && !matchRole && !matchSkill) {
          return false
        }
      }
      return true
    })
  }, [users, statusFilter, searchQuery])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">User Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Inspect registered student profiles, institutional credentials, skills, and trust badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/admin">
              <span>Admin Overview</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "ALL" ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Students
          </span>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.totalStudents}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("VERIFIED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "VERIFIED" ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified
            </span>
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.verified}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "PENDING" ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending
            </span>
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.pending}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("ADMIN")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "ADMIN" ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Admins
            </span>
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.admins}</div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="ALL" className="text-xs font-semibold rounded-lg">
              Students ({counts.totalStudents})
            </TabsTrigger>
            <TabsTrigger value="VERIFIED" className="text-xs font-semibold rounded-lg">
              Verified ({counts.verified})
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="text-xs font-semibold rounded-lg">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="ADMIN" className="text-xs font-semibold rounded-lg">
              Admins ({counts.admins})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search student, role, college, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card className="border-border/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="size-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No students found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No student matches "${searchQuery}".` : "No users in this category."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isApproved = user.verificationStatus === "APPROVED"
            const isPending = user.verificationStatus === "PENDING"

            return (
              <Card
                key={user.id}
                className="border-border/80 bg-card rounded-2xl shadow-sm hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-xl border border-border shrink-0">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                      <AvatarFallback className="rounded-xl font-bold text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate">@{user.username}</span>
                        {user.isAdmin && (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/40 bg-primary/10">
                            Admin
                          </Badge>
                        )}
                        <Badge
                          variant={isApproved ? "success" : isPending ? "outline" : "secondary"}
                          className="text-[10px] uppercase font-semibold py-0 px-2"
                        >
                          {user.verificationStatus}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="size-3 text-primary shrink-0" />
                          <span className="truncate">{user.college}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="size-3 text-primary shrink-0" />
                          <span className="truncate">{user.department}</span>
                          {user.year && <span>(Year {user.year})</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="size-3 text-primary shrink-0" />
                          <span className="font-medium text-foreground">{user.primaryRole}</span>
                        </div>
                      </div>

                      {/* Skills Chips */}
                      {user.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {user.skills.slice(0, 4).map((s) => (
                            <span
                              key={s.name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/40 text-[11px] font-medium border border-border/60"
                            >
                              <TechIcon name={s.name} className="size-3" />
                              <span>{s.name}</span>
                            </span>
                          ))}
                          {user.skills.length > 4 && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              +{user.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                    <div className="hidden sm:flex flex-col items-end mr-2 text-right text-xs">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Joined
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <Eye className="size-3.5" />
                      <span>Inspect Profile</span>
                    </Button>

                    <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-primary">
                      <Link href={`/users/${user.id}`} target="_blank">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* User Inspect Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <div className="space-y-6">
              <DialogHeader className="pb-3 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 rounded-xl border border-border">
                      <AvatarImage src={selectedUser.avatarUrl ?? undefined} alt={selectedUser.name} />
                      <AvatarFallback className="font-bold">
                        {selectedUser.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <span>{selectedUser.name}</span>
                        <Badge
                          variant={selectedUser.verificationStatus === "APPROVED" ? "success" : "outline"}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {selectedUser.verificationStatus}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        @{selectedUser.username} · Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </DialogDescription>
                    </div>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary">
                    <Link href={`/users/${selectedUser.id}`} target="_blank">
                      <span>Public Profile</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </div>
              </DialogHeader>

              {/* Sections */}
              <div className="space-y-4 text-xs">
                {/* 1. Academic Affiliation */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="size-3.5 text-primary" />
                    <span>Academic Information</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">College / University</span>
                      <span className="font-semibold text-foreground">{selectedUser.college}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Degree &amp; Department</span>
                      <span className="font-semibold text-foreground">
                        {selectedUser.department}
                        {selectedUser.year && ` (Year ${selectedUser.year})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">College Email</span>
                      <span className="font-semibold text-foreground font-mono">{selectedUser.collegeEmail || "Not recorded"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">ERP / Student ID</span>
                      <span className="font-semibold text-foreground font-mono">{selectedUser.erp || "Not recorded"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Skills & Roles */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-primary" />
                    <span>Primary Role &amp; Technical Stack</span>
                  </span>
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Primary Role</span>
                      <span className="font-semibold text-foreground">{selectedUser.primaryRole}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">
                        Technical Skills ({selectedUser.skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedUser.skills.map((s) => (
                          <span
                            key={s.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] font-medium"
                          >
                            <TechIcon name={s.name} className="size-3" />
                            <span>{s.name}</span>
                            <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                              ({s.level})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Active Squads */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    <span>Active Squad Memberships ({selectedUser.activeTeams.length})</span>
                  </span>
                  {selectedUser.activeTeams.length === 0 ? (
                    <p className="text-muted-foreground italic">Not currently active in any squads.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedUser.activeTeams.map((team) => (
                        <Badge key={team.id} variant="secondary" className="text-xs py-1 px-2.5">
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex justify-end pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
