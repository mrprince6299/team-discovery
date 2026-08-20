"use client"

import * as React from "react"
import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  Calendar,
  Search,
  Users,
  ExternalLink,
  PlusCircle,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  FileText,
  Layers,
  Edit3,
  Eye,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  AdminEventItem,
  AdminEventCounts,
  AdminEventInput,
  createAdminEvent,
  updateAdminEvent,
  setAdminEventStatus,
  deleteAdminEvent,
} from "@/app/actions/events"
import type { EventStatus } from "@prisma/client"

interface AdminEventsClientProps {
  initialEvents: AdminEventItem[]
  initialCounts: AdminEventCounts
}

export function AdminEventsClient({ initialEvents, initialCounts }: AdminEventsClientProps) {
  const [events, setEvents] = useState<AdminEventItem[]>(initialEvents)
  const [counts, setCounts] = useState(initialCounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isPending, startTransition] = useTransition()

  // Modals state
  const [inspectEvent, setInspectEvent] = useState<AdminEventItem | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<AdminEventItem | null>(null)

  // Form State for Create / Edit
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [formRegDeadline, setFormRegDeadline] = useState("")
  const [formTeamSize, setFormTeamSize] = useState("2 - 4 Members")
  const [formRules, setFormRules] = useState("")
  const [formBannerUrl, setFormBannerUrl] = useState("")
  const [formStatus, setFormStatus] = useState<EventStatus>("DRAFT")

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormStartDate("")
    setFormEndDate("")
    setFormRegDeadline("")
    setFormTeamSize("2 - 4 Members")
    setFormRules("")
    setFormBannerUrl("")
    setFormStatus("DRAFT")
  }

  const openCreateModal = () => {
    resetForm()
    // Defaults: today and 7 days from now
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    setFormStartDate(now.toISOString().slice(0, 16))
    setFormEndDate(nextWeek.toISOString().slice(0, 16))
    setFormRegDeadline(deadline.toISOString().slice(0, 16))
    setIsCreateOpen(true)
  }

  const openEditModal = (evt: AdminEventItem) => {
    setEditEvent(evt)
    setFormName(evt.name)
    setFormDescription(evt.description)
    setFormStartDate(new Date(evt.startDate).toISOString().slice(0, 16))
    setFormEndDate(new Date(evt.endDate).toISOString().slice(0, 16))
    setFormRegDeadline(new Date(evt.registrationDeadline).toISOString().slice(0, 16))
    setFormTeamSize(evt.teamSizeInfo)
    setFormRules(evt.rules)
    setFormBannerUrl(evt.bannerUrl || "")
    setFormStatus(evt.status)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formDescription.trim() || !formRules.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    const payload: AdminEventInput = {
      name: formName.trim(),
      description: formDescription.trim(),
      startDate: new Date(formStartDate),
      endDate: new Date(formEndDate),
      registrationDeadline: new Date(formRegDeadline),
      teamSizeInfo: formTeamSize.trim(),
      rules: formRules.trim(),
      bannerUrl: formBannerUrl.trim() || null,
      status: formStatus,
    }

    startTransition(async () => {
      const res = await createAdminEvent(payload)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Event created successfully!")
        setIsCreateOpen(false)
        resetForm()

        // Append to local state
        const newEvt: AdminEventItem = {
          id: res.eventId || ("evt-" + Date.now()),
          name: payload.name,
          description: payload.description,
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          registrationDeadline: new Date(payload.registrationDeadline),
          rules: payload.rules,
          bannerUrl: payload.bannerUrl || null,
          teamSizeInfo: payload.teamSizeInfo,
          status: payload.status || "DRAFT",
          teamCount: 0,
          totalMembersCount: 0,
          announcementCount: 0,
        }
        setEvents((prev) => [newEvt, ...prev])
        setCounts((prev) => ({
          ...prev,
          total: prev.total + 1,
          draft: (payload.status === "DRAFT" || !payload.status) ? prev.draft + 1 : prev.draft,
          published: payload.status === "PUBLISHED" ? prev.published + 1 : prev.published,
          registrationOpen: payload.status === "REGISTRATION_OPEN" ? prev.registrationOpen + 1 : prev.registrationOpen,
        }))
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEvent) return

    const payload: Partial<AdminEventInput> = {
      name: formName.trim(),
      description: formDescription.trim(),
      startDate: new Date(formStartDate),
      endDate: new Date(formEndDate),
      registrationDeadline: new Date(formRegDeadline),
      teamSizeInfo: formTeamSize.trim(),
      rules: formRules.trim(),
      bannerUrl: formBannerUrl.trim() || null,
      status: formStatus,
    }

    startTransition(async () => {
      const res = await updateAdminEvent(editEvent.id, payload)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Event updated successfully!")
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === editEvent.id
              ? {
                  ...evt,
                  name: payload.name || evt.name,
                  description: payload.description || evt.description,
                  startDate: payload.startDate ? new Date(payload.startDate) : evt.startDate,
                  endDate: payload.endDate ? new Date(payload.endDate) : evt.endDate,
                  registrationDeadline: payload.registrationDeadline
                    ? new Date(payload.registrationDeadline)
                    : evt.registrationDeadline,
                  rules: payload.rules || evt.rules,
                  bannerUrl: payload.bannerUrl !== undefined ? payload.bannerUrl : evt.bannerUrl,
                  teamSizeInfo: payload.teamSizeInfo || evt.teamSizeInfo,
                  status: payload.status || evt.status,
                }
              : evt
          )
        )
        setEditEvent(null)
      }
    })
  }

  const handleStatusTransition = (evtId: string, newStatus: EventStatus) => {
    startTransition(async () => {
      const res = await setAdminEventStatus(evtId, newStatus)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Event status updated to ${newStatus.replace(/_/g, " ")}`)
        setEvents((prev) =>
          prev.map((e) => (e.id === evtId ? { ...e, status: newStatus } : e))
        )
        if (inspectEvent?.id === evtId) {
          setInspectEvent((prev) => (prev ? { ...prev, status: newStatus } : null))
        }
      }
    })
  }

  const handleDelete = (evtId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return

    startTransition(async () => {
      const res = await deleteAdminEvent(evtId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Event deleted.")
        setEvents((prev) => prev.filter((e) => e.id !== evtId))
        if (inspectEvent?.id === evtId) setInspectEvent(null)
      }
    })
  }

  // Filter & Search Logic
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (statusFilter === "OPEN" && evt.status !== "REGISTRATION_OPEN") return false
      if (statusFilter === "PUBLISHED" && evt.status !== "PUBLISHED") return false
      if (statusFilter === "DRAFT" && evt.status !== "DRAFT") return false
      if (statusFilter === "CLOSED" && evt.status !== "REGISTRATION_CLOSED") return false
      if (statusFilter === "COMPLETED" && evt.status !== "COMPLETED") return false

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = evt.name.toLowerCase().includes(q)
        const matchDesc = evt.description.toLowerCase().includes(q)
        const matchRules = evt.rules.toLowerCase().includes(q)
        const matchSize = evt.teamSizeInfo.toLowerCase().includes(q)
        if (!matchName && !matchDesc && !matchRules && !matchSize) {
          return false
        }
      }
      return true
    })
  }, [events, statusFilter, searchQuery])

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case "REGISTRATION_OPEN":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
            Registration Open
          </Badge>
        )
      case "PUBLISHED":
        return (
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] uppercase font-bold">
            Published
          </Badge>
        )
      case "ONGOING":
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] uppercase font-bold">
            Ongoing
          </Badge>
        )
      case "DRAFT":
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground border-dashed">
            Draft
          </Badge>
        )
      case "REGISTRATION_CLOSED":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold">
            Registration Closed
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Events &amp; Hackathons</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Events &amp; Hackathon Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Author, publish, schedule, and oversee live hackathons and build competitions for student squads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button onClick={openCreateModal} size="sm" className="gap-1.5 font-semibold shadow-xs">
            <PlusCircle className="size-4" />
            <span>Create Event</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/events" target="_blank">
              <span>View Catalog</span>
              <ExternalLink className="size-3 text-muted-foreground" />
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
            Total Events
          </span>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.total}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("OPEN")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "OPEN" ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Registration Open
            </span>
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.registrationOpen}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("DRAFT")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "DRAFT" ? "border-muted-foreground bg-muted/20 ring-1 ring-muted-foreground/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Drafts
            </span>
            <FileText className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.draft}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("COMPLETED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "COMPLETED" ? "border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Completed
            </span>
            <Trophy className="size-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.completed}</div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="ALL" className="text-xs font-semibold rounded-lg">
              All ({counts.total})
            </TabsTrigger>
            <TabsTrigger value="OPEN" className="text-xs font-semibold rounded-lg">
              Open ({counts.registrationOpen})
            </TabsTrigger>
            <TabsTrigger value="PUBLISHED" className="text-xs font-semibold rounded-lg">
              Published ({counts.published})
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className="text-xs font-semibold rounded-lg">
              Drafts ({counts.draft})
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="text-xs font-semibold rounded-lg">
              Closed ({counts.registrationClosed})
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="text-xs font-semibold rounded-lg">
              Completed ({counts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search events by name, rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="border-border/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No events found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No event matches "${searchQuery}".` : "No events in this status category."}
            </p>
            <Button onClick={openCreateModal} size="sm" className="mt-2 text-xs">
              <PlusCircle className="size-3.5 mr-1.5" />
              Create First Event
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredEvents.map((evt) => {
            return (
              <Card
                key={evt.id}
                className="border-border/80 hover:border-border transition-all bg-card rounded-2xl p-5 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{evt.name}</h3>
                      {getStatusBadge(evt.status)}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        <span>Starts: {new Date(evt.startDate).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>{evt.teamSizeInfo}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Layers className="size-3.5" />
                        <span>{evt.teamCount} Squads registered</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    <Button
                      onClick={() => setInspectEvent(evt)}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 h-8"
                    >
                      <Eye className="size-3.5" />
                      <span>Inspect</span>
                    </Button>

                    <Button
                      onClick={() => openEditModal(evt)}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 h-8"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit</span>
                    </Button>

                    {/* Status quick transitions */}
                    {evt.status === "DRAFT" && (
                      <Button
                        onClick={() => handleStatusTransition(evt.id, "REGISTRATION_OPEN")}
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8"
                        disabled={isPending}
                      >
                        <Sparkles className="size-3.5" />
                        <span>Publish &amp; Open</span>
                      </Button>
                    )}

                    {evt.status === "REGISTRATION_OPEN" && (
                      <Button
                        onClick={() => handleStatusTransition(evt.id, "REGISTRATION_CLOSED")}
                        variant="secondary"
                        size="sm"
                        className="text-xs text-amber-700 dark:text-amber-300 gap-1 h-8"
                        disabled={isPending}
                      >
                        <Clock className="size-3.5" />
                        <span>Close Reg</span>
                      </Button>
                    )}

                    {evt.status === "REGISTRATION_CLOSED" && (
                      <Button
                        onClick={() => handleStatusTransition(evt.id, "REGISTRATION_OPEN")}
                        variant="secondary"
                        size="sm"
                        className="text-xs text-emerald-700 dark:text-emerald-300 gap-1 h-8"
                        disabled={isPending}
                      >
                        <Sparkles className="size-3.5" />
                        <span>Reopen Reg</span>
                      </Button>
                    )}

                    {evt.status === "PUBLISHED" && (
                      <Button
                        onClick={() => handleStatusTransition(evt.id, "REGISTRATION_OPEN")}
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8"
                        disabled={isPending}
                      >
                        <Sparkles className="size-3.5" />
                        <span>Open Reg</span>
                      </Button>
                    )}

                    {(evt.status === "ONGOING" || evt.status === "REGISTRATION_CLOSED") && (
                      <Button
                        onClick={() => handleStatusTransition(evt.id, "COMPLETED")}
                        variant="outline"
                        size="sm"
                        className="text-xs text-sky-700 dark:text-sky-300 gap-1 h-8"
                        disabled={isPending}
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Complete</span>
                      </Button>
                    )}

                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                      <Link href={`/events/${evt.id}`} target="_blank" title="Open Public Showcase">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* CREATE EVENT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <PlusCircle className="size-5 text-primary" />
              <span>Create New Event / Hackathon</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the competition details. You can save as a Draft or immediately open registration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Event Title *</label>
              <Input
                placeholder="e.g. National Smart Campus Hackathon 2026"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description *</label>
              <textarea
                placeholder="Detailed overview of the competition, problem statements, and prize categories..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Date *</label>
                <Input
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">End Date *</label>
                <Input
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reg Deadline *</label>
                <Input
                  type="datetime-local"
                  value={formRegDeadline}
                  onChange={(e) => setFormRegDeadline(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Team Size Rules *</label>
                <Input
                  placeholder="e.g. 2 - 4 Members per Squad"
                  value={formTeamSize}
                  onChange={(e) => setFormTeamSize(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Initial Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DRAFT">Draft (Admin Only)</option>
                  <option value="REGISTRATION_OPEN">Registration Open</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Rules &amp; Guidelines *</label>
              <textarea
                placeholder="Eligibility criteria, code of conduct, submission format, judging metrics..."
                value={formRules}
                onChange={(e) => setFormRules(e.target.value)}
                rows={4}
                required
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Banner Image URL (Optional)</label>
              <Input
                placeholder="https://... or /images/events/banner.jpg"
                value={formBannerUrl}
                onChange={(e) => setFormBannerUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="font-semibold">
                {isPending ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT EVENT DIALOG */}
      <Dialog open={!!editEvent} onOpenChange={(o) => !o && setEditEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="size-5 text-primary" />
              <span>Edit Event Details</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update dates, rules, or status for this event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Event Title *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description *</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Date *</label>
                <Input
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">End Date *</label>
                <Input
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reg Deadline *</label>
                <Input
                  type="datetime-local"
                  value={formRegDeadline}
                  onChange={(e) => setFormRegDeadline(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Team Size Rules *</label>
                <Input
                  value={formTeamSize}
                  onChange={(e) => setFormTeamSize(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REGISTRATION_OPEN">Registration Open</option>
                  <option value="REGISTRATION_CLOSED">Registration Closed</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Rules &amp; Guidelines *</label>
              <textarea
                value={formRules}
                onChange={(e) => setFormRules(e.target.value)}
                rows={4}
                required
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Banner Image URL</label>
              <Input
                value={formBannerUrl}
                onChange={(e) => setFormBannerUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setEditEvent(null)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="font-semibold">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* INSPECT EVENT DIALOG */}
      <Dialog open={!!inspectEvent} onOpenChange={(o) => !o && setInspectEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl space-y-4">
          {inspectEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {inspectEvent.name}
                  </DialogTitle>
                  {getStatusBadge(inspectEvent.status)}
                </div>
                <DialogDescription className="text-xs">
                  Event ID: <span className="font-mono">{inspectEvent.id}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                {/* Description */}
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                    Overview
                  </span>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/70">
                    {inspectEvent.description}
                  </p>
                </div>

                {/* Schedule & Rules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="p-3.5 rounded-xl border-border/80 space-y-2">
                    <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      <span>Schedule</span>
                    </span>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Start:</span>
                        <span className="font-mono text-foreground">{new Date(inspectEvent.startDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End:</span>
                        <span className="font-mono text-foreground">{new Date(inspectEvent.endDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reg Deadline:</span>
                        <span className="font-mono text-foreground">{new Date(inspectEvent.registrationDeadline).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3.5 rounded-xl border-border/80 space-y-2">
                    <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      <span>Participation Metrics</span>
                    </span>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Team Size Rule:</span>
                        <span className="font-mono text-foreground">{inspectEvent.teamSizeInfo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registered Squads:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{inspectEvent.teamCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Participants:</span>
                        <span className="font-mono text-foreground">{inspectEvent.totalMembersCount}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Rules & Guidelines */}
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                    Rules &amp; Guidelines
                  </span>
                  <div className="bg-muted/20 p-3 rounded-xl border border-border/70 text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {inspectEvent.rules}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                <Button
                  onClick={() => handleDelete(inspectEvent.id)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Event</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                    <Link href={`/events/${inspectEvent.id}`} target="_blank">
                      <span>Public Showcase</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                  <Button
                    onClick={() => {
                      const curr = inspectEvent
                      setInspectEvent(null)
                      openEditModal(curr)
                    }}
                    size="sm"
                    className="text-xs gap-1.5 font-semibold"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Event</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
