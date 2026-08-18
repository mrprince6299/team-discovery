'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

interface EventCatalogClientProps {
  initialEvents: EventCatalogItem[]
}

export function EventCatalogClient({ initialEvents }: EventCatalogClientProps) {
  const [events] = React.useState<EventCatalogItem[]>(initialEvents)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  const filteredEvents = React.useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.name.toLowerCase().includes(search.toLowerCase()) ||
        evt.description.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'OPEN')
        return (
          evt.status === 'REGISTRATION_OPEN' ||
          evt.status === 'PUBLISHED' ||
          evt.status === 'ONGOING'
        )
      if (statusFilter === 'COMPLETED') return evt.status === 'COMPLETED'
      return evt.status === statusFilter
    })
  }, [events, search, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
            Registration Open
          </Badge>
        )
      case 'ONGOING':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] uppercase font-bold">
            Live Hackathon
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">
            Completed
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

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
              <Trophy className="h-3.5 w-3.5" />
              <span>Hackathon &amp; Competition Showcase</span>
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
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 hidden sm:inline-block shrink-0" />
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'OPEN', label: 'Open & Live' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={statusFilter === tab.id ? 'default' : 'ghost'}
              onClick={() => setStatusFilter(tab.id)}
              className="text-xs h-8 px-3 rounded-lg"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">No events found</CardTitle>
          <CardDescription className="text-xs max-w-md mx-auto">
            No events match your search criteria. Check back soon for upcoming innovation challenges and hackathons.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <Card
              key={evt.id}
              className="border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-xl flex flex-col justify-between overflow-hidden group"
            >
              <CardHeader className="p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(evt.status)}
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
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

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs font-semibold group-hover:border-primary/40"
                  >
                    <Link href={`/events/${evt.id}`}>
                      <span>View Showcase</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  {evt.status === 'REGISTRATION_OPEN' && (
                    <Button asChild size="sm" className="text-xs font-semibold bg-primary text-primary-foreground">
                      <Link href={`/teams/create?eventId=${evt.id}`}>
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                        Join
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
