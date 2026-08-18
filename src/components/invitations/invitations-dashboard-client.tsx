"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Mail,
  Send,
  Search,
  Sparkles,
  ArrowRight,
  Compass,
  RotateCcw,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { InvitationCard, type ReceivedInvitation } from "./invitation-card"
import { SentInvitationCard, type SentInvitation } from "./sent-invitation-card"

interface InvitationsDashboardClientProps {
  initialReceivedInvitations: ReceivedInvitation[]
  initialSentInvitations: SentInvitation[]
  isLeader: boolean
}

export function InvitationsDashboardClient({
  initialReceivedInvitations,
  initialSentInvitations,
  isLeader,
}: InvitationsDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("received")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const handleRefresh = () => {
    router.refresh()
  }

  // Filter Received Invitations
  const filteredReceived = useMemo(() => {
    return initialReceivedInvitations.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTeam = inv.teamName.toLowerCase().includes(query)
        const matchesRole = inv.roleName.toLowerCase().includes(query)
        const matchesSender = inv.sender.name.toLowerCase().includes(query) || inv.sender.username.toLowerCase().includes(query)
        const matchesSkill = inv.requiredSkills.some((s) => s.name.toLowerCase().includes(query))
        if (!matchesTeam && !matchesRole && !matchesSender && !matchesSkill) return false
      }
      return true
    })
  }, [initialReceivedInvitations, statusFilter, searchQuery])

  // Filter Sent Invitations
  const filteredSent = useMemo(() => {
    return initialSentInvitations.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesRecipient = inv.recipient.name.toLowerCase().includes(query) || inv.recipient.username.toLowerCase().includes(query)
        const matchesTeam = inv.teamName.toLowerCase().includes(query)
        const matchesRole = inv.roleName.toLowerCase().includes(query)
        const matchesSkill = inv.requiredSkills.some((s) => s.name.toLowerCase().includes(query))
        if (!matchesRecipient && !matchesTeam && !matchesRole && !matchesSkill) return false
      }
      return true
    })
  }, [initialSentInvitations, statusFilter, searchQuery])

  const pendingReceivedCount = initialReceivedInvitations.filter((i) => i.status === "PENDING" && !i.isExpired).length

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-emerald-500/5 p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Team Invitations & Recruitment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Invitations Hub
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Review exclusive team invitations extended by squad leaders, evaluate role requirements, or monitor invitations you have sent out.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild size="default" className="gap-2 font-bold shadow-xs">
              <Link href="/discover">
                <Compass className="size-4" />
                <span>Find Teammates</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-2">
          <TabsList className="bg-muted/40 p-1 rounded-xl">
            <TabsTrigger value="received" className="gap-2 text-xs font-semibold rounded-lg data-[state=active]:shadow-xs">
              <Mail className="size-3.5" />
              <span>Received Invitations</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold ml-0.5">
                {initialReceivedInvitations.length}
              </Badge>
              {pendingReceivedCount > 0 && (
                <span className="size-2 rounded-full bg-emerald-500" title={`${pendingReceivedCount} pending decision`} />
              )}
            </TabsTrigger>

            {isLeader && (
              <TabsTrigger value="sent" className="gap-2 text-xs font-semibold rounded-lg data-[state=active]:shadow-xs">
                <Send className="size-3.5" />
                <span>Sent Team Invitations</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold ml-0.5">
                  {initialSentInvitations.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Quick Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by team, role, person..."
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery.trim() || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("ALL")
                }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: RECEIVED INVITATIONS (CANDIDATE VIEW) */}
        <TabsContent value="received" className="space-y-6">
          {filteredReceived.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredReceived.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  onStatusChanged={handleRefresh}
                />
              ))}
            </div>
          ) : initialReceivedInvitations.length === 0 ? (
            <div className="rounded-3xl border border-border/80 bg-card p-10 text-center space-y-5 max-w-xl mx-auto shadow-xs">
              <div className="relative mx-auto w-full max-w-sm aspect-16/9 rounded-2xl overflow-hidden border border-border bg-muted">
                <Image
                  src="/images/applications-hero.jpg"
                  alt="Invitations Hub"
                  fill
                  className="object-cover"
                  sizes="400px"
                  priority
                />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-foreground">No Invitations Yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  You haven&apos;t received any direct team invitations yet. Make sure your profile skills are up to date and your status is set to &ldquo;Looking for Team&rdquo;.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button asChild size="default" className="gap-2 font-bold shadow-xs">
                  <Link href="/profile">
                    <UserCheck className="size-4" />
                    <span>Update Profile</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="gap-2 font-semibold">
                  <Link href="/teams">
                    <span>Explore Teams</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-border rounded-3xl p-8 space-y-2">
              <p className="text-sm font-semibold text-foreground">No invitations match your filter</p>
              <p className="text-xs text-muted-foreground">Try clearing or adjusting your search criteria.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: SENT INVITATIONS (LEADER VIEW) */}
        {isLeader && (
          <TabsContent value="sent" className="space-y-6">
            {filteredSent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredSent.map((inv) => (
                  <SentInvitationCard key={inv.id} invitation={inv} />
                ))}
              </div>
            ) : initialSentInvitations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
                  <Send className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Invitations Sent Yet</h3>
                  <p className="text-xs text-muted-foreground">
                    You haven&apos;t sent any invitations from your team roles. Use Teammate Discovery to find candidates and send direct invites.
                  </p>
                </div>
                <Button asChild size="sm" className="gap-1.5 font-bold shadow-xs">
                  <Link href="/discover">
                    <Compass className="size-3.5" />
                    <span>Find Candidates via Discovery</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-border rounded-3xl p-8 space-y-2">
                <p className="text-sm font-semibold text-foreground">No sent invitations match your filter</p>
                <p className="text-xs text-muted-foreground">Try clearing or adjusting your search criteria.</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
