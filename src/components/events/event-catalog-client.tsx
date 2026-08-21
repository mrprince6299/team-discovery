'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { EventCatalogItem } from '@/app/actions/events'
import {
  Calendar,
  Users,
  Search,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
  Trophy,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react'

interface EventCatalogClientProps {
  initialEvents: EventCatalogItem[]
}

export function EventCatalogClient({ initialEvents }: EventCatalogClientProps) {
  const [events] = React.useState<EventCatalogItem[]>(initialEvents)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false)

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (search.trim().length > 0) count++
    if (statusFilter !== 'ALL') count++
    return count
  }, [search, statusFilter])

  const filteredEvents = React.useMemo(() => {
    return events.filter((evt) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        q.length === 0 ||
        evt.name.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'OPEN') return evt.status === 'REGISTRATION_OPEN'
      if (statusFilter === 'ONGOING') return evt.status === 'ONGOING'
      if (statusFilter === 'COMPLETED') return evt.status === 'COMPLETED'
      return evt.status === statusFilter
    })
  }, [events, search, statusFilter])

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px] uppercase font-bold gap-1 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Registration Open</span>
          </Badge>
        )
      case 'ONGOING':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 text-[10px] uppercase font-bold gap-1 py-0.5">
            <Sparkles className="size-3 text-purple-500" />
            <span>Live Hackathon</span>
          </Badge>
        )
      case 'REGISTRATION_CLOSED':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] uppercase font-bold gap-1 py-0.5">
            <Clock className="size-3 text-amber-500" />
            <span>Reg Closed</span>
          </Badge>
        )
      case 'PUBLISHED':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 text-[10px] uppercase font-bold gap-1 py-0.5">
            <Calendar className="size-3 text-blue-500" />
            <span>Upcoming</span>
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground gap-1 py-0.5">
            <Trophy className="size-3 text-muted-foreground" />
            <span>Completed</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">
            {status.replace(/_/g, ' ')}
          </Badge>
        )
    }
  }

  const getDeadlineContext = (deadline: Date, status: string) => {
    const d = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (status === 'REGISTRATION_CLOSED' || diffDays < 0) {
      return (
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Clock className="size-3" />
          <span>Reg Closed</span>
        </span>
      )
    }

    if (diffDays <= 3 && diffDays >= 0) {
      return (
        <span className="text-[11px] font-bold text-destructive flex items-center gap-1">
          <ShieldAlert className="size-3 animate-bounce" />
          <span>Closes in {diffDays === 0 ? 'today' : `${diffDays}d`}</span>
        </span>
      )
    }

    return (
      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
        <Clock className="size-3 text-primary" />
        <span>Closes {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      </span>
    )
  }

  const filterTabs = [
    { id: 'ALL', label: 'All Events' },
    { id: 'OPEN', label: 'Registration Open' },
    { id: 'ONGOING', label: 'Live Hackathons' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
              <Trophy className="h-3.5 w-3.5" />
              <span>Events &amp; Competitions Hub</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Build with Top Squads in Live Events
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Discover active hackathons, innovation challenges, and build competitions. Form a high-performing squad, compete for prizes, and earn verified peer endorsements.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild className="bg-primary text-primary-foreground font-semibold shadow-xs">
                <Link href="/teams/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Form a Squad
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-border hover:bg-muted">
                <Link href="/discover">
                  <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                  Find Teammates
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-full h-48 sm:h-56 lg:h-64 rounded-xl overflow-hidden border border-border/60 shadow-sm">
            <Image
              src="/images/events-showcase.jpg"
              alt="Event Showcase and Build Competitions"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search hackathons by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8.5 pr-8 h-9 text-xs rounded-xl bg-background border-border/80"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Status Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
            {filterTabs.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={statusFilter === tab.id ? 'default' : 'ghost'}
                onClick={() => setStatusFilter(tab.id)}
                className="text-xs h-8 px-3 rounded-lg font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Mobile Filter Sheet Trigger */}
          <div className="sm:hidden flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>

            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filter Status {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
                <SheetHeader className="pb-3 text-left">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <Filter className="size-4 text-primary" />
                    <span>Filter Events</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Filter hackathons by status or lifecycle stage.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-2 py-3">
                  {filterTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={statusFilter === tab.id ? 'default' : 'outline'}
                      className="w-full justify-start text-xs font-semibold h-9"
                      onClick={() => {
                        setStatusFilter(tab.id)
                        setIsMobileFiltersOpen(false)
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">Active:</span>

            {search && (
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-primary/30 bg-primary/5">
                <span>Query: &ldquo;{search}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-destructive cursor-pointer p-0.5"
                  aria-label="Remove search filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            {statusFilter !== 'ALL' && (
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-border/80 bg-muted/30">
                <span>Status: {filterTabs.find((t) => t.id === statusFilter)?.label}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-destructive cursor-pointer p-0.5"
                  aria-label="Remove status filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Clear All</span>
            </Button>
          </div>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 rounded-2xl p-12 text-center space-y-3 bg-card">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">No events found</CardTitle>
          <CardDescription className="text-xs max-w-md mx-auto">
            No events match your search criteria. Check back soon for upcoming innovation challenges and hackathons.
          </CardDescription>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <Card
              key={evt.id}
              className="border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between overflow-hidden group shadow-xs"
            >
              {/* Event Card Banner */}
              {evt.bannerUrl ? (
                <div className="relative w-full h-40 bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={evt.bannerUrl}
                    alt={evt.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(evt.status)}
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-gradient-to-r from-primary/20 via-indigo-500/15 to-emerald-500/20 p-3 flex items-start justify-between">
                  {getStatusBadge(evt.status)}
                </div>
              )}

              <CardHeader className="p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3 text-primary shrink-0" />
                    <span>
                      {new Date(evt.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      –{' '}
                      {new Date(evt.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </span>

                  {getDeadlineContext(evt.registrationDeadline, evt.status)}
                </div>

                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {evt.name}
                </CardTitle>

                <CardDescription className="text-xs leading-relaxed line-clamp-2">
                  {evt.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {/* Event Key Stats */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">{evt.teamCount}</strong> Squads
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-foreground">{evt.totalSeatsRemaining}</strong> Open Seats
                    </span>
                  </div>
                </div>

                {/* Team Size Rules badge */}
                {evt.teamSizeInfo && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/20 px-2.5 py-1 rounded-lg border border-border/60">
                    <Users className="size-3 text-indigo-500 shrink-0" />
                    <span className="truncate">Squad size: <strong>{evt.teamSizeInfo}</strong></span>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs font-semibold group-hover:border-primary/40 rounded-xl"
                  >
                    <Link href={`/events/${evt.id}`}>
                      <span>View Showcase</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  {evt.status === 'REGISTRATION_OPEN' && (
                    <Button asChild size="sm" className="text-xs font-semibold bg-primary text-primary-foreground rounded-xl shadow-xs">
                      <Link href={`/teams/create?eventId=${evt.id}`}>
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                        <span>Form Squad</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
