"use client"

import * as React from "react"
import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  Bookmark,
  Sparkles,
  Code2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  globalSearch,
  GlobalSearchResult,
  SearchUserResult,
  SearchTeamResult,
  SearchProjectResult,
  SearchEventResult,
} from "@/app/actions/search"
import { cn } from "@/lib/utils"

interface GlobalSearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function SearchModalContent({
  onClose,
}: {
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult | null>(null)
  const [activeTab, setActiveTab] = useState<"ALL" | "USERS" | "TEAMS" | "PROJECTS" | "EVENTS">("ALL")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Handle debounced search query
  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (!val.trim()) {
      setResults(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
  }

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) return

    const timeout = setTimeout(async () => {
      try {
        const res = await globalSearch(query.trim())
        if (res.data) {
          setResults(res.data)
          setSelectedIndex(0)
        }
      } catch {
        // Safe ignoring of transient network error
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  // Flatten currently visible results for keyboard navigation
  const visibleItems = React.useMemo(() => {
    if (!results) return []
    const items: Array<{
      type: "USER" | "TEAM" | "PROJECT" | "EVENT"
      id: string
      url: string
      title: string
      data: SearchUserResult | SearchTeamResult | SearchProjectResult | SearchEventResult
    }> = []

    if (activeTab === "ALL" || activeTab === "USERS") {
      for (const u of results.users) {
        items.push({ type: "USER", id: u.id, url: `/users/${u.id}`, title: u.name, data: u })
      }
    }
    if (activeTab === "ALL" || activeTab === "TEAMS") {
      for (const t of results.teams) {
        items.push({ type: "TEAM", id: t.id, url: `/teams/${t.id}`, title: t.name, data: t })
      }
    }
    if (activeTab === "ALL" || activeTab === "PROJECTS") {
      for (const p of results.projects) {
        items.push({ type: "PROJECT", id: p.id, url: `/users/${p.creatorId}`, title: p.title, data: p })
      }
    }
    if (activeTab === "ALL" || activeTab === "EVENTS") {
      for (const e of results.events) {
        items.push({ type: "EVENT", id: e.id, url: `/events/${e.id}`, title: e.name, data: e })
      }
    }

    return items
  }, [results, activeTab])

  const handleNavigate = (url: string) => {
    onClose()
    startTransition(() => {
      router.push(url)
    })
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (visibleItems.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % visibleItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = visibleItems[selectedIndex]
      if (selected) {
        handleNavigate(selected.url)
      }
    }
  }

  return (
    <>
      {/* 1. Search Input Bar */}
      <div className="flex items-center px-4 border-b border-border/80 bg-card">
        <Search className="size-4 text-muted-foreground mr-2.5 shrink-0" />
        <Input
          ref={inputRef}
          placeholder="Search candidates, teams, projects, events, or skills..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-13 text-sm border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground"
        />
        {isSearching && <Loader2 className="size-4 animate-spin text-primary ml-2 shrink-0" />}
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ml-2 border border-border">
          ESC
        </kbd>
      </div>

      {/* 2. Category Filter Tabs */}
      {results && results.totalMatches > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/20 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              activeTab === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All ({results.totalMatches})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("USERS")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              activeTab === "USERS"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            People ({results.users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TEAMS")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              activeTab === "TEAMS"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Teams ({results.teams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PROJECTS")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              activeTab === "PROJECTS"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Projects ({results.projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EVENTS")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition-colors",
              activeTab === "EVENTS"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Events ({results.events.length})
          </button>
        </div>
      )}

      {/* 3. Results List */}
      <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
        {/* Initial State */}
        {!results && !query.trim() && (
          <div className="py-12 text-center space-y-2">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Instant Platform Discovery</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Search verified candidates, discoverable squads, hackathon projects, and active events.
            </p>
          </div>
        )}

        {/* No Results */}
        {results && results.totalMatches === 0 && (
          <div className="py-12 text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground">No matches found for &quot;{query}&quot;</p>
            <p className="text-xs text-muted-foreground">
              Try searching by different skills, roles, event names, or usernames.
            </p>
          </div>
        )}

        {/* Grouped Results Display */}
        {visibleItems.map((item, idx) => {
          const isSelected = idx === selectedIndex

          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleNavigate(item.url)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors text-xs select-none",
                isSelected ? "bg-muted/80 text-foreground" : "hover:bg-muted/40 text-muted-foreground"
              )}
            >
              {/* USER RESULT */}
              {item.type === "USER" && (() => {
                const u = item.data as SearchUserResult
                const initials = u.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-lg border border-border shrink-0">
                      <AvatarImage src={u.profilePhoto || undefined} alt={u.name} />
                      <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{u.name}</span>
                        <span className="text-[11px] text-muted-foreground">@{u.username}</span>
                        {u.isBookmarked && (
                          <Bookmark className="size-3 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {u.departmentName || "Candidate"}
                        </span>
                        {u.topSkills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* TEAM RESULT */}
              {item.type === "TEAM" && (() => {
                const t = item.data as SearchTeamResult
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Users className="size-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{t.name}</span>
                        {t.eventName && (
                          <Badge variant="outline" className="text-[9px] h-4 text-primary px-1">
                            {t.eventName}
                          </Badge>
                        )}
                        {t.isBookmarked && (
                          <Bookmark className="size-3 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-md">
                        {t.totalSeatsRemaining} Seat{t.totalSeatsRemaining !== 1 ? "s" : ""} Open ·{" "}
                        {t.skills.join(", ") || "General Team"}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* PROJECT RESULT */}
              {item.type === "PROJECT" && (() => {
                const p = item.data as SearchProjectResult
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Code2 className="size-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{p.title}</span>
                        <span className="text-[10px] text-muted-foreground">by {p.creatorName}</span>
                        {p.isBookmarked && (
                          <Bookmark className="size-3 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-md">
                        {p.role} · {p.skills.join(", ") || "Public Portfolio Build"}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* EVENT RESULT */}
              {item.type === "EVENT" && (() => {
                const e = item.data as SearchEventResult
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{e.name}</span>
                        <Badge variant="exact" className="text-[9px] h-4 px-1">
                          {e.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-md">
                        {e.description ? `${e.description.slice(0, 50)}... · ` : ""}{e.registeredSquadsCount} Registered Squad
                        {e.registeredSquadsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Right Arrow indicator */}
              <ArrowRight
                className={cn(
                  "size-3.5 shrink-0 ml-2 transition-opacity",
                  isSelected ? "opacity-100 text-foreground" : "opacity-0"
                )}
              />
            </div>
          )
        })}
      </div>

      {/* 4. Footer Shortcuts Strip */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/80 bg-muted/30 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-background px-1 py-0.5 border border-border">↑</kbd>
            <kbd className="rounded bg-background px-1 py-0.5 border border-border">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-background px-1.5 py-0.5 border border-border">↵</kbd>
            <span>Open</span>
          </span>
        </div>
        <span>Team Discovery Global Search</span>
      </div>
    </>
  )
}

export function GlobalSearchDialog({ isOpen, onOpenChange }: GlobalSearchDialogProps) {
  // Listen for Cmd+K / Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!isOpen)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onOpenChange])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Instant Search</DialogTitle>
        </DialogHeader>

        {isOpen && <SearchModalContent onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
